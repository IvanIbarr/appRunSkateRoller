import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_config.dart';
import '../../../core/ui/network_reel_video.dart';
import '../../../core/ui/rn_layered_styles.dart';
import '../../../core/ui/rn_mirror_layouts.dart';
import '../../../core/ui/user_profile_avatar.dart';
import '../../perfil/data/perfil_providers.dart';
import '../data/rollertips_repository.dart';

final tipsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(rollertipsRepositoryProvider).list(scope: 'active');
});

final _tipsMeProvider = currentMeProvider;

String _tipPlayableUrl(String raw) {
  final t = raw.trim();
  if (t.isEmpty) return t;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  final base = ApiConfig.baseUrl(isWeb: kIsWeb);
  final origin = Uri.parse(base).origin;
  final path = t.startsWith('/') ? t : '/$t';
  return '$origin$path';
}

/// Espejo visual de `RollerTipsScreen.tsx` (scrollContent, headerCard, card, reelCard, reactionsRow).
class RollerTipsScreen extends ConsumerStatefulWidget {
  const RollerTipsScreen({super.key});

  @override
  ConsumerState<RollerTipsScreen> createState() => _RollerTipsScreenState();
}

class _RollerTipsScreenState extends ConsumerState<RollerTipsScreen> {
  static const _cyan = Color(0xFF38BDF8);

  final bool _showRules = true;
  bool _showUpload = false;
  bool _showCreators = false;
  final Map<String, bool> _expandedTips = {};
  final Map<String, bool> _commentExpanded = {};
  final Map<String, TextEditingController> _commentDrafts = {};
  final Map<String, Map<String, dynamic>> _tipOverrides = {};
  final _tipDescCtrl = TextEditingController();
  final _creatorQueryCtrl = TextEditingController();
  PlatformFile? _pickedVideo;
  String? _webPreviewUrl;
  bool _publishing = false;

  static const _reactions = [
    ('like', '👍'),
    ('corazon', '❤️'),
    ('asombro', '😲'),
    ('tristeza', '😢'),
    ('risa', '😂'),
    ('me_encanta', '😍'),
  ];

  @override
  void dispose() {
    _tipDescCtrl.dispose();
    _creatorQueryCtrl.dispose();
    for (final c in _commentDrafts.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _commentCtrlFor(String tipId) {
    return _commentDrafts.putIfAbsent(tipId, TextEditingController.new);
  }

  Map<String, dynamic> _mergeTip(Map<String, dynamic> tip) {
    final id = (tip['id'] ?? '').toString();
    final o = _tipOverrides[id];
    if (o == null) return tip;
    return {...tip, ...o};
  }

  Future<void> _pickVideo() async {
    final r = await FilePicker.platform.pickFiles(
      type: FileType.video,
      allowMultiple: false,
      withData: true,
    );
    final f = r?.files.firstOrNull;
    if (f == null) return;
    String? previewUrl;
    if (kIsWeb && f.bytes != null && f.bytes!.isNotEmpty) {
      final ext = (f.extension ?? 'mp4').toLowerCase();
      final mime = ext == 'mov' ? 'video/quicktime' : 'video/mp4';
      previewUrl = Uri.dataFromBytes(f.bytes!, mimeType: mime).toString();
    }
    setState(() {
      _pickedVideo = f;
      _webPreviewUrl = previewUrl;
    });
  }

  Future<void> _onReaction(WidgetRef ref, String tipId, String reaction) async {
    try {
      final updated = await ref.read(rollertipsRepositoryProvider).addReaction(
            tipId: tipId,
            reaction: reaction,
          );
      setState(() => _tipOverrides[tipId] = updated);
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg.contains('sesión') ? 'Inicia sesión para reaccionar' : msg)),
      );
    }
  }

  Future<void> _onComment(WidgetRef ref, String tipId, Map<String, dynamic>? me) async {
    final ctrl = _commentCtrlFor(tipId);
    final text = ctrl.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Escribe un comentario.')));
      return;
    }
    final words = text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;
    if (words > 350) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Máximo 350 palabras.')));
      return;
    }
    try {
      final updated = await ref.read(rollertipsRepositoryProvider).addComment(
            tipId: tipId,
            text: text,
            authorId: me?['id']?.toString(),
            authorName: (me?['alias'] ?? me?['email'] ?? 'Usuario').toString(),
          );
      ctrl.clear();
      setState(() => _tipOverrides[tipId] = updated);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<void> _publish(WidgetRef ref) async {
    final file = _pickedVideo;
    if (file == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Selecciona un video primero.')));
      return;
    }
    setState(() => _publishing = true);
    try {
      final me = ref.read(_tipsMeProvider).valueOrNull;
      await ref.read(rollertipsRepositoryProvider).create(
            video: file,
            description: _tipDescCtrl.text.trim(),
            uploaderName: (me?['alias'] ?? me?['email'])?.toString(),
            uploaderEmail: me?['email']?.toString(),
            uploaderAlias: me?['alias']?.toString(),
          );
      ref.invalidate(tipsProvider);
      setState(() {
        _pickedVideo = null;
        _webPreviewUrl = null;
        _tipDescCtrl.clear();
        _tipOverrides.clear();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tip publicado.')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(tipsProvider);
    final meAsync = ref.watch(_tipsMeProvider);
    final topPad = kIsWeb ? 24.0 : 32.0;

    return RnMirrorBrandTabLayout(
      topPadding: topPad,
      onRefresh: () async {
        ref.invalidate(tipsProvider);
        await ref.read(tipsProvider.future);
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _headerCard(context, meAsync),
          if (_showRules) _rulesCard(),
          _uploadCard(ref),
          _creatorsCard(async),
          async.when(
            data: (tips) => _reelsSection(
              context,
              ref,
              tips.map(_mergeTip).toList(),
              meAsync.valueOrNull,
            ),
            loading: () => const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8))),
            ),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _headerCard(BuildContext context, AsyncValue<Map<String, dynamic>> meAsync) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: RnLayeredStyles.glassPanel(radius: 18),
      child: Row(
        children: [
          meAsync.when(
            data: (me) {
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: UserProfileAvatar.fromUser(
                  me,
                  size: 48,
                  borderColor: const Color(0xFF38BDF8).withValues(alpha: 0.5),
                  backgroundColor: const Color(0xFF1E293B),
                ),
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.only(right: 12),
              child: SizedBox(width: 48, height: 48, child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            error: (_, _) => const Padding(
              padding: EdgeInsets.only(right: 12),
              child: CircleAvatar(radius: 24, child: Icon(Icons.person)),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Rollertips',
                  style: GoogleFonts.permanentMarker(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Comparte tips en video con la comunidad',
                  style: GoogleFonts.permanentMarker(
                    fontSize: 13,
                    color: const Color(0xFFCBD5F5),
                    height: 18 / 13,
                  ),
                ),
              ],
            ),
          ),
          Material(
            color: const Color.fromRGBO(15, 23, 42, 0.35),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.2)),
            ),
            child: InkWell(
              onTap: () => _rulesInfoModal(context),
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Text('ℹ️', style: TextStyle(fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _rulesInfoModal(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color.fromRGBO(15, 23, 42, 0.95),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.12)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Requisitos del video',
                  style: GoogleFonts.permanentMarker(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 12),
                _ruleRow('Tamaño máximo', '1 GB'),
                _ruleRow('Duración máxima', '1:30 min'),
                _ruleRow('Formatos recomendados', 'MP4 o MOV'),
                _ruleRow('Orientación ideal', 'Vertical o cuadrado'),
                _ruleRow('Resolución sugerida', '1080x1920 (stories)'),
                _ruleRowLast('Resolución sugerida', '1080x1080 (feed)'),
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Material(
                      color: const Color.fromRGBO(56, 189, 248, 0.12),
                      borderRadius: BorderRadius.circular(10),
                      child: InkWell(
                        onTap: () => Navigator.pop(ctx),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.5)),
                          ),
                          child: const Text(
                            'Cerrar',
                            style: TextStyle(color: Color(0xFF7DD3FC), fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _rulesCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDeco(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Requisitos del video',
            style: GoogleFonts.permanentMarker(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFF8FAFC),
            ),
          ),
          const SizedBox(height: 12),
          _ruleRow('Tamaño máximo', '1 GB'),
          _ruleRow('Duración máxima', '1:30 min'),
          _ruleRow('Formatos recomendados', 'MP4 o MOV'),
          _ruleRow('Orientación ideal', 'Vertical o cuadrado'),
          _ruleRow('Resolución sugerida', '1080x1920 (stories)'),
          _ruleRowLast('Resolución sugerida', '1080x1080 (feed)'),
        ],
      ),
    );
  }

  Widget _ruleRow(String a, String b) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color.fromRGBO(255, 255, 255, 0.08))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(a, style: GoogleFonts.permanentMarker(fontSize: 13, color: const Color(0xFFCBD5F5)))),
          Text(b, style: GoogleFonts.permanentMarker(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFFF8FAFC))),
        ],
      ),
    );
  }

  Widget _ruleRowLast(String a, String b) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(a, style: GoogleFonts.permanentMarker(fontSize: 13, color: const Color(0xFFCBD5F5)))),
          Text(b, style: GoogleFonts.permanentMarker(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFFF8FAFC))),
        ],
      ),
    );
  }

  BoxDecoration _cardDeco() => RnLayeredStyles.glassPanel(radius: 18);

  Widget _uploadCard(WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDeco(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Subir video',
                style: GoogleFonts.permanentMarker(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFF8FAFC),
                ),
              ),
              Material(
                color: const Color.fromRGBO(15, 23, 42, 0.35),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.2)),
                ),
                child: InkWell(
                  onTap: () => setState(() => _showUpload = !_showUpload),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                    child: Text(_showUpload ? '▾' : '▸', style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 14)),
                  ),
                ),
              ),
            ],
          ),
          if (_showUpload) ...[
            const SizedBox(height: 12),
            Text(
              'Selecciona tu video y publícalo cuando esté listo.',
              style: GoogleFonts.permanentMarker(fontSize: 13, color: const Color(0xFFCBD5F5)),
            ),
            const SizedBox(height: 8),
            _tipsRnOutlineButton(
              label: 'Seleccionar video',
              onTap: _publishing ? null : _pickVideo,
            ),
            if (_pickedVideo != null)
              Container(
                margin: const EdgeInsets.only(top: 10),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
                  color: const Color.fromRGBO(15, 23, 42, 0.4),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _pickedVideo!.name,
                      style: const TextStyle(fontSize: 12, color: Color(0xFFF8FAFC), fontWeight: FontWeight.w600),
                    ),
                    if (_pickedVideo!.size > 0)
                      Text(
                        'Tamaño: ${(_pickedVideo!.size / (1024 * 1024)).toStringAsFixed(2)} MB',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                  ],
                ),
              ),
            if (_webPreviewUrl != null && _webPreviewUrl!.isNotEmpty) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: NetworkReelVideo(url: _webPreviewUrl!, height: 220),
              ),
            ] else if (!kIsWeb &&
                _pickedVideo != null &&
                _pickedVideo!.path != null &&
                _pickedVideo!.path!.isNotEmpty) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: LocalFileReelVideo(path: _pickedVideo!.path!, height: 220),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              'Descripción (máx. 1024)',
              style: GoogleFonts.permanentMarker(fontSize: 12, color: const Color(0xFFE2E8F0)),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _tipDescCtrl,
              maxLines: 4,
              maxLength: 1024,
              style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 13),
              cursorColor: Color(0xFF38BDF8),
              decoration: RnLayeredStyles.textField(
                hintText: 'Escribe tu tip o descripción...',
                borderRadius: 10,
              ),
            ),
            const SizedBox(height: 10),
            _tipsRnOutlineButton(
              label: 'Publicar',
              busy: _publishing,
              onTap: _publishing ? null : () => _publish(ref),
            ),
          ],
        ],
      ),
    );
  }

  Widget _creatorsCard(AsyncValue<List<Map<String, dynamic>>> async) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDeco(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Buscar creadores',
                style: GoogleFonts.permanentMarker(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFF8FAFC),
                ),
              ),
              Material(
                color: const Color.fromRGBO(15, 23, 42, 0.35),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.2)),
                ),
                child: InkWell(
                  onTap: () => setState(() => _showCreators = !_showCreators),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                    child: Text(_showCreators ? '▾' : '▸', style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 14)),
                  ),
                ),
              ),
            ],
          ),
          if (_showCreators) ...[
            TextField(
              controller: _creatorQueryCtrl,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 13),
              cursorColor: Color(0xFF38BDF8),
              decoration: RnLayeredStyles.textField(
                hintText: 'Busca por nombre o alias...',
                borderRadius: 10,
              ).copyWith(
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              ),
            ),
            const SizedBox(height: 8),
            async.when(
              data: (tips) {
                final creators = <String, String>{};
                for (final t in tips) {
                  final id = (t['uploadedBy'] ?? '').toString();
                  if (id.isEmpty) continue;
                  final name = (t['uploaderAlias'] ?? t['uploaderName'] ?? t['uploaderEmail'] ?? 'Usuario').toString();
                  creators[id] = name;
                }
                final q = _creatorQueryCtrl.text.trim().toLowerCase();
                final filtered = creators.entries
                    .where((e) => q.isEmpty || e.value.toLowerCase().contains(q))
                    .toList();
                if (filtered.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'Sin resultados.',
                      style: TextStyle(fontSize: 13, color: Color(0xFFCBD5F5)),
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                return Column(
                  children: [
                    for (final e in filtered)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Material(
                          color: const Color.fromRGBO(15, 23, 42, 0.4),
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: () {},
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    e.value,
                                    style: const TextStyle(fontSize: 12, color: Color(0xFFF8FAFC), fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Toca para ver videos y detalles',
                                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _reelsSection(
    BuildContext context,
    WidgetRef ref,
    List<Map<String, dynamic>> tips,
    Map<String, dynamic>? me,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'RollerTips recientes',
          style: GoogleFonts.permanentMarker(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: const Color(0xFFF8FAFC),
          ),
        ),
        const SizedBox(height: 8),
        if (tips.isEmpty)
          const Text(
            'Aún no hay videos publicados.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Color(0xFFCBD5F5)),
          )
        else
          for (final tip in tips) _reelCard(context, ref, tip, me),
      ],
    );
  }

  String _timeLeftLabel(Map<String, dynamic> tip) {
    final raw = (tip['expiresAt'] ?? '').toString();
    if (raw.isEmpty) return '';
    final exp = DateTime.tryParse(raw);
    if (exp == null) return '';
    final diff = exp.difference(DateTime.now());
    if (diff.isNegative) return 'Expirado';
    final h = diff.inHours;
    final m = diff.inMinutes % 60;
    if (h > 0) return '${h}h ${m}m';
    return '${m}m';
  }

  Widget _reelCard(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> tip,
    Map<String, dynamic>? me,
  ) {
    final id = (tip['id'] ?? '').toString();
    final url = (tip['url'] ?? '').toString();
    final text = (tip['description'] ?? '').toString();
    final expanded = _expandedTips[id] == true;
    final isLong = text.length > 125;
    final display = !isLong || expanded ? text : '${text.substring(0, 125)}…';
    final myId = me?['id']?.toString();
    final uploadedBy = (tip['uploadedBy'] ?? '').toString();
    final name = (tip['uploaderAlias'] ?? tip['uploaderName'] ?? tip['uploaderEmail'] ?? 'Usuario').toString();
    final reactions = tip['reactions'];
    final reactionsByUser = tip['reactionsByUser'];
    final myReaction = reactionsByUser is Map ? reactionsByUser[myId]?.toString() : null;
    final comments = tip['comments'] is List ? List<Map<String, dynamic>>.from(tip['comments'] as List) : <Map<String, dynamic>>[];
    final playable = _tipPlayableUrl(url);
    final timeLeft = _timeLeftLabel(tip);
    final commentsOpen = _commentExpanded[id] == true;

    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: RnLayeredStyles.glassPanel(radius: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (myId != null && uploadedBy == myId)
            Align(
              alignment: Alignment.centerRight,
              child: Material(
                color: const Color.fromRGBO(248, 113, 113, 0.12),
                borderRadius: BorderRadius.circular(10),
                child: InkWell(
                  onTap: () async {
                    final go = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => Dialog(
                        backgroundColor: const Color.fromRGBO(15, 23, 42, 0.95),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                          side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.12)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'Eliminar video',
                                style: GoogleFonts.permanentMarker(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFFF8FAFC),
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                '¿Deseas eliminar este video?',
                                style: TextStyle(fontSize: 13, color: Color(0xFFCBD5F5), height: 18 / 13),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      onTap: () => Navigator.pop(ctx, false),
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                        child: Text(
                                          'Cancelar',
                                          style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Material(
                                    color: const Color.fromRGBO(248, 113, 113, 0.12),
                                    borderRadius: BorderRadius.circular(10),
                                    child: InkWell(
                                      onTap: () => Navigator.pop(ctx, true),
                                      borderRadius: BorderRadius.circular(10),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: Color.fromRGBO(248, 113, 113, 0.45)),
                                        ),
                                        child: const Text(
                                          'Eliminar',
                                          style: TextStyle(fontSize: 14, color: Color(0xFFFCA5A5), fontWeight: FontWeight.w700),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                    if (go != true || !context.mounted) return;
                    try {
                      await ref.read(rollertipsRepositoryProvider).deleteTip(id);
                      ref.invalidate(tipsProvider);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Video eliminado.')));
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('No se pudo eliminar: $e')),
                        );
                      }
                    }
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color.fromRGBO(248, 113, 113, 0.5)),
                    ),
                    child: const Text(
                      '🗑 Eliminar',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFFFCA5A5)),
                    ),
                  ),
                ),
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                name,
                style: const TextStyle(fontSize: 12, color: _cyan, fontWeight: FontWeight.w700),
              ),
              if (timeLeft.isNotEmpty)
                Text(
                  timeLeft,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: ColoredBox(
                  color: const Color.fromRGBO(15, 23, 42, 0.6),
                  child: playable.isEmpty
                      ? const SizedBox(
                          height: 240,
                          width: double.infinity,
                          child: Center(child: Icon(Icons.videocam_off, color: Colors.white54, size: 48)),
                        )
                      : NetworkReelVideo(url: playable, height: 240),
                ),
              ),
              if (playable.isNotEmpty)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Material(
                    color: const Color.fromRGBO(15, 23, 42, 0.75),
                    shape: const CircleBorder(),
                    child: IconButton(
                      tooltip: 'Abrir fuera de la app',
                      onPressed: () async {
                        final u = Uri.parse(playable);
                        if (!await launchUrl(u, mode: LaunchMode.externalApplication) && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir el video')));
                        }
                      },
                      icon: const Icon(Icons.open_in_new, color: Color(0xFF38BDF8), size: 22),
                    ),
                  ),
                ),
            ],
          ),
          if (text.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              display,
              style: GoogleFonts.permanentMarker(fontSize: 13, color: const Color(0xFFF8FAFC), height: 18 / 13),
            ),
            if (isLong)
              Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Material(
                    color: const Color.fromRGBO(56, 189, 248, 0.1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.5)),
                    ),
                    child: InkWell(
                      onTap: () => setState(() => _expandedTips[id] = !expanded),
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        child: Text(
                          expanded ? 'Ver menos' : 'Ver más',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF7DD3FC), fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              for (final r in _reactions)
                Material(
                  color: myReaction == r.$1
                      ? _cyan.withValues(alpha: 0.2)
                      : const Color.fromRGBO(15, 23, 42, 0.4),
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: () => _onReaction(ref, id, r.$1),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: myReaction == r.$1 ? _cyan : const Color.fromRGBO(255, 255, 255, 0.12),
                          width: myReaction == r.$1 ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(r.$2, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 4),
                          Text(
                            '${reactions is Map ? reactions[r.$1] ?? 0 : 0}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFFE2E8F0), fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Comentarios (${comments.length})',
                style: GoogleFonts.permanentMarker(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFF8FAFC),
                ),
              ),
              TextButton(
                onPressed: () => setState(() => _commentExpanded[id] = !commentsOpen),
                child: Text(
                  commentsOpen ? 'Ocultar' : 'Ver / agregar',
                  style: const TextStyle(color: _cyan, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          if (commentsOpen) ...[
            if (comments.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('Sin comentarios.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              )
            else
              for (final c in comments)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color.fromRGBO(2, 6, 23, 0.55),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: RnLayeredStyles.glassBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        (c['authorName'] ?? 'Usuario').toString(),
                        style: const TextStyle(fontSize: 11, color: _cyan, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (c['text'] ?? '').toString(),
                        style: const TextStyle(fontSize: 13, color: Color(0xFFE2E8F0), height: 1.35),
                      ),
                    ],
                  ),
                ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentCtrlFor(id),
                    maxLines: 2,
                    style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 13),
                    decoration: RnLayeredStyles.textField(
                      hintText: 'Escribe un comentario…',
                      borderRadius: 10,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: () => _onComment(ref, id, me),
                  style: RnLayeredStyles.ctaButton(backgroundColor: _cyan),
                  child: const Text('Enviar'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _tipsRnOutlineButton({
    required String label,
    required VoidCallback? onTap,
    bool busy = false,
  }) {
    return Opacity(
      opacity: onTap == null ? 0.5 : 1,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
            alignment: Alignment.center,
            constraints: const BoxConstraints(minHeight: 50),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _cyan),
            ),
            child: busy
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: _cyan),
                  )
                : Text(
                    label,
                    style: GoogleFonts.permanentMarker(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: _cyan,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

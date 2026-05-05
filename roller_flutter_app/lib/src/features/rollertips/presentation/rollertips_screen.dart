import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_config.dart';
import '../../../core/ui/network_reel_video.dart';
import '../../perfil/data/perfil_repository.dart';
import '../data/rollertips_repository.dart';

final tipsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(rollertipsRepositoryProvider).list(scope: 'active');
});

final _tipsMeProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.watch(perfilRepositoryProvider).me();
});

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
  final bool _showRules = true;
  bool _showUpload = false;
  bool _showCreators = false;
  final Map<String, bool> _expandedTips = {};
  final _tipDescCtrl = TextEditingController();
  PlatformFile? _pickedVideo;
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
    super.dispose();
  }

  Future<void> _pickVideo() async {
    final r = await FilePicker.platform.pickFiles(
      type: FileType.video,
      allowMultiple: false,
      withData: true,
    );
    final f = r?.files.firstOrNull;
    if (f != null) setState(() => _pickedVideo = f);
  }

  Future<void> _publish(WidgetRef ref) async {
    final file = _pickedVideo;
    if (file == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Selecciona un video primero.')));
      return;
    }
    setState(() => _publishing = true);
    try {
      await ref.read(rollertipsRepositoryProvider).create(
            video: file,
            description: _tipDescCtrl.text.trim(),
          );
      ref.invalidate(tipsProvider);
      setState(() {
        _pickedVideo = null;
        _tipDescCtrl.clear();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tip publicado.')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
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

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/patines-fondo-nuevo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          const Positioned.fill(
            child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.55)),
          ),
          Positioned.fill(
            child: RefreshIndicator(
              color: const Color(0xFF38BDF8),
              onRefresh: () async {
                ref.invalidate(tipsProvider);
                await ref.read(tipsProvider.future);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(20, topPad, 20, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _headerCard(context, meAsync),
                    if (_showRules) _rulesCard(),
                    _uploadCard(ref),
                    _creatorsCard(async),
                    async.when(
                      data: (tips) => _reelsSection(context, tips, meAsync.valueOrNull),
                      loading: () => const Padding(
                        padding: EdgeInsets.all(32),
                        child: Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8))),
                      ),
                      error: (e, _) => Text('Error: $e', style: const TextStyle(color: Color(0xFFCBD5F5))),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerCard(BuildContext context, AsyncValue<Map<String, dynamic>> meAsync) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.55),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.25), blurRadius: 12, offset: Offset(0, 6)),
        ],
      ),
      child: Row(
        children: [
          meAsync.when(
            data: (me) {
              final foto = (me['fotoPerfil'] ?? '').toString();
              final av = (me['avatar'] ?? '').toString();
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: CircleAvatar(
                  radius: 24,
                  backgroundColor: const Color(0xFF1E293B),
                  backgroundImage: foto.startsWith('http') ? NetworkImage(foto) : null,
                  child: foto.startsWith('http')
                      ? null
                      : Text(av.isEmpty ? '👤' : av, style: const TextStyle(fontSize: 20)),
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
    showDialog(
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'RollerTips',
                style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFFF8FAFC)),
              ),
              const SizedBox(height: 12),
              const Text(
                'Publica videos cortos con tips. Respeta las reglas de la comunidad.',
                style: TextStyle(color: Color(0xFFCBD5F5), fontSize: 14),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cerrar', style: TextStyle(color: Color(0xFF7DD3FC), fontWeight: FontWeight.w600)),
                ),
              ),
            ],
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

  BoxDecoration _cardDeco() {
    return BoxDecoration(
      color: const Color.fromRGBO(15, 23, 42, 0.75),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
      boxShadow: const [
        BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.28), blurRadius: 16, offset: Offset(0, 8)),
      ],
    );
  }

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
            OutlinedButton(
              onPressed: _publishing ? null : _pickVideo,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF7DD3FC),
                side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.5)),
              ),
              child: Text('Seleccionar video', style: GoogleFonts.permanentMarker()),
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
            if (_pickedVideo != null && _pickedVideo!.path != null && _pickedVideo!.path!.isNotEmpty) ...[
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
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color.fromRGBO(15, 23, 42, 0.3),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color.fromRGBO(148, 163, 184, 0.28)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color.fromRGBO(148, 163, 184, 0.28)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: _publishing ? null : () => _publish(ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF7DD3FC),
                side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.5)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _publishing
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('Publicar', style: GoogleFonts.permanentMarker(fontWeight: FontWeight.w600)),
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
          if (_showCreators)
            async.when(
              data: (tips) {
                final creators = <String, String>{};
                for (final t in tips) {
                  final id = (t['uploadedBy'] ?? '').toString();
                  if (id.isEmpty) continue;
                  final name = (t['uploaderAlias'] ?? t['uploaderName'] ?? t['uploaderEmail'] ?? 'Usuario').toString();
                  creators[id] = name;
                }
                if (creators.isEmpty) {
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
                    for (final e in creators.entries)
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
      ),
    );
  }

  Widget _reelsSection(BuildContext context, List<Map<String, dynamic>> tips, Map<String, dynamic>? me) {
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
          for (final tip in tips) _reelCard(context, tip, me),
      ],
    );
  }

  Widget _reelCard(BuildContext context, Map<String, dynamic> tip, Map<String, dynamic>? me) {
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
    final playable = _tipPlayableUrl(url);

    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.75),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (myId != null && uploadedBy == myId)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Eliminar tip: conectar DELETE /rollertips en backend.')));
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                  foregroundColor: const Color(0xFFFCA5A5),
                  side: const BorderSide(color: Color.fromRGBO(248, 113, 113, 0.5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('🗑 Eliminar', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                name,
                style: const TextStyle(fontSize: 12, color: Color(0xFF38BDF8), fontWeight: FontWeight.w700, decoration: TextDecoration.underline),
              ),
              Text(
                (tip['expiresAt'] ?? '').toString().isEmpty ? '' : '⏳',
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
                  color: const Color.fromRGBO(15, 23, 42, 0.4),
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: () {},
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
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
        ],
      ),
    );
  }
}

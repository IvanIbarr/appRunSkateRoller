import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/l10n/app_locale.dart';
import '../../chat/data/chat_repository.dart';
import '../../perfil/data/perfil_repository.dart';

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(perfilRepositoryProvider).me();
  } catch (_) {
    return null;
  }
});

final _messagesProvider =
    FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, chatType) async {
  return ref.watch(chatRepositoryProvider).getMessages(chatType: chatType);
});

class ComunidadScreen extends ConsumerStatefulWidget {
  const ComunidadScreen({super.key});

  @override
  ConsumerState<ComunidadScreen> createState() => _ComunidadScreenState();
}

class _ComunidadScreenState extends ConsumerState<ComunidadScreen> {
  String _tab = 'general';
  final _textCtrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  bool _canViewStaff(Map<String, dynamic>? me) {
    final tipo = (me?['tipoPerfil'] ?? '').toString();
    return tipo == 'administrador' || tipo == 'liderGrupo';
  }

  String _formatTime(dynamic timestamp) {
    try {
      final dt = timestamp is DateTime ? timestamp : DateTime.tryParse(timestamp.toString());
      final t = dt ?? DateTime.now();
      final hh = t.hour.toString().padLeft(2, '0');
      final mm = t.minute.toString().padLeft(2, '0');
      return '$hh:$mm';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appLocaleProvider).t;
    final me = ref.watch(_meProvider).valueOrNull;
    final canStaff = _canViewStaff(me);
    if (!canStaff && _tab == 'staff') {
      _tab = 'general';
    }

    final async = ref.watch(_messagesProvider(_tab));
    final myEmail = (me?['email'] ?? '').toString().toLowerCase();
    final myId = (me?['id'] ?? '').toString();

    // RN ComunidadScreen: paddingTop web 12, móvil 6.
    final padTop = kIsWeb ? 12.0 : 6.0;
    final padBottom = kIsWeb ? 0.0 : 8.0;

    final tabText = TextStyle(
      fontSize: 16,
      color: const Color(0xFFE2E8F0),
      fontWeight: FontWeight.w600,
      fontFamily: kIsWeb ? GoogleFonts.permanentMarker().fontFamily : null,
      shadows: const [
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.6), blurRadius: 4, offset: Offset(0, 1)),
      ],
    );
    final activeTabText = TextStyle(
      fontSize: 16,
      color: const Color(0xFFFFFFFF),
      fontWeight: FontWeight.w700,
      fontFamily: kIsWeb ? GoogleFonts.permanentMarker().fontFamily : null,
      shadows: const [
        Shadow(color: Color.fromRGBO(56, 189, 248, 0.6), blurRadius: 6, offset: Offset(0, 1)),
      ],
    );

    return Scaffold(
      body: Stack(
        children: [
          // RN: comunidad-fondo.jpeg (si no está en assets, mismo patrón que Historial: patines-fondo-nuevo)
          Positioned.fill(
            child: Image.asset(
              'assets/patines-fondo-nuevo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          const Positioned.fill(
            child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.55)),
          ),
          SafeArea(
            child: Padding(
              padding: EdgeInsets.only(top: padTop, bottom: padBottom),
              child: Column(
                children: [
                  // Tabs container (RN styles.tabsContainer)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16).copyWith(top: 14),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(20, 24, 38, 0.72),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.16)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color.fromRGBO(0, 0, 0, 0.25),
                          blurRadius: 16,
                          offset: Offset(0, 10),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _tab = 'general'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              alignment: Alignment.center,
                              color: _tab == 'general'
                                  ? const Color.fromRGBO(56, 189, 248, 0.18)
                                  : Colors.transparent,
                              child: Text(t('community.chatGeneral'), style: _tab == 'general' ? activeTabText : tabText),
                            ),
                          ),
                        ),
                        if (canStaff) ...[
                          Container(
                            width: 1,
                            margin: const EdgeInsets.symmetric(vertical: 10),
                            decoration: const BoxDecoration(
                              color: Color.fromRGBO(255, 255, 255, 0.18),
                              boxShadow: [
                                BoxShadow(
                                  color: Color.fromRGBO(0, 0, 0, 0.30),
                                  blurRadius: 2,
                                  offset: Offset(0, 0),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () => setState(() => _tab = 'staff'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                alignment: Alignment.center,
                                color: _tab == 'staff'
                                    ? const Color.fromRGBO(56, 189, 248, 0.18)
                                    : Colors.transparent,
                                child: Text(t('community.chatStaff'), style: _tab == 'staff' ? activeTabText : tabText),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Chat container (RN styles.chatContainer)
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16).copyWith(top: 14, bottom: 16),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color.fromRGBO(12, 16, 28, 0.78),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
                        boxShadow: const [
                          BoxShadow(
                            color: Color.fromRGBO(0, 0, 0, 0.30),
                            blurRadius: 18,
                            offset: Offset(0, 14),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        children: [
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton.icon(
                              onPressed: () => ref.invalidate(_messagesProvider(_tab)),
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('Refrescar'),
                            ),
                          ),
                          Expanded(
                            child: async.when(
                              data: (items) {
                                if (items.isEmpty) {
                                  return const Center(
                                    child: Text(
                                      'Sin mensajes todavía',
                                      style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.85)),
                                    ),
                                  );
                                }
                                // RN usa FlatList con padding 16 y scroll-to-end.
                                return ListView.builder(
                                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                                  itemCount: items.length,
                                  itemBuilder: (context, index) {
                                    final it = items[index];
                                    final user = (it['userName'] ?? 'Usuario').toString();
                                    final text = (it['text'] ?? '').toString();
                                    final msgEmail = (it['userEmail'] ?? '').toString().toLowerCase();
                                    final msgUserId = (it['userId'] ?? '').toString();
                                    final isMe = (myId.isNotEmpty && msgUserId == myId) ||
                                        (myEmail.isNotEmpty && msgEmail == myEmail);
                                    final isSystem = msgUserId == 'system';
                                    final ts = _formatTime(it['timestamp'] ?? it['createdAt'] ?? '');

                                    final bg = isSystem
                                        ? const Color.fromRGBO(15, 23, 42, 0.18)
                                        : (isMe
                                            ? const Color.fromRGBO(37, 99, 235, 0.95)
                                            : const Color.fromRGBO(248, 250, 252, 0.96));
                                    final borderColor = isSystem
                                        ? const Color.fromRGBO(148, 163, 184, 0.50)
                                        : (isMe
                                            ? const Color.fromRGBO(59, 130, 246, 0.45)
                                            : const Color.fromRGBO(15, 23, 42, 0.08));
                                    final align = isSystem
                                        ? Alignment.center
                                        : (isMe ? Alignment.centerRight : Alignment.centerLeft);

                                    final radius = BorderRadius.circular(18).copyWith(
                                      topRight: Radius.circular(isMe ? 6 : 18),
                                    );

                                    return Align(
                                      alignment: align,
                                      child: Container(
                                        constraints: const BoxConstraints(maxWidth: 560),
                                        margin: const EdgeInsets.only(bottom: 10),
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: isSystem ? 8 : 10,
                                        ),
                                        decoration: BoxDecoration(
                                          color: bg,
                                          borderRadius: radius,
                                          border: Border.all(color: borderColor),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color.fromRGBO(0, 0, 0, 0.18),
                                              blurRadius: isSystem ? 10 : 12,
                                              offset: Offset(0, isSystem ? 6 : 8),
                                            ),
                                          ],
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            if (!isSystem)
                                              Text(
                                                isMe ? 'Tú' : user,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: isMe
                                                      ? const Color.fromRGBO(255, 255, 255, 0.90)
                                                      : const Color(0xFF475569),
                                                  letterSpacing: 0.2,
                                                ),
                                              ),
                                            if (!isSystem) const SizedBox(height: 3),
                                            if (text.isNotEmpty)
                                              Text(
                                                text,
                                                textAlign: isSystem ? TextAlign.center : TextAlign.start,
                                                style: TextStyle(
                                                  fontSize: 16,
                                                  height: 21 / 16,
                                                  fontWeight: isSystem ? FontWeight.w500 : FontWeight.w400,
                                                  color: isSystem
                                                      ? const Color(0xFFE2E8F0)
                                                      : (isMe ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A)),
                                                ),
                                              ),
                                            const SizedBox(height: 6),
                                            Align(
                                              alignment: Alignment.centerRight,
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: isMe
                                                      ? const Color.fromRGBO(15, 23, 42, 0.25)
                                                      : const Color.fromRGBO(15, 23, 42, 0.06),
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  ts,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: isMe ? const Color(0xFFBFDBFE) : const Color(0xFF64748B),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                );
                              },
                              loading: () => const Center(child: CircularProgressIndicator()),
                              error: (e, st) => Center(
                                child: Text(
                                  'Error cargando chat: $e',
                                  style: const TextStyle(color: Color(0xFFFF3B30)),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                          ),
                          // RN input container: rgba(255,255,255,0.95) + borderTop
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: const BoxDecoration(
                              color: Color.fromRGBO(255, 255, 255, 0.95),
                              border: Border(
                                top: BorderSide(color: Color(0xFFE0E0E0), width: 1),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF9F9F9),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: const Color(0xFFDDDDDD)),
                                    ),
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                    child: TextField(
                                      controller: _textCtrl,
                                      minLines: 1,
                                      maxLines: 4,
                                      style: const TextStyle(fontSize: 16, color: Color(0xFF0F172A)),
                                      decoration: const InputDecoration(
                                        hintText: 'Escribe un mensaje...',
                                        border: InputBorder.none,
                                        isDense: true,
                                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                InkWell(
                                  onTap: _sending
                                      ? null
                                      : () async {
                                          final text = _textCtrl.text.trim();
                                          if (text.isEmpty) return;
                                          setState(() => _sending = true);
                                          try {
                                            await ref.read(chatRepositoryProvider).sendMessage(chatType: _tab, text: text);
                                            _textCtrl.clear();
                                            ref.invalidate(_messagesProvider(_tab));
                                          } finally {
                                            if (mounted) setState(() => _sending = false);
                                          }
                                        },
                                  child: Container(
                                    constraints: const BoxConstraints(minWidth: 70),
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: _sending ? const Color(0xFFCCCCCC) : const Color(0xFF007AFF),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      _sending ? '...' : 'Enviar',
                                      style: const TextStyle(
                                        color: Color(0xFFFFFFFF),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


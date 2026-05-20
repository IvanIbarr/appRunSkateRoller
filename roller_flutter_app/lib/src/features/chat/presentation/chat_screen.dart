import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_mirror_layouts.dart';
import '../../../core/ui/rn_mobile_shell_width.dart';
import '../../../core/ui/user_profile_avatar.dart';
import '../../../core/auth/staff_chat_access.dart';
import '../../grupo/data/grupo_repository.dart';
import '../../perfil/data/perfil_providers.dart';
import 'chat_comunidad_rn_tabs_mirror.dart';
import 'chat_thread_screen.dart' show ChatThreadScreen, chatThreadMessagesProvider;

/// Overlay RN `ComunidadScreen.tsx` → `backgroundOverlay` rgba(10,12,24,0.55).
const _kComunidadOverlay = Color.fromRGBO(10, 12, 24, 0.55);

final _chatTabMeProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(currentMeProvider.future);
  } catch (_) {
    return null;
  }
});

final _chatNombreGrupoIfStaffProvider =
    FutureProvider.autoDispose.family<String, bool>((ref, staffVisible) async {
  if (!staffVisible) return '';
  try {
    return await ref.read(grupoRepositoryProvider).getNombre();
  } catch (_) {
    return '';
  }
});

bool _canViewStaffChat(Map<String, dynamic>? me) => canAccessStaffChat(me);

/// Fondo + overlay + contenido (Column flexible; ancho máx. 480 solo en web ancha).
Widget _chatComunidadShell({required Widget child, required bool wideWeb}) {
  Widget foreground = SizedBox.expand(child: child);
  if (wideWeb) {
    foreground = Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: kRnMobileShellMaxContentWidth),
        child: SizedBox(
          width: kRnMobileShellMaxContentWidth,
          child: SizedBox.expand(child: child),
        ),
      ),
    );
  }

  return Stack(
    fit: StackFit.expand,
    children: [
      Positioned.fill(
        child: Image.asset(
          RnMirrorFreeze.comunidadAsset,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => Image.asset(
            RnMirrorFreeze.brandAsset,
            fit: BoxFit.cover,
          ),
        ),
      ),
      const Positioned.fill(
        child: IgnorePointer(
          child: ColoredBox(color: _kComunidadOverlay),
        ),
      ),
      Positioned.fill(
        child: SafeArea(
          bottom: false,
          child: foreground,
        ),
      ),
    ],
  );
}

/// Pestaña **Chat** del shell. Ruta: `/chat`.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.invalidate(_chatTabMeProvider);
      ref.invalidate(chatThreadMessagesProvider('general'));
      ref.invalidate(chatThreadMessagesProvider('staff'));
    });
  }

  Widget _buildChatContent(Map<String, dynamic>? me) {
    if (me == null) return _missingUserLikeRn();
    final canStaff = _canViewStaffChat(me);
    final grupoNombre =
        ref.watch(_chatNombreGrupoIfStaffProvider(canStaff)).valueOrNull ?? '';
    final staffLabel =
        grupoNombre.trim().isEmpty ? 'Chat Staff' : 'Chat Staff ${grupoNombre.trim()}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              UserProfileAvatar.header(me),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Comunidad',
                      style: GoogleFonts.permanentMarker(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFF8FAFC),
                      ),
                    ),
                    Text(
                      (me['alias'] ?? me['email'] ?? '').toString().split('@').first,
                      style: GoogleFonts.permanentMarker(
                        fontSize: 14,
                        color: const Color(0xFF94A3B8),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ChatComunidadRnTabsMirror(
            embedRnShell: false,
            canViewStaff: canStaff,
            staffLabel: staffLabel,
            generalPane: const ChatThreadScreen(chatType: 'general', shellEmbedded: true),
            staffPane: canStaff ? const ChatThreadScreen(chatType: 'staff', shellEmbedded: true) : null,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final wideWeb = isRnWideWeb(context);
    final meAsync = ref.watch(_chatTabMeProvider);

    final chatChild = meAsync.when(
      loading: () => _loadingLikeRn(),
      error: (_, st) => _missingUserLikeRn(),
      data: _buildChatContent,
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      resizeToAvoidBottomInset: true,
      body: _chatComunidadShell(wideWeb: wideWeb, child: chatChild),
    );
  }

  Widget _loadingLikeRn() {
    return const SizedBox.expand(
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Color(0xFF007AFF)),
            SizedBox(height: 14),
            Text(
              'Cargando...',
              style: TextStyle(fontSize: 16, color: Color(0xFF888888)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _missingUserLikeRn() {
    return SizedBox.expand(
      child: Center(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'No se pudo cargar la información del usuario',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 16,
              color: Color(0xFFFF3B30),
              height: 1.35,
            ),
          ),
        ),
      ),
    );
  }
}

import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/auth/auth_session.dart';
import '../../grupo/data/grupo_repository.dart';
import '../../perfil/data/perfil_repository.dart';

final _menuMeProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.watch(perfilRepositoryProvider).me();
});

final _menuLiderProvider = FutureProvider.autoDispose<String?>((ref) async {
  try {
    final r = await ref.watch(grupoRepositoryProvider).getIntegrantes();
    return r.liderId;
  } catch (_) {
    return null;
  }
});

bool _canManageStaff(Map<String, dynamic>? me, String? liderId) {
  if (me == null) return false;
  final tipo = (me['tipoPerfil'] ?? '').toString();
  final isLeaderProfile = tipo == 'liderGrupo' || tipo == 'administrador';
  if (!isLeaderProfile) return false;
  final myId = me['id']?.toString();
  if (liderId == null || liderId.isEmpty || myId != liderId) return false;
  return true;
}

bool _showIntegrantes(Map<String, dynamic>? me, bool canStaff) {
  if (me == null) return false;
  if (canStaff) return true;
  final tipo = (me['tipoPerfil'] ?? '').toString();
  final grupoId = me['grupoId']?.toString() ?? '';
  if (grupoId.isEmpty) return false;
  if (tipo == 'liderGrupo') return true;
  if (tipo == 'roller') return true;
  return false;
}

Uint8List? _tryDataUrlImage(String raw) {
  final s = raw.trim();
  if (!s.startsWith('data:image/')) return null;
  final idx = s.indexOf('base64,');
  if (idx < 0) return null;
  try {
    return base64Decode(s.substring(idx + 'base64,'.length));
  } catch (_) {
    return null;
  }
}

/// Espejo de `MenuScreen.tsx` (StyleSheet: content, title, botones, avatarContainer, profileChoice*).
class MenuScreen extends ConsumerStatefulWidget {
  const MenuScreen({super.key});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  bool _profileFotoMode = false;

  @override
  Widget build(BuildContext context) {
    final meAsync = ref.watch(_menuMeProvider);
    final liderAsync = ref.watch(_menuLiderProvider);

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/menu-fondo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              20,
              MediaQuery.paddingOf(context).top > 0 ? 20 : 60,
              20,
              20,
            ),
            child: meAsync.when(
              data: (me) {
                final liderId = liderAsync.valueOrNull;
                final canStaff = _canManageStaff(me, liderId);
                final integrantes = _showIntegrantes(me, canStaff);
                final email = (me['email'] ?? '').toString();
                final alias = (me['alias'] ?? '').toString();
                final foto = (me['fotoPerfil'] ?? '').toString();
                final hasFoto = foto.isNotEmpty;
                final hasAvatar = (me['avatar'] ?? '').toString().isNotEmpty;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Menú',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.permanentMarker(
                        fontSize: 31,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        shadows: const [
                          Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Configuración y opciones de la aplicación',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.permanentMarker(
                        fontSize: 21,
                        color: Colors.white,
                        shadows: const [
                          Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
                        ],
                      ),
                    ),
                    if (email.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        email,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.permanentMarker(
                          fontSize: 14,
                          fontStyle: FontStyle.italic,
                          color: Colors.white.withValues(alpha: 0.9),
                          shadows: const [
                            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 2, offset: Offset(1, 1)),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: _profileChoice(
                            label: 'Avatar',
                            active: !_profileFotoMode,
                            onTap: () => setState(() => _profileFotoMode = false),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _profileChoice(
                            label: 'Subir foto',
                            active: _profileFotoMode,
                            onTap: () {
                              setState(() => _profileFotoMode = true);
                              if (!hasFoto) context.go('/perfil');
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Center(child: _MenuAvatarLarge(me: me, fotoMode: _profileFotoMode)),
                    const SizedBox(height: 10),
                    Material(
                      color: const Color.fromRGBO(0, 122, 255, 0.2),
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        onTap: () => context.go('/perfil'),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF007AFF)),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            _profileFotoMode
                                ? (hasFoto ? '✏️ Cambiar foto' : '➕ Subir foto')
                                : (hasAvatar ? '✏️ Modificar Avatar' : '➕ Agregar Avatar'),
                            style: GoogleFonts.permanentMarker(
                              fontSize: 14,
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (_profileFotoMode && hasFoto) ...[
                      const SizedBox(height: 6),
                      TextButton(
                        onPressed: () => context.go('/perfil'),
                        child: Text(
                          'Quitar foto',
                          style: GoogleFonts.permanentMarker(
                            fontSize: 13,
                            color: const Color(0xFFFF3B30),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    _rnButton(
                      bg: const Color(0xFF2ECC71),
                      shadow: const Color(0xFF2ECC71),
                      label: '👤 Información personal',
                      onTap: () => context.go('/perfil'),
                    ),
                    if (alias.isEmpty)
                      _rnButton(
                        bg: const Color(0xFF007AFF),
                        shadow: const Color(0xFF007AFF),
                        border: true,
                        label: '➕ Agregar Alias',
                        onTap: () => context.go('/alias/agregar'),
                      )
                    else
                      _rnButton(
                        bg: const Color(0xFF007AFF),
                        shadow: const Color(0xFF007AFF),
                        border: true,
                        label: '✏️ Cambiar de Alias',
                        onTap: () => context.go('/alias/cambiar'),
                      ),
                    if (canStaff) ...[
                      _rnButton(
                        bg: const Color(0xFF34C759),
                        shadow: const Color(0xFF34C759),
                        label: '➕ Agregar Staff',
                        onTap: () => context.go('/grupo/integrantes'),
                      ),
                      _rnButton(
                        bg: const Color(0xFF007AFF),
                        shadow: const Color(0xFF007AFF),
                        label: '📝 Nombre del Grupo',
                        onTap: () => context.go('/grupo/nombre'),
                      ),
                    ],
                    if (integrantes)
                      _rnButton(
                        bg: const Color(0xFF9B59B6),
                        shadow: const Color(0xFF9B59B6),
                        label: '👥 Integrantes del Grupo',
                        onTap: () => context.go('/grupo/integrantes'),
                      ),
                    const SizedBox(height: 8),
                    _rnButton(
                      bg: const Color(0xFFFF3B30),
                      shadow: const Color(0xFFFF3B30),
                      label: 'Cerrar Sesión',
                      onTap: () async {
                        final ok = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Cerrar sesión'),
                            content: const Text('¿Estás seguro que deseas cerrar sesión?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
                              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Cerrar sesión')),
                            ],
                          ),
                        );
                        if (ok == true && context.mounted) {
                          await ref.read(authSessionProvider.notifier).clear();
                          if (context.mounted) context.go('/login');
                        }
                      },
                    ),
                  ],
                );
              },
              loading: () => const Center(child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator())),
              error: (e, _) => Text('Error: $e', style: const TextStyle(color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _profileChoice({
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return Material(
      color: active ? const Color(0xFFE3F2FD) : Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: active ? const Color(0xFF007AFF) : const Color(0xFFDDDDDD), width: 2),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.permanentMarker(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: active ? const Color(0xFF007AFF) : const Color(0xFF666666),
            ),
          ),
        ),
      ),
    );
  }

  static Widget _rnButton({
    required Color bg,
    required Color shadow,
    required String label,
    required VoidCallback onTap,
    bool border = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        elevation: 6,
        shadowColor: shadow.withValues(alpha: 0.3),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: border ? Border.all(color: bg, width: 2) : null,
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.permanentMarker(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MenuAvatarLarge extends StatelessWidget {
  const _MenuAvatarLarge({required this.me, required this.fotoMode});

  final Map<String, dynamic> me;
  final bool fotoMode;

  @override
  Widget build(BuildContext context) {
    final foto = (me['fotoPerfil'] ?? '').toString();
    final av = (me['avatar'] ?? '').toString();

    if (fotoMode && foto.isNotEmpty) {
      final bytes = _tryDataUrlImage(foto);
      if (bytes != null) {
        return ClipOval(
          child: Image.memory(
            bytes,
            width: 120,
            height: 120,
            fit: BoxFit.cover,
          ),
        );
      }
      if (foto.startsWith('http')) {
        return ClipOval(
          child: Image.network(
            foto,
            width: 120,
            height: 120,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _fallbackCircle(av),
          ),
        );
      }
    }

    return _fallbackCircle(av);
  }

  Widget _fallbackCircle(String avatar) {
    return Container(
      width: 72,
      height: 72,
      decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFE0E0E0)),
      alignment: Alignment.center,
      child: avatar.isEmpty
          ? const Icon(Icons.person, size: 40, color: Color(0xFF666666))
          : Text(avatar, style: const TextStyle(fontSize: 28)),
    );
  }
}

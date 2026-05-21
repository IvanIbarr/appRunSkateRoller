import 'dart:convert';
import 'dart:io' show File;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/l10n/app_locale.dart';
import '../../../core/ui/rn_layered_styles.dart';
import '../../../core/ui/rn_mirror_layouts.dart';
import '../../auth/data/auth_repository.dart';
import '../../grupo/data/grupo_repository.dart';
import '../../perfil/data/perfil_providers.dart';
import '../../perfil/data/perfil_repository.dart';
import 'avatar_selector_sheet.dart';
import 'widgets/menu_sport_widgets.dart';

final _menuMeProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
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

bool _hasGrupo(Map<String, dynamic> me) {
  return (me['grupoId'] ?? '').toString().trim().isNotEmpty;
}

bool _canCreateGrupo(Map<String, dynamic> me) {
  if (_hasGrupo(me)) return false;
  final tipo = (me['tipoPerfil'] ?? '').toString();
  return tipo == 'liderGrupo' || tipo == 'administrador';
}

/// Menú con estilo glass homologado a [/ruta].
class MenuScreen extends ConsumerStatefulWidget {
  const MenuScreen({super.key});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  bool _profileFotoMode = false;
  bool _leavingGrupo = false;
  bool _updatingProfile = false;
  String? _avatarMessage;
  String? _profileMessage;

  void _showSnack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: error ? const Color(0xFFFF3B30) : const Color(0xFF34C759),
      ),
    );
  }

  Future<void> _selectAvatar(String avatar) async {
    setState(() {
      _updatingProfile = true;
      _avatarMessage = null;
      _profileMessage = null;
    });
    try {
      await ref.read(authRepositoryProvider).updateAvatar(avatar);
      ref.invalidate(_menuMeProvider);
      invalidateCurrentMe(ref);
      setState(() => _avatarMessage = '✓ Avatar actualizado exitosamente');
      _showSnack('Avatar actualizado');
    } catch (e) {
      setState(() => _avatarMessage = '⚠️ Error al actualizar avatar');
      _showSnack('No se pudo actualizar el avatar', error: true);
    } finally {
      if (mounted) setState(() => _updatingProfile = false);
    }
  }

  Future<void> _pickProfilePhoto() async {
    setState(() {
      _updatingProfile = true;
      _profileMessage = null;
      _avatarMessage = null;
    });
    try {
      final res = await FilePicker.platform.pickFiles(
        type: FileType.image,
        withData: true,
      );
      final file = res?.files.firstOrNull;
      if (file == null) {
        if (mounted) setState(() => _updatingProfile = false);
        return;
      }

      List<int> bytes;
      if (file.bytes != null) {
        bytes = file.bytes!;
      } else if (file.path != null && !kIsWeb) {
        bytes = await File(file.path!).readAsBytes();
      } else {
        throw Exception('No se pudo leer la imagen');
      }

      if (bytes.length > 2 * 1024 * 1024) {
        throw Exception('La imagen es muy grande (máx. 2 MB)');
      }

      final ext = (file.extension ?? 'jpg').toLowerCase();
      final mime = ext == 'png'
          ? 'image/png'
          : ext == 'webp'
              ? 'image/webp'
              : 'image/jpeg';
      final dataUrl = 'data:$mime;base64,${base64Encode(bytes)}';

      await ref.read(authRepositoryProvider).updateFotoPerfil(dataUrl);
      ref.invalidate(_menuMeProvider);
      invalidateCurrentMe(ref);
      if (!mounted) return;
      setState(() {
        _profileFotoMode = true;
        _profileMessage = '✓ Foto actualizada exitosamente';
      });
      _showSnack('Foto de perfil guardada');
    } catch (e) {
      setState(() => _profileMessage = '⚠️ Error al subir foto');
      _showSnack('No se pudo subir la foto: $e', error: true);
    } finally {
      if (mounted) setState(() => _updatingProfile = false);
    }
  }

  Future<void> _removeProfilePhoto() async {
    setState(() {
      _updatingProfile = true;
      _profileMessage = null;
    });
    try {
      await ref.read(authRepositoryProvider).updateFotoPerfil(null);
      ref.invalidate(_menuMeProvider);
      invalidateCurrentMe(ref);
      if (!mounted) return;
      setState(() {
        _profileFotoMode = false;
        _profileMessage = '✓ Foto eliminada';
      });
      _showSnack('Foto eliminada');
    } catch (e) {
      setState(() => _profileMessage = '⚠️ Error al eliminar foto');
      _showSnack('No se pudo eliminar la foto', error: true);
    } finally {
      if (mounted) setState(() => _updatingProfile = false);
    }
  }

  void _onProfileModeChange(bool fotoMode, {required bool hasFoto}) {
    setState(() {
      _profileFotoMode = fotoMode;
      _avatarMessage = null;
      _profileMessage = null;
    });
    if (fotoMode && !hasFoto) {
      _pickProfilePhoto();
    }
  }

  Future<void> _confirmSalirGrupo(BuildContext context) async {
    final tipo = ref.read(_menuMeProvider).valueOrNull?['tipoPerfil']?.toString() ?? '';
    final isLeader = tipo == 'liderGrupo' || tipo == 'administrador';
    final content = isLeader
        ? 'Como líder, al salir se disolverá el grupo para todos los integrantes. ¿Continuar?'
        : '¿Estás seguro que deseas salir del grupo roller? Podrás unirte a otro o crear uno nuevo si eres líder.';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Salir del grupo'),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Salir del grupo'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    setState(() => _leavingGrupo = true);
    try {
      await ref.read(grupoRepositoryProvider).salirGrupo();
      ref.invalidate(_menuMeProvider);
      ref.invalidate(_menuLiderProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Has salido del grupo')),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo salir del grupo: $e')),
      );
    } finally {
      if (mounted) setState(() => _leavingGrupo = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final meAsync = ref.watch(_menuMeProvider);
    final liderAsync = ref.watch(_menuLiderProvider);
    final scrollChild = meAsync.when(
      data: (me) => _menuLoadedColumn(
        context,
        ref,
        me,
        liderAsync.valueOrNull,
      ),
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(48),
          child: CircularProgressIndicator(color: MenuSportTheme.cyan),
        ),
      ),
      error: (_, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(ref.watch(appLocaleProvider).t('menu.title'), style: RnMirrorTypography.heroTitle()),
          const SizedBox(height: 32),
        ],
      ),
    );

    return RnMirrorMenuLayout(child: scrollChild);
  }

  Widget _menuLoadedColumn(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> me,
    String? liderId,
  ) {
    void nav(String route) {
      context.go(route);
    }

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
        MenuSportHeader(email: email),
        const SizedBox(height: 16),
        MenuSportGlassCard(
          accent: MenuSportTheme.cyan,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: MenuSportProfileChip(
                      label: 'Avatar',
                      active: !_profileFotoMode,
                      onTap: _updatingProfile ? () {} : () => _onProfileModeChange(false, hasFoto: hasFoto),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: MenuSportProfileChip(
                      label: 'Subir foto',
                      active: _profileFotoMode,
                      onTap: _updatingProfile ? () {} : () => _onProfileModeChange(true, hasFoto: hasFoto),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Center(
                child: _updatingProfile
                    ? const SizedBox(
                        width: 96,
                        height: 96,
                        child: CircularProgressIndicator(strokeWidth: 2, color: MenuSportTheme.cyan),
                      )
                    : MenuSportAvatar(me: me, fotoMode: _profileFotoMode),
              ),
              const SizedBox(height: 12),
              if (_profileFotoMode)
                Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _updatingProfile ? null : _pickProfilePhoto,
                        style: RnLayeredStyles.ctaButton(backgroundColor: MenuSportTheme.teal),
                        child: Text(hasFoto ? '✏️ Cambiar foto' : '➕ Subir foto'),
                      ),
                    ),
                    if (hasFoto)
                      TextButton(
                        onPressed: _updatingProfile ? null : _removeProfilePhoto,
                        child: const Text('Quitar foto', style: TextStyle(color: MenuSportTheme.red)),
                      ),
                  ],
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _updatingProfile
                        ? null
                        : () => AvatarSelectorSheet.show(
                              context,
                              selectedAvatar: hasAvatar ? (me['avatar'] ?? '').toString() : null,
                              onSelect: _selectAvatar,
                            ),
                    style: RnLayeredStyles.ctaButton(backgroundColor: MenuSportTheme.cyan),
                    child: Text(hasAvatar ? '✏️ Modificar Avatar' : '➕ Agregar Avatar'),
                  ),
                ),
              if (_avatarMessage != null && !_profileFotoMode) ...[
                const SizedBox(height: 8),
                Text(
                  _avatarMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _avatarMessage!.startsWith('✓') ? MenuSportTheme.green : MenuSportTheme.orange,
                  ),
                ),
              ],
              if (_profileMessage != null && _profileFotoMode) ...[
                const SizedBox(height: 8),
                Text(
                  _profileMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _profileMessage!.startsWith('✓') ? MenuSportTheme.green : MenuSportTheme.orange,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Opciones',
          style: GoogleFonts.permanentMarker(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: MenuSportTheme.textMuted,
          ),
        ),
        const SizedBox(height: 10),
        MenuSportActionButton(
          label: '👤 Información personal',
          accent: MenuSportTheme.green,
          filled: true,
          onTap: () => nav('/menu/informacion-personal'),
        ),
        if (alias.isEmpty)
          MenuSportActionButton(
            label: '➕ Agregar Alias',
            accent: MenuSportTheme.cyan,
            onTap: () => nav('/alias/agregar'),
          )
        else
          MenuSportActionButton(
            label: '✏️ Cambiar de Alias',
            accent: MenuSportTheme.cyan,
            onTap: () => nav('/alias/cambiar'),
          ),
        if (_canCreateGrupo(me))
          MenuSportActionButton(
            label: '➕ Crear grupo',
            accent: MenuSportTheme.orange,
            onTap: () => nav('/grupo/nombre'),
          ),
        if (_hasGrupo(me))
          MenuSportActionButton(
            label: _leavingGrupo ? 'Saliendo del grupo…' : '🚪 Salir del grupo',
            accent: MenuSportTheme.orange,
            enabled: !_leavingGrupo,
            onTap: () => _confirmSalirGrupo(context),
          ),
        if (canStaff) ...[
          MenuSportActionButton(
            label: '➕ Agregar Staff',
            accent: MenuSportTheme.green,
            onTap: () => nav('/grupo/integrantes'),
          ),
          MenuSportActionButton(
            label: '📝 Nombre del Grupo',
            accent: MenuSportTheme.cyan,
            onTap: () => nav('/grupo/nombre'),
          ),
        ],
        if (integrantes)
          MenuSportActionButton(
            label: '👥 Integrantes del Grupo',
            accent: MenuSportTheme.violet,
            onTap: () => nav('/grupo/integrantes'),
          ),
        MenuSportActionButton(
          label: '🎬 Mis archivos RollerTips',
          accent: MenuSportTheme.violet,
          onTap: () => nav('/rollertips'),
        ),
        MenuSportActionButton(
          label: '⭐ Mis suscripciones',
          accent: MenuSportTheme.orange,
          onTap: () => nav('/menu/suscripciones'),
        ),
        MenuSportActionButton(
          label: '🛒 Ventas / Marketplace',
          accent: MenuSportTheme.teal,
          onTap: () => nav('/marketing'),
        ),
        if (email.toLowerCase() == 'admin@roller.com')
          MenuSportActionButton(
            label: '⚙️ Panel administrador',
            accent: MenuSportTheme.orange,
            onTap: () => nav('/menu/admin'),
          ),
        MenuSportActionButton(
          label: '💬 Soporte',
          accent: MenuSportTheme.cyan,
          onTap: () => nav('/soporte'),
        ),
        MenuSportActionButton(
          label: 'Cerrar Sesión',
          accent: MenuSportTheme.red,
          filled: true,
          onTap: () async {
            final ok = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Cerrar sesión'),
                content: const Text(
                  '¿Estás seguro que deseas cerrar sesión?',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: const Text('Cancelar'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Cerrar sesión'),
                  ),
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
  }
}

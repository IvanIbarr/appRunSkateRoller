import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:convert';
import 'dart:io' show File;
import 'package:flutter/foundation.dart';

import '../../../core/ui/background_scaffold.dart';
import '../../../core/ui/glass_card.dart';
import '../data/perfil_providers.dart';
import '../data/perfil_repository.dart';
import '../../auth/data/auth_repository.dart';

final meProvider = currentMeProvider;

class PerfilScreen extends ConsumerStatefulWidget {
  const PerfilScreen({super.key});

  @override
  ConsumerState<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends ConsumerState<PerfilScreen> {
  bool _busy = false;

  Uint8List? _tryDecodeDataUrl(String raw) {
    final s = raw.trim();
    if (!s.startsWith('data:image/')) return null;
    final idx = s.indexOf('base64,');
    if (idx < 0) return null;
    final b64 = s.substring(idx + 'base64,'.length);
    try {
      return base64Decode(b64);
    } catch (_) {
      return null;
    }
  }

  Future<void> _pickAndSetFotoPerfil() async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowedExtensions: const ['jpg', 'jpeg', 'png', 'webp'],
      withData: kIsWeb,
    );
    final file = res?.files.firstOrNull;
    if (file == null) return;

    List<int> bytes;
    if (file.bytes != null) {
      bytes = file.bytes!;
    } else if (file.path != null) {
      bytes = await File(file.path!).readAsBytes();
    } else {
      throw Exception('No se pudo leer el archivo');
    }

    // Nota: backend hoy espera string (URL o data-url). Usamos data-url para demo.
    final ext = file.extension?.toLowerCase();
    final mime = (ext == 'png')
        ? 'image/png'
        : (ext == 'webp')
            ? 'image/webp'
            : 'image/jpeg';
    final dataUrl = 'data:$mime;base64,${base64Encode(bytes)}';

    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).updateFotoPerfil(dataUrl);
      ref.invalidate(meProvider);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _setAvatarQuick(String? avatar) async {
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).updateAvatar(avatar);
      ref.invalidate(meProvider);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(meProvider);
    return Scaffold(
      body: BackgroundScaffold(
        showLogo: false,
        child: async.when(
          data: (u) {
            final email = (u['email'] ?? '').toString();
            final alias = (u['alias'] ?? '').toString();
            final tipoPerfil = (u['tipoPerfil'] ?? u['tipo_perfil'] ?? '').toString();
            final fotoPerfil = (u['fotoPerfil'] ?? u['foto_perfil'] ?? '').toString();
            final avatar = (u['avatar'] ?? '').toString();
            final fotoBytes = _tryDecodeDataUrl(fotoPerfil);
            return GlassCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Perfil', style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 12),
                  Card(
                    child: ListTile(
                      title: Text(alias.isNotEmpty ? alias : 'Sin alias'),
                      subtitle: Text(email),
                      trailing: Text(tipoPerfil.isEmpty ? '-' : tipoPerfil),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
                          color: const Color.fromRGBO(2, 6, 23, 0.62),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: fotoPerfil.trim().isEmpty
                            ? const Icon(Icons.person, color: Color(0xFFE2E8F0))
                            : (fotoBytes != null
                                ? Image.memory(fotoBytes, fit: BoxFit.cover)
                                : Image.network(
                                    fotoPerfil,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, st) =>
                                        const Icon(Icons.person, color: Color(0xFFE2E8F0)),
                                  )),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Avatar: ${avatar.isEmpty ? '—' : avatar}'),
                            Text(
                              'Foto perfil: ${fotoPerfil.isEmpty ? '—' : 'configurada'}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _busy ? null : _pickAndSetFotoPerfil,
                          child: Text(_busy ? '...' : 'Subir foto (demo)'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _busy ? null : () => _setAvatarQuick('skate-pink'),
                          child: const Text('Avatar skate-pink'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: _busy ? null : () => _setAvatarQuick(null),
                    child: const Text('Quitar avatar'),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => GlassCard(child: Text('Error cargando perfil: $e')),
        ),
      ),
    );
  }
}


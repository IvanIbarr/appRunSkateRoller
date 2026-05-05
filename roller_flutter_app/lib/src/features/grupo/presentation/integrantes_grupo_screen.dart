import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../perfil/data/perfil_repository.dart';
import '../data/grupo_repository.dart';

final integrantesGrupoProvider =
    FutureProvider.autoDispose<({List<Map<String, dynamic>> integrantes, String? liderId})>((ref) async {
  return ref.watch(grupoRepositoryProvider).getIntegrantes();
});

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(perfilRepositoryProvider).me();
  } catch (_) {
    return null;
  }
});

class IntegrantesGrupoScreen extends ConsumerWidget {
  const IntegrantesGrupoScreen({super.key});

  bool _canEditNombramientos({
    required Map<String, dynamic>? me,
    required String? liderId,
  }) {
    if (me == null || liderId == null || liderId.isEmpty) return false;
    final myId = (me['id'] ?? '').toString();
    if (myId != liderId) return false;
    final tipo = (me['tipoPerfil'] ?? '').toString();
    return tipo == 'liderGrupo' || tipo == 'administrador';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(integrantesGrupoProvider);
    final me = ref.watch(_meProvider).valueOrNull;

    return PageScaffold(
      title: 'Integrantes del Grupo',
      maxWidth: 980,
      child: async.when(
        data: (data) {
          final integrantes = data.integrantes;
          final liderId = data.liderId;
          final canEdit = _canEditNombramientos(me: me, liderId: liderId);
          if (integrantes.isEmpty) {
            return const Text('No hay integrantes todavía.');
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      canEdit ? 'Toca un integrante para nombramiento' : 'Solo lectura',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => ref.invalidate(integrantesGrupoProvider),
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Refrescar'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ...integrantes.map((u) {
                final id = (u['id'] ?? '').toString();
                final email = (u['email'] ?? '').toString();
                final alias = (u['alias'] ?? '').toString();
                final nombramiento = (u['nombramiento'] ?? '').toString();
                final isLider = liderId != null && liderId.isNotEmpty && id == liderId;
                final subtitle = [
                  if (alias.isNotEmpty) 'Alias: $alias',
                  if (nombramiento.isNotEmpty) 'Nombramiento: $nombramiento',
                  if (isLider) 'Líder principal',
                ].join(' • ');
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: const Color.fromRGBO(2, 6, 23, 0.62),
                      child: Text((alias.isNotEmpty ? alias : email).characters.take(1).toString().toUpperCase()),
                    ),
                    title: Text(alias.isNotEmpty ? alias : email, style: const TextStyle(fontWeight: FontWeight.w900)),
                    subtitle: subtitle.isEmpty ? null : Text(subtitle),
                    trailing: canEdit ? const Icon(Icons.edit_rounded) : null,
                    onTap: !canEdit
                        ? null
                        : () async {
                            final picked = await showModalBottomSheet<String?>(
                              context: context,
                              showDragHandle: true,
                              builder: (context) {
                                const opts = <String?>['colider', 'veterano', 'nuevo', null];
                                String label(String? o) {
                                  switch (o) {
                                    case 'colider':
                                      return 'Colíder';
                                    case 'veterano':
                                      return 'Veterano';
                                    case 'nuevo':
                                      return 'Nuevo';
                                    default:
                                      return 'Sin nombramiento';
                                  }
                                }

                                return ListView(
                                  padding: const EdgeInsets.all(12),
                                  children: [
                                    Text(
                                      'Nombramiento',
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                                    ),
                                    const SizedBox(height: 10),
                                    ...opts.map((o) {
                                      final active = o == (nombramiento.isEmpty ? null : nombramiento);
                                      return Card(
                                        child: ListTile(
                                          title: Text(label(o)),
                                          trailing: active ? const Icon(Icons.check_circle_rounded) : null,
                                          onTap: () => Navigator.of(context).pop(o),
                                        ),
                                      );
                                    }),
                                  ],
                                );
                              },
                            );
                            if (picked == null && picked != null) return;
                            try {
                              await ref.read(grupoRepositoryProvider).updateNombramiento(userId: id, nombramiento: picked);
                              ref.invalidate(integrantesGrupoProvider);
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo actualizar: $e')));
                              }
                            }
                          },
                  ),
                );
              }),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Text('Error cargando integrantes: $e'),
      ),
    );
  }
}


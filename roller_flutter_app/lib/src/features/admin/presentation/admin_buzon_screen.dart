import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../support/data/support_ticket_store.dart';

final adminTicketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) async {
  return ref.watch(supportTicketStoreProvider).list();
});

class AdminBuzonScreen extends ConsumerStatefulWidget {
  const AdminBuzonScreen({super.key});

  @override
  ConsumerState<AdminBuzonScreen> createState() => _AdminBuzonScreenState();
}

class _AdminBuzonScreenState extends ConsumerState<AdminBuzonScreen> {
  String _filter = 'todos';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(adminTicketsProvider);
    return PageScaffold(
      title: 'Buzón (Admin)',
      maxWidth: 1100,
      child: async.when(
        data: (tickets) {
          final filtered = _filter == 'todos'
              ? tickets
              : tickets.where((t) => t.status == _filter).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        for (final k in const ['todos', 'nuevo', 'visto', 'resuelto'])
                          ChoiceChip(
                            label: Text(k == 'todos' ? 'Todos' : k),
                            selected: _filter == k,
                            onSelected: (_) => setState(() => _filter = k),
                          ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => ref.invalidate(adminTicketsProvider),
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Refrescar'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (filtered.isEmpty)
                const Text('No hay tickets.')
              else
                for (final t in filtered)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  t.title,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(999),
                                  color: const Color.fromRGBO(56, 189, 248, 0.16),
                                  border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.35)),
                                ),
                                child: Text(t.status, style: const TextStyle(fontWeight: FontWeight.w900)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${t.createdAtIso.substring(0, 16)} · Área: ${t.area}${t.fromEmail == null ? '' : ' · De: ${t.fromEmail}'}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 10),
                          Text(t.description),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () async {
                                    await ref.read(supportTicketStoreProvider).updateStatus(t.id, 'visto');
                                    ref.invalidate(adminTicketsProvider);
                                  },
                                  child: const Text('Marcar visto'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () async {
                                    await ref.read(supportTicketStoreProvider).updateStatus(t.id, 'resuelto');
                                    ref.invalidate(adminTicketsProvider);
                                  },
                                  child: const Text('Resolver'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                                  onPressed: () async {
                                    final ok = await showDialog<bool>(
                                      context: context,
                                      builder: (_) => AlertDialog(
                                        title: const Text('Eliminar ticket'),
                                        content: const Text('¿Eliminar este ticket del buzón?'),
                                        actions: [
                                          TextButton(
                                            onPressed: () => Navigator.of(context).pop(false),
                                            child: const Text('Cancelar'),
                                          ),
                                          ElevatedButton(
                                            onPressed: () => Navigator.of(context).pop(true),
                                            child: const Text('Eliminar'),
                                          ),
                                        ],
                                      ),
                                    );
                                    if (ok == true) {
                                      await ref.read(supportTicketStoreProvider).delete(t.id);
                                      ref.invalidate(adminTicketsProvider);
                                    }
                                  },
                                  child: const Text('Eliminar'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Text('Error cargando buzón: $e'),
      ),
    );
  }
}


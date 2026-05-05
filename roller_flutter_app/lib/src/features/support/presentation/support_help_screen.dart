import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../perfil/data/perfil_repository.dart';
import '../data/support_ticket_store.dart';

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(perfilRepositoryProvider).me();
  } catch (_) {
    return null;
  }
});

final _ticketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) async {
  return ref.watch(supportTicketStoreProvider).list();
});

class SupportHelpScreen extends ConsumerStatefulWidget {
  const SupportHelpScreen({super.key});

  @override
  ConsumerState<SupportHelpScreen> createState() => _SupportHelpScreenState();
}

class _SupportHelpScreenState extends ConsumerState<SupportHelpScreen> {
  String _area = 'ruta';
  final _title = TextEditingController();
  final _desc = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  String _shortFolio(String id) => id.length > 14 ? '${id.substring(0, 14)}…' : id;

  Future<void> _submit() async {
    final t = _title.text.trim();
    final d = _desc.text.trim();
    if (t.isEmpty || d.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Escribe título y descripción.')));
      return;
    }
    if (d.length > 2500) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Máximo 2,500 caracteres.')));
      return;
    }
    setState(() => _sending = true);
    try {
      final me = ref.read(_meProvider).valueOrNull;
      final fromEmail = (me?['email'] ?? '').toString().trim();
      final fromUserId = (me?['id'] ?? '').toString().trim();
      final tk = await ref.read(supportTicketStoreProvider).add(
            area: _area,
            title: t,
            description: d,
            fromEmail: fromEmail.isEmpty ? null : fromEmail,
            fromUserId: fromUserId.isEmpty ? null : fromUserId,
          );
      ref.invalidate(_ticketsProvider);
      _title.clear();
      _desc.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Solicitud enviada. Folio: ${_shortFolio(tk.id)}')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo enviar: $e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
    if (!mounted) return;
  }

  @override
  Widget build(BuildContext context) {
    const areas = <({String id, String label})>[
      (id: 'ruta', label: 'Ruta'),
      (id: 'chat', label: 'Chat'),
      (id: 'historial', label: 'Historial'),
      (id: 'calendario', label: 'Calendario'),
      (id: 'rollertips', label: 'RollerTips'),
      (id: 'marketing', label: 'Marketing'),
      (id: 'compras', label: 'Compras / Checkout'),
      (id: 'juego', label: 'Juego'),
      (id: 'mi_cuenta', label: 'Mi cuenta'),
      (id: 'lenguaje_seguro', label: 'Lenguaje seguro'),
      (id: 'otro', label: 'Otro'),
    ];

    final tickets = ref.watch(_ticketsProvider).valueOrNull ?? const <SupportTicket>[];

    return PageScaffold(
      title: 'Ayuda y Asistencia',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Cuéntanos en qué parte necesitas ayuda.'),
          const SizedBox(height: 12),
          if (tickets.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tus folios (este dispositivo)',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 10),
                    for (final tk in tickets.take(8))
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 120,
                              child: Text(_shortFolio(tk.id), overflow: TextOverflow.ellipsis),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(999),
                                color: const Color.fromRGBO(56, 189, 248, 0.16),
                                border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.35)),
                              ),
                              child: Text(tk.status, style: const TextStyle(fontWeight: FontWeight.w800)),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(tk.title, overflow: TextOverflow.ellipsis),
                            ),
                          ],
                        ),
                      ),
                    const Text(
                      'Nota: en este MVP los tickets se guardan localmente. Luego conectamos el buzón admin al backend.',
                      style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.70)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          Text('¿En qué página necesitas ayuda?', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final a in areas)
                ChoiceChip(
                  label: Text(a.label),
                  selected: _area == a.id,
                  onSelected: (_) => setState(() => _area = a.id),
                ),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Título', hintText: 'Ej: No me salen sugerencias en destino'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _desc,
            minLines: 4,
            maxLines: 8,
            decoration: const InputDecoration(labelText: 'Descripción (máx. 2,500)', hintText: 'Describe el problema o tu sugerencia…'),
            onChanged: (t) {
              if (t.length <= 2500) return;
              _desc.text = t.substring(0, 2500);
              _desc.selection = TextSelection.collapsed(offset: _desc.text.length);
            },
          ),
          const SizedBox(height: 8),
          Text(
            '${2500 - _desc.text.length} caracteres restantes',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: _sending ? null : _submit,
              child: Text(_sending ? 'Enviando…' : 'Enviar'),
            ),
          ),
        ],
      ),
    );
  }
}


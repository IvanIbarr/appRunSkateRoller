import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../chat/data/chat_repository.dart';

final _adminMessagesProvider =
    FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, chatType) async {
  return ref.watch(chatRepositoryProvider).getMessages(chatType: chatType);
});

class AdminChatsScreen extends ConsumerStatefulWidget {
  const AdminChatsScreen({super.key});

  @override
  ConsumerState<AdminChatsScreen> createState() => _AdminChatsScreenState();
}

class _AdminChatsScreenState extends ConsumerState<AdminChatsScreen> {
  String _chatType = 'staff';
  final _groupName = TextEditingController();

  @override
  void dispose() {
    _groupName.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_adminMessagesProvider(_chatType));
    final label = _chatType == 'staff' ? 'Chat staff' : 'Chat general';
    return PageScaffold(
      title: 'Chats (Admin)',
      maxWidth: 1100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Tipo de chat', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      ChoiceChip(
                        label: const Text('Staff'),
                        selected: _chatType == 'staff',
                        onSelected: (_) => setState(() => _chatType = 'staff'),
                      ),
                      ChoiceChip(
                        label: const Text('General'),
                        selected: _chatType == 'general',
                        onSelected: (_) => setState(() => _chatType = 'general'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _groupName,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del grupo (solo referencia)',
                      hintText: 'Ej: Roller Santa Fe',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$label${_groupName.text.trim().isEmpty ? '' : ' · Grupo: ${_groupName.text.trim()}'}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => ref.invalidate(_adminMessagesProvider(_chatType)),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Refrescar'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: async.when(
              data: (items) {
                if (items.isEmpty) return const Center(child: Text('No hay mensajes.'));
                final show = items.length > 80 ? items.sublist(items.length - 80) : items;
                return ListView.builder(
                  itemCount: show.length,
                  itemBuilder: (context, i) {
                    final m = show[i];
                    final head = '${m['userName'] ?? 'Usuario'} · ${(m['timestamp'] ?? '').toString().toString().substring(0, 16)}';
                    final text = (m['text'] ?? '').toString();
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(head, style: const TextStyle(fontWeight: FontWeight.w900)),
                            const SizedBox(height: 6),
                            Text(text),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Text('Error cargando mensajes: $e'),
            ),
          ),
        ],
      ),
    );
  }
}


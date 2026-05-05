import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const chats = [
      (id: 'general', title: 'Chat general', subtitle: 'Todos los usuarios'),
      (id: 'staff', title: 'Chat staff', subtitle: 'Líder/administración'),
    ];

    return PageScaffold(
      title: 'Chats',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final c in chats)
            Card(
              child: ListTile(
                leading: const Icon(Icons.chat_bubble_outline_rounded),
                title: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w900)),
                subtitle: Text(c.subtitle),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.go('/chat/thread', extra: c.id),
              ),
            ),
        ],
      ),
    );
  }
}


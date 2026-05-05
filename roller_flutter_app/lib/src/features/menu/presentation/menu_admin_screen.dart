import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';

class MenuAdminScreen extends StatelessWidget {
  const MenuAdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Admin',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.dashboard_rounded),
              title: const Text('Panel Admin'),
              subtitle: const Text('Usuarios, chats, ventas, buzón, reset'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/admin'),
            ),
          ),
        ],
      ),
    );
  }
}


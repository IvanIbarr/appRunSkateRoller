import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';

class AdminHomeScreen extends StatelessWidget {
  const AdminHomeScreen({super.key});

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
              leading: const Icon(Icons.people_alt_outlined),
              title: const Text('Usuarios (Admin)'),
              subtitle: const Text('Demo/local (hasta tener backend admin)'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/admin/usuarios'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.chat_outlined),
              title: const Text('Chats (Admin)'),
              subtitle: const Text('General/Staff + moderación básica'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/admin/chats'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.sell_outlined),
              title: const Text('Ventas generales (Admin)'),
              subtitle: const Text('Marketing real + Recap demo'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/admin/ventas'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.support_agent_outlined),
              title: const Text('Buzón (Admin)'),
              subtitle: const Text('Tickets locales (mismo store que Soporte)'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/admin/buzon'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.lock_reset_rounded),
              title: const Text('Reset Password (Admin)'),
              subtitle: const Text('Envía correo vía /auth/forgot-password'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/admin/reset-password'),
            ),
          ),
        ],
      ),
    );
  }
}


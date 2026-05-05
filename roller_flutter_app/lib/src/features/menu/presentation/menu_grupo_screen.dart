import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';

class MenuGrupoScreen extends StatelessWidget {
  const MenuGrupoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Mi grupo',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Nombre del grupo'),
              subtitle: const Text('Editar nombre y persistir en backend'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/grupo/nombre'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.groups_rounded),
              title: const Text('Integrantes'),
              subtitle: const Text('Ver lista y asignar nombramientos (si eres líder principal)'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.go('/grupo/integrantes'),
            ),
          ),
        ],
      ),
    );
  }
}


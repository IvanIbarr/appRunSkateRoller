import 'package:flutter/material.dart';

import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';

@Preview('Menú · iPhone + Desktop (Mock)')
Widget previewMenuCompareMock() => previewCompare(
      title: 'Menú · iPhone vs Desktop',
      iphone: const _MenuMock(),
      desktop: const _MenuMock(),
    );

class _MenuMock extends StatelessWidget {
  const _MenuMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Menú',
      maxWidth: 900,
      child: Column(
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_rounded),
              title: const Text('Perfil'),
              subtitle: const Text('Nombre muy largo de prueba: Sacx 2003 Apellido Apellido Apellido'),
              onTap: () {},
            ),
          ),
          const SizedBox(height: 10),
          const Card(
            child: ListTile(
              leading: Icon(Icons.groups_rounded),
              title: Text('Mi grupo'),
              subtitle: Text('Grupo con nombre extremadamente largo para probar overflow en 2 líneas máximo'),
            ),
          ),
          const SizedBox(height: 10),
          const Card(
            child: ListTile(
              leading: Icon(Icons.workspace_premium_rounded),
              title: Text('Mis suscripciones'),
              subtitle: Text('Plan: Plus Anual \$479 MXN (texto largo) · Estado: Activo'),
            ),
          ),
          const SizedBox(height: 10),
          const Card(
            child: ListTile(
              leading: Icon(Icons.admin_panel_settings_rounded),
              title: Text('Admin'),
              subtitle: Text('Usuarios • Ventas • Buzón (mock)'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout_rounded),
              title: const Text('Cerrar sesión'),
              onTap: () {},
            ),
          ),
        ],
      ),
    );
  }
}


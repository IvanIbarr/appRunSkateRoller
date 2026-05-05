import 'package:flutter/material.dart';

import '../../../core/ui/page_scaffold.dart';

class AdminUsuariosScreen extends StatefulWidget {
  const AdminUsuariosScreen({super.key});

  @override
  State<AdminUsuariosScreen> createState() => _AdminUsuariosScreenState();
}

class _AdminUsuariosScreenState extends State<AdminUsuariosScreen> {
  final List<_AdminUserRow> _users = [
    _AdminUserRow(id: 'mock-admin', email: 'admin@roller.com', tipoPerfil: 'administrador'),
    _AdminUserRow(id: 'mock-lider', email: 'lider@roller.com', tipoPerfil: 'liderGrupo'),
    _AdminUserRow(id: 'mock-roller', email: 'roller@roller.com', tipoPerfil: 'roller'),
  ];

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Usuarios (Admin)',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Altas por día (demo)', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  const Text('Nota: este panel es local/demo hasta que tengamos backend admin.'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Lista de usuarios (demo)', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 10),
                  for (final u in _users)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(u.email, style: const TextStyle(fontWeight: FontWeight.w900)),
                                const SizedBox(height: 2),
                                Text(u.tipoPerfil, style: Theme.of(context).textTheme.bodySmall),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                            onPressed: () {
                              showDialog<void>(
                                context: context,
                                builder: (_) => AlertDialog(
                                  title: const Text('Eliminar usuario (demo)'),
                                  content: Text('Usuario: ${u.email}\nID: ${u.id}\n\nEn Flutter esto será real cuando exista backend admin.'),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cerrar')),
                                  ],
                                ),
                              );
                            },
                            child: const Text('Eliminar'),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminUserRow {
  _AdminUserRow({required this.id, required this.email, required this.tipoPerfil});
  final String id;
  final String email;
  final String tipoPerfil;
}


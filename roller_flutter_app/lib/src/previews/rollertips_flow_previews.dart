import 'package:flutter/material.dart';

import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';

@Preview('RollerTips · Perfil (iPhone + Desktop)')
Widget previewRollerTipsPerfilCompareMock() => previewCompare(
      title: 'RollerTips · Perfil',
      iphone: const _RollerTipsPerfilMock(),
      desktop: const _RollerTipsPerfilMock(),
    );

@Preview('RollerTips · Archivo (iPhone + Desktop)')
Widget previewRollerTipsArchivoCompareMock() => previewCompare(
      title: 'RollerTips · Archivo',
      iphone: const _RollerTipsArchivoMock(),
      desktop: const _RollerTipsArchivoMock(),
    );

class _RollerTipsPerfilMock extends StatelessWidget {
  const _RollerTipsPerfilMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'RollerTips · Perfil',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: const Color.fromRGBO(2, 6, 23, 0.62),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
                ),
                child: const Icon(Icons.person, color: Color(0xFFE2E8F0)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('sacx2003@gmail.com', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                    const SizedBox(height: 4),
                    const Text('Alias: sacx2003 · Tips subidos: 12', style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.78))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Card(
            child: ListTile(
              leading: Icon(Icons.video_library_outlined),
              title: Text('Mis tips recientes'),
              subtitle: Text('Lista mock con descripciones largas para probar overflow.'),
            ),
          ),
          const Card(
            child: ListTile(
              leading: Icon(Icons.settings_outlined),
              title: Text('Preferencias'),
              subtitle: Text('Placeholder'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RollerTipsArchivoMock extends StatelessWidget {
  const _RollerTipsArchivoMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'RollerTips · Archivo',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Archivo / Históricos',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),
          ...List.generate(6, (i) {
            return Card(
              child: ListTile(
                leading: const Icon(Icons.play_circle_outline_rounded),
                title: Text('Tip archivado #${i + 1}'),
                subtitle: const Text(
                  'Descripción larga para verificar saltos de línea y consistencia con el estilo oscuro.',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () {},
              ),
            );
          }),
        ],
      ),
    );
  }
}


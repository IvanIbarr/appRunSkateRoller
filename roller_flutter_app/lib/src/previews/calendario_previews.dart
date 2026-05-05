import 'package:flutter/material.dart';

import '../core/ui/background_scaffold.dart';
import '../core/ui/glass_card.dart';
import '../core/ui/preview.dart';

@Preview('Calendario · iPhone + Desktop (Mock)')
Widget previewCalendarioCompareMock() => previewCompare(
      title: 'Calendario · iPhone vs Desktop',
      iphone: const _CalendarioMock(),
      desktop: const _CalendarioMock(),
    );

class _CalendarioMock extends StatelessWidget {
  const _CalendarioMock();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(12, (i) {
      return {
        'titulo': i == 0
            ? 'Evento con título extremadamente largo para probar el truncado y no romper el ListTile en móvil'
            : 'Evento $i',
        'fecha': '2026-05-${(i + 1).toString().padLeft(2, '0')}T20:00:00.000Z',
        'lugar': 'Parque con nombre largo, Colonia Larguísima, Alcaldía X, Ciudad de México',
      };
    });

    return BackgroundScaffold(
      showLogo: false,
      child: GlassCard(
        child: SizedBox(
          height: 560,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Calendario', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(it['titulo']!.toString(), maxLines: 2, overflow: TextOverflow.ellipsis),
                        subtitle: Text('${it['fecha']} • ${it['lugar']}', maxLines: 2, overflow: TextOverflow.ellipsis),
                        trailing: IconButton(onPressed: () {}, icon: const Icon(Icons.delete_outline)),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(onPressed: () {}, child: const Text('Crear evento (mock)')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


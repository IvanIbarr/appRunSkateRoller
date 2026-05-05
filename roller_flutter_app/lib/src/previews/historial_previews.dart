import 'package:flutter/material.dart';

import '../core/ui/background_scaffold.dart';
import '../core/ui/glass_card.dart';
import '../core/ui/preview.dart';

@Preview('Historial · iPhone + Desktop (Mock)')
Widget previewHistorialCompareMock() => previewCompare(
      title: 'Historial · iPhone vs Desktop',
      iphone: const _HistorialMock(),
      desktop: const _HistorialMock(),
    );

class _HistorialMock extends StatelessWidget {
  const _HistorialMock();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(14, (i) {
      return {
        'origen': i.isEven
            ? 'Origen con nombre muy largo número $i — Avenida Insurgentes Sur 1234, CDMX'
            : 'Origen $i',
        'destino': 'Destino con texto largo para probar truncado y multilínea $i — Calle X, Colonia Y, 01234',
        'distancia': 1200 + (i * 137),
        'duracion': 600 + (i * 53),
      };
    });
    final top = [
      {'alias': 'LíderDeGrupoConAliasMuyLargoQueNoDebeRomperLaVista', 'km': 123.45},
      {'alias': 'roller@roller.com', 'km': 98.7},
      {'alias': 'sacx2003@gmail.com', 'km': 77.77},
    ];

    return BackgroundScaffold(
      showLogo: false,
      child: GlassCard(
        child: SizedBox(
          height: 560,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text('Historial', style: Theme.of(context).textTheme.headlineSmall)),
                  SizedBox(
                    height: 40,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: const [
                          _Chip('All'),
                          SizedBox(width: 6),
                          _Chip('Week'),
                          SizedBox(width: 6),
                          _Chip('Month'),
                          SizedBox(width: 6),
                          _Chip('Year'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: const [
                  Expanded(child: _MiniStat(label: 'KM', value: '256.7')),
                  SizedBox(width: 10),
                  Expanded(child: _MiniStat(label: 'Recorridos', value: '42')),
                  SizedBox(width: 10),
                  Expanded(child: _MiniStat(label: 'Tiempo', value: '12h 05m')),
                ],
              ),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(it['origen']!.toString(), maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text('Destino: ${it['destino']}',
                            maxLines: 2, overflow: TextOverflow.ellipsis),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('${it['distancia']} m'),
                            Text('${it['duracion']} s', style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              Text('Top', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              for (final u in top)
                Text('- ${u['alias']} · ${u['km']} km', overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.label);
  final String label;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.22),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelSmall),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.62),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}


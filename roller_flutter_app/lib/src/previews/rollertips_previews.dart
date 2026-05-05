import 'package:flutter/material.dart';

import '../core/ui/background_scaffold.dart';
import '../core/ui/glass_card.dart';
import '../core/ui/preview.dart';

@Preview('RollerTips · iPhone + Desktop (Mock)')
Widget previewRollerTipsCompareMock() => previewCompare(
      title: 'RollerTips · iPhone vs Desktop',
      iphone: const _RollerTipsMock(),
      desktop: const _RollerTipsMock(),
    );

class _RollerTipsMock extends StatelessWidget {
  const _RollerTipsMock();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(12, (i) {
      return {
        'uploader': i == 0
            ? 'Creador Con Alias Súper Largo Que Debería Cortarse En Una Línea'
            : 'uploader $i',
        'desc': i.isEven
            ? 'Descripción muy larga para probar multiline. '
                'Incluye varios renglones y texto extra para forzar elipsis o wrap dependiendo del ancho.'
            : 'Tip corto.',
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
              Text('RollerTips', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(it['uploader']!, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(it['desc']!, maxLines: 3, overflow: TextOverflow.ellipsis),
                        trailing: const Icon(Icons.play_circle_outline),
                        onTap: () {},
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(onPressed: () {}, child: const Text('Subir tip (mock)')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


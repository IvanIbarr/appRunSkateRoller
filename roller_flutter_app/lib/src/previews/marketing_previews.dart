import 'package:flutter/material.dart';

import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';

@Preview('Marketing · iPhone + Desktop (Mock)')
Widget previewMarketingCompareMock() => previewCompare(
      title: 'Marketing · iPhone vs Desktop',
      iphone: const _MarketingMock(),
      desktop: const _MarketingMock(),
    );

class _MarketingMock extends StatelessWidget {
  const _MarketingMock();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(14, (i) {
      return {
        'brandModel': i == 0 ? 'Patines FR1 80 Deluxe Ultra Mega Edition — descripción larga' : 'Producto $i',
        'priceMx': (i * 111).toString(),
        'category': i.isEven ? 'Slalom / Freestyle' : 'Fitness',
      };
    });

    return PageScaffold(
      title: 'Marketing',
      maxWidth: 1100,
      actions: [
        TextButton.icon(onPressed: () {}, icon: const Icon(Icons.add), label: const Text('Vender')),
      ],
      child: SizedBox(
        height: 560,
        child: ListView.separated(
          itemCount: items.length,
          separatorBuilder: (context, index) => const SizedBox(height: 10),
          itemBuilder: (context, i) {
            final it = items[i];
            final title = it['brandModel']!;
            final price = it['priceMx']!;
            final category = it['category']!;
            return Card(
              child: ListTile(
                leading: const Icon(Icons.local_offer_rounded),
                title: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
                subtitle: Text('\$$price MXN • $category', maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: ElevatedButton(onPressed: () {}, child: const Text('Comprar')),
              ),
            );
          },
        ),
      ),
    );
  }
}


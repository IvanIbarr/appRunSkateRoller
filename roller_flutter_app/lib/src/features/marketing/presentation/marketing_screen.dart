import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../data/marketing_repository.dart';
import '../models/marketing_checkout_draft.dart';

final marketingSalesProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(marketingRepositoryProvider).listSales();
});

class MarketingScreen extends ConsumerWidget {
  const MarketingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(marketingSalesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/marketing/vender'),
        icon: const Icon(Icons.add),
        label: const Text('Vender'),
      ),
      body: PageScaffold(
        title: 'Marketing',
        maxWidth: 1100,
        child: async.when(
          data: (items) {
            if (items.isEmpty) {
              return const Text('No hay publicaciones todavía');
            }
            return SizedBox(
              height: 560,
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(marketingSalesProvider);
                  await ref.read(marketingSalesProvider.future);
                },
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    final saleId = (it['id'] ?? '').toString();
                    final title = (it['brandModel'] ?? 'Producto').toString();
                    final price = (it['priceMx'] ?? '').toString();
                    final category = (it['category'] ?? '').toString();
                    return Card(
                      child: ListTile(
                        leading: const Icon(Icons.local_offer_rounded),
                        title: Text(title),
                        subtitle: Text(
                          [
                            if (price.isNotEmpty) '\$$price MXN',
                            if (category.isNotEmpty) category,
                          ].join(' • '),
                        ),
                        trailing: ElevatedButton(
                          onPressed: () {
                            final draft = MarketingCheckoutDraft(
                              saleId: saleId,
                              brandModel: title,
                              priceMx: price.isEmpty ? '0' : price,
                            );
                            context.go('/marketing/comprar/envio', extra: draft);
                          },
                          child: const Text('Comprar'),
                        ),
                      ),
                    );
                  },
                ),
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Text('Error cargando marketing: $e'),
        ),
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../marketing/data/marketing_repository.dart';

final _salesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(marketingRepositoryProvider).listSales();
});

class AdminVentasScreen extends ConsumerStatefulWidget {
  const AdminVentasScreen({super.key});

  @override
  ConsumerState<AdminVentasScreen> createState() => _AdminVentasScreenState();
}

class _AdminVentasScreenState extends ConsumerState<AdminVentasScreen> {
  String _tab = 'marketing';

  String _mx(num n) {
    final v = n.isFinite ? n : 0;
    return v.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    final salesAsync = ref.watch(_salesProvider);
    return PageScaffold(
      title: 'Ventas generales (Admin)',
      maxWidth: 1100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'marketing', label: Text('Marketing')),
                    ButtonSegment(value: 'recap', label: Text('Recap (demo)')),
                  ],
                  selected: {_tab},
                  onSelectionChanged: (v) => setState(() => _tab = v.first),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: () => ref.invalidate(_salesProvider),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Refrescar'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_tab == 'marketing')
            salesAsync.when(
              data: (items) {
                final count = items.length;
                final sumPrices = items.fold<num>(0, (acc, s) => acc + (num.tryParse('${s['priceMx'] ?? 0}') ?? 0));
                final sumFees =
                    items.fold<num>(0, (acc, s) => acc + (num.tryParse('${s['listingFeeMx'] ?? 0}') ?? 0));
                final toDeposit = (sumPrices - sumFees) < 0 ? 0 : (sumPrices - sumFees);
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Resumen Marketing', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
                            const SizedBox(height: 10),
                            Text('Publicaciones: $count'),
                            Text('Total listado (suma precios): \$${_mx(sumPrices)} MXN'),
                            Text('Cuotas/fees (suma listingFeeMx): \$${_mx(sumFees)} MXN'),
                            const SizedBox(height: 6),
                            Text(
                              'A depositar (aprox): \$${_mx(toDeposit)} MXN',
                              style: const TextStyle(fontWeight: FontWeight.w900),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Nota: esto sale de /marketing/sales. Para “ventas reales” faltaría registrar eventos de pago/compra en backend.',
                              style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.70)),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (items.isEmpty)
                      const Text('No hay publicaciones.')
                    else
                      for (final it in items.take(40))
                        Card(
                          child: ListTile(
                            title: Text('${it['brandModel'] ?? 'Producto'}', style: const TextStyle(fontWeight: FontWeight.w900)),
                            subtitle: Text('${it['category'] ?? ''} • \$${it['priceMx'] ?? ''} MXN'),
                            trailing: Text('Fee \$${it['listingFeeMx'] ?? 0}'),
                          ),
                        ),
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Text('Error cargando ventas: $e'),
            )
          else
            const Card(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'Recap (demo): en RN se registraba localmente. Aquí lo dejaremos como demo hasta que el backend emita eventos de compra.',
                  style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.78)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}


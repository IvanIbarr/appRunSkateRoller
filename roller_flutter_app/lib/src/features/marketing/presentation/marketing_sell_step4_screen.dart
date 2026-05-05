import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../data/marketing_repository.dart';
import '../models/marketing_sell_draft.dart';
import 'marketing_screen.dart';

class MarketingSellStep4Screen extends ConsumerStatefulWidget {
  const MarketingSellStep4Screen({super.key, required this.draft});

  final MarketingSellDraft draft;

  @override
  ConsumerState<MarketingSellStep4Screen> createState() => _MarketingSellStep4ScreenState();
}

class _MarketingSellStep4ScreenState extends ConsumerState<MarketingSellStep4Screen> {
  bool _busy = false;

  Future<void> _publicar() async {
    if ((widget.draft.category ?? '').isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Falta categoría.')));
      return;
    }
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    setState(() => _busy = true);
    try {
      await ref.read(marketingRepositoryProvider).createSale(
            brandModel: widget.draft.brandDetails.isEmpty ? 'Patines' : widget.draft.brandDetails,
            category: widget.draft.category ?? '',
            priceMx: widget.draft.priceMx,
            homeDelivery: widget.draft.homeDelivery,
            deliveryFeeMx: widget.draft.deliveryFeeMx,
            saleType: widget.draft.saleType,
            listingFeeMx: widget.draft.listingFeeMx,
          );
      if (!mounted) return;
      ref.invalidate(marketingSalesProvider);
      messenger.showSnackBar(const SnackBar(content: Text('Publicación creada.')));
      router.go('/marketing');
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('Error publicando: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.draft;
    return PageScaffold(
      title: 'Publicar venta · Paso 4',
      maxWidth: 900,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Revisar', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          _Row(label: 'Marca / detalles', value: d.brandDetails.isEmpty ? '—' : d.brandDetails),
          _Row(label: 'Categoría', value: d.category ?? '—'),
          _Row(label: 'Precio', value: d.priceMx.isEmpty ? '—' : '\$${d.priceMx} MXN'),
          _Row(label: 'Entrega', value: d.homeDelivery ? 'A domicilio (\$${d.deliveryFeeMx})' : 'No'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _publicar,
              child: Text(_busy ? 'Publicando...' : 'Publicar'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 2),
          Text(value, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}


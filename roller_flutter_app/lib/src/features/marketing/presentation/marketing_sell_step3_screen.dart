import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/marketing_sell_draft.dart';

class MarketingSellStep3Screen extends StatefulWidget {
  const MarketingSellStep3Screen({super.key, required this.draft});

  final MarketingSellDraft draft;

  @override
  State<MarketingSellStep3Screen> createState() => _MarketingSellStep3ScreenState();
}

class _MarketingSellStep3ScreenState extends State<MarketingSellStep3Screen> {
  late final _price = TextEditingController(text: widget.draft.priceMx);
  bool _homeDelivery = false;
  final _deliveryFee = TextEditingController();

  @override
  void initState() {
    super.initState();
    _homeDelivery = widget.draft.homeDelivery;
    _deliveryFee.text = widget.draft.deliveryFeeMx == 0 ? '' : widget.draft.deliveryFeeMx.toString();
  }

  @override
  void dispose() {
    _price.dispose();
    _deliveryFee.dispose();
    super.dispose();
  }

  void _next() {
    final next = widget.draft.copyWith(
      priceMx: _price.text.trim(),
      homeDelivery: _homeDelivery,
      deliveryFeeMx: int.tryParse(_deliveryFee.text.trim()) ?? 0,
    );
    context.go('/marketing/vender/step4', extra: next);
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Publicar venta · Paso 3',
      maxWidth: 900,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Categoría: ${widget.draft.category ?? '—'}', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          TextField(
            controller: _price,
            decoration: const InputDecoration(labelText: 'Precio (MXN)'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            value: _homeDelivery,
            onChanged: (v) => setState(() => _homeDelivery = v),
            title: const Text('¿Entrega a domicilio?'),
          ),
          if (_homeDelivery) ...[
            const SizedBox(height: 10),
            TextField(
              controller: _deliveryFee,
              decoration: const InputDecoration(labelText: 'Costo de envío (MXN)'),
              keyboardType: TextInputType.number,
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: _next, child: const Text('Siguiente · Publicar')),
          ),
        ],
      ),
    );
  }
}


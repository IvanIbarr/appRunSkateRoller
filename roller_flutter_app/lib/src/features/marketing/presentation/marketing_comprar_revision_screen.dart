import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/marketing_checkout_draft.dart';

class MarketingComprarRevisionScreen extends StatelessWidget {
  const MarketingComprarRevisionScreen({super.key, required this.draft});

  final MarketingCheckoutDraft draft;

  @override
  Widget build(BuildContext context) {
    final dir = [
      draft.calle,
      draft.numero,
      draft.colonia,
      draft.municipio,
      draft.estado,
      draft.codigoPostal,
    ].where((e) => (e ?? '').trim().isNotEmpty).join(', ');

    return PageScaffold(
      title: 'Revisar pedido',
      maxWidth: 900,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Producto', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFF38BDF8))),
          const SizedBox(height: 8),
          _Row(label: 'Artículo', value: draft.brandModel),
          _Row(label: 'Precio', value: '\$${draft.priceMx} MXN'),
          const SizedBox(height: 12),
          Text('Entrega', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFF38BDF8))),
          const SizedBox(height: 8),
          _Row(label: 'Dirección', value: dir.isEmpty ? '—' : dir),
          _Row(label: 'Tipo', value: draft.tipoDomicilio ?? '—'),
          const SizedBox(height: 12),
          Text('Contacto', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFF38BDF8))),
          const SizedBox(height: 8),
          _Row(label: 'Nombre', value: draft.contactoNombre ?? '—'),
          _Row(label: 'Teléfono', value: draft.contactoTelefono ?? '—'),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.go('/marketing/comprar/pago', extra: draft),
              child: const Text('Siguiente · Forma de pago'),
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


import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/recap_checkout_draft.dart';
import '../recap_flow_cache.dart';

class RecapCheckoutRevisionScreen extends StatelessWidget {
  const RecapCheckoutRevisionScreen({super.key, required this.draft});

  final RecapCheckoutDraft draft;

  @override
  Widget build(BuildContext context) {
    final isFree = draft.amountMx == 0;
    return PageScaffold(
      title: 'Revisar compra',
      maxWidth: 820,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFree ? 'Plan gratis: no se requiere pago.' : 'Demo: sin cargo real al confirmar en el siguiente paso.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 14),
          Text('Plan', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFF38BDF8))),
          const SizedBox(height: 8),
          _Row(label: 'Producto', value: draft.planTitle),
          _Row(label: 'Importe', value: '\$${draft.amountMx} MXN'),
          const SizedBox(height: 12),
          Text('Titular', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFF38BDF8))),
          const SizedBox(height: 8),
          _Row(label: 'Nombre', value: draft.buyerName ?? '—'),
          _Row(label: 'Correo', value: draft.buyerEmail ?? '—'),
          _Row(label: 'Teléfono', value: draft.buyerPhone ?? '—'),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (isFree) {
                  RecapFlowCache.setPlan(draft.planId);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plan gratis activado (demo).')));
                  final input = RecapFlowCache.lastInput;
                  if (input != null) {
                    context.go('/recap/crear', extra: input);
                  } else {
                    context.go('/recap/crear');
                  }
                  return;
                }
                context.go('/recap/pago', extra: draft);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF007AFF),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
              ),
              child: Text(isFree ? 'Finalizar' : 'Siguiente · Forma de pago'),
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


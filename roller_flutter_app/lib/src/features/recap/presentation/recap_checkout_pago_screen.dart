import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/recap_checkout_draft.dart';
import '../recap_flow_cache.dart';

class RecapCheckoutPagoScreen extends StatefulWidget {
  const RecapCheckoutPagoScreen({super.key, required this.draft});

  final RecapCheckoutDraft draft;

  @override
  State<RecapCheckoutPagoScreen> createState() => _RecapCheckoutPagoScreenState();
}

class _RecapCheckoutPagoScreenState extends State<RecapCheckoutPagoScreen> {
  static const _options = <({String key, String label, String hint})>[
    (key: 'tarjeta', label: 'Tarjeta débito / crédito', hint: 'Integración de pasarela pendiente (demo).'),
    (key: 'transferencia', label: 'Transferencia bancaria', hint: 'En producción: datos CLABE / referencia.'),
    (key: 'otro', label: 'Otro / manual', hint: 'Solo para completar el flujo de prueba.'),
  ];

  String? _forma;

  @override
  void initState() {
    super.initState();
    _forma = widget.draft.formaPago;
  }

  void _confirmar() {
    if (_forma == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Selecciona una forma de pago.')));
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Compra demo completada. Plan: ${widget.draft.planTitle} · Total: \$${widget.draft.amountMx} MXN · Forma: $_forma',
        ),
      ),
    );
    RecapFlowCache.setPlan(widget.draft.planId);
    final input = RecapFlowCache.lastInput;
    if (input != null) {
      context.go('/recap/crear', extra: input);
    } else {
      context.go('/recap/crear');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Forma de pago',
      maxWidth: 820,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.draft.planTitle, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('\$${widget.draft.amountMx} MXN',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: const Color(0xFF38BDF8), fontWeight: FontWeight.w900)),
          const SizedBox(height: 14),
          for (final o in _options) ...[
            InkWell(
              onTap: () => setState(() => _forma = o.key),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _forma == o.key ? const Color(0x8838BDF8) : const Color(0x33475569)),
                  color: _forma == o.key ? const Color(0x1A38BDF8) : Colors.transparent,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: _RadioDot(active: _forma == o.key),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.label, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(o.hint, style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _confirmar,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF007AFF),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
              ),
              child: const Text('Confirmar compra (demo)'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0x8094A3B8), width: 2),
      ),
      child: active
          ? Center(
              child: Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF38BDF8)),
              ),
            )
          : null,
    );
  }
}


import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/recap_checkout_draft.dart';

class RecapCheckoutDatosScreen extends StatefulWidget {
  const RecapCheckoutDatosScreen({super.key, required this.draft});

  final RecapCheckoutDraft draft;

  @override
  State<RecapCheckoutDatosScreen> createState() => _RecapCheckoutDatosScreenState();
}

class _RecapCheckoutDatosScreenState extends State<RecapCheckoutDatosScreen> {
  late final _name = TextEditingController(text: widget.draft.buyerName ?? '');
  late final _email = TextEditingController(text: widget.draft.buyerEmail ?? '');
  late final _phone = TextEditingController(text: widget.draft.buyerPhone ?? '');

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  void _fillDemo() {
    _name.text = 'Ana López Demo';
    _email.text = 'ana.recap.demo@ejemplo.com';
    _phone.text = '5512345678';
    setState(() {});
  }

  void _next() {
    final n = _name.text.trim();
    final e = _email.text.trim();
    final t = _phone.text.trim();
    if (n.isEmpty || e.isEmpty || t.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Completa nombre, correo y teléfono (o usa datos de prueba).')),
      );
      return;
    }
    final nextDraft = widget.draft.copyWith(buyerName: n, buyerEmail: e, buyerPhone: t);
    context.go('/recap/revision', extra: nextDraft);
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Tus datos',
      maxWidth: 820,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${widget.draft.planTitle} · \$${widget.draft.amountMx} MXN', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton(
              onPressed: _fillDemo,
              child: const Text('Llenar con datos de prueba'),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Nombre completo'),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'Correo'),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            decoration: const InputDecoration(labelText: 'Teléfono (10 dígitos)'),
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _next,
              child: const Text('Siguiente · Revisar'),
            ),
          ),
        ],
      ),
    );
  }
}


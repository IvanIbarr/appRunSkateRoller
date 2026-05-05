import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/marketing_checkout_draft.dart';

class MarketingComprarEnvioScreen extends StatefulWidget {
  const MarketingComprarEnvioScreen({super.key, required this.draft});

  final MarketingCheckoutDraft draft;

  @override
  State<MarketingComprarEnvioScreen> createState() => _MarketingComprarEnvioScreenState();
}

class _MarketingComprarEnvioScreenState extends State<MarketingComprarEnvioScreen> {
  late final _calle = TextEditingController(text: widget.draft.calle ?? '');
  late final _numero = TextEditingController(text: widget.draft.numero ?? '');
  late final _colonia = TextEditingController(text: widget.draft.colonia ?? '');
  late final _municipio = TextEditingController(text: widget.draft.municipio ?? '');
  late final _estado = TextEditingController(text: widget.draft.estado ?? '');
  late final _cp = TextEditingController(text: widget.draft.codigoPostal ?? '');
  late final _contacto = TextEditingController(text: widget.draft.contactoNombre ?? '');
  late final _tel = TextEditingController(text: widget.draft.contactoTelefono ?? '');

  String _tipo = 'residencial';

  @override
  void initState() {
    super.initState();
    _tipo = widget.draft.tipoDomicilio ?? 'residencial';
  }

  @override
  void dispose() {
    _calle.dispose();
    _numero.dispose();
    _colonia.dispose();
    _municipio.dispose();
    _estado.dispose();
    _cp.dispose();
    _contacto.dispose();
    _tel.dispose();
    super.dispose();
  }

  void _next() {
    if (_calle.text.trim().isEmpty || _numero.text.trim().isEmpty || _cp.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Completa calle, número y código postal.')));
      return;
    }
    final next = widget.draft.copyWith(
      calle: _calle.text.trim(),
      numero: _numero.text.trim(),
      colonia: _colonia.text.trim(),
      municipio: _municipio.text.trim(),
      estado: _estado.text.trim(),
      codigoPostal: _cp.text.trim(),
      tipoDomicilio: _tipo,
      contactoNombre: _contacto.text.trim(),
      contactoTelefono: _tel.text.trim(),
    );
    context.go('/marketing/comprar/revision', extra: next);
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Entrega',
      maxWidth: 900,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.draft.brandModel, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('\$${widget.draft.priceMx} MXN', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 14),
          TextField(controller: _calle, decoration: const InputDecoration(labelText: 'Calle')),
          const SizedBox(height: 10),
          TextField(controller: _numero, decoration: const InputDecoration(labelText: 'Número')),
          const SizedBox(height: 10),
          TextField(controller: _colonia, decoration: const InputDecoration(labelText: 'Colonia (opcional)')),
          const SizedBox(height: 10),
          TextField(controller: _municipio, decoration: const InputDecoration(labelText: 'Municipio / Alcaldía (opcional)')),
          const SizedBox(height: 10),
          TextField(controller: _estado, decoration: const InputDecoration(labelText: 'Estado (opcional)')),
          const SizedBox(height: 10),
          TextField(controller: _cp, decoration: const InputDecoration(labelText: 'Código postal')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _tipo,
            items: const [
              DropdownMenuItem(value: 'residencial', child: Text('Residencial')),
              DropdownMenuItem(value: 'deposito', child: Text('Depósito')),
              DropdownMenuItem(value: 'oficina', child: Text('Oficina')),
              DropdownMenuItem(value: 'empresa', child: Text('Empresa')),
            ],
            onChanged: (v) => setState(() => _tipo = v ?? 'residencial'),
            decoration: const InputDecoration(labelText: 'Tipo de domicilio'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _contacto, decoration: const InputDecoration(labelText: 'Nombre de contacto (opcional)')),
          const SizedBox(height: 10),
          TextField(controller: _tel, decoration: const InputDecoration(labelText: 'Teléfono (opcional)'), keyboardType: TextInputType.phone),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: _next, child: const Text('Siguiente · Revisar')),
          ),
        ],
      ),
    );
  }
}


import 'package:flutter/material.dart';

import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';

@Preview('Marketing · Vender (Step 1)')
Widget previewMarketingVenderStep1CompareMock() => previewCompare(
      title: 'Marketing · Vender (Step 1)',
      iphone: const _MarketingVenderStep1Mock(),
      desktop: const _MarketingVenderStep1Mock(),
    );

@Preview('Marketing · Vender (Step 3)')
Widget previewMarketingVenderStep3CompareMock() => previewCompare(
      title: 'Marketing · Vender (Step 3)',
      iphone: const _MarketingVenderStep3Mock(),
      desktop: const _MarketingVenderStep3Mock(),
    );

@Preview('Marketing · Vender (Step 4)')
Widget previewMarketingVenderStep4CompareMock() => previewCompare(
      title: 'Marketing · Vender (Step 4)',
      iphone: const _MarketingVenderStep4Mock(),
      desktop: const _MarketingVenderStep4Mock(),
    );

@Preview('Marketing · Comprar (Envío)')
Widget previewMarketingComprarEnvioCompareMock() => previewCompare(
      title: 'Marketing · Comprar (Envío)',
      iphone: const _MarketingComprarEnvioMock(),
      desktop: const _MarketingComprarEnvioMock(),
    );

@Preview('Marketing · Comprar (Revisión)')
Widget previewMarketingComprarRevisionCompareMock() => previewCompare(
      title: 'Marketing · Comprar (Revisión)',
      iphone: const _MarketingComprarRevisionMock(),
      desktop: const _MarketingComprarRevisionMock(),
    );

@Preview('Marketing · Comprar (Pago)')
Widget previewMarketingComprarPagoCompareMock() => previewCompare(
      title: 'Marketing · Comprar (Pago)',
      iphone: const _MarketingComprarPagoMock(),
      desktop: const _MarketingComprarPagoMock(),
    );

class _MarketingVenderStep1Mock extends StatelessWidget {
  const _MarketingVenderStep1Mock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Vender · Producto',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(decoration: InputDecoration(labelText: 'Marca y modelo', hintText: 'Powerslide Next 80')),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              ChoiceChip(label: const Text('Patines'), selected: true, onSelected: (_) {}),
              ChoiceChip(label: const Text('Ruedas'), selected: false, onSelected: (_) {}),
              ChoiceChip(label: const Text('Protecciones'), selected: false, onSelected: (_) {}),
              ChoiceChip(label: const Text('Otros'), selected: false, onSelected: (_) {}),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(height: 50, child: ElevatedButton(onPressed: () {}, child: const Text('Siguiente'))),
        ],
      ),
    );
  }
}

class _MarketingVenderStep3Mock extends StatelessWidget {
  const _MarketingVenderStep3Mock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Vender · Precio y entrega',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(decoration: InputDecoration(labelText: 'Precio (MXN)', hintText: '1500')),
          const SizedBox(height: 12),
          SwitchListTile(
            value: true,
            onChanged: (_) {},
            title: const Text('Entrega a domicilio'),
          ),
          const SizedBox(height: 12),
          const TextField(decoration: InputDecoration(labelText: 'Costo envío (MXN)', hintText: '120')),
          const SizedBox(height: 16),
          SizedBox(height: 50, child: ElevatedButton(onPressed: () {}, child: const Text('Siguiente'))),
        ],
      ),
    );
  }
}

class _MarketingVenderStep4Mock extends StatelessWidget {
  const _MarketingVenderStep4Mock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Vender · Revisión',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Card(
            child: ListTile(
              title: Text('Powerslide Next 80'),
              subtitle: Text('Categoría: Patines · Precio: \$1500 · Domicilio: Sí (\$120)'),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: ElevatedButton(onPressed: () {}, child: const Text('Publicar')),
          ),
        ],
      ),
    );
  }
}

class _MarketingComprarEnvioMock extends StatelessWidget {
  const _MarketingComprarEnvioMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Comprar · Envío',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(decoration: InputDecoration(labelText: 'Dirección', hintText: 'Calle, número, colonia, CP')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: 'Casa',
            items: const [
              DropdownMenuItem(value: 'Casa', child: Text('Casa')),
              DropdownMenuItem(value: 'Departamento', child: Text('Departamento')),
              DropdownMenuItem(value: 'Oficina', child: Text('Oficina')),
            ],
            onChanged: (_) {},
            decoration: const InputDecoration(labelText: 'Tipo de domicilio'),
          ),
          const SizedBox(height: 12),
          const TextField(decoration: InputDecoration(labelText: 'Teléfono', hintText: '55 0000 0000')),
          const SizedBox(height: 16),
          SizedBox(height: 50, child: ElevatedButton(onPressed: () {}, child: const Text('Continuar'))),
        ],
      ),
    );
  }
}

class _MarketingComprarRevisionMock extends StatelessWidget {
  const _MarketingComprarRevisionMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Comprar · Revisión',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Card(
            child: ListTile(
              title: Text('Producto'),
              subtitle: Text('Ruedas 80mm (x8) · \$899'),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text('Envío'),
              subtitle: Text('Casa · Calle y CP · Teléfono 55…'),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(height: 50, child: ElevatedButton(onPressed: () {}, child: const Text('Ir a pago'))),
        ],
      ),
    );
  }
}

class _MarketingComprarPagoMock extends StatelessWidget {
  const _MarketingComprarPagoMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Comprar · Pago',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Card(child: ListTile(title: Text('Tarjeta'), subtitle: Text('**** 1234'))),
          const Card(child: ListTile(title: Text('Transferencia'), subtitle: Text('SPEI / CLABE'))),
          const SizedBox(height: 12),
          SizedBox(height: 50, child: ElevatedButton(onPressed: () {}, child: const Text('Confirmar compra (demo)'))),
        ],
      ),
    );
  }
}


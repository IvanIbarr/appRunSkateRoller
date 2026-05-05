import 'package:flutter/material.dart';

import '../core/ui/preview.dart';
import '../core/ui/glass_card.dart';

/// Catálogo de componentes/átomos para validar tokens visuales (RN vs Flutter)
/// con textos extremos y variantes. Busca "@Preview(".

@Preview('Catálogo · Átomos (iPhone viewport)')
Widget previewAtomsCatalog() => previewApp(const _AtomsCatalog(), title: 'Átomos');

@Preview('Catálogo · Átomos (iPhone + Desktop)')
Widget previewAtomsCatalogCompare() => previewCompare(
      iphone: const _AtomsCatalog(),
      desktop: const _AtomsCatalog(),
      title: 'Átomos · iPhone vs Desktop',
    );

class _AtomsCatalog extends StatelessWidget {
  const _AtomsCatalog();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Botones', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              ElevatedButton(onPressed: () {}, child: const Text('Primario')),
              ElevatedButton(
                onPressed: () {},
                child: const Text('Primario con texto MUY largo para probar elipsis/wrap'),
              ),
              OutlinedButton(onPressed: () {}, child: const Text('Outlined')),
              OutlinedButton(
                onPressed: () {},
                child: const Text('Outlined con texto MUY largo para probar elipsis/wrap'),
              ),
              TextButton(onPressed: () {}, child: const Text('Text button')),
            ],
          ),
          const SizedBox(height: 18),

          Text('Inputs', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Correo',
              hintText: 'nombre.apellido.super.largo+alias.demo@dominio-extremadamente-largo-ejemplo.com',
            ),
          ),
          const SizedBox(height: 12),
          const TextField(
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Descripción (multilínea)',
              hintText:
                  'Texto largo para probar lineHeight, padding y borderRadius.\n'
                  'Línea 2.\nLínea 3.',
            ),
          ),
          const SizedBox(height: 18),

          Text('Cards', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          GlassCard(
            maxWidth: double.infinity,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('GlassCard', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 6),
                const Text(
                  'Card con contenido largo para probar padding interno, border, radio y contraste.',
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Mini card', style: Theme.of(context).textTheme.titleSmall),
                              const SizedBox(height: 6),
                              const Text('Texto corto'),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Mini card con título MUY largo para truncar',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Texto más largo para forzar 2 líneas y validar spacing.',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          Text('Chips / Pills', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: const [
              _Pill(label: 'All'),
              _Pill(label: 'Week'),
              _Pill(label: 'Month'),
              _Pill(label: 'Year'),
              _Pill(label: 'Etiqueta extremadamente larga para overflow'),
            ],
          ),
          const SizedBox(height: 18),

          Text('ListTile', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.local_offer_rounded),
              title: const Text(
                'Título MUY largo para probar 2 líneas máximo en móvil y que no empuje el trailing',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: const Text(
                'Subtítulo largo · \$12345 MXN · Slalom / Freestyle · texto extra extra extra',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              trailing: ElevatedButton(onPressed: () {}, child: const Text('Acción')),
            ),
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.22),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelSmall, overflow: TextOverflow.ellipsis),
    );
  }
}


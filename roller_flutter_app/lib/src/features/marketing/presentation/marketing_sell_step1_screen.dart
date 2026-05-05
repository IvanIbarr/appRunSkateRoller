import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/marketing_sell_draft.dart';

class MarketingSellStep1Screen extends StatefulWidget {
  const MarketingSellStep1Screen({super.key});

  @override
  State<MarketingSellStep1Screen> createState() => _MarketingSellStep1ScreenState();
}

class _MarketingSellStep1ScreenState extends State<MarketingSellStep1Screen> {
  final _brand = TextEditingController();
  String? _category;
  bool _showInfo = false;

  static const _categories = <String>[
    'Fitness',
    'Freeskate',
    'Agresivos',
    'Velocidad',
    'Slalom / Freestyle',
  ];

  @override
  void dispose() {
    _brand.dispose();
    super.dispose();
  }

  void _next() {
    if ((_category ?? '').isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Selecciona una categoría.')));
      return;
    }
    final draft = MarketingSellDraft(brandDetails: _brand.text.trim(), category: _category);
    context.go('/marketing/vender/step3', extra: draft);
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Publicar venta · Paso 1',
      maxWidth: 900,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _brand,
            decoration: const InputDecoration(labelText: 'Marca y características'),
            minLines: 2,
            maxLines: 4,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Text('Categoría', style: Theme.of(context).textTheme.titleMedium),
              ),
              IconButton(
                onPressed: () => setState(() => _showInfo = true),
                icon: const Icon(Icons.info_outline_rounded),
              ),
            ],
          ),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final c in _categories)
                ChoiceChip(
                  label: Text(c),
                  selected: _category == c,
                  onSelected: (_) => setState(() => _category = c),
                ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: _next, child: const Text('Siguiente')),
          ),
          if (_showInfo) ...[
            const SizedBox(height: 14),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Categorías', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(
                      'Fitness: recreativo.\nFreeskate: urbano.\nAgresivos: skatepark.\nVelocidad: competencia.\nSlalom: trucos con conos.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => setState(() => _showInfo = false),
                        child: const Text('Cerrar'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../calendario/presentation/widgets/evento_image_uploader.dart';
import '../models/marketing_sell_draft.dart';

/// Espejo de `MarketingSellSkatesStep3Screen.tsx` (Paso 2 RN): fotos, precio, condición.
class MarketingSellStep2Screen extends StatefulWidget {
  const MarketingSellStep2Screen({super.key, required this.draft});

  final MarketingSellDraft draft;

  @override
  State<MarketingSellStep2Screen> createState() => _MarketingSellStep2ScreenState();
}

class _MarketingSellStep2ScreenState extends State<MarketingSellStep2Screen> {
  static const _maxPhotos = 5;
  static const _deliveryFeeDefault = 99;

  late final TextEditingController _brand;
  late final TextEditingController _price;
  late List<String> _photos;
  String? _condition;
  bool _homeDelivery = false;
  String _saleType = 'gratis';

  @override
  void initState() {
    super.initState();
    _brand = TextEditingController(text: widget.draft.brandDetails);
    _price = TextEditingController(text: widget.draft.priceMx);
    _photos = List<String>.from(widget.draft.photoUris);
    _condition = widget.draft.condition;
    _homeDelivery = widget.draft.homeDelivery;
    _saleType = widget.draft.saleType;
  }

  @override
  void dispose() {
    _brand.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _addPhoto() async {
    if (_photos.length >= _maxPhotos) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Máximo $_maxPhotos fotos.')),
      );
      return;
    }
    try {
      final dataUrl = await EventoImagePicker.pickDataUrl(
        maxFileBytes: EventoImagePicker.marketingMaxBytes,
      );
      if (dataUrl == null || !mounted) return;
      setState(() => _photos = [..._photos, dataUrl]);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _next() {
    if (_photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Adjunta al menos una foto del producto.')),
      );
      return;
    }
    if (_price.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Indica el precio en MXN.')),
      );
      return;
    }
    final next = widget.draft.copyWith(
      brandDetails: _brand.text.trim(),
      priceMx: _price.text.trim(),
      photoUris: _photos,
      condition: _condition,
      homeDelivery: _homeDelivery,
      deliveryFeeMx: _homeDelivery ? _deliveryFeeDefault : 0,
      saleType: _saleType,
    );
    context.go('/marketing/vender/step4', extra: next);
  }

  @override
  Widget build(BuildContext context) {
    final category = widget.draft.category ?? '—';
    return PageScaffold(
      title: 'Publicar venta · Paso 2',
      maxWidth: 900,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoría: $category', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            TextField(
              controller: _brand,
              decoration: const InputDecoration(labelText: 'Marca y modelo'),
              minLines: 2,
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Text('Condición', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                for (final c in ['nuevo', 'usado', 'reacondicionado'])
                  ChoiceChip(
                    label: Text(c == 'reacondicionado' ? 'Reacond.' : c[0].toUpperCase() + c.substring(1)),
                    selected: _condition == c,
                    onSelected: (_) => setState(() => _condition = c),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _price,
              decoration: const InputDecoration(labelText: 'Precio (MXN)'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _homeDelivery,
              onChanged: (v) => setState(() => _homeDelivery = v),
              title: const Text('¿Entrega a domicilio? (+ \$99 MXN)'),
            ),
            const SizedBox(height: 8),
            Text('Tipo de publicación', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                for (final t in ['gratis', 'clasica', 'premium'])
                  ChoiceChip(
                    label: Text(t[0].toUpperCase() + t.substring(1)),
                    selected: _saleType == t,
                    onSelected: (_) => setState(() => _saleType = t),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'Fotos del producto (hasta $_maxPhotos)',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 4),
            Text(
              'Mínimo 1 foto. Máx. 10 MB por imagen.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _photos.length >= _maxPhotos ? null : _addPhoto,
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('Adjuntar fotos'),
            ),
            const SizedBox(height: 12),
            if (_photos.isEmpty)
              Text('Aún no hay fotos adjuntas.', style: Theme.of(context).textTheme.bodySmall)
            else
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (var i = 0; i < _photos.length; i++)
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: SizedBox(
                            width: 88,
                            height: 88,
                            child: EventoDraftImage(uri: _photos[i], fit: BoxFit.cover),
                          ),
                        ),
                        Positioned(
                          top: -6,
                          right: -6,
                          child: Material(
                            color: Colors.red.shade700,
                            shape: const CircleBorder(),
                            child: InkWell(
                              customBorder: const CircleBorder(),
                              onTap: () => setState(() => _photos = [..._photos]..removeAt(i)),
                              child: const Padding(
                                padding: EdgeInsets.all(4),
                                child: Icon(Icons.close, size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 4,
                          left: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontSize: 11)),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            const SizedBox(height: 8),
            Text('${_photos.length} / $_maxPhotos fotos'),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(onPressed: _next, child: const Text('Siguiente · Revisar')),
            ),
          ],
        ),
      ),
    );
  }
}

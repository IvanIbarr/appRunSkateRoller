import 'package:flutter/material.dart';

import '../../../core/ui/background_scaffold.dart';
import '../../../core/ui/glass_card.dart';

class RutaScreen extends StatefulWidget {
  const RutaScreen({super.key});

  @override
  State<RutaScreen> createState() => _RutaScreenState();
}

class _RutaScreenState extends State<RutaScreen> {
  final _origenCtrl = TextEditingController();
  final _destinoCtrl = TextEditingController();

  @override
  void dispose() {
    _origenCtrl.dispose();
    _destinoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BackgroundScaffold(
        showLogo: false,
        child: GlassCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Ruta', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'Escribe o ten a la mano la calle y codigo postal para ubicar mejor origen y destino en el mapa.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _origenCtrl,
                decoration: const InputDecoration(labelText: 'Origen'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _destinoCtrl,
                decoration: const InputDecoration(labelText: 'Destino'),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Mapa/Ruteo se integra en el siguiente bloque (UI ya homologada).'),
                      ),
                    );
                  },
                  child: const Text('Trazar ruta'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


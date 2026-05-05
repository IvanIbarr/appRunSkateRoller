import 'package:flutter/material.dart';

import '../../../core/ui/page_scaffold.dart';

class MenuSuscripcionesScreen extends StatelessWidget {
  const MenuSuscripcionesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Mis suscripciones',
      maxWidth: 900,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Suscripciones Recap', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Text(
            'Placeholder: aquí mostraremos tu plan activo (Gratis / Pase / Plus) y el botón para cancelar.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}


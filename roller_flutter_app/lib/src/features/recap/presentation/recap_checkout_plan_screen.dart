import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/recap_checkout_draft.dart';

class _PlanOption {
  const _PlanOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.amountMx,
    required this.extra,
  });

  final String id;
  final String title;
  final String subtitle;
  final int amountMx;
  final List<String> extra;
}

class RecapCheckoutPlanScreen extends StatelessWidget {
  const RecapCheckoutPlanScreen({super.key});

  static const _plans = <_PlanOption>[
    _PlanOption(
      id: 'gratis0',
      title: 'Gratis',
      subtitle: 'Demo con prioridad estándar y marca de agua.',
      amountMx: 0,
      extra: [
        '⏳ Prioridad estándar',
        '📣 Comunidad / marca de agua',
        '⏱️ Descarga por 15 días',
        '🖼️ Hasta 5 fotos por ruta',
      ],
    ),
    _PlanOption(
      id: 'pase25',
      title: 'Pase Único \$25',
      subtitle: 'Un solo video sin marca de agua (demo).',
      amountMx: 25,
      extra: [
        '✅ Sin marcas de agua',
        '⚡ Prioridad alta',
        '🖼️ Hasta 15 fotos',
      ],
    ),
    _PlanOption(
      id: 'plus59',
      title: 'Plus \$59',
      subtitle: 'Prioridad VIP + videoteca (demo).',
      amountMx: 59,
      extra: [
        '✅ Prioridad VIP',
        '☁️ Videoteca en la nube',
        '🖼️ Hasta 60 fotos',
      ],
    ),
    _PlanOption(
      id: 'plus479',
      title: 'Plus Anual \$479',
      subtitle: 'Ideal para temporada (demo).',
      amountMx: 479,
      extra: [
        '✅ Todo lo Pro',
        '⭐ Soporte premium',
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Elegir plan',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Elige el plan que mejor se adapte a ti. En esta demo podrás avanzar hasta “Pago” sin cobro real.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          for (final p in _plans) ...[
            InkWell(
              onTap: () {
                final draft = RecapCheckoutDraft(
                  planId: p.id,
                  planTitle: p.title,
                  amountMx: p.amountMx,
                );
                context.go('/recap/datos', extra: draft);
              },
              borderRadius: BorderRadius.circular(14),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.title, style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(p.subtitle, style: Theme.of(context).textTheme.bodySmall),
                      if (p.extra.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(p.extra.join('\n'), style: Theme.of(context).textTheme.bodySmall),
                      ],
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          p.amountMx == 0 ? '\$0' : '\$${p.amountMx} MXN',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(color: const Color(0xFF38BDF8), fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
          const SizedBox(height: 6),
          Text(
            'Tip: en el plan gratis, cerca del límite de fotos puedes desbloquear 15 fotos con el Pase Único por \$25.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}


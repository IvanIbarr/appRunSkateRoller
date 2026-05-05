import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../core/ui/preview.dart';
import '../features/recap/models/recap_checkout_draft.dart';
import '../features/recap/models/recap_input.dart';
import '../features/recap/presentation/recap_checkout_datos_screen.dart';
import '../features/recap/presentation/recap_checkout_pago_screen.dart';
import '../features/recap/presentation/recap_checkout_plan_screen.dart';
import '../features/recap/presentation/recap_checkout_revision_screen.dart';
import '../features/recap/presentation/recap_create_screen.dart';

@Preview('Recap · Crear (iPhone + Desktop)')
Widget previewRecapCreateCompareMock() => previewCompare(
      title: 'Recap · Crear',
      iphone: RecapCreateScreen(input: _mockInput()),
      desktop: RecapCreateScreen(input: _mockInput()),
    );

@Preview('Recap · Elegir plan (iPhone + Desktop)')
Widget previewRecapPlanCompareMock() => previewCompare(
      title: 'Recap · Plan',
      iphone: const RecapCheckoutPlanScreen(),
      desktop: const RecapCheckoutPlanScreen(),
    );

@Preview('Recap · Datos (iPhone + Desktop)')
Widget previewRecapDatosCompareMock() => previewCompare(
      title: 'Recap · Datos',
      iphone: RecapCheckoutDatosScreen(draft: _mockDraft()),
      desktop: RecapCheckoutDatosScreen(draft: _mockDraft()),
    );

@Preview('Recap · Revisión (iPhone + Desktop)')
Widget previewRecapRevisionCompareMock() => previewCompare(
      title: 'Recap · Revisión',
      iphone: RecapCheckoutRevisionScreen(draft: _mockDraft()),
      desktop: RecapCheckoutRevisionScreen(draft: _mockDraft()),
    );

@Preview('Recap · Pago (iPhone + Desktop)')
Widget previewRecapPagoCompareMock() => previewCompare(
      title: 'Recap · Pago',
      iphone: RecapCheckoutPagoScreen(draft: _mockDraft()),
      desktop: RecapCheckoutPagoScreen(draft: _mockDraft()),
    );

RecapInput _mockInput() {
  final route = <LatLng>[
    const LatLng(19.4326, -99.1332),
    const LatLng(19.4402, -99.1424),
    const LatLng(19.4471, -99.1512),
    const LatLng(19.4550, -99.1601),
    const LatLng(19.4634, -99.1710),
  ];
  return RecapInput(
    route: route,
    origen: 'Mi ubicación actual',
    destino: 'Chapultepec, CDMX',
    distanceMeters: 7840,
    durationSeconds: 45 * 60,
  );
}

RecapCheckoutDraft _mockDraft() {
  return RecapCheckoutDraft(
    planId: 'pase25',
    planTitle: 'Pase Único \$25',
    amountMx: 25,
    buyerName: 'Ana López Demo',
    buyerEmail: 'ana.recap.demo@ejemplo.com',
    buyerPhone: '5512345678',
    formaPago: 'tarjeta',
  );
}


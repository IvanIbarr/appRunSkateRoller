import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import 'location_context.dart' as loc;

/// Comprueba servicio, permisos y una lectura inicial (dispara el diálogo del SO).
class DeviceLocation {
  static Future<({bool ok, String? message})> ensureForTracking() async {
    if (kIsWeb && !loc.isLocationAvailableOnWeb()) {
      return (
        ok: false,
        message:
            'En el iPhone, el GPS en el navegador solo funciona con HTTPS.\n'
            'Cierra esta pestaña y abre la URL que empiece por https:// (puerto 8443).\n'
            'En el PC ejecuta: .\\scripts\\run_web_lan_https.ps1',
      );
    }

    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      return (
        ok: false,
        message: 'Activa la ubicación (GPS) del teléfono en Ajustes.',
      );
    }

    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }

    if (perm == LocationPermission.deniedForever) {
      return (
        ok: false,
        message: kIsWeb
            ? 'Ubicación bloqueada. iPhone: Ajustes → Safari → Ubicación → Permitir.'
            : 'Ubicación bloqueada. Abre Ajustes de la app y permite ubicación.',
      );
    }

    if (perm == LocationPermission.denied) {
      return (
        ok: false,
        message: 'Permiso de ubicación denegado. Vuelve a pulsar e intenta de nuevo.',
      );
    }

    try {
      await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
      return (ok: true, message: null);
    } catch (e) {
      return (
        ok: false,
        message: kIsWeb
            ? 'No se obtuvo GPS. Usa HTTPS, concede permiso al navegador y prueba al aire libre.'
            : 'No se obtuvo GPS: $e',
      );
    }
  }
}

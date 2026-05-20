import 'package:latlong2/latlong.dart';

double? _coerceDouble(dynamic v) {
  if (v == null) return null;
  if (v is double) return v;
  if (v is int) return v.toDouble();
  return double.tryParse(v.toString());
}

int? _coerceInt(dynamic v) {
  if (v == null) return null;
  if (v is int) return v;
  if (v is double) return v.round();
  return int.tryParse(v.toString());
}

class RecapInput {
  RecapInput({
    required this.route,
    this.distanceMeters,
    this.durationSeconds,
    this.origen,
    this.destino,
  });

  final List<LatLng> route;
  final double? distanceMeters;
  final double? durationSeconds;
  final String? origen;
  final String? destino;

  /// Copia con números seguros (evita fallos si el extra trae int/String desde JSON o estado).
  RecapInput normalized() {
    return RecapInput(
      route: List<LatLng>.from(route),
      distanceMeters: _coerceDouble(distanceMeters),
      durationSeconds: _coerceDouble(durationSeconds),
      origen: origen,
      destino: destino,
    );
  }

  double? get km => distanceMeters == null ? null : (distanceMeters! / 1000.0);

  double? get avgKmh {
    if (distanceMeters == null || durationSeconds == null || durationSeconds == 0) return null;
    final hours = durationSeconds! / 3600.0;
    return (distanceMeters! / 1000.0) / hours;
  }

  /// Segundos de duración como entero redondeado (video / UI).
  int get durationSecondsInt => _coerceInt(durationSeconds) ?? 0;
}


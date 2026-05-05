import 'package:latlong2/latlong.dart';

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

  double? get km => distanceMeters == null ? null : (distanceMeters! / 1000.0);

  double? get avgKmh {
    if (distanceMeters == null || durationSeconds == null || durationSeconds == 0) return null;
    final hours = durationSeconds! / 3600.0;
    return (distanceMeters! / 1000.0) / hours;
  }
}


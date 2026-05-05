import 'package:dio/dio.dart';

class MapboxRouteResult {
  MapboxRouteResult({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.coordinates,
  });

  final double distanceMeters;
  final double durationSeconds;
  /// Lista de puntos [lng, lat]
  final List<List<double>> coordinates;
}

class MapboxService {
  // Token default de la versión anterior (si no lo sobreescribes).
  static const String token = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
    defaultValue:
        'pk.eyJ1Ijoic2lpZ21hcCIsImEiOiJjbWpxcXRtN2kybXo4M2VvcGdmY2IxanZuIn0.ubWaiTudKvARocuzJWheVg',
  );

  static final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 18),
    ),
  );

  static Future<List<double>> _geocode(String q, {String language = 'es'}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/${Uri.encodeComponent(q)}.json',
      queryParameters: {
        'access_token': token,
        'limit': 1,
        'language': language,
        'country': 'mx',
      },
    );
    final data = res.data ?? const {};
    final features = (data['features'] as List?) ?? const [];
    if (features.isEmpty) {
      throw Exception('No se encontró la dirección: $q');
    }
    final center = (features[0] as Map)['center'] as List?;
    if (center == null || center.length < 2) {
      throw Exception('Geocoding inválido');
    }
    return [double.parse(center[0].toString()), double.parse(center[1].toString())]; // [lng,lat]
  }

  static Future<MapboxRouteResult> cyclingRoute({
    required String originText,
    required String destText,
    String language = 'es',
  }) async {
    if (token.isEmpty) {
      throw Exception('Token Mapbox faltante');
    }
    final o = await _geocode(originText, language: language);
    final d = await _geocode(destText, language: language);

    final res = await _dio.get<Map<String, dynamic>>(
      'https://api.mapbox.com/directions/v5/mapbox/cycling/${o[0]},${o[1]};${d[0]},${d[1]}',
      queryParameters: {
        'geometries': 'geojson',
        'access_token': token,
      },
    );
    final data = res.data ?? const {};
    final routes = (data['routes'] as List?) ?? const [];
    if (routes.isEmpty) {
      throw Exception('No se encontró una ruta válida');
    }
    final r0 = routes[0] as Map;
    final dist = double.tryParse(r0['distance']?.toString() ?? '') ?? 0;
    final dur = double.tryParse(r0['duration']?.toString() ?? '') ?? 0;
    final geom = r0['geometry'] as Map?;
    final coords = (geom?['coordinates'] as List?) ?? const [];
    final parsed = coords
        .whereType<List>()
        .where((e) => e.length >= 2)
        .map((e) => [double.parse(e[0].toString()), double.parse(e[1].toString())])
        .toList();
    return MapboxRouteResult(distanceMeters: dist, durationSeconds: dur, coordinates: parsed);
  }
}


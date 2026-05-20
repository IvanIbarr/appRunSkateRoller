import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class MapboxSuggestion {
  MapboxSuggestion({
    required this.placeName,
    required this.lng,
    required this.lat,
  });

  final String placeName;
  final double lng;
  final double lat;
}

class MapboxRouteResult {
  MapboxRouteResult({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.coordinates,
  });

  final double distanceMeters;
  final double durationSeconds;

  /// Puntos [lng, lat]
  final List<List<double>> coordinates;
}

class MapboxService {
  /// Última respuesta sugerencias: 401/403 (para avisar UX sin DioException global).
  static bool suggestionRequestWasUnauthorized = false;

  // ---------------------------------------------------------------------------
  // Tokens — misma prioridad conceptual que `appRunSkateRoller/src/config/mapbox.ts`:
  // env propio (aquí: MAPBOX_ACCESS_TOKEN o REACT_APP_MAPBOX_ACCESS_TOKEN) y si no, DEFAULT_TOKEN.
  // ---------------------------------------------------------------------------

  /// `DEFAULT_TOKEN` en RN (`mapbox.ts`) si no hay `REACT_APP_MAPBOX_ACCESS_TOKEN`.
  static const String rnDefaultPublicToken =
      'pk.eyJ1Ijoic2lpZ21hcCIsImEiOiJjbWpxcXRtN2kybXo4M2VvcGdmY2IxanZuIn0.ubWaiTudKvARocuzJWheVg';

  /// Token de muestra oficial Mapbox (RN `EXAMPLE_TOKEN`): no sirve para Geocoding/Directions.
  static const String rnOfficialExampleToken =
      'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

  static String _fromDartMapbox() {
    const v = String.fromEnvironment('MAPBOX_ACCESS_TOKEN', defaultValue: '');
    return v.trim();
  }

  /// Misma variable que usa React Native / Webpack (`REACT_APP_MAPBOX_ACCESS_TOKEN`).
  static String _fromDartReact() {
    const v = String.fromEnvironment('REACT_APP_MAPBOX_ACCESS_TOKEN', defaultValue: '');
    return v.trim();
  }

  static String _fromDotenvMapbox() {
    if (!dotenv.isInitialized) return '';
    return (dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '').trim();
  }

  static String _fromDotenvReact() {
    if (!dotenv.isInitialized) return '';
    return (dotenv.env['REACT_APP_MAPBOX_ACCESS_TOKEN'] ?? '').trim();
  }

  /// Origen 1:1 con RN: primero overrides (define / dotenv), luego `DEFAULT_TOKEN` del repo RN.
  static Iterable<String> _tokenCandidatesPrioritized() sync* {
    yield _fromDartMapbox();
    yield _fromDartReact();
    yield _fromDotenvMapbox();
    yield _fromDotenvReact();
    yield rnDefaultPublicToken;
  }

  /// `true` si el valor parece tutorial / placeholder (no llamar a Mapbox con eso).
  static bool looksLikeMapboxPlaceholder(String raw) {
    final t = raw.trim().toLowerCase();
    if (t.isEmpty) return true;
    if (t == rnOfficialExampleToken.toLowerCase()) return true;
    const bad = {
      'pk.tu_token_real_aqui',
      'pk.tu_token_real',
      'pk.your_token_here',
      'pk...',
      'pk.',
    };
    if (bad.contains(t)) return true;
    if (t.contains('tu_token_real') || t.contains('token_real_aqui')) return true;
    // Textos tipo tutorial en mapbox.local.env (no son JWT reales).
    if (t.contains('tu_token_completo_aqui') || t.contains('token_completo_aqui')) return true;
    if (t.contains('token_completo_sin')) return true;
    if (t.contains('...tu_') || t.contains('...tu_token')) return true;
    if (t.contains('sin_omitir') || t.contains('omitir_nada')) return true;
    if (t.contains('pega_aqui') || t.contains('paste_here')) return true;
    return false;
  }

  /// Usuario fijó el token de ejemplo oficial (comportamiento RN `isExampleToken()`).
  static bool explicitOfficialExampleConfigured() {
    for (final raw in [_fromDartMapbox(), _fromDartReact(), _fromDotenvMapbox(), _fromDotenvReact()]) {
      if (raw.isNotEmpty && raw == rnOfficialExampleToken) return true;
    }
    return false;
  }

  /// Token para APIs Mapbox (RN: `REACT_APP_…` + fallback default; Flutter: también `MAPBOX_ACCESS_TOKEN` y dotenv).
  static String get token {
    for (final raw in _tokenCandidatesPrioritized()) {
      if (raw.isEmpty || looksLikeMapboxPlaceholder(raw)) continue;
      return raw;
    }
    return '';
  }

  static final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 18),
      validateStatus: (s) => s != null && s < 600,
    ),
  );

  static void _throwIfMapboxUnauthorized(Response<dynamic>? res, {String contexto = ''}) {
    final c = res?.statusCode ?? 0;
    if (c == 401 || c == 403) {
      final webHint = kIsWeb
          ? ' En Flutter Web: `flutter run -d chrome --dart-define-from-file=mapbox.local.env` con '
              '`REACT_APP_MAPBOX_ACCESS_TOKEN` o `MAPBOX_ACCESS_TOKEN` (como RN / `.env`). '
              'Hot reload no aplica: **full restart**.'
          : ' Configura `REACT_APP_MAPBOX_ACCESS_TOKEN` o `MAPBOX_ACCESS_TOKEN` en `.env`, '
              '`assets/dotenv/mapbox_env.env`, o `--dart-define`.';
      final msg =
          '${contexto.isEmpty ? 'Mapbox' : contexto} no autorizado ($c). El pk. es inválido, revocado o no tiene permisos. '
          'Crea uno en https://account.mapbox.com/access-tokens/ .'
          '$webHint '
          '(Android Studio: Run → Edit Configurations → Additional run args).';
      throw Exception(msg.trim());
    }
  }

  /// `true` si algún origen (sin contar el DEFAULT RN) tiene texto que parece tutorial.
  static bool get definesLookLikeTutorialPlaceholder {
    for (final raw in [_fromDartMapbox(), _fromDartReact(), _fromDotenvMapbox(), _fromDotenvReact()]) {
      if (raw.isNotEmpty && looksLikeMapboxPlaceholder(raw)) return true;
    }
    return false;
  }

  /// Mensaje SnackBar cuando no hay token usable (p. ej. tutorial en `mapbox.local.env`).
  static String get calcularTokenSnackMessage {
    if (definesLookLikeTutorialPlaceholder) {
      return 'El token en `MAPBOX_ACCESS_TOKEN` o `REACT_APP_MAPBOX_ACCESS_TOKEN` parece texto de ejemplo. '
          'Pega el pk. COMPLETO desde https://account.mapbox.com/access-tokens/ en `mapbox.local.env` (como en RN) '
          'y ejecuta: flutter run -d chrome --dart-define-from-file=mapbox.local.env';
    }
    return 'Falta token Mapbox válido. $configUserHint';
  }

  /// Mensaje corto para SnackBars (Web vs nativo).
  static String get configUserHint {
    if (kIsWeb) {
      return 'Web: en `mapbox.local.env` usa la misma variable que React Native: '
          '`REACT_APP_MAPBOX_ACCESS_TOKEN=pk...` (o `MAPBOX_ACCESS_TOKEN=...`). '
          'Token en https://account.mapbox.com/access-tokens/ . Luego: '
          '`flutter run -d chrome --dart-define-from-file=mapbox.local.env` (full restart).';
    }
    return 'Añade `REACT_APP_MAPBOX_ACCESS_TOKEN` o `MAPBOX_ACCESS_TOKEN` en `roller_flutter_app/.env`, '
        '`assets/dotenv/mapbox_env.env`, o `--dart-define`.';
  }

  static String _missingTokenMessage() {
    final badOverride = definesLookLikeTutorialPlaceholder;
    if (badOverride) {
      return 'Token Mapbox no válido: parece un marcador de tutorial (p. ej. pk.tu_token_real_aqui). '
          'Copia tu token público completo desde https://account.mapbox.com/access-tokens/ '
          '${kIsWeb ? 'y pásalo con `--dart-define-from-file=mapbox.local.env` o `flutter run -d chrome --dart-define=MAPBOX_ACCESS_TOKEN=pk...` (Web no lee `.env` del disco).' : 'y ponlo en `roller_flutter_app/.env` o `--dart-define`.'}';
    }
    return 'Token Mapbox faltante. '
        '${kIsWeb ? 'En Web: crea `mapbox.local.env` (plantilla `mapbox.local.env.example`) y ejecuta '
            '`flutter run -d chrome --dart-define-from-file=mapbox.local.env`, o pasa `--dart-define=...`.' : 'Añade `MAPBOX_ACCESS_TOKEN` en `roller_flutter_app/.env` o en `assets/dotenv/mapbox_env.env`, o usa `--dart-define`.'}';
  }

  static void _rejectIfExampleLikeRn() {
    if (explicitOfficialExampleConfigured()) {
      throw Exception(
        'Estás usando el token de ejemplo de Mapbox (EXAMPLE_TOKEN de RN): no permite Geocoding/Directions. '
        'Pon tu propio pk. en `REACT_APP_MAPBOX_ACCESS_TOKEN` / `MAPBOX_ACCESS_TOKEN` (.env, mapbox.local.env o --dart-define).',
      );
    }
  }

  static Future<List<double>> geocodePlace(
    String q, {
    String language = 'es',
    String? proximityLngLat,
  }) async {
    final query = q.trim();
    if (query.isEmpty) {
      throw Exception('Dirección vacía');
    }
    _rejectIfExampleLikeRn();
    if (token.isEmpty) {
      throw Exception(_missingTokenMessage());
    }
    final qp = <String, dynamic>{
      'access_token': token,
      'limit': 1,
      'language': language,
      'country': 'mx',
    };
    if (proximityLngLat != null && proximityLngLat.isNotEmpty) {
      qp['proximity'] = proximityLngLat;
    }
    final res = await _dio.get<Map<String, dynamic>>(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/${Uri.encodeComponent(query)}.json',
      queryParameters: qp,
    );
    _throwIfMapboxUnauthorized(res, contexto: 'Geocoding');
    final data = res.data ?? const {};
    final features = (data['features'] as List?) ?? const [];
    if (features.isEmpty) {
      throw Exception('No se encontró la dirección: $query');
    }
    final center = (features[0] as Map)['center'] as List?;
    if (center == null || center.length < 2) {
      throw Exception('Geocoding inválido');
    }
    return [
      double.parse(center[0].toString()),
      double.parse(center[1].toString()),
    ];
  }

  /// Autocompletado (MX + proximity opcional).
  static Future<List<MapboxSuggestion>> suggestions(
    String query, {
    String language = 'es',
    String? proximityLngLat,
    int limit = 6,
  }) async {
    final q = query.trim();
    if (q.length < 3) return [];
    if (explicitOfficialExampleConfigured()) return [];

    suggestionRequestWasUnauthorized = false;

    if (token.isEmpty) return [];

    final qp = <String, dynamic>{
      'access_token': token,
      'limit': limit,
      'language': language,
      'country': 'mx',
      'autocomplete': 'true',
      'types': 'address,place,locality,neighborhood,poi',
    };
    if (proximityLngLat != null && proximityLngLat.isNotEmpty) {
      qp['proximity'] = proximityLngLat;
    }
    final res = await _dio.get<Map<String, dynamic>>(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/${Uri.encodeComponent(q)}.json',
      queryParameters: qp,
    );
    final sc = res.statusCode ?? 0;
    if (sc == 401 || sc == 403) {
      suggestionRequestWasUnauthorized = true;
      return [];
    }
    final data = res.data ?? const {};
    final features = (data['features'] as List?) ?? const [];
    final out = <MapboxSuggestion>[];
    for (final f in features) {
      if (f is! Map) continue;
      final placeName = f['place_name']?.toString();
      final center = f['center'] as List?;
      if (placeName == null || center == null || center.length < 2) continue;
      out.add(
        MapboxSuggestion(
          placeName: placeName,
          lng: double.parse(center[0].toString()),
          lat: double.parse(center[1].toString()),
        ),
      );
    }
    return out;
  }

  /// Perfil cycling.
  static Future<MapboxRouteResult> cyclingRoute({
    required String originText,
    required String destText,
    List<double>? originCoordsLngLat,
    List<double>? destinationCoordsLngLat,
    String language = 'es',
  }) async {
    _rejectIfExampleLikeRn();
    if (token.isEmpty) {
      throw Exception(_missingTokenMessage());
    }

    final oc = originCoordsLngLat;
    final dc = destinationCoordsLngLat;
    final hasO = oc != null && oc.length >= 2;
    final hasD = dc != null && dc.length >= 2;

    late List<double> resolvedO;
    late List<double> resolvedD;

    final proxAfterO = (oc != null && oc.length >= 2) ? '${oc[0]},${oc[1]}' : null;

    if (hasO && hasD) {
      resolvedO = List<double>.from(oc);
      resolvedD = List<double>.from(dc);
    } else if (!hasO && !hasD) {
      resolvedO = await geocodePlace(originText, language: language);
      resolvedD = await geocodePlace(destText, language: language, proximityLngLat: '${resolvedO[0]},${resolvedO[1]}');
    } else if (!hasO) {
      resolvedO = await geocodePlace(originText, language: language);
      if (hasD) {
        resolvedD = List<double>.from(dc);
      } else {
        resolvedD =
            await geocodePlace(destText, language: language, proximityLngLat: '${resolvedO[0]},${resolvedO[1]}');
      }
    } else {
      resolvedO = List<double>.from(oc);
      resolvedD = await geocodePlace(destText, language: language, proximityLngLat: proxAfterO);
    }

    final res = await _dio.get<Map<String, dynamic>>(
      'https://api.mapbox.com/directions/v5/mapbox/cycling/${resolvedO[0]},${resolvedO[1]};${resolvedD[0]},${resolvedD[1]}',
      queryParameters: {
        'geometries': 'geojson',
        'access_token': token,
      },
    );
    _throwIfMapboxUnauthorized(res, contexto: 'Directions cycling');
    final data = res.data ?? const {};
    final routes = (data['routes'] as List?) ?? const [];
    if (routes.isEmpty) {
      final msg = data['message']?.toString() ?? 'sin rutas';
      throw Exception('No se encontró una ruta válida ($msg)');
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

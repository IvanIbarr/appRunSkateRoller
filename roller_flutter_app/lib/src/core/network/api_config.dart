import 'package:flutter/foundation.dart';

/// URL base del API (Dio y enlaces que deben coincidir con el backend).
///
/// **Producción (recomendado):** URL completa sin barra final:
/// ```bash
/// flutter build apk --dart-define-from-file=release.local.env
/// ```
/// En `release.local.env`: `API_BASE_URL=https://api.tudominio.com`
///
/// **Desarrollo — puerto:**
/// ```bash
/// flutter run --dart-define=API_PORT=3001
/// ```
///
/// **Desarrollo — host móvil/emulador:**
/// ```bash
/// flutter run --dart-define=API_HOST=192.168.1.10
/// ```
///
/// **Web (sin API_BASE_URL):** mismo host que sirve la app + `API_PORT`.
class ApiConfig {
  /// Si está definido, tiene prioridad sobre host/puerto (producción y staging).
  static const String _apiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static const int _devPort = int.fromEnvironment('API_PORT', defaultValue: 3001);

  static const String _defaultMobileHost =
      String.fromEnvironment('API_HOST', defaultValue: '10.0.2.2');

  static String _normalizeApiBase(String raw) {
    var u = raw.trim();
    if (u.isEmpty) return '';
    while (u.endsWith('/')) {
      u = u.substring(0, u.length - 1);
    }
    if (u.endsWith('/api')) return u;
    return '$u/api';
  }

  static String baseUrl({bool isWeb = false}) {
    final fromEnv = _normalizeApiBase(_apiBaseUrl);
    if (fromEnv.isNotEmpty) return fromEnv;

    if (isWeb || kIsWeb) {
      final u = Uri.base;
      final scheme = u.scheme.isEmpty ? 'http' : u.scheme;
      final host = u.host.isEmpty ? 'localhost' : u.host;
      // Proxy HTTPS dev (scripts/https_dev_proxy): API en el mismo host/puerto → /api
      if (scheme == 'https') {
        final portPart = u.hasPort ? ':${u.port}' : '';
        return '$scheme://$host$portPart/api';
      }
      return '$scheme://$host:$_devPort/api';
    }
    return 'http://$_defaultMobileHost:$_devPort/api';
  }

  /// Origen del API sin `/api` (sirve `/uploads/...` estáticos del backend).
  static String uploadsOrigin() {
    final api = baseUrl();
    return api.replaceFirst(RegExp(r'/api/?$'), '');
  }

  /// Paridad RN `resolveMediaUrl`: `/uploads/chat/x.jpg` → origen + path.
  static String resolveMediaUrl(String? relativeOrAbsolute) {
    if (relativeOrAbsolute == null) return '';
    final raw = relativeOrAbsolute.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    final path = raw.startsWith('/') ? raw : '/$raw';
    final normalized = path.replaceFirst(RegExp(r'^/api'), '');
    return '${uploadsOrigin()}$normalized';
  }
}

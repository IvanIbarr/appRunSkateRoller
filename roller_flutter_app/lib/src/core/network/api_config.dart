import 'package:flutter/foundation.dart';

/// URL base del API (Dio y enlaces que deben coincidir con el backend).
///
/// **Archivo a editar:** `lib/src/core/network/api_config.dart`
///
/// **Puerto (por defecto 3001):**
/// ```bash
/// flutter run -d chrome --dart-define=API_PORT=4000
/// ```
///
/// **Host en móvil/emulador** (sigue valiendo `API_HOST`):
/// ```bash
/// flutter run --dart-define=API_HOST=192.168.1.10
/// ```
///
/// **Web:** se usa el mismo host que sirve la app (`Uri.base.host`) + `API_PORT`.
class ApiConfig {
  static const int _devPort = int.fromEnvironment('API_PORT', defaultValue: 3001);

  /// Para móvil físico (Android/iOS) en la misma WiFi:
  /// - Ejecuta con: `--dart-define=API_HOST=192.168.X.Y`
  /// Para emulador Android:
  /// - default host = 10.0.2.2
  static const String _defaultMobileHost =
      String.fromEnvironment('API_HOST', defaultValue: '10.0.2.2');

  static String baseUrl({bool isWeb = false}) {
    if (isWeb || kIsWeb) {
      // En web, apunta al mismo host donde se abre la app pero con el puerto del backend.
      final u = Uri.base;
      final scheme = u.scheme.isEmpty ? 'http' : u.scheme;
      final host = u.host.isEmpty ? 'localhost' : u.host;
      return '$scheme://$host:$_devPort/api';
    }
    return 'http://$_defaultMobileHost:$_devPort/api';
  }

  /// Origen del API sin `/api` (sirve `/uploads/...` estáticos del backend).
  static String uploadsOrigin() {
    final api = baseUrl();
    return api.replaceFirst(RegExp(r'/api/?$'), '');
  }

  /// Paridad RN `resolveMediaUrl`: `/uploads/chat/x.jpg` → `http://host:3001/uploads/chat/x.jpg`.
  static String resolveMediaUrl(String? relativeOrAbsolute) {
    if (relativeOrAbsolute == null) return '';
    final raw = relativeOrAbsolute.trim();
    if (raw.isEmpty) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    final path = raw.startsWith('/') ? raw : '/$raw';
    // Corrige URLs mal formadas guardadas con prefijo /api.
    final normalized = path.replaceFirst(RegExp(r'^/api'), '');
    return '${uploadsOrigin()}$normalized';
  }
}

import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Carga variables de `.env` empaquetadas y, fuera de web, fusiona `./.env` en la raíz
/// del directorio de trabajo (útil al ejecutar `flutter run -d chrome` / desktop desde IDE).
///
/// Prioridad efectiva por clave respeta flutter_dotenv: [mergeWith] gana sobre el contenido del asset.
Future<void> loadAppDotEnv() async {
  final rootOverrides = await _dotEnvOverridesFromFilesystemRoot();

  await dotenv.load(
    fileName: 'assets/dotenv/mapbox_env.env',
    mergeWith: rootOverrides,
    // El repo lleva placeholder; desarrolladores pueden no tener ningún archivo.
    isOptional: true,
  );
}

Future<Map<String, String>> _dotEnvOverridesFromFilesystemRoot() async {
  if (kIsWeb) return {};
  try {
    final cwd = Directory.current.path;
    final sep = Platform.pathSeparator;
    final f = File('$cwd$sep.env');
    if (!await f.exists()) return {};
    final lines = await f.readAsLines();
    return const Parser().parse(lines);
  } catch (e) {
    assert(() {
      debugPrint('[loadAppDotEnv] No se fusionó raíz/.env ($e)');
      return true;
    }());
    return {};
  }
}

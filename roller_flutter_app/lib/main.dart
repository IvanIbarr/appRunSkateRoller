import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app.dart';
import 'src/core/config/load_app_dotenv.dart';
import 'src/features/calendario/data/evento_reminder_service.dart';
import 'url_strategy_configure.dart';

/// Punto de entrada único de producción (iOS / Android / Web).
/// Router: [RollerApp] + GoRouter en `src/app.dart`. Sin mocks ni launcher alternativo.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  configureUrlStrategyIfWeb();
  await loadAppDotEnv();
  if (!kIsWeb) {
    await EventoReminderService.init();
  }
  runApp(const ProviderScope(child: RollerApp()));
}

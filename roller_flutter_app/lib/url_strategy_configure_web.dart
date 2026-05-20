import 'package:flutter_web_plugins/url_strategy.dart';

/// Web: rutas sin `#/` (p. ej. `/inicio?seguimiento=…`), alineado con enlaces compartidos.
void configureUrlStrategyIfWeb() {
  usePathUrlStrategy();
}

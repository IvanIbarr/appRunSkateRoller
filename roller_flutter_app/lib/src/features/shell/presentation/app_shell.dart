import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/rn_shell_bottom_tab_bar.dart';

/// Shell principal: una sola barra inferior RN ([RnShellScaffold]) en todas las plataformas.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static RnMainRoute _rnMainRouteFromShellIndex(int appIndex) {
    switch (appIndex) {
      case 0:
        return RnMainRoute.ruta;
      case 1:
        return RnMainRoute.marketing;
      case 2:
        return RnMainRoute.historial;
      case 3:
        return RnMainRoute.calendario;
      case 4:
        return RnMainRoute.chat;
      case 5:
        return RnMainRoute.rollertips;
      case 7:
        return RnMainRoute.menu;
      default:
        return RnMainRoute.menu;
    }
  }

  static int _shellIndexFromRnMainRoute(RnMainRoute route) {
    switch (route) {
      case RnMainRoute.ruta:
        return 0;
      case RnMainRoute.marketing:
        return 1;
      case RnMainRoute.historial:
        return 2;
      case RnMainRoute.calendario:
        return 3;
      case RnMainRoute.chat:
        return 4;
      case RnMainRoute.rollertips:
        return 5;
      case RnMainRoute.menu:
        return 7;
    }
  }

  @override
  Widget build(BuildContext context) {
    return RnShellScaffold(
      activeRoute: _rnMainRouteFromShellIndex(navigationShell.currentIndex),
      onNavigate: (route) {
        final idx = _shellIndexFromRnMainRoute(route);
        navigationShell.goBranch(idx, initialLocation: idx == navigationShell.currentIndex);
      },
      // El IndexedStack interno de GoRouter usa StackFit.loose; sin expandir, ramas
      // como Chat (Column + Expanded) pueden quedar con altura ~0 y verse “vacías”.
      child: SizedBox.expand(child: navigationShell),
    );
  }
}

/// Contenedor equivalente al de `StatefulShellRoute.indexedStack` en go_router,
/// pero con `IndexedStack(sizing: StackFit.expand)`. Con `StackFit.loose` (por
/// defecto), las ramas en `Offstage` miden 0 y el tamaño útil puede colapsar a
/// cero sobre todo en pantallas `Column`+`Expanded` (p. ej. Chat), dejando solo
/// el fondo de marca.
Widget rollerStatefulShellNavigatorContainer(
  BuildContext context,
  StatefulNavigationShell navigationShell,
  List<Widget> children,
) {
  final currentIndex = navigationShell.currentIndex;
  return IndexedStack(
    index: currentIndex,
    sizing: StackFit.expand,
    clipBehavior: Clip.hardEdge,
    children: [
      for (var i = 0; i < children.length; i++)
        Offstage(
          offstage: currentIndex != i,
          child: TickerMode(
            enabled: currentIndex == i,
            child: children[i],
          ),
        ),
    ],
  );
}

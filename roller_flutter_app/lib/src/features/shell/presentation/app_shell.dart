import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_session.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _destinations = <({IconData icon, String label})>[
    (icon: Icons.home_rounded, label: 'Ruta'),
    (icon: Icons.forum_rounded, label: 'Chat'),
    (icon: Icons.emoji_events_rounded, label: 'Historial'),
    (icon: Icons.event_available_rounded, label: 'Calendario'),
    (icon: Icons.play_circle_rounded, label: 'Rollertips'),
    (icon: Icons.storefront_rounded, label: 'Marketing'),
    (icon: Icons.menu_rounded, label: 'Menú'),
  ];

  int _mapIndex(int uiIndex) {
    // UI (como versión anterior): Ruta, Chat, Historial, Calendario, Rollertips, Marketing, Menú
    // App actual: Inicio, Marketing, Historial, Calendario, Chat, Tips, Perfil, Menú
    switch (uiIndex) {
      case 0:
        return 0; // Inicio/Ruta
      case 1:
        return 4; // Chat
      case 2:
        return 2; // Historial
      case 3:
        return 3; // Calendario
      case 4:
        return 5; // Tips (Rollertips)
      case 5:
        return 1; // Marketing
      case 6:
        return 7; // Menú
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final w = MediaQuery.of(context).size.width;
    // En web, forzar barra superior tipo "píldora" (como versión anterior).
    // En móvil, conservar barra inferior.
    final useTopBar = kIsWeb ? true : w >= 820;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Roller'),
        actions: [
          IconButton(
            tooltip: 'Salir',
            onPressed: () async {
              await ref.read(authSessionProvider.notifier).clear();
              if (context.mounted) {
                context.go('/login');
              }
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Column(
        children: [
          if (useTopBar)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: _TopPillBar(
                selectedUiIndex: _reverseMapIndex(navigationShell.currentIndex),
                onTap: (uiIndex) {
                  final idx = _mapIndex(uiIndex);
                  navigationShell.goBranch(idx, initialLocation: idx == navigationShell.currentIndex);
                },
              ),
            ),
          Expanded(child: navigationShell),
        ],
      ),
      bottomNavigationBar: useTopBar
          ? null
          : SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                decoration: const BoxDecoration(
                  color: Color.fromRGBO(2, 6, 23, 0.88),
                  border: Border(
                    top: BorderSide(color: Color.fromRGBO(226, 232, 240, 0.10)),
                  ),
                ),
                child: NavigationBar(
                  height: 64,
                  selectedIndex: _reverseMapIndex(navigationShell.currentIndex),
                  onDestinationSelected: (uiIndex) {
                    final idx = _mapIndex(uiIndex);
                    navigationShell.goBranch(idx, initialLocation: idx == navigationShell.currentIndex);
                  },
                  destinations: const [
                    NavigationDestination(icon: Icon(Icons.home_rounded), label: 'Ruta'),
                    NavigationDestination(icon: Icon(Icons.forum_rounded), label: 'Chat'),
                    NavigationDestination(icon: Icon(Icons.emoji_events_rounded), label: 'Historial'),
                    NavigationDestination(icon: Icon(Icons.event_available_rounded), label: 'Calendario'),
                    NavigationDestination(icon: Icon(Icons.play_circle_rounded), label: 'Rollertips'),
                    NavigationDestination(icon: Icon(Icons.storefront_rounded), label: 'Marketing'),
                    NavigationDestination(icon: Icon(Icons.menu_rounded), label: 'Menú'),
                  ],
                ),
              ),
            ),
    );
  }

  int _reverseMapIndex(int appIndex) {
    // Aproximación inversa para resaltar item en topbar.
    switch (appIndex) {
      case 0:
        return 0; // Ruta
      case 4:
        return 1; // Chat
      case 2:
        return 2; // Historial
      case 3:
        return 3; // Calendario
      case 5:
        return 4; // Rollertips
      case 1:
        return 5; // Marketing
      default:
        return 6; // Menú
    }
  }
}

class _TopPillBar extends StatelessWidget {
  const _TopPillBar({required this.selectedUiIndex, required this.onTap});

  final int selectedUiIndex;
  final void Function(int index) onTap;

  @override
  Widget build(BuildContext context) {
    final items = AppShell._destinations;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.72),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.35),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(items.length, (i) {
            final it = items[i];
            final active = i == selectedUiIndex;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => onTap(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: active
                        ? const Color.fromRGBO(255, 62, 165, 0.22)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(it.icon, size: 20, color: active ? const Color(0xFFFF3EA5) : const Color(0xFFE2E8F0)),
                      const SizedBox(height: 4),
                      Text(
                        it.label,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: active ? const Color(0xFFF8FAFC) : const Color(0xFFCBD5E1),
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}


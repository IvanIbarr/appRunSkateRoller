import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../l10n/app_locale.dart';
import 'rn_mirror_layouts.dart';

enum RnMainRoute {
  ruta,
  chat,
  historial,
  calendario,
  rollertips,
  marketing,
  menu,
}

class RnTabItem {
  const RnTabItem({
    required this.route,
    required this.label,
    required this.shortLabel,
    this.lucideIcon,
    this.skateEmoji = false,
  });

  final RnMainRoute route;
  final String label;
  final String shortLabel;

  /// Icono línea Lucide; omitido si [skateEmoji] (pestaña Ruta → 🛼).
  final IconData? lucideIcon;

  /// Identidad Roller: emoji de patín en la primera pestaña.
  final bool skateEmoji;
}

abstract final class RnCyberNavTokens {
  static const Color glassBg = Color(0xCC0D1117);

  /// Verde neón marca (tabs activos, glow).
  static const Color neonSpring = Color(0xFF00FF7F);

  static const Color neonCyan = Color(0xFF38BDF8);
  static const Color neonCyanSoft = Color(0xFF22D3EE);

  /// Inactivo: slate urbano.
  static const Color inactiveIcon = Color(0xFF475569);

  static const LinearGradient activeLineGradient = LinearGradient(
    colors: [neonSpring, neonCyanSoft, neonCyan],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static List<Shadow> springIconGlow() => [
        Shadow(color: neonSpring.withValues(alpha: 0.92), blurRadius: 16, offset: Offset.zero),
        Shadow(color: neonSpring.withValues(alpha: 0.55), blurRadius: 26, offset: Offset.zero),
        Shadow(color: neonCyanSoft.withValues(alpha: 0.35), blurRadius: 12, offset: Offset.zero),
      ];
}

class RnBottomTabBar extends ConsumerWidget {
  const RnBottomTabBar({
    super.key,
    required this.activeRoute,
    required this.onNavigate,
  });

  final RnMainRoute activeRoute;
  final void Function(RnMainRoute route) onNavigate;

  /// Altura interior (fila de tabs). Debe albergar rail + icono + label Orbitron sin overflow.
  static const double kPreferredInteriorHeight = 78;

  List<RnTabItem> _tabs(String Function(String) t) => [
        RnTabItem(route: RnMainRoute.ruta, label: t('tab.ruta'), shortLabel: t('tab.ruta'), skateEmoji: true),
        RnTabItem(route: RnMainRoute.chat, label: t('tab.chat'), shortLabel: t('tab.chat'), lucideIcon: LucideIcons.messageCircle),
        RnTabItem(route: RnMainRoute.historial, label: t('tab.historial'), shortLabel: t('tab.historial'), lucideIcon: LucideIcons.trophy),
        RnTabItem(route: RnMainRoute.calendario, label: t('tab.calendario'), shortLabel: t('tab.calendario'), lucideIcon: LucideIcons.calendarDays),
        RnTabItem(route: RnMainRoute.rollertips, label: t('tab.rollertips'), shortLabel: t('tab.rollertips'), lucideIcon: LucideIcons.clapperboard),
        RnTabItem(route: RnMainRoute.marketing, label: t('tab.marketing'), shortLabel: t('tab.marketing'), lucideIcon: LucideIcons.sparkles),
        RnTabItem(route: RnMainRoute.menu, label: t('tab.menu'), shortLabel: t('tab.menu'), lucideIcon: LucideIcons.menu),
      ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tabs = _tabs(ref.watch(appLocaleProvider).t);
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: RnCyberNavTokens.glassBg,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white10, width: 1),
          ),
          child: Material(
            color: Colors.transparent,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  for (final t in tabs)
                    Expanded(
                      child: _RnCyberTabTile(
                        item: t,
                        active: t.route == activeRoute,
                        onTap: () => onNavigate(t.route),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RnCyberTabTile extends StatelessWidget {
  const _RnCyberTabTile({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final RnTabItem item;
  final bool active;
  final VoidCallback onTap;

  Widget _tabGlyph(double sizeBig, double sizeSm) {
    final sz = active ? sizeBig : sizeSm;
    if (item.skateEmoji) {
      return Opacity(
        opacity: active ? 1 : 0.58,
        child: Text(
          '🛼',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: sz,
            height: 1,
            shadows: active ? RnCyberNavTokens.springIconGlow() : null,
          ),
        ),
      );
    }
    return Icon(
      item.lucideIcon!,
      size: sz,
      color: active ? RnCyberNavTokens.neonSpring : RnCyberNavTokens.inactiveIcon.withValues(alpha: 0.94),
      shadows: active ? RnCyberNavTokens.springIconGlow() : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    assert(item.skateEmoji || item.lucideIcon != null, 'RnTabItem: falta lucideIcon o skateEmoji.');
    return Semantics(
      button: true,
      selected: active,
      label: item.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          splashColor: RnCyberNavTokens.neonSpring.withValues(alpha: 0.18),
          highlightColor: RnCyberNavTokens.neonCyan.withValues(alpha: 0.06),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: active ? RnCyberNavTokens.neonSpring.withValues(alpha: 0.55) : Colors.transparent,
                width: active ? 1 : 0,
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: RnCyberNavTokens.neonSpring.withValues(alpha: 0.38),
                        blurRadius: 14,
                      ),
                      BoxShadow(
                        color: RnCyberNavTokens.neonCyanSoft.withValues(alpha: 0.18),
                        blurRadius: 20,
                      ),
                    ]
                  : const [],
              color: active ? RnCyberNavTokens.neonSpring.withValues(alpha: 0.08) : Colors.transparent,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _MicroNeonRail(active: active),
                const SizedBox(height: 6),
                _tabGlyph(28, 26),
                SizedBox(height: active ? 5 : 2),
                SizedBox(
                  height: active ? 12 : 0,
                  width: double.infinity,
                  child: active
                      ? Padding(
                          padding: const EdgeInsets.only(left: 1, right: 1),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              item.label.toUpperCase(),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.orbitron(
                                fontSize: 8,
                                height: 1,
                                letterSpacing: 0.85,
                                fontWeight: FontWeight.w700,
                                color: RnCyberNavTokens.neonSpring,
                                shadows: [
                                  Shadow(
                                    color: RnCyberNavTokens.neonSpring.withValues(alpha: 0.58),
                                    blurRadius: 8,
                                    offset: Offset.zero,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MicroNeonRail extends StatelessWidget {
  const _MicroNeonRail({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    if (!active) return const SizedBox(height: 3);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      height: 3,
      width: 22,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(99),
        gradient: RnCyberNavTokens.activeLineGradient,
        boxShadow: [
          BoxShadow(
            color: RnCyberNavTokens.neonSpring.withValues(alpha: 0.82),
            blurRadius: 7,
            spreadRadius: 0.4,
          ),
        ],
      ),
    );
  }
}

class RnBottomNavigationSlot extends StatelessWidget {
  const RnBottomNavigationSlot({
    super.key,
    required this.activeRoute,
    required this.onNavigate,
  });

  final RnMainRoute activeRoute;
  final void Function(RnMainRoute route) onNavigate;

  static const double totalHeight = RnBottomTabBar.kPreferredInteriorHeight + 28;

  /// Margen inferior del contenedor flotante (paridad RN `Padding` bottom: 16).
  static const double floatingOuterBottomMargin = 16;

  static const double _horizontalMargin = 12;

  /// Espacio que la barra inferior ocupa sobre el body con `extendBody: true`.
  static double reservedBottomInset(BuildContext context) {
    return totalHeight + floatingOuterBottomMargin + MediaQuery.paddingOf(context).bottom;
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      minimum: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.only(
          left: _horizontalMargin,
          right: _horizontalMargin,
          bottom: floatingOuterBottomMargin,
        ),
        child: SizedBox(
          height: RnBottomTabBar.kPreferredInteriorHeight,
          child: RnBottomTabBar(
            activeRoute: activeRoute,
            onNavigate: onNavigate,
          ),
        ),
      ),
    );
  }
}

class RnShellScaffold extends StatelessWidget {
  const RnShellScaffold({
    super.key,
    required this.activeRoute,
    required this.child,
    this.onNavigate,
  });

  static const double webMobileFrameMaxWidth = 430;

  final RnMainRoute activeRoute;
  final Widget child;
  final void Function(RnMainRoute route)? onNavigate;

  @override
  Widget build(BuildContext context) {
    // Comunidad/Chat en RN: imagen absoluteFill al 100% del viewport (no columna 430px).
    final webFullBleed = activeRoute == RnMainRoute.chat;
    return RnMirrorProductionShell(
      activeRoute: activeRoute,
      onNavigate: onNavigate,
      webFullBleed: webFullBleed,
      body: child,
    );
  }
}

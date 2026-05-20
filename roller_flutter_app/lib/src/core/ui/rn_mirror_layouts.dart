// =============================================================================
// RN MIRROR LAYOUTS — CONGELAMIENTO ARQUITECTÓNICO [y9]
// -----------------------------------------------------------------------------
// Este archivo define la estructura visual 1:1 con React Native.
// REGLA: No modificar tras el congelamiento. Cambios de datos/API van en
// lib/src/features/** (inyección por parámetros / slots).
// =============================================================================

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_theme.dart';
import 'rn_layered_styles.dart';
import 'rn_shell_bottom_tab_bar.dart';
import 'user_profile_avatar.dart';

/// Ancho máximo del molde móvil en Web (iPhone Pro Max).
abstract final class RnMirrorFreeze {
  static const double webPhoneMaxWidth = 430;
  /// RN `ComunidadScreen` → `require('../../assets/comunidad-fondo.jpeg')`.
  /// Si no está en `assets/`, usar [brandAsset] como respaldo.
  static const String comunidadAsset = 'assets/comunidad-fondo.jpeg';
  static const String brandAsset = 'assets/patines-fondo-nuevo.jpeg';
  static const String menuAsset = 'assets/menu-fondo.jpeg';
  static const String crearEventoAsset = 'assets/IMG_2675.jpeg';
  static const Color webGutter = Color(0xFF02040C);
  static const Color brandOverlay = Color.fromRGBO(10, 12, 24, 0.52);
  static const Color historialOverlay = Color.fromRGBO(15, 15, 30, 0.6);
  static const Color crearEventoOverlay = Color.fromRGBO(10, 17, 40, 217);
  static const Color calendarioBase = Color(0xFF0F0F1E);
}

// -----------------------------------------------------------------------------
// 1. ENCAPSULAMIENTO HÍBRIDO (Web 430px · iOS/Android 100%)
// -----------------------------------------------------------------------------

/// Envuelve [child] en marco centrado solo en Web ancho; nativo = 100%.
class RnMirrorHybridPhoneFrame extends StatelessWidget {
  const RnMirrorHybridPhoneFrame({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useFrame = kIsWeb && constraints.maxWidth > RnMirrorFreeze.webPhoneMaxWidth;
        if (!useFrame) return child;
        return ColoredBox(
          color: RnMirrorFreeze.webGutter,
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: RnMirrorFreeze.webPhoneMaxWidth,
                maxHeight: constraints.maxHeight,
              ),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: AppTheme.bg,
                  border: Border.all(color: const Color.fromRGBO(148, 163, 184, 0.12)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color.fromRGBO(0, 0, 0, 0.55),
                      blurRadius: 40,
                      offset: Offset(0, 16),
                    ),
                  ],
                ),
                child: ClipRect(child: child),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Shell producción: cuerpo + TabBar 7 iconos (punto azul) fija abajo.
class RnMirrorProductionShell extends StatelessWidget {
  const RnMirrorProductionShell({
    super.key,
    required this.activeRoute,
    required this.body,
    this.onNavigate,
    /// En web, `/chat` pinta fondo a ancho completo del viewport (sin marco 430px).
    this.webFullBleed = false,
  });

  final RnMainRoute activeRoute;
  final Widget body;
  final void Function(RnMainRoute route)? onNavigate;
  final bool webFullBleed;

  @override
  Widget build(BuildContext context) {
    final scaffold = Scaffold(
      backgroundColor: webFullBleed && kIsWeb ? Colors.transparent : AppTheme.bg,
      extendBody: true,
      body: body,
      bottomNavigationBar: RnBottomNavigationSlot(
        activeRoute: activeRoute,
        onNavigate: onNavigate ?? (_) {},
      ),
    );
    if (webFullBleed && kIsWeb) {
      return scaffold;
    }
    return RnMirrorHybridPhoneFrame(child: scaffold);
  }
}

// -----------------------------------------------------------------------------
// 2. CAPAS DE FONDO (Stack / Positioned)
// -----------------------------------------------------------------------------

class RnMirrorScreenBackdrop extends StatelessWidget {
  const RnMirrorScreenBackdrop({
    super.key,
    required this.child,
    this.asset = RnMirrorFreeze.brandAsset,
    this.imageOpacity = 1.0,
    this.overlay = RnMirrorFreeze.brandOverlay,
    this.baseColor = AppTheme.bg,
  });

  final Widget child;
  final String asset;
  final double imageOpacity;
  final Color overlay;
  final Color baseColor;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: baseColor,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: imageOpacity,
              child: Image.asset(
                asset,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => const ColoredBox(color: Color(0xFF0B1022)),
              ),
            ),
          ),
          Positioned.fill(child: ColoredBox(color: overlay)),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

class RnMirrorBrandBackdrop extends StatelessWidget {
  const RnMirrorBrandBackdrop({
    super.key,
    required this.child,
    this.overlay = RnMirrorFreeze.brandOverlay,
  });

  final Widget child;
  final Color overlay;

  @override
  Widget build(BuildContext context) {
    return RnMirrorScreenBackdrop(overlay: overlay, child: child);
  }
}

/// Fondo Calendario: imagen suave + velo mapa.
class RnMirrorCalendarioBackdrop extends StatelessWidget {
  const RnMirrorCalendarioBackdrop({super.key, required this.child, this.overlays = const []});

  final Widget child;
  final List<Widget> overlays;

  @override
  Widget build(BuildContext context) {
    return RnMirrorScreenBackdrop(
      baseColor: const Color(0xFF0F0F1E),
      imageOpacity: 0.35,
      overlay: RnLayeredStyles.mapOverlay,
      child: Stack(
        children: [
          Positioned.fill(child: child),
          ...overlays,
        ],
      ),
    );
  }
}

class RnMirrorHistorialBackdrop extends StatelessWidget {
  const RnMirrorHistorialBackdrop({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: Color(0xFF0F0F1E)),
        Positioned.fill(
          child: Opacity(
            opacity: 0.45,
            child: Image.asset(RnMirrorFreeze.brandAsset, fit: BoxFit.cover),
          ),
        ),
        const Positioned.fill(child: ColoredBox(color: RnMirrorFreeze.historialOverlay)),
        SafeArea(child: child),
      ],
    );
  }
}

/// Mapa a pantalla completa + imagen de marca + velo (Ruta / Recap).
class RnMirrorMapStackBackdrop extends StatelessWidget {
  const RnMirrorMapStackBackdrop({
    super.key,
    required this.mapLayer,
    required this.foreground,
    this.loadingOverlay,
  });

  final Widget mapLayer;
  final Widget foreground;
  final Widget? loadingOverlay;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned.fill(
          child: Image.asset(
            RnMirrorFreeze.brandAsset,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => const ColoredBox(color: Color(0xFF0B1022)),
          ),
        ),
        Positioned.fill(child: mapLayer),
        const Positioned.fill(child: ColoredBox(color: RnLayeredStyles.mapOverlay)),
        if (loadingOverlay != null) Positioned.fill(child: loadingOverlay!),
        Positioned.fill(child: foreground),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// 3. TIPOGRAFÍA URBANA (Permanent Marker)
// -----------------------------------------------------------------------------

abstract final class RnMirrorTypography {
  static TextStyle heroTitle({double size = 31}) => GoogleFonts.permanentMarker(
        fontSize: size,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        shadows: const [
          Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
        ],
      );

  static TextStyle heroSubtitle({double size = 21}) => GoogleFonts.permanentMarker(
        fontSize: size,
        fontWeight: FontWeight.w600,
        color: Colors.white,
        shadows: const [
          Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
        ],
      );

  static TextStyle tabLabel({required bool active}) => GoogleFonts.permanentMarker(
        fontSize: 16,
        height: 1.05,
        fontWeight: active ? FontWeight.w700 : FontWeight.w600,
        color: active ? Colors.white : const Color(0xFFE2E8F0),
        shadows: [
          Shadow(
            color: active ? const Color.fromRGBO(56, 189, 248, 0.6) : const Color.fromRGBO(0, 0, 0, 0.6),
            offset: const Offset(0, 1),
            blurRadius: active ? 6 : 4,
          ),
        ],
      );
}

// -----------------------------------------------------------------------------
// 4. RUTA — cabecera + glassPanel + CTA elíptico
// -----------------------------------------------------------------------------

class RnMirrorRutaHeader extends StatelessWidget {
  const RnMirrorRutaHeader({super.key, this.user});

  final Map<String, dynamic>? user;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          UserProfileAvatar.header(
            user,
            borderColor: const Color.fromRGBO(226, 232, 240, 0.14),
            backgroundColor: const Color.fromRGBO(2, 6, 23, 0.62),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Inicio de Recorrido', style: RnMirrorTypography.heroTitle()),
                const SizedBox(height: 4),
                Text('Navegación y Tracking', style: RnMirrorTypography.heroSubtitle()),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class RnMirrorRutaFormGlass extends StatelessWidget {
  const RnMirrorRutaFormGlass({super.key, required this.children});

  final List<Widget> children;

  static final BoxDecoration _rutaNeonDarkGlass = BoxDecoration(
    color: const Color.fromRGBO(2, 6, 23, 0.82),
    borderRadius: BorderRadius.circular(22),
    border: Border.all(width: 1.15, color: const Color.fromRGBO(0, 255, 127, 0.38)),
    boxShadow: [
      BoxShadow(color: AppTheme.routeElectricCta.withValues(alpha: 0.22), blurRadius: 18, spreadRadius: 0),
      const BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.55), blurRadius: 22, offset: Offset(0, 12)),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        decoration: _rutaNeonDarkGlass,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        ),
      ),
    );
  }
}

class RnMirrorRutaCalcularCta extends StatelessWidget {
  const RnMirrorRutaCalcularCta({
    super.key,
    required this.label,
    required this.enabled,
    required this.onPressed,
  });

  final String label;
  final bool enabled;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: enabled ? onPressed : null,
        style: ButtonStyle(
          minimumSize: WidgetStateProperty.all(const Size.fromHeight(52)),
          backgroundColor: WidgetStateProperty.resolveWith((s) {
            if (s.contains(WidgetState.disabled)) return const Color.fromRGBO(148, 163, 184, 0.35);
            return AppTheme.routeElectricCta;
          }),
          foregroundColor: WidgetStateProperty.resolveWith((s) {
            if (s.contains(WidgetState.disabled)) return const Color(0xFF475569);
            return const Color(0xFF020617);
          }),
          elevation: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.disabled) ? 0.0 : 8.0),
          shadowColor: WidgetStateProperty.all(const Color(0x9900D4FF)),
          shape: WidgetStateProperty.all(RoundedRectangleBorder(borderRadius: BorderRadius.circular(28))),
        ),
        child: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.3),
        ),
      ),
    );
  }
}

class RnMirrorRutaLayout extends StatelessWidget {
  const RnMirrorRutaLayout({
    super.key,
    required this.formFields,
    this.user,
    this.bottomMap,
    this.bottomMapHeight,
    this.trackingPanel,
    this.isCalculating = false,
  });

  final Map<String, dynamic>? user;
  final List<Widget> formFields;
  final Widget? bottomMap;
  /// Alto del mapa inferior (web móvil suele pedir ~0.35–0.6 del viewport como RN).
  final double? bottomMapHeight;
  final Widget? trackingPanel;
  final bool isCalculating;

  @override
  Widget build(BuildContext context) {
    return RnMirrorScreenBackdrop(
      overlay: RnMirrorFreeze.brandOverlay,
      child: Stack(
        fit: StackFit.expand,
        children: [
          SafeArea(
            child: Theme(
              data: Theme.of(context).copyWith(
                focusColor: Colors.transparent,
                hoverColor: Colors.transparent,
              ),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.only(bottom: RnBottomNavigationSlot.totalHeight + 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    RnMirrorRutaHeader(user: user),
                    const SizedBox(height: 10),
                    RnMirrorRutaFormGlass(children: formFields),
                    if (bottomMap != null) ...[
                      const SizedBox(height: 14),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: RnLayeredStyles.glassBorder),
                            boxShadow: const [
                              BoxShadow(
                                color: Color.fromRGBO(0, 0, 0, 0.28),
                                blurRadius: 14,
                                offset: Offset(0, 6),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: SizedBox(
                              height: bottomMapHeight ?? 220,
                              child: bottomMap,
                            ),
                          ),
                        ),
                      ),
                    ],
                    if (trackingPanel != null) ...[
                      const SizedBox(height: 14),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: trackingPanel!,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          if (isCalculating)
            const Positioned.fill(
              child: AbsorbPointer(
                child: ColoredBox(
                  color: Color.fromRGBO(15, 23, 42, 0.55),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: Color(0xFF38BDF8)),
                        SizedBox(height: 12),
                        Text(
                          'Calculando ruta…',
                          style: TextStyle(fontSize: 15, color: Color(0xFFE2E8F0), fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// 5. RECAP — mapa + panel cristal flotante
// -----------------------------------------------------------------------------

class RnMirrorRecapLayout extends StatelessWidget {
  const RnMirrorRecapLayout({
    super.key,
    required this.mapLayer,
    required this.titleRow,
    required this.glassBody,
  });

  final Widget mapLayer;
  final Widget titleRow;
  final Widget glassBody;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: RnMirrorMapStackBackdrop(
        mapLayer: mapLayer,
        foreground: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                titleRow,
                const SizedBox(height: 12),
                glassBody,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// 6. CHAT — fondo marca + slot (tabs + hilo en producción)
// -----------------------------------------------------------------------------

class RnMirrorChatLayout extends StatelessWidget {
  const RnMirrorChatLayout({super.key, required this.body});

  final Widget body;

  @override
  Widget build(BuildContext context) {
    return RnMirrorBrandBackdrop(child: SizedBox.expand(child: body));
  }
}

/// Avatar ranking: foto de perfil o emoji (Historial podio + lista).
class RnMirrorLeaderboardAvatar extends StatelessWidget {
  const RnMirrorLeaderboardAvatar({super.key, required this.user, required this.radius});

  final Map<String, dynamic> user;
  final double radius;

  static String? photoUrlFor(Map<String, dynamic> u) {
    return UserProfileAvatar.resolveNetworkUrl((u['fotoPerfil'] ?? u['foto_perfil'] ?? '').toString());
  }

  @override
  Widget build(BuildContext context) {
    return UserProfileAvatar.fromUser(
      user,
      size: radius * 2,
      borderWidth: 0,
      backgroundColor: const Color(0xFF0F172A),
    );
  }
}

// -----------------------------------------------------------------------------
// 7. HISTORIAL — podio Top 3 + lista (estructura fija)
// -----------------------------------------------------------------------------

class RnMirrorHistorialLayout extends StatelessWidget {
  const RnMirrorHistorialLayout({super.key, required this.scrollChild});

  final Widget scrollChild;

  @override
  Widget build(BuildContext context) {
    return RnMirrorHistorialBackdrop(
      child: scrollChild,
    );
  }
}

class RnMirrorLeaderboardPodium extends StatelessWidget {
  const RnMirrorLeaderboardPodium({super.key, required this.entries});

  final List<Map<String, dynamic>> entries;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return const SizedBox.shrink();
    final p1 = entries[0];
    final p2 = entries.length > 1 ? entries[1] : null;
    final p3 = entries.length > 2 ? entries[2] : null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(child: p2 != null ? _PodiumStand(rank: 2, user: p2, height: 112) : const SizedBox()),
          Expanded(child: _PodiumStand(rank: 1, user: p1, height: 140)),
          Expanded(child: p3 != null ? _PodiumStand(rank: 3, user: p3, height: 96) : const SizedBox()),
        ],
      ),
    );
  }
}

class _PodiumStand extends StatelessWidget {
  const _PodiumStand({required this.rank, required this.user, required this.height});

  final int rank;
  final Map<String, dynamic> user;
  final double height;

  @override
  Widget build(BuildContext context) {
    final name = (user['alias'] ?? user['email'] ?? 'Roller').toString();
    final km = double.tryParse((user['totalKilometros'] ?? 0).toString()) ?? 0;
    final medal = rank == 1 ? '🥇' : (rank == 2 ? '🥈' : '🥉');
    final ring = rank == 1
        ? const Color(0xFFFFD700)
        : rank == 2
            ? const Color(0xFFC0C0C0)
            : const Color(0xFFCD7F32);
    final r = rank == 1 ? 34.0 : 28.0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(medal, style: const TextStyle(fontSize: 30)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: ring, width: 3),
          ),
          child: RnMirrorLeaderboardAvatar(user: user, radius: r),
        ),
        const SizedBox(height: 10),
        Text(
          name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: GoogleFonts.permanentMarker(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
        ),
        Text(
          '${km.toStringAsFixed(1)} km',
          style: GoogleFonts.permanentMarker(fontSize: 11, color: const Color(0xFFFF9500), fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        Container(
          height: height,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: rank == 1
                  ? const [Color(0xFFFFD700), Color(0xFFFFA500)]
                  : rank == 2
                      ? const [Color(0xFFE2E8F0), Color(0xFF94A3B8)]
                      : const [Color(0xFFCD7F32), Color(0xFFB45309)],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
          ),
          alignment: Alignment.topCenter,
          padding: const EdgeInsets.only(top: 12),
          child: Text(
            '$rank°',
            style: GoogleFonts.permanentMarker(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
          ),
        ),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// 8. CALENDARIO / TABS — scroll sobre fondo marca
// -----------------------------------------------------------------------------

class RnMirrorTabScrollLayout extends StatelessWidget {
  const RnMirrorTabScrollLayout({
    super.key,
    required this.child,
    this.bottomPadding = 100,
  });

  final Widget child;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    return RnMirrorBrandBackdrop(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16, kIsWeb ? 12 : 6, 16, bottomPadding),
        child: child,
      ),
    );
  }
}

/// Calendario: fondo + refresh + scroll con padding inferior tab bar.
class RnMirrorCalendarioLayout extends StatelessWidget {
  const RnMirrorCalendarioLayout({
    super.key,
    required this.scrollChild,
    required this.onRefresh,
    this.overlays = const [],
    this.refreshColor = const Color(0xFF6C63FF),
  });

  final Widget scrollChild;
  final Future<void> Function() onRefresh;
  final List<Widget> overlays;
  final Color refreshColor;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: RnMirrorFreeze.calendarioBase,
      child: RnMirrorCalendarioBackdrop(
        overlays: overlays,
        child: RefreshIndicator(
          color: refreshColor,
          onRefresh: onRefresh,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.only(bottom: RnBottomNavigationSlot.totalHeight + 40),
            child: scrollChild,
          ),
        ),
      ),
    );
  }
}

/// Menú: fondo dedicado + scroll con safe area superior.
class RnMirrorMenuLayout extends StatelessWidget {
  const RnMirrorMenuLayout({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Material(
      type: MaterialType.transparency,
      child: RnMirrorScreenBackdrop(
        asset: RnMirrorFreeze.menuAsset,
        overlay: RnMirrorFreeze.brandOverlay,
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(16, top > 0 ? 12 : 40, 16, RnBottomNavigationSlot.totalHeight + 40),
          child: child,
        ),
      ),
    );
  }
}

/// Tabs con marca (Tips, Marketing): fondo + refresh opcional + overlays modales.
class RnMirrorBrandTabLayout extends StatelessWidget {
  const RnMirrorBrandTabLayout({
    super.key,
    required this.child,
    this.onRefresh,
    this.overlays = const [],
    this.overlay = const Color.fromRGBO(10, 12, 24, 0.55),
    this.refreshColor = const Color(0xFF38BDF8),
    this.horizontalPadding = 20,
    this.topPadding,
  });

  final Widget child;
  final Future<void> Function()? onRefresh;
  final List<Widget> overlays;
  final Color overlay;
  final Color refreshColor;
  final double horizontalPadding;
  final double? topPadding;

  @override
  Widget build(BuildContext context) {
    final top = topPadding ?? (kIsWeb ? 24.0 : 32.0);
    final bottom = RnBottomNavigationSlot.totalHeight + 40;
    final scroll = SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(horizontalPadding, top, horizontalPadding, bottom),
      child: child,
    );
    final body = onRefresh == null
        ? scroll
        : RefreshIndicator(color: refreshColor, onRefresh: onRefresh!, child: scroll);

    return Material(
      color: const Color(0xFF0F172A),
      child: RnMirrorScreenBackdrop(
        overlay: overlay,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned.fill(child: body),
            ...overlays,
          ],
        ),
      ),
    );
  }
}

/// Crear / editar evento: fondo IMG_2675 + scroll de formulario.
class RnMirrorCrearEventoLayout extends StatelessWidget {
  const RnMirrorCrearEventoLayout({super.key, required this.body});

  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: RnMirrorScreenBackdrop(
        asset: RnMirrorFreeze.crearEventoAsset,
        overlay: RnMirrorFreeze.crearEventoOverlay,
        child: SingleChildScrollView(
          padding: EdgeInsets.only(bottom: RnBottomNavigationSlot.totalHeight + 24),
          child: body,
        ),
      ),
    );
  }
}

/// Cabecera urbana con botón atrás (Crear evento).
class RnMirrorCrearEventoHeader extends StatelessWidget {
  const RnMirrorCrearEventoHeader({super.key, required this.title, required this.onBack});

  final String title;
  final VoidCallback onBack;

  static const Color _cyan = Color(0xFF00D9FF);

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.paddingOf(context).top;
    final headerTop = topPad > 0 ? 20.0 : 60.0;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, headerTop, 20, 0),
      child: Row(
        children: [
          Material(
            color: const Color.fromRGBO(0, 217, 255, 0.2),
            shape: const CircleBorder(side: BorderSide(color: Color.fromRGBO(0, 217, 255, 0.3))),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onBack,
              child: const SizedBox(
                width: 40,
                height: 40,
                child: Center(
                  child: Text('←', style: TextStyle(fontSize: 24, color: _cyan, fontWeight: FontWeight.w300)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: RnMirrorTypography.heroTitle(size: 24))),
        ],
      ),
    );
  }
}

/// Contenedor oscuro para sheet / modal “Crear evento” (tipografía urbana externa).
class RnMirrorBottomSheetShell extends StatelessWidget {
  const RnMirrorBottomSheetShell({super.key, required this.title, required this.body});

  final String title;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color.fromRGBO(12, 16, 28, 0.96),
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        border: Border(top: BorderSide(color: Color.fromRGBO(255, 255, 255, 0.12))),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.paddingOf(context).bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color.fromRGBO(148, 163, 184, 0.45),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(title, style: RnMirrorTypography.heroTitle(size: 24)),
          const SizedBox(height: 16),
          Flexible(child: SingleChildScrollView(child: body)),
        ],
      ),
    );
  }
}

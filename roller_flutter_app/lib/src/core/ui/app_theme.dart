import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color bg = Color(0xFF020617); // slate-950
  static const Color surface = Color(0xFF0B1224);
  // RN original usa mucho rgba(226,232,240,0.14)
  static const Color border = Color.fromRGBO(226, 232, 240, 0.14);
  static const Color accent = Color(0xFFFF3EA5);
  static const Color primaryBlue = Color(0xFF38BDF8);

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: accent,
      brightness: Brightness.dark,
      surface: surface,
    );

    final textTheme = GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: const Color(0xFFF8FAFC),
      displayColor: const Color(0xFFF8FAFC),
    );

    return base.copyWith(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: bg,
      textTheme: textTheme,
      dividerTheme: const DividerThemeData(
        color: Color.fromRGBO(226, 232, 240, 0.14),
        thickness: 1,
        space: 1,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: Color(0xFFF8FAFC),
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        // Match RN routeCard: rgba(2,6,23,0.62)
        color: const Color.fromRGBO(2, 6, 23, 0.62),
        elevation: 10,
        shadowColor: const Color.fromRGBO(0, 0, 0, 0.35),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          // RN usa 18-20 en la mayoría de cards
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.16)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: const Color.fromRGBO(2, 6, 23, 0.92),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.16)),
        ),
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w900,
          color: const Color(0xFFF8FAFC),
          shadows: const [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
          ],
        ),
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: const Color.fromRGBO(248, 250, 252, 0.92),
          height: 1.25,
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: const Color.fromRGBO(2, 6, 23, 0.92),
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: const Color.fromRGBO(226, 232, 240, 0.24),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          side: BorderSide(color: Color.fromRGBO(226, 232, 240, 0.16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        // Un poco más opaco para legibilidad en fondo fotográfico
        fillColor: const Color.fromRGBO(15, 23, 42, 0.44),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        // RN labelWhite: color #FFF + shadow negro (legibilidad sobre fondo/imagen)
        labelStyle: const TextStyle(
          color: Color(0xFFFFFFFF),
          shadows: [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
          ],
        ),
        floatingLabelStyle: const TextStyle(
          color: Color.fromRGBO(248, 250, 252, 0.92),
          fontWeight: FontWeight.w800,
          shadows: [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.70), blurRadius: 3, offset: Offset(1, 1)),
          ],
        ),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.22)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.22)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primaryBlue, width: 1.2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          // En RN, el CTA de Ruta es azul translúcido con borde
          backgroundColor: const Color.fromRGBO(56, 189, 248, 0.20),
          foregroundColor: const Color(0xFFF0F9FF),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.35)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.4),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFF8FAFC),
          side: const BorderSide(color: border),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: Color(0xFFE2E8F0),
        textColor: Color(0xFFF8FAFC),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        indicatorColor: Color.fromRGBO(255, 62, 165, 0.20),
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  static TextStyle titleMarker(BuildContext context, {double size = 40}) {
    return GoogleFonts.permanentMarker(
      fontSize: size,
      height: 1.1,
      letterSpacing: size * 0.04,
      color: const Color(0xFFF8FAFC),
      shadows: const [
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.55), blurRadius: 10, offset: Offset(0, 6)),
      ],
    );
  }
}


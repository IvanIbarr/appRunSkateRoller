import 'package:flutter/material.dart';

/// Tokens compartidos para pantallas en modo capas (mapa/fondo + paneles flotantes).
abstract final class RnLayeredStyles {
  static const Color glassFill = Color.fromRGBO(15, 23, 42, 0.75);
  static const Color glassBorder = Color.fromRGBO(255, 255, 255, 0.12);
  static const Color mapOverlay = Color.fromRGBO(10, 12, 24, 0.34);

  static BoxDecoration glassPanel({
    double radius = 20,
    List<BoxShadow>? boxShadow,
  }) {
    return BoxDecoration(
      color: glassFill,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: glassBorder),
      boxShadow: boxShadow ??
          const [
            BoxShadow(
              color: Color.fromRGBO(0, 0, 0, 0.28),
              blurRadius: 16,
              offset: Offset(0, 8),
            ),
          ],
    );
  }

  /// Campos Ruta: fondo blanco como RN. Sin [labelText] interno: el label va arriba (evita solapamiento).
  static InputDecoration rutaTextField({
    String? hintText,
    double borderRadius = 12,
  }) {
    const borderColor = Color.fromRGBO(203, 213, 225, 0.9);
    OutlineInputBorder b(Color c, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: c, width: width),
        );
    final idle = b(borderColor);
    final focus = b(const Color.fromRGBO(56, 189, 248, 0.75), 1.25);
    return InputDecoration(
      hintText: hintText,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: idle,
      enabledBorder: idle,
      focusedBorder: focus,
      disabledBorder: idle,
      floatingLabelBehavior: FloatingLabelBehavior.never,
      hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
    );
  }

  /// Campos amplios sin anillo azul nativo de foco en Web: borde estable en todos los estados.
  static InputDecoration textField({
    String? labelText,
    String? hintText,
    double borderRadius = 12,
  }) {
    const borderColor = Color.fromRGBO(148, 163, 184, 0.45);
    const subtleFocus = Color.fromRGBO(56, 189, 248, 0.45);
    OutlineInputBorder b(Color c, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: c, width: width),
        );
    final idle = b(borderColor);
    final focus = b(subtleFocus, 1.25);
    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      filled: true,
      fillColor: const Color.fromRGBO(15, 23, 42, 0.55),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      isDense: false,
      border: idle,
      enabledBorder: idle,
      focusedBorder: focus,
      disabledBorder: idle,
      errorBorder: b(const Color.fromRGBO(248, 113, 113, 0.65)),
      focusedErrorBorder: b(const Color.fromRGBO(248, 113, 113, 0.85), 1.25),
      labelStyle: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 14),
      hintStyle: TextStyle(
        color: const Color(0xFFCBD5F5).withValues(alpha: 0.78),
        fontSize: 14,
      ),
      floatingLabelStyle: const TextStyle(color: Color(0xFF7DD3FC)),
    );
  }

  static ButtonStyle ctaButton({
    Color backgroundColor = const Color(0xFF007AFF),
    Color foregroundColor = Colors.white,
  }) {
    return ElevatedButton.styleFrom(
      minimumSize: const Size.fromHeight(50),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
    );
  }
}

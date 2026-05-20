import 'package:flutter/material.dart';

/// Marcador de posición en el mapa (icono Material «roller_skating», Apache 2.0).
class RutaSkateMarker extends StatelessWidget {
  const RutaSkateMarker({super.key, this.size = 36});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF0F172A).withValues(alpha: 0.9),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            blurRadius: 12,
            color: const Color(0xFF38BDF8).withValues(alpha: 0.75),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Icon(
        Icons.roller_skating,
        color: const Color(0xFF38BDF8),
        size: size * 0.62,
      ),
    );
  }
}

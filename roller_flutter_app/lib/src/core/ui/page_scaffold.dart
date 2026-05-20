import 'package:flutter/material.dart';
import 'dart:math' as math;

import 'package:google_fonts/google_fonts.dart';

import 'background_scaffold.dart';
import 'glass_card.dart';

class PageScaffold extends StatelessWidget {
  const PageScaffold({
    super.key,
    required this.title,
    required this.child,
    this.showLogo = false,
    this.maxWidth = 920,
    this.actions = const [],
  });

  final String title;
  final Widget child;
  final bool showLogo;
  final double maxWidth;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final effectiveMaxWidth = w >= 900 ? math.min(maxWidth, 500.0) : maxWidth;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: BackgroundScaffold(
        showLogo: showLogo,
        child: GlassCard(
        maxWidth: effectiveMaxWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.permanentMarker(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFF8FAFC),
                      shadows: const [
                        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
                      ],
                    ),
                  ),
                ),
                ...actions,
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
      ),
    );
  }
}


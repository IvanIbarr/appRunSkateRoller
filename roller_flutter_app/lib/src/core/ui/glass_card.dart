import 'package:flutter/material.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.maxWidth = 760,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final innerPad = w < 420 ? 12.0 : 16.0;
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(innerPad),
            child: child,
          ),
        ),
      ),
    );
  }
}


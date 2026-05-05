import 'package:flutter/material.dart';

class SimplePlaceholderScreen extends StatelessWidget {
  const SimplePlaceholderScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text(
          '$title (pendiente de migrar)',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}


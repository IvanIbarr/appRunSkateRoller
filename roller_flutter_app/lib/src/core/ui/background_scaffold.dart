import 'package:flutter/material.dart';

class BackgroundScaffold extends StatelessWidget {
  const BackgroundScaffold({
    super.key,
    required this.child,
    this.showLogo = true,
  });

  final Widget child;
  final bool showLogo;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final pad = w < 420 ? 14.0 : 24.0;
    return Stack(
      children: [
        Positioned.fill(
          child: Image.asset(
            'assets/patines-fondo-nuevo.jpeg',
            fit: BoxFit.cover,
          ),
        ),
        Positioned.fill(
          child: Container(
            // RN original: overlay rgba(10,12,24,0.52)
            color: const Color.fromRGBO(10, 12, 24, 0.52),
          ),
        ),
        SafeArea(
          child: Align(
            alignment: Alignment.topCenter,
            child: SingleChildScrollView(
              padding: EdgeInsets.all(pad),
              child: Column(
                children: [
                  if (showLogo)
                    Opacity(
                      opacity: 0.92,
                      child: Image.asset(
                        'assets/logo.jpeg',
                        width: w < 420 ? 76 : 92,
                        height: w < 420 ? 76 : 92,
                        fit: BoxFit.cover,
                      ),
                    ),
                  if (showLogo) const SizedBox(height: 16),
                  child,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}


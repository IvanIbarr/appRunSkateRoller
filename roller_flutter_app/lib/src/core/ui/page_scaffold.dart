import 'package:flutter/material.dart';

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
    return Scaffold(
      body: BackgroundScaffold(
        showLogo: showLogo,
        child: GlassCard(
          maxWidth: maxWidth,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(title, style: Theme.of(context).textTheme.headlineSmall),
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


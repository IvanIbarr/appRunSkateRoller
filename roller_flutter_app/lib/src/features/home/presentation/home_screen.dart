import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_session.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Roller Flutter - Inicio'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(authSessionProvider.notifier).clear();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: const Text('Salir'),
          ),
        ],
      ),
      body: const Center(
        child: Text(
          'Base Flutter creada.\nSiguiente bloque: Historial, Calendario y Chat.',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

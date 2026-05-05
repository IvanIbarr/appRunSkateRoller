import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/background_scaffold.dart';
import '../../../core/ui/app_theme.dart';
import 'auth_controller.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _emailCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);
    final isLoading = state.isLoading;

    return Scaffold(
      body: BackgroundScaffold(
        showLogo: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 18),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Olvidé mi contraseña',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: const Color(0xFFF8FAFC),
                                    fontWeight: FontWeight.w900,
                                    shadows: const [
                                      Shadow(
                                        color: Color.fromRGBO(0, 0, 0, 0.85),
                                        blurRadius: 10,
                                        offset: Offset(2, 2),
                                      ),
                                      Shadow(
                                        color: Color.fromRGBO(56, 189, 248, 0.18),
                                        blurRadius: 18,
                                        offset: Offset(0, 10),
                                      ),
                                    ],
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Te enviaremos un código de 4 dígitos al correo.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: const Color.fromRGBO(226, 232, 240, 0.78),
                                    height: 1.2,
                                  ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 14),
                            TextField(
                              controller: _emailCtrl,
                              decoration: const InputDecoration(labelText: 'Correo'),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isLoading
                                    ? null
                                    : () async {
                                        final ok = await ref
                                            .read(authControllerProvider.notifier)
                                            .forgotPassword(_emailCtrl.text);
                                        if (!context.mounted) return;
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              ok
                                                  ? 'Solicitud enviada, revisa tu correo'
                                                  : 'No se pudo solicitar recuperación (SMTP)',
                                            ),
                                          ),
                                        );
                                      },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryBlue,
                                  foregroundColor: const Color(0xFF020617),
                                  side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.45)),
                                ),
                                child: const Text('Enviar código'),
                              ),
                            ),
                            const SizedBox(height: 14),
                            Container(
                              height: 1,
                              color: const Color.fromRGBO(226, 232, 240, 0.14),
                            ),
                            const SizedBox(height: 14),
                            TextField(
                              controller: _codeCtrl,
                              decoration: const InputDecoration(labelText: 'Código (4 dígitos)'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _passwordCtrl,
                              obscureText: true,
                              decoration: const InputDecoration(labelText: 'Nueva contraseña'),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isLoading
                                    ? null
                                    : () async {
                                        final ok = await ref.read(authControllerProvider.notifier).resetPassword(
                                              email: _emailCtrl.text,
                                              code: _codeCtrl.text,
                                              password: _passwordCtrl.text,
                                            );
                                        if (!context.mounted) return;
                                        if (ok) {
                                          context.go('/login');
                                        } else {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('No se pudo actualizar la contraseña')),
                                          );
                                        }
                                      },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.accent,
                                  foregroundColor: const Color(0xFFF8FAFC),
                                  side: const BorderSide(color: Color.fromRGBO(255, 62, 165, 0.45)),
                                ),
                                child: const Text('Cambiar contraseña'),
                              ),
                            ),
                            TextButton(
                              onPressed: isLoading ? null : () => context.go('/login'),
                              child: const Text('Regresar a login'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

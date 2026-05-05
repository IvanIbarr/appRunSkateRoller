import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;

    return Scaffold(
      body: LoginLayout(
        emailCtrl: _emailCtrl,
        passwordCtrl: _passwordCtrl,
        loading: isLoading,
        onLogin: () async {
          final ok = await ref
              .read(authControllerProvider.notifier)
              .login(email: _emailCtrl.text, password: _passwordCtrl.text);
          if (!context.mounted) return;
          if (ok) {
            context.go('/inicio');
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No fue posible iniciar sesión')),
            );
          }
        },
        onForgot: () => context.go('/reset-password'),
        onRegister: () => context.go('/register'),
      ),
    );
  }
}

class LoginLayout extends StatelessWidget {
  const LoginLayout({
    super.key,
    required this.emailCtrl,
    required this.passwordCtrl,
    required this.loading,
    required this.onLogin,
    required this.onForgot,
    required this.onRegister,
  });

  final TextEditingController emailCtrl;
  final TextEditingController passwordCtrl;
  final bool loading;
  final VoidCallback onLogin;
  final VoidCallback onForgot;
  final VoidCallback onRegister;

  double _titleFontSize(double width) {
    const gutters = 68.0;
    final usable = (width - gutters).clamp(130.0, 2000.0);
    final fromWidth = (usable / 10.2).floorToDouble();
    // Más grande para legibilidad (mock en iPhone y desktop)
    return fromWidth.clamp(28.0, 64.0);
  }

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final titleSize = _titleFontSize(w);
    final padH = 24.0;

    final titleStyle = GoogleFonts.permanentMarker(
      fontSize: titleSize,
      height: 1.14,
      letterSpacing: (titleSize * 0.04).clamp(0.5, 4.0),
      // En preview sobre foto, necesitamos contraste alto.
      color: const Color(0xFFF8FAFC),
      shadows: const [
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.85), blurRadius: 10, offset: Offset(2, 2)),
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.65), blurRadius: 22, offset: Offset(0, 8)),
      ],
    );

    return Stack(
      children: [
        const Positioned.fill(
          child: ColoredBox(color: Color(0xFFF5F5F5)),
        ),
        Positioned.fill(
          child: Image.asset(
            'assets/logo.jpeg',
            fit: BoxFit.cover,
          ),
        ),
        // Overlay oscuro para legibilidad (entre foto y textos)
        Positioned.fill(
          child: Container(color: Colors.black.withValues(alpha: 0.40)),
        ),
        SafeArea(
          child: LayoutBuilder(
            builder: (context, c) {
              return SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: padH, vertical: w < 420 ? 26 : 34),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: c.maxHeight),
                  child: Column(
                    children: [
                      // Más espacio superior para que el título no quede pegado al notch/borde.
                      SizedBox(height: w < 420 ? 18 : 26),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'RunSkateRoller',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: titleStyle,
                        ),
                      ),
                      SizedBox(height: w < 420 ? 34 : 56),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 400),
                        child: Column(
                          children: [
                            TextField(
                              controller: emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                hintText: 'correo@ejemplo.com',
                              ).copyWith(
                                labelStyle: const TextStyle(color: Colors.white),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              ),
                              style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 16),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: passwordCtrl,
                              obscureText: true,
                              decoration: const InputDecoration(
                                labelText: 'Contraseña',
                                hintText: 'Ingresa tu contraseña',
                              ).copyWith(
                                labelStyle: const TextStyle(color: Colors.white),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              ),
                              style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 16),
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton(
                                onPressed: loading ? null : onLogin,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                                  textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                ),
                                child: Text(loading ? 'Entrando...' : 'Iniciar Sesión'),
                              ),
                            ),
                            const SizedBox(height: 12),
                            InkWell(
                              onTap: loading ? null : onForgot,
                              child: const Text(
                                'Olvidé mi contraseña',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Color(0xFF0A84FF),
                                  fontWeight: FontWeight.w600,
                                  shadows: [
                                    Shadow(color: Color.fromRGBO(0, 0, 0, 0.6), blurRadius: 2, offset: Offset(1, 1)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 520),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              '¿No tienes una cuenta? ',
                              style: TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            InkWell(
                              onTap: loading ? null : onRegister,
                              child: const Text(
                                'Regístrate',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // bottom breathing room
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

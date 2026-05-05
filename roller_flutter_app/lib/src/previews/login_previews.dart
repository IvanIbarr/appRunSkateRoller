import 'package:flutter/material.dart';

import '../core/ui/preview.dart';
import '../features/auth/presentation/login_screen.dart';

@Preview('Login · iPhone + Desktop (Mock)')
Widget previewLoginCompareMock() {
  // Usamos el Login real, pero sin interacción (controladores vacíos).
  // Para pruebas de overflow, el mock se hace con controllers prellenados.
  final email = TextEditingController(text: 'nombre.apellido.super.largo+alias.demo@dominio-extremadamente-largo-ejemplo.com');
  final pass = TextEditingController(text: '123456');

  return previewCompare(
    title: 'Login · iPhone vs Desktop',
    iphone: _LoginMock(emailCtrl: email, passwordCtrl: pass),
    desktop: _LoginMock(emailCtrl: email, passwordCtrl: pass),
  );
}

class _LoginMock extends StatelessWidget {
  const _LoginMock({required this.emailCtrl, required this.passwordCtrl});
  final TextEditingController emailCtrl;
  final TextEditingController passwordCtrl;

  @override
  Widget build(BuildContext context) {
    // Reutiliza el layout del Login real (sin providers)
    return Scaffold(
      body: Builder(
        builder: (context) {
          return LoginLayout(
            emailCtrl: emailCtrl,
            passwordCtrl: passwordCtrl,
            loading: false,
            onLogin: () {},
            onForgot: () {},
            onRegister: () {},
          );
        },
      ),
    );
  }
}


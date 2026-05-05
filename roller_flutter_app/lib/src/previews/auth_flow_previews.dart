import 'package:flutter/material.dart';

import '../core/ui/glass_card.dart';
import '../core/ui/preview.dart';

@Preview('Auth · Login (iPhone + Desktop)')
Widget previewAuthLoginCompare() => previewCompare(
      title: 'Auth · Login',
      iphone: const _AuthLoginMock(),
      desktop: const _AuthLoginMock(),
    );

@Preview('Auth · Registro (iPhone + Desktop)')
Widget previewAuthRegistroCompare() => previewCompare(
      title: 'Auth · Registro',
      iphone: const _AuthRegistroMock(),
      desktop: const _AuthRegistroMock(),
    );

@Preview('Auth · Recuperar contraseña (iPhone + Desktop)')
Widget previewAuthForgotCompare() => previewCompare(
      title: 'Auth · Recuperar contraseña',
      iphone: const _AuthForgotMock(),
      desktop: const _AuthForgotMock(),
    );

@Preview('Auth · Reset contraseña (iPhone + Desktop)')
Widget previewAuthResetCompare() => previewCompare(
      title: 'Auth · Reset contraseña',
      iphone: const _AuthResetMock(),
      desktop: const _AuthResetMock(),
    );

class _AuthBg extends StatelessWidget {
  const _AuthBg({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final padH = w >= 900 ? 34.0 : 20.0;

    return Stack(
      children: [
        Positioned.fill(
          child: Image.asset(
            'assets/logo.jpeg',
            fit: BoxFit.cover,
          ),
        ),
        const Positioned.fill(
          child: ColoredBox(color: Color.fromRGBO(0, 0, 0, 0.42)),
        ),
        SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(padH, 26, padH, 26),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: const Color(0xFFF8FAFC),
                            fontSize: 30,
                            fontWeight: FontWeight.w900,
                            shadows: const [
                              Shadow(
                                color: Color.fromRGBO(0, 0, 0, 0.85),
                                blurRadius: 10,
                                offset: Offset(2, 2),
                              ),
                              Shadow(
                                color: Color.fromRGBO(255, 62, 165, 0.22),
                                blurRadius: 18,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                    ),
                    const SizedBox(height: 14),
                    GlassCard(child: child),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AuthLoginMock extends StatelessWidget {
  const _AuthLoginMock();

  @override
  Widget build(BuildContext context) {
    return _AuthBg(
      title: 'RUNSKATEROLLER',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(
            decoration: InputDecoration(labelText: 'Correo', hintText: 'correo@ejemplo.com'),
          ),
          const SizedBox(height: 12),
          const TextField(
            obscureText: true,
            decoration: InputDecoration(labelText: 'Contraseña', hintText: '••••••••'),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: null,
              child: const Text('Iniciar Sesión'),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(onPressed: null, child: const Text('Olvidé mi contraseña')),
          const SizedBox(height: 6),
          TextButton(onPressed: null, child: const Text('Crear cuenta')),
        ],
      ),
    );
  }
}

class _AuthRegistroMock extends StatelessWidget {
  const _AuthRegistroMock();

  @override
  Widget build(BuildContext context) {
    return _AuthBg(
      title: 'Registro',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(decoration: InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          const TextField(obscureText: true, decoration: InputDecoration(labelText: 'Contraseña')),
          const SizedBox(height: 12),
          const TextField(obscureText: true, decoration: InputDecoration(labelText: 'Confirmar contraseña')),
          const SizedBox(height: 14),
          Text(
            'Datos básicos',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFFF8FAFC),
                ),
          ),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, c) {
              final wide = c.maxWidth >= 520;
              if (wide) {
                return Row(
                  children: [
                    const Expanded(child: TextField(decoration: InputDecoration(labelText: 'Edad'))),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: 'masculino',
                        items: const [
                          DropdownMenuItem(value: 'masculino', child: Text('Masculino')),
                          DropdownMenuItem(value: 'femenino', child: Text('Femenino')),
                          DropdownMenuItem(value: 'otro', child: Text('Otro')),
                        ],
                        onChanged: (_) {},
                        decoration: const InputDecoration(labelText: 'Sexo'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: 'es',
                        items: const [
                          DropdownMenuItem(value: 'es', child: Text('Español')),
                          DropdownMenuItem(value: 'en', child: Text('Inglés')),
                        ],
                        onChanged: (_) {},
                        decoration: const InputDecoration(labelText: 'Nacionalidad'),
                      ),
                    ),
                  ],
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const TextField(decoration: InputDecoration(labelText: 'Edad')),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: 'masculino',
                    items: const [
                      DropdownMenuItem(value: 'masculino', child: Text('Masculino')),
                      DropdownMenuItem(value: 'femenino', child: Text('Femenino')),
                      DropdownMenuItem(value: 'otro', child: Text('Otro')),
                    ],
                    onChanged: (_) {},
                    decoration: const InputDecoration(labelText: 'Sexo'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: 'es',
                    items: const [
                      DropdownMenuItem(value: 'es', child: Text('Español')),
                      DropdownMenuItem(value: 'en', child: Text('Inglés')),
                    ],
                    onChanged: (_) {},
                    decoration: const InputDecoration(labelText: 'Nacionalidad'),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF3EA5),
                foregroundColor: const Color(0xFFF8FAFC),
                side: const BorderSide(color: Color.fromRGBO(255, 62, 165, 0.45)),
              ),
              child: const Text('Crear cuenta'),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthForgotMock extends StatelessWidget {
  const _AuthForgotMock();

  @override
  Widget build(BuildContext context) {
    return _AuthBg(
      title: 'Recuperar contraseña',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Te enviaremos un código de 4 dígitos al correo.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color.fromRGBO(226, 232, 240, 0.78),
                  height: 1.2,
                ),
          ),
          const SizedBox(height: 12),
          const TextField(decoration: InputDecoration(labelText: 'Email')),
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF38BDF8),
                foregroundColor: const Color(0xFF020617),
                side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.45)),
              ),
              child: const Text('Enviar código'),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(onPressed: null, child: const Text('Volver al login')),
        ],
      ),
    );
  }
}

class _AuthResetMock extends StatelessWidget {
  const _AuthResetMock();

  @override
  Widget build(BuildContext context) {
    return _AuthBg(
      title: 'Restablecer contraseña',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(
            decoration: InputDecoration(labelText: 'Email', hintText: 'correo@ejemplo.com'),
          ),
          const SizedBox(height: 12),
          const TextField(decoration: InputDecoration(labelText: 'Código', hintText: '1234')),
          const SizedBox(height: 12),
          const TextField(obscureText: true, decoration: InputDecoration(labelText: 'Nueva contraseña')),
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: null,
              child: const Text('Confirmar'),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(onPressed: null, child: const Text('Regresar a Login')),
        ],
      ),
    );
  }
}


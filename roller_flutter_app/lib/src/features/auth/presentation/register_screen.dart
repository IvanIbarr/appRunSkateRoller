import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'auth_controller.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _aliasCtrl = TextEditingController();
  final _edadCtrl = TextEditingController(text: '18');
  final _cumpleCtrl = TextEditingController(text: '01/01/2000');

  String _sexo = 'ambos';
  String _nacionalidad = 'español';
  String _tipoPerfil = 'roller';
  String _avatar = '';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _aliasCtrl.dispose();
    _edadCtrl.dispose();
    _cumpleCtrl.dispose();
    super.dispose();
  }

  DateTime? _parseDdMmYyyy(String raw) {
    final s = raw.trim();
    final parts = s.split('/');
    if (parts.length != 3) return null;
    final d = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    final y = int.tryParse(parts[2]);
    if (d == null || m == null || y == null) return null;
    if (y < 1900 || y > DateTime.now().year) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    final dt = DateTime(y, m, d);
    if (dt.year != y || dt.month != m || dt.day != d) return null;
    return dt;
  }

  int _calcAge(DateTime birth) {
    final today = DateTime.now();
    var age = today.year - birth.year;
    final hadBirthday =
        (today.month > birth.month) || (today.month == birth.month && today.day >= birth.day);
    if (!hadBirthday) age -= 1;
    return age;
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authControllerProvider).isLoading;

    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: ColoredBox(color: Color(0xFF0F172A))),
          Positioned.fill(
            child: Image.asset(
              'assets/patines-fondo-nuevo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          const Positioned.fill(
            child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.55)),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 48),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Registro',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFFF8FAFC),
                          ),
                        ),
                        const SizedBox(height: 16),

                        _Label('Email'),
                        _TextFieldRn(
                          controller: _emailCtrl,
                          enabled: !isLoading,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 16),

                        _Label('Idioma'),
                        Row(
                          children: [
                            Expanded(
                              child: _ToggleButtonRn(
                                text: 'Español',
                                active: _nacionalidad == 'español',
                                onTap: isLoading ? null : () => setState(() => _nacionalidad = 'español'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _ToggleButtonRn(
                                text: 'Inglés',
                                active: _nacionalidad == 'inglés',
                                onTap: isLoading ? null : () => setState(() => _nacionalidad = 'inglés'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        _Label('Tipo de perfil'),
                        _ToggleButtonRn(
                          text: 'Líder de grupo',
                          active: _tipoPerfil == 'liderGrupo',
                          onTap: isLoading ? null : () => setState(() => _tipoPerfil = 'liderGrupo'),
                        ),
                        const SizedBox(height: 8),
                        _ToggleButtonRn(
                          text: 'Roller',
                          active: _tipoPerfil == 'roller',
                          onTap: isLoading ? null : () => setState(() => _tipoPerfil = 'roller'),
                        ),
                        const SizedBox(height: 20),

                        _Label('Sexo'),
                        Row(
                          children: [
                            Expanded(
                              child: _ToggleButtonRn(
                                text: 'Masculino',
                                active: _sexo == 'masculino',
                                onTap: isLoading ? null : () => setState(() => _sexo = 'masculino'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _ToggleButtonRn(
                                text: 'Femenino',
                                active: _sexo == 'femenino',
                                onTap: isLoading ? null : () => setState(() => _sexo = 'femenino'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _ToggleButtonRn(
                          text: 'Ambos',
                          active: _sexo == 'ambos',
                          onTap: isLoading ? null : () => setState(() => _sexo = 'ambos'),
                        ),
                        const SizedBox(height: 20),

                        _Label('Alias'),
                        _TextFieldRn(
                          controller: _aliasCtrl,
                          enabled: !isLoading,
                        ),
                        const SizedBox(height: 16),

                        _Label('Contraseña'),
                        _TextFieldRn(
                          controller: _passwordCtrl,
                          enabled: !isLoading,
                          obscureText: true,
                        ),
                        const SizedBox(height: 16),

                        _Label('Confirmar contraseña'),
                        _TextFieldRn(
                          controller: _confirmPasswordCtrl,
                          enabled: !isLoading,
                          obscureText: true,
                        ),
                        const SizedBox(height: 16),

                        _Label('Cumpleaños'),
                        _TextFieldRn(
                          controller: _cumpleCtrl,
                          enabled: !isLoading,
                          keyboardType: TextInputType.datetime,
                        ),
                        const SizedBox(height: 16),

                        _Label('Edad'),
                        _TextFieldRn(
                          controller: _edadCtrl,
                          enabled: !isLoading,
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 20),

                        _Label('Avatar (opcional)'),
                        _PickerButtonRn(
                          text: _avatar.trim().isEmpty ? 'Selecciona un avatar' : _avatar,
                          enabled: !isLoading,
                          onTap: () async {
                            if (isLoading) return;
                            final picked = await showModalBottomSheet<String>(
                              context: context,
                              showDragHandle: true,
                              builder: (context) {
                                final options = const ['', 'skate-pink', 'skate-blue', 'flame', 'star'];
                                return SafeArea(
                                  child: ListView(
                                    padding: const EdgeInsets.all(12),
                                    children: [
                                      Text(
                                        'Selecciona avatar',
                                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800),
                                      ),
                                      const SizedBox(height: 10),
                                      ...options.map((o) {
                                        final label = o.isEmpty ? 'Sin avatar' : o;
                                        final active = _avatar == o;
                                        return Padding(
                                          padding: const EdgeInsets.only(bottom: 8),
                                          child: _PickerOptionRn(
                                            label: label,
                                            active: active,
                                            onTap: () => Navigator.of(context).pop(o),
                                          ),
                                        );
                                      }),
                                    ],
                                  ),
                                );
                              },
                            );
                            if (picked == null) return;
                            setState(() => _avatar = picked);
                          },
                        ),
                        const SizedBox(height: 8),

                        _PrimaryButtonRn(
                          title: isLoading ? 'Creando…' : 'Crear cuenta',
                          enabled: !isLoading,
                          onTap: () async {
                            if (isLoading) return;
                            final email = _emailCtrl.text.trim();
                            final pass = _passwordCtrl.text;
                            final confirm = _confirmPasswordCtrl.text;
                            if (email.isEmpty || !email.contains('@')) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Ingresa un correo válido')),
                              );
                              return;
                            }
                            if (pass.length < 6) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('La contraseña debe tener al menos 6 caracteres')),
                              );
                              return;
                            }
                            if (pass != confirm) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Las contraseñas no coinciden')),
                              );
                              return;
                            }
                            final birth = _parseDdMmYyyy(_cumpleCtrl.text);
                            if (birth == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Cumpleaños inválido (usa DD/MM/YYYY)')),
                              );
                              return;
                            }
                            final edad = int.tryParse(_edadCtrl.text.trim()) ?? 0;
                            if (edad < 13) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Debes tener al menos 13 años')),
                              );
                              return;
                            }
                            final edadCalc = _calcAge(birth);
                            if (edadCalc != edad) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'La edad no coincide con el cumpleaños. Según la fecha, deberías tener $edadCalc años.',
                                  ),
                                ),
                              );
                              return;
                            }

                            final ok = await ref.read(authControllerProvider.notifier).registro(
                                  email: email,
                                  password: pass,
                                  confirmPassword: confirm,
                                  edad: edad,
                                  cumpleanosIso: birth.toIso8601String(),
                                  sexo: _sexo,
                                  nacionalidad: _nacionalidad,
                                  tipoPerfil: _tipoPerfil,
                                  avatar: _avatar.trim().isEmpty ? null : _avatar.trim(),
                                  alias: _aliasCtrl.text.trim().isEmpty ? null : _aliasCtrl.text.trim(),
                                );
                            if (!context.mounted) return;
                            if (ok) {
                              context.go('/inicio');
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('No se pudo registrar')),
                              );
                            }
                          },
                        ),

                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '¿Ya tienes cuenta? ',
                              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFCBD5F5)),
                            ),
                            GestureDetector(
                              onTap: isLoading
                                  ? null
                                  : () {
                                      context.go('/login');
                                    },
                              child: Text(
                                'Inicia sesión',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: const Color(0xFF38BDF8),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
      ),
    );
  }
}

class _TextFieldRn extends StatelessWidget {
  const _TextFieldRn({
    required this.controller,
    required this.enabled,
    this.keyboardType,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final bool enabled;
  final TextInputType? keyboardType;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDDDDDD)),
      ),
      child: TextField(
        controller: controller,
        enabled: enabled,
        keyboardType: keyboardType,
        obscureText: obscureText,
        enableInteractiveSelection: true,
        textAlignVertical: TextAlignVertical.center,
        style: GoogleFonts.inter(fontSize: 16, color: const Color(0xFF333333)),
        decoration: const InputDecoration(
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          filled: false,
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}

class _ToggleButtonRn extends StatelessWidget {
  const _ToggleButtonRn({
    required this.text,
    required this.active,
    required this.onTap,
  });

  final String text;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: active ? const Color.fromRGBO(56, 189, 248, 0.18) : const Color.fromRGBO(15, 23, 42, 0.35),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: active ? const Color.fromRGBO(56, 189, 248, 0.8) : const Color.fromRGBO(148, 163, 184, 0.35),
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: active ? const Color(0xFFF8FAFC) : const Color(0xFFCBD5F5),
            fontWeight: active ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

class _PickerButtonRn extends StatelessWidget {
  const _PickerButtonRn({
    required this.text,
    required this.enabled,
    required this.onTap,
  });

  final String text;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          constraints: const BoxConstraints(minHeight: 48),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFDDDDDD)),
          ),
          child: Row(
            children: [
              const Icon(Icons.person_outline, color: Color(0xFF333333), size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(text, style: GoogleFonts.inter(fontSize: 16, color: const Color(0xFF333333))),
              ),
              const Icon(Icons.expand_more, color: Color(0xFF333333)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PickerOptionRn extends StatelessWidget {
  const _PickerOptionRn({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: active ? const Color.fromRGBO(56, 189, 248, 0.18) : const Color.fromRGBO(15, 23, 42, 0.35),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: active ? const Color.fromRGBO(56, 189, 248, 0.8) : const Color.fromRGBO(148, 163, 184, 0.35),
          ),
        ),
        child: Row(
          children: [
            Expanded(child: Text(label, style: GoogleFonts.inter(color: Colors.white))),
            if (active) const Icon(Icons.check_circle_rounded, color: Color(0xFF38BDF8)),
          ],
        ),
      ),
    );
  }
}

class _PrimaryButtonRn extends StatelessWidget {
  const _PrimaryButtonRn({
    required this.title,
    required this.enabled,
    required this.onTap,
  });

  final String title;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF007AFF),
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(
            title,
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
          ),
        ),
      ),
    );
  }
}

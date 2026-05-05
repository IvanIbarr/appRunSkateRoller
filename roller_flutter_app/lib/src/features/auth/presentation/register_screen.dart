import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/background_scaffold.dart';
import '../../../core/ui/app_theme.dart';
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
                              'Registro',
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
                                        color: Color.fromRGBO(255, 62, 165, 0.22),
                                        blurRadius: 18,
                                        offset: Offset(0, 10),
                                      ),
                                    ],
                                  ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(labelText: 'Correo'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _aliasCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Alias',
                                hintText: 'Ej: RollerPro2024',
                              ),
                              maxLength: 100,
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _passwordCtrl,
                              obscureText: true,
                              decoration: const InputDecoration(labelText: 'Contraseña'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _confirmPasswordCtrl,
                              obscureText: true,
                              decoration: const InputDecoration(labelText: 'Confirmar contraseña'),
                            ),
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
                                      Expanded(
                                        child: TextField(
                                          controller: _edadCtrl,
                                          keyboardType: TextInputType.number,
                                          decoration: const InputDecoration(labelText: 'Edad (>= 13)'),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: DropdownButtonFormField<String>(
                                          initialValue: _sexo,
                                          items: const [
                                            DropdownMenuItem(value: 'masculino', child: Text('Masculino')),
                                            DropdownMenuItem(value: 'femenino', child: Text('Femenino')),
                                            DropdownMenuItem(value: 'ambos', child: Text('Ambos')),
                                          ],
                                          onChanged: isLoading ? null : (v) => setState(() => _sexo = v ?? 'ambos'),
                                          decoration: const InputDecoration(labelText: 'Sexo'),
                                        ),
                                      ),
                                    ],
                                  );
                                }
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    TextField(
                                      controller: _edadCtrl,
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(labelText: 'Edad (>= 13)'),
                                    ),
                                    const SizedBox(height: 12),
                                    DropdownButtonFormField<String>(
                                      initialValue: _sexo,
                                      items: const [
                                        DropdownMenuItem(value: 'masculino', child: Text('Masculino')),
                                        DropdownMenuItem(value: 'femenino', child: Text('Femenino')),
                                        DropdownMenuItem(value: 'ambos', child: Text('Ambos')),
                                      ],
                                      onChanged: isLoading ? null : (v) => setState(() => _sexo = v ?? 'ambos'),
                                      decoration: const InputDecoration(labelText: 'Sexo'),
                                    ),
                                  ],
                                );
                              },
                            ),
                            const SizedBox(height: 12),
                            DropdownButtonFormField<String>(
                              initialValue: _nacionalidad,
                              items: const [
                                DropdownMenuItem(value: 'español', child: Text('Español')),
                                DropdownMenuItem(value: 'inglés', child: Text('Inglés')),
                              ],
                              onChanged: isLoading ? null : (v) => setState(() => _nacionalidad = v ?? 'español'),
                              decoration: const InputDecoration(labelText: 'Nacionalidad'),
                            ),
                            const SizedBox(height: 12),
                            DropdownButtonFormField<String>(
                              initialValue: _tipoPerfil,
                              items: const [
                                DropdownMenuItem(value: 'liderGrupo', child: Text('Líder de grupo')),
                                DropdownMenuItem(value: 'roller', child: Text('Roller')),
                              ],
                              onChanged: isLoading ? null : (v) => setState(() => _tipoPerfil = v ?? 'roller'),
                              decoration: const InputDecoration(labelText: 'Tipo de perfil'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _cumpleCtrl,
                              keyboardType: TextInputType.datetime,
                              decoration: const InputDecoration(
                                labelText: 'Cumpleaños',
                                hintText: 'DD/MM/YYYY (ej: 15/01/1990)',
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Tip: asegúrate de que Edad y Cumpleaños coincidan.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: const Color.fromRGBO(226, 232, 240, 0.72),
                                  ),
                            ),
                            const SizedBox(height: 12),
                            InputDecorator(
                              decoration: const InputDecoration(
                                labelText: 'Avatar (opcional)',
                                hintText: 'Selecciona un avatar',
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      _avatar.trim().isEmpty ? 'Sin avatar' : _avatar,
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                            color: const Color.fromRGBO(248, 250, 252, 0.92),
                                          ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  OutlinedButton(
                                    onPressed: isLoading
                                        ? null
                                        : () async {
                                            final picked = await showModalBottomSheet<String>(
                                              context: context,
                                              showDragHandle: true,
                                              builder: (context) {
                                                final options = const [
                                                  '',
                                                  'skate-pink',
                                                  'skate-blue',
                                                  'flame',
                                                  'star',
                                                ];
                                                return ListView(
                                                  padding: const EdgeInsets.all(12),
                                                  children: [
                                                    Text(
                                                      'Selecciona avatar',
                                                      style: Theme.of(context)
                                                          .textTheme
                                                          .titleMedium
                                                          ?.copyWith(fontWeight: FontWeight.w900),
                                                    ),
                                                    const SizedBox(height: 10),
                                                    ...options.map((o) {
                                                      final label = o.isEmpty ? 'Sin avatar' : o;
                                                      return Card(
                                                        child: ListTile(
                                                          title: Text(label),
                                                          trailing: _avatar == o
                                                              ? const Icon(Icons.check_circle_rounded)
                                                              : null,
                                                          onTap: () => Navigator.of(context).pop(o),
                                                        ),
                                                      );
                                                    }),
                                                  ],
                                                );
                                              },
                                            );
                                            if (picked == null) return;
                                            setState(() => _avatar = picked);
                                          },
                                    child: const Text('Cambiar'),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isLoading
                                    ? null
                                    : () async {
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
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.accent,
                                  foregroundColor: const Color(0xFFF8FAFC),
                                  side: const BorderSide(color: Color.fromRGBO(255, 62, 165, 0.45)),
                                ),
                                child: Text(isLoading ? 'Creando...' : 'Crear cuenta'),
                              ),
                            ),
                            TextButton(
                              onPressed: isLoading ? null : () => context.go('/login'),
                              child: const Text('Ya tengo cuenta (volver a login)'),
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


import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../auth/presentation/auth_controller.dart';

class AdminResetPasswordScreen extends ConsumerStatefulWidget {
  const AdminResetPasswordScreen({super.key});

  @override
  ConsumerState<AdminResetPasswordScreen> createState() => _AdminResetPasswordScreenState();
}

class _AdminResetPasswordScreenState extends ConsumerState<AdminResetPasswordScreen> {
  final _email = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final e = _email.text.trim().toLowerCase();
    if (!e.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Escribe un correo válido.')));
      return;
    }
    setState(() => _sending = true);
    try {
      final ok = await ref.read(authControllerProvider.notifier).forgotPassword(e);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ok ? 'Enviado (si existe el usuario).' : 'No se pudo enviar (SMTP/backend).')),
      );
      if (ok) _email.clear();
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Reset Password (Admin)',
      maxWidth: 820,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Envía correo de recuperación (requiere SMTP/back activo).'),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Correo del usuario', hintText: 'usuario@email.com'),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: _sending ? null : _send,
              child: Text(_sending ? 'Enviando…' : 'Enviar reset'),
            ),
          ),
        ],
      ),
    );
  }
}


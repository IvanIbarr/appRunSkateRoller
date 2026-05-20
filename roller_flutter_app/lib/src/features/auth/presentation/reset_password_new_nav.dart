import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'new_password_screen.dart';

/// Ir a nueva contraseña con query; sin [GoRouter] abre la pantalla vía [Navigator].
void authGoNewPassword(BuildContext context, String email) {
  final trimmed = email.trim();
  final q = trimmed.isEmpty ? '' : '?email=${Uri.encodeComponent(trimmed)}';
  final router = GoRouter.maybeOf(context);
  if (router != null) {
    context.go('/reset-password/new$q');
    return;
  }
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => NewPasswordScreen(email: trimmed.isEmpty ? null : trimmed),
    ),
  );
}

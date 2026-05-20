import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Si hay [GoRouter] activo usa rutas declarativas; si no, vuelve atrás con [Navigator].
void authGoLoginOrPop(BuildContext context) {
  final router = GoRouter.maybeOf(context);
  if (router != null) {
    context.go('/login');
  } else {
    Navigator.of(context, rootNavigator: true).maybePop();
  }
}

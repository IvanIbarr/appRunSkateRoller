import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Navegación segura: usa [GoRouter] si está disponible; si no, [Navigator].
void popOrGoCalendario(BuildContext context) {
  final g = GoRouter.maybeOf(context);
  if (g != null) {
    g.go('/calendario');
    return;
  }
  final nav = Navigator.maybeOf(context);
  if (nav?.canPop() == true) {
    nav!.pop();
  }
}

void popWithOptionalResult(BuildContext context, [Object? result]) {
  final g = GoRouter.maybeOf(context);
  if (g != null && g.canPop()) {
    g.pop(result);
    return;
  }
  final nav = Navigator.maybeOf(context);
  if (nav?.canPop() == true) {
    nav!.pop(result);
  }
}

Future<T?> pushVistaPreviaIfRouter<T extends Object?>(BuildContext context, Object extra) {
  final g = GoRouter.maybeOf(context);
  if (g != null) {
    return g.push<T>('/calendario/vista-previa', extra: extra);
  }
  return Future<T?>.value(null);
}

void popOneOrGoCalendario(BuildContext context) {
  final g = GoRouter.maybeOf(context);
  if (g != null && g.canPop()) {
    g.pop();
    return;
  }
  final nav = Navigator.maybeOf(context);
  if (nav?.canPop() == true) {
    nav!.pop();
    return;
  }
  popOrGoCalendario(context);
}

/// Atrás desde vista previa: [pop] con `false` o ir al calendario si no hay stack.
void popBackFromVistaPrevia(BuildContext context) {
  final g = GoRouter.maybeOf(context);
  if (g != null && g.canPop()) {
    g.pop(false);
    return;
  }
  final nav = Navigator.maybeOf(context);
  if (nav?.canPop() == true) {
    nav!.pop(false);
    return;
  }
  popOrGoCalendario(context);
}

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/l10n/app_locale.dart';
import '../data/auth_repository.dart';

class AuthController extends StateNotifier<AsyncValue<void>> {
  AuthController(this._repo, this._ref) : super(const AsyncData(null));

  final AuthRepository _repo;
  final Ref _ref;

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();
    try {
      final token = await _repo.login(email: email, password: password);
      await _ref.read(authSessionProvider.notifier).setToken(token);
      state = const AsyncData(null);
      return true;
    } catch (e, st) {
      var msg = e.toString().replaceFirst('Exception: ', '');
      if (msg.isEmpty || msg == e.runtimeType.toString()) {
        msg = 'No fue posible iniciar sesión';
      }
      state = AsyncError(msg, st);
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    state = const AsyncLoading();
    try {
      await _repo.forgotPassword(email);
      state = const AsyncData(null);
      return true;
    } catch (e, st) {
      var msg = e.toString().replaceFirst('Exception: ', '');
      if (msg.isEmpty || msg == e.runtimeType.toString()) {
        msg = 'No pudimos enviar el código. Verifica el correo e intenta nuevamente.';
      }
      state = AsyncError(msg, st);
      return false;
    }
  }

  Future<bool> registro({
    required String email,
    required String password,
    required String confirmPassword,
    required int edad,
    required String cumpleanosIso,
    required String sexo,
    required String nacionalidad,
    required String tipoPerfil,
    String? avatar,
    String? alias,
  }) async {
    state = const AsyncLoading();
    try {
      final token = await _repo.registro(
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        edad: edad,
        cumpleanosIso: cumpleanosIso,
        sexo: sexo,
        nacionalidad: nacionalidad,
        tipoPerfil: tipoPerfil,
        avatar: avatar,
      );
      await _ref.read(authSessionProvider.notifier).setToken(token);
      await _ref.read(appLocaleProvider.notifier).setFromNacionalidad(nacionalidad);
      if (alias != null && alias.trim().isNotEmpty) {
        try {
          await _repo.agregarAlias(alias);
        } catch (_) {
          // No bloqueamos el registro si falla alias.
        }
      }
      state = const AsyncData(null);
      return true;
    } catch (_) {
      state = AsyncError('No se pudo registrar', StackTrace.current);
      return false;
    }
  }

  Future<bool> resetPassword({
    required String email,
    required String code,
    required String password,
  }) async {
    state = const AsyncLoading();
    try {
      final resetToken = await _repo.verifyResetCode(email: email, code: code);
      await _repo.resetPassword(email: email, resetToken: resetToken, password: password);
      state = const AsyncData(null);
      return true;
    } catch (_) {
      state = AsyncError('No se pudo restablecer la contrasena', StackTrace.current);
      return false;
    }
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  return AuthController(ref.watch(authRepositoryProvider), ref);
});

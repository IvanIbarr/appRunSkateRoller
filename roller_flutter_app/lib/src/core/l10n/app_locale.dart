import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_locale_storage.dart';
import 'app_translations.dart';

class AppLocaleState {
  const AppLocaleState(this.locale);

  final Locale locale;

  String get languageCode => locale.languageCode;

  String t(String key) => AppTranslations.translate(languageCode, key);
}

class AppLocaleNotifier extends StateNotifier<AppLocaleState> {
  AppLocaleNotifier() : super(const AppLocaleState(Locale('es'))) {
    _load();
  }

  Future<void> _load() async {
    final saved = await AppLocaleStorage.read();
    if (saved == 'en') {
      state = const AppLocaleState(Locale('en'));
    } else if (saved == 'es') {
      state = const AppLocaleState(Locale('es'));
    }
  }

  Future<void> setLocale(Locale locale) async {
    final code = locale.languageCode == 'en' ? 'en' : 'es';
    await AppLocaleStorage.write(code);
    state = AppLocaleState(Locale(code));
  }

  Future<void> setFromNacionalidad(String nacionalidad) {
    final code = AppTranslations.localeCodeFromNacionalidad(nacionalidad);
    return setLocale(Locale(code));
  }
}

final appLocaleProvider =
    StateNotifierProvider<AppLocaleNotifier, AppLocaleState>((ref) {
  return AppLocaleNotifier();
});

/// Acceso rápido en widgets con [WidgetRef].
extension AppLocaleRefX on WidgetRef {
  String tr(String key) => watch(appLocaleProvider).t(key);
  Locale get appLocale => watch(appLocaleProvider).locale;
}

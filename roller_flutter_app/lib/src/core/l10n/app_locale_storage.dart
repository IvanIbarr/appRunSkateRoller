import 'app_locale_storage_native.dart'
    if (dart.library.html) 'app_locale_storage_web.dart' as platform;

abstract final class AppLocaleStorage {
  static Future<String?> read() => platform.readAppLocale();
  static Future<void> write(String code) => platform.writeAppLocale(code);
}

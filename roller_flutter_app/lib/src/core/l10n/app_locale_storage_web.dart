import 'dart:html' as html;

const _key = 'app_ui_locale';

Future<String?> readAppLocale() async {
  return html.window.localStorage[_key];
}

Future<void> writeAppLocale(String code) async {
  html.window.localStorage[_key] = code;
}

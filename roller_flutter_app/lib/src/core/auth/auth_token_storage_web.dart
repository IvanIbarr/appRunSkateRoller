import 'dart:html' as html;

const _tokenKey = 'auth_token';

Future<String?> readToken() async {
  return html.window.localStorage[_tokenKey];
}

Future<void> writeToken(String token) async {
  html.window.localStorage[_tokenKey] = token;
}

Future<void> deleteToken() async {
  html.window.localStorage.remove(_tokenKey);
}

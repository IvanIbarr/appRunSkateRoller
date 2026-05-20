import 'dart:html' as html;

bool isSecureBrowserContext() => html.window.isSecureContext ?? false;

/// Safari/Chrome en móvil solo exponen GPS en contexto seguro (HTTPS o localhost).
bool isLocationAvailableOnWeb() => isSecureBrowserContext();

import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_theme.dart';

/// Anotación tipo "@Preview" (Flutter no trae una oficial como Compose).
/// Sirve para localizar previews aislados por pantalla sin levantar la app completa.
class Preview {
  const Preview(this.name);
  final String name;
}

class PreviewViewport {
  const PreviewViewport({
    required this.name,
    required this.size,
    required this.devicePixelRatio,
  });

  final String name;
  final Size size;
  final double devicePixelRatio;

  static const iphone14 = PreviewViewport(
    name: 'iPhone 14/15',
    size: Size(390, 844),
    devicePixelRatio: 3.0,
  );

  static const desktop720p = PreviewViewport(
    name: 'Desktop 1280×720',
    size: Size(1280, 720),
    devicePixelRatio: 1.0,
  );
}

Widget _frame({
  required PreviewViewport viewport,
  required Widget child,
}) {
  return Container(
    width: viewport.size.width,
    height: viewport.size.height,
    decoration: BoxDecoration(
      color: AppTheme.bg,
      borderRadius: BorderRadius.circular(30),
      border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.18)),
      boxShadow: const [
        BoxShadow(
          color: Color.fromRGBO(0, 0, 0, 0.45),
          blurRadius: 36,
          offset: Offset(0, 18),
        ),
      ],
    ),
    clipBehavior: Clip.antiAlias,
    child: MediaQuery(
      data: MediaQueryData(
        size: viewport.size,
        devicePixelRatio: viewport.devicePixelRatio,
        textScaler: const TextScaler.linear(1.0),
        platformBrightness: Brightness.dark,
      ),
      child: SafeArea(
        child: Material(
          color: Colors.transparent,
          child: Theme(
            data: AppTheme.dark(),
            child: child,
          ),
        ),
      ),
    ),
  );
}

/// Wrapper consistente para previews.
Widget previewApp(Widget child, {String? title}) {
  const viewport = PreviewViewport.iphone14;

  // Root en MaterialApp para asegurar MaterialLocalizations (TextField, etc.)
  // y dentro simulamos look iPhone con Cupertino widgets.
  return ProviderScope(
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      title: title ?? 'Preview',
      theme: AppTheme.dark(),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('es'), Locale('en')],
      home: CupertinoTheme(
        data: const CupertinoThemeData(
          brightness: Brightness.dark,
          primaryColor: AppTheme.primaryBlue,
          barBackgroundColor: Color.fromRGBO(2, 6, 23, 0.90),
          scaffoldBackgroundColor: AppTheme.bg,
          textTheme: CupertinoTextThemeData(textStyle: TextStyle(color: Color(0xFFF8FAFC))),
        ),
        child: CupertinoPageScaffold(
          navigationBar: CupertinoNavigationBar(
            middle: Text(title ?? 'Preview'),
            backgroundColor: const Color.fromRGBO(2, 6, 23, 0.90),
          ),
          child: Container(
            color: const Color(0xFF0B1022),
            child: Center(child: _frame(viewport: viewport, child: child)),
          ),
        ),
      ),
    ),
  );
}

/// Preview con iPhone + Desktop lado a lado (ideal para Simple Browser).
Widget previewCompare({
  required Widget iphone,
  required Widget desktop,
  String title = 'Compare',
}) {
  return ProviderScope(
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      title: title,
      theme: AppTheme.dark(),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('es'), Locale('en')],
      home: CupertinoTheme(
        data: const CupertinoThemeData(
          brightness: Brightness.dark,
          primaryColor: AppTheme.primaryBlue,
          barBackgroundColor: Color.fromRGBO(2, 6, 23, 0.90),
          scaffoldBackgroundColor: AppTheme.bg,
          textTheme: CupertinoTextThemeData(textStyle: TextStyle(color: Color(0xFFF8FAFC))),
        ),
        child: CupertinoPageScaffold(
          navigationBar: CupertinoNavigationBar(
            middle: Text(title),
            backgroundColor: const Color.fromRGBO(2, 6, 23, 0.90),
          ),
          child: Container(
            color: const Color(0xFF0B1022),
            child: Center(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'iPhone 14/15 (390×844 @3x)',
                          style: TextStyle(color: Color(0xFFE2E8F0), fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        _frame(viewport: PreviewViewport.iphone14, child: iphone),
                      ],
                    ),
                    const SizedBox(width: 18),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Desktop (1280×720 @1x)',
                          style: TextStyle(color: Color(0xFFE2E8F0), fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        _frame(viewport: PreviewViewport.desktop720p, child: desktop),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}


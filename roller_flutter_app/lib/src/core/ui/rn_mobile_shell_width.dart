import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Ancho máximo del bloque móvil (chat + bottom nav) en web ancha.
const double kRnMobileShellMaxContentWidth = 480;

/// Web con viewport >= 600px: simular frame móvil centrado.
bool isRnWideWeb(BuildContext context) =>
    kIsWeb && MediaQuery.sizeOf(context).width >= 600;

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/core/ui/app_theme.dart';
import 'src/previews/auth_flow_previews.dart' as auth_flow;
import 'src/previews/chat_flow_previews.dart' as chat_flow;
import 'src/previews/component_catalog_previews.dart' as atoms;
import 'src/previews/chat_previews.dart' as chat;
import 'src/previews/login_previews.dart' as login;
import 'src/previews/marketing_flow_previews.dart' as marketing_flow;
import 'src/previews/menu_flow_previews.dart' as menu_flow;
import 'src/previews/recap_previews.dart' as recap;
import 'src/previews/rollertips_flow_previews.dart' as tips_flow;
import 'src/previews/ruta_flow_previews.dart' as ruta_flow;
import 'src/previews/ruta_previews.dart' as ruta;
import 'src/previews/screen_previews.dart' as screens;
import 'src/previews/historial_previews.dart' as historial;
import 'src/previews/calendario_previews.dart' as calendario;
import 'src/previews/rollertips_previews.dart' as tips;
import 'src/previews/marketing_previews.dart' as marketing;
import 'src/previews/menu_previews.dart' as menu;
import 'src/previews/admin_previews.dart' as admin;
import 'src/previews/register_real_previews.dart' as reg_real;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: PreviewLauncherApp()));
}

class PreviewLauncherApp extends StatelessWidget {
  const PreviewLauncherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Roller Previews',
      theme: AppTheme.dark(),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('es'),
        Locale('en'),
      ],
      home: const PreviewHome(),
    );
  }
}

class PreviewHome extends StatelessWidget {
  const PreviewHome({super.key});

  @override
  Widget build(BuildContext context) {
    final sections = <_PreviewSection>[
      _PreviewSection(
        title: 'Diseño (Átomos)',
        items: [
          (title: 'Catálogo · Átomos (iPhone)', build: atoms.previewAtomsCatalog),
          (title: 'Catálogo · Átomos (iPhone + Desktop)', build: atoms.previewAtomsCatalogCompare),
        ],
      ),
      _PreviewSection(
        title: 'Módulo Auth',
        items: [
          (title: 'Login (Principal) · Compare', build: login.previewLoginCompareMock),
          (title: 'Login (Mock simple) · Compare', build: auth_flow.previewAuthLoginCompare),
          (title: 'Registro REAL (pantalla) · Compare', build: reg_real.previewRegisterRealCompare),
          (title: 'Registro (Sub-pantalla) · Compare', build: auth_flow.previewAuthRegistroCompare),
          (title: 'Recuperar Contraseña / Olvidé · Compare', build: auth_flow.previewAuthForgotCompare),
          (title: 'Reset Contraseña (Sub-pantalla) · Compare', build: auth_flow.previewAuthResetCompare),
        ],
      ),
      _PreviewSection(
        title: 'Módulo Ruta',
        items: [
          (title: 'Configuración de Ruta (Principal) · Compare', build: ruta_flow.previewRutaConfigCompare),
          (title: 'Confirmación de Trayecto (Modal abierto) · Compare', build: ruta_flow.previewRutaConfirmCompare),
          (title: 'Viaje en Progreso (Tracking) · Compare', build: ruta_flow.previewRutaTrackingCompare),
          (title: 'Resumen de Recorrido Final · Compare', build: ruta_flow.previewRutaResumenCompare),
          (title: 'Ruta (Mock overlays legacy) · Compare', build: ruta.previewRutaCompareMock),
        ],
      ),
      _PreviewSection(
        title: 'Módulo Recap',
        items: [
          (title: 'Crear Recap (Principal) · Compare', build: recap.previewRecapCreateCompareMock),
          (title: 'Elegir plan · Compare', build: recap.previewRecapPlanCompareMock),
          (title: 'Tus datos · Compare', build: recap.previewRecapDatosCompareMock),
          (title: 'Revisión · Compare', build: recap.previewRecapRevisionCompareMock),
          (title: 'Pago · Compare', build: recap.previewRecapPagoCompareMock),
        ],
      ),
      _PreviewSection(
        title: 'Módulo Admin',
        items: [
          (title: 'Admin · Home · Compare', build: admin.previewAdminHomeCompare),
          (title: 'Admin · Home REAL (pantalla) · Compare', build: reg_real.previewAdminHomeRealCompare),
          (title: 'Admin · Usuarios · Compare', build: admin.previewAdminUsuariosCompare),
          (title: 'Admin · Chats · Compare', build: admin.previewAdminChatsCompare),
          (title: 'Admin · Ventas · Compare', build: admin.previewAdminVentasCompare),
          (title: 'Admin · Buzón · Compare', build: admin.previewAdminBuzonCompare),
          (title: 'Admin · Reset password · Compare', build: admin.previewAdminResetCompare),
        ],
      ),
      _PreviewSection(
        title: 'Módulo Chat',
        items: [
          (title: 'Chat · Thread (ChatThread.tsx 1:1) · Compare', build: chat_flow.previewChatThreadRnMirrorCompareMock),
          (title: 'Lista de chats · Compare', build: chat_flow.previewChatListCompareMock),
          (title: 'Chat individual (teclado cerrado) · Compare', build: chat_flow.previewChatDetailClosedCompareMock),
          (title: 'Chat individual (teclado abierto) · Compare', build: chat_flow.previewChatDetailOpenCompareMock),
          (title: 'Chat thread avanzado (emoji/adjunto UI) · Compare', build: chat_flow.previewChatAdvancedThreadCompareMock),
          (title: 'Chat (Mock) · Compare', build: chat.previewChatCompareMock),
        ],
      ),
      _PreviewSection(
        title: 'Pantallas reales (Riverpod + red; pueden mostrar error sin API)',
        items: [
          (title: 'Login (real)', build: screens.previewLogin),
          (title: 'Ruta / Inicio (real)', build: screens.previewRuta),
          (title: 'Chat (real)', build: screens.previewChat),
          (title: 'Historial (real)', build: screens.previewHistorial),
          (title: 'Calendario (real)', build: screens.previewCalendario),
          (title: 'RollerTips (real)', build: screens.previewRollerTips),
          (title: 'Marketing (real)', build: screens.previewMarketing),
          (title: 'Menú (real)', build: screens.previewMenu),
        ],
      ),
      _PreviewSection(
        title: 'Resto de pantallas (mocks compare)',
        items: [
          (title: 'Historial · Compare', build: historial.previewHistorialCompareMock),
          (title: 'Calendario · Compare', build: calendario.previewCalendarioCompareMock),
          (title: 'RollerTips · Compare', build: tips.previewRollerTipsCompareMock),
          (title: 'Marketing · Compare', build: marketing.previewMarketingCompareMock),
          (title: 'Menú · Compare', build: menu.previewMenuCompareMock),
        ],
      ),
      _PreviewSection(
        title: 'Sub-vistas extra (detectadas en RN)',
        items: [
          (title: 'RollerTips · Perfil · Compare', build: tips_flow.previewRollerTipsPerfilCompareMock),
          (title: 'RollerTips · Archivo · Compare', build: tips_flow.previewRollerTipsArchivoCompareMock),
          (title: 'Marketing · Vender Step 1 · Compare', build: marketing_flow.previewMarketingVenderStep1CompareMock),
          (title: 'Marketing · Vender Step 3 · Compare', build: marketing_flow.previewMarketingVenderStep3CompareMock),
          (title: 'Marketing · Vender Step 4 · Compare', build: marketing_flow.previewMarketingVenderStep4CompareMock),
          (title: 'Marketing · Comprar Envío · Compare', build: marketing_flow.previewMarketingComprarEnvioCompareMock),
          (title: 'Marketing · Comprar Revisión · Compare', build: marketing_flow.previewMarketingComprarRevisionCompareMock),
          (title: 'Marketing · Comprar Pago · Compare', build: marketing_flow.previewMarketingComprarPagoCompareMock),
          (title: 'Menú · Grupo · Compare', build: menu_flow.previewMenuGrupoCompareMock),
          (title: 'Menú · Suscripciones · Compare', build: menu_flow.previewMenuSuscripcionesCompareMock),
          (title: 'Menú · Admin · Compare', build: menu_flow.previewMenuAdminCompareMock),
          (title: 'Menú · Comunidad · Compare', build: menu_flow.previewMenuComunidadCompareMock),
          (title: 'Menú · Cambiar Alias · Compare', build: menu_flow.previewMenuCambiarAliasCompareMock),
        ],
      ),
      _PreviewSection(
        title: 'Legacy',
        items: [
          (title: 'Screens Mock (legacy)', build: screens.previewMockLogin),
        ],
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Previews')),
      body: ListView.builder(
        padding: const EdgeInsets.all(14),
        itemCount: sections.length,
        itemBuilder: (context, s) {
          final section = sections[s];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: ExpansionTile(
                title: Text(section.title, style: const TextStyle(fontWeight: FontWeight.w900)),
                childrenPadding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
                children: [
                  ...section.items.map((it) {
                    return Card(
                      child: ListTile(
                        title: Text(it.title),
                        trailing: const Icon(Icons.chevron_right_rounded),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => it.build(),
                            ),
                          );
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

typedef _PreviewItem = ({String title, Widget Function() build});

class _PreviewSection {
  _PreviewSection({required this.title, required this.items});
  final String title;
  final List<_PreviewItem> items;
}


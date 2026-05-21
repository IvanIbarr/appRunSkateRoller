import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import 'core/auth/auth_session.dart';
import 'core/l10n/app_locale.dart';
import 'core/ui/app_theme.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/register_screen.dart';
import 'features/auth/presentation/reset_password_screen.dart';
import 'features/auth/presentation/new_password_screen.dart';
import 'features/shell/presentation/app_shell.dart';
import 'features/historial/presentation/historial_screen.dart';
import 'features/calendario/presentation/calendario_screen.dart';
import 'features/chat/presentation/chat_screen.dart';
import 'features/rollertips/presentation/rollertips_screen.dart';
import 'features/perfil/presentation/perfil_screen.dart';
import 'features/ruta/presentation/ruta_screen.dart';
import 'features/marketing/presentation/marketing_screen.dart';
import 'features/marketing/models/marketing_checkout_draft.dart';
import 'features/marketing/models/marketing_sell_draft.dart';
import 'features/marketing/presentation/marketing_comprar_envio_screen.dart';
import 'features/marketing/presentation/marketing_comprar_pago_screen.dart';
import 'features/marketing/presentation/marketing_comprar_revision_screen.dart';
import 'features/marketing/presentation/marketing_sell_step1_screen.dart';
import 'features/marketing/presentation/marketing_sell_step2_screen.dart';
import 'features/marketing/presentation/marketing_sell_step4_screen.dart';
import 'features/menu/presentation/menu_screen.dart';
import 'features/menu/presentation/informacion_personal_screen.dart';
import 'features/menu/presentation/menu_admin_screen.dart';
import 'features/menu/presentation/menu_grupo_screen.dart';
import 'features/menu/presentation/menu_suscripciones_screen.dart';
import 'features/recap/models/recap_checkout_draft.dart';
import 'features/recap/models/recap_input.dart';
import 'features/recap/presentation/recap_checkout_datos_screen.dart';
import 'features/recap/presentation/recap_checkout_pago_screen.dart';
import 'features/recap/presentation/recap_checkout_plan_screen.dart';
import 'features/recap/presentation/recap_checkout_revision_screen.dart';
import 'features/recap/presentation/recap_create_screen.dart';
import 'features/alias/presentation/agregar_alias_screen.dart';
import 'features/alias/presentation/cambiar_alias_screen.dart';
import 'features/grupo/presentation/nombre_grupo_screen.dart';
import 'features/grupo/presentation/integrantes_grupo_screen.dart';
import 'features/support/presentation/support_help_screen.dart';
import 'features/comunidad/presentation/comunidad_screen.dart';
import 'features/calendario/models/evento_draft.dart';
import 'features/calendario/presentation/crear_evento_screen.dart';
import 'features/calendario/presentation/vista_previa_evento_screen.dart';
import 'features/calendario/data/evento_realtime_bootstrap.dart';
import 'features/admin/presentation/admin_home_screen.dart';
import 'features/admin/presentation/admin_buzon_screen.dart';
import 'features/admin/presentation/admin_chats_screen.dart';
import 'features/admin/presentation/admin_reset_password_screen.dart';
import 'features/admin/presentation/admin_usuarios_screen.dart';
import 'features/admin/presentation/admin_ventas_screen.dart';
import 'features/chat/presentation/chat_list_screen.dart';
import 'features/chat/presentation/chat_thread_screen.dart';

final _routerProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(authSessionProvider);
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/reset-password' ||
          state.matchedLocation == '/reset-password/new';

      final isLoading = session.isLoading;
      final isAuthed = session.valueOrNull != null;

      if (isLoading) {
        return null;
      }

      final seguimientoQ = state.uri.queryParameters['seguimiento']?.trim() ?? '';
      final inicioSpectador =
          (state.uri.path == '/inicio' || state.matchedLocation == '/inicio') && seguimientoQ.isNotEmpty;

      if (!isAuthed && !loggingIn) {
        if (inicioSpectador) {
          return null;
        }
        return '/login';
      }

      if (isAuthed && loggingIn) {
        return '/inicio';
      }

      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: '/',
        redirect: (context, state) {
          final seg = state.uri.queryParameters['seguimiento']?.trim() ?? '';
          if (seg.isNotEmpty) {
            return '/inicio?seguimiento=${Uri.encodeQueryComponent(seg)}';
          }
          return '/inicio';
        },
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password/new',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'];
          return NewPasswordScreen(email: email);
        },
      ),
      GoRoute(
        path: '/alias/agregar',
        builder: (context, state) => const AgregarAliasScreen(),
      ),
      GoRoute(
        path: '/alias/cambiar',
        builder: (context, state) => const CambiarAliasScreen(),
      ),
      GoRoute(
        path: '/grupo/nombre',
        builder: (context, state) => const NombreGrupoScreen(),
      ),
      GoRoute(
        path: '/grupo/integrantes',
        builder: (context, state) => const IntegrantesGrupoScreen(),
      ),
      GoRoute(
        path: '/soporte',
        builder: (context, state) => const SupportHelpScreen(),
      ),
      GoRoute(
        path: '/comunidad',
        builder: (context, state) => const ComunidadScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminHomeScreen(),
      ),
      GoRoute(
        path: '/admin/usuarios',
        builder: (context, state) => const AdminUsuariosScreen(),
      ),
      GoRoute(
        path: '/admin/chats',
        builder: (context, state) => const AdminChatsScreen(),
      ),
      GoRoute(
        path: '/admin/ventas',
        builder: (context, state) => const AdminVentasScreen(),
      ),
      GoRoute(
        path: '/admin/buzon',
        builder: (context, state) => const AdminBuzonScreen(),
      ),
      GoRoute(
        path: '/admin/reset-password',
        builder: (context, state) => const AdminResetPasswordScreen(),
      ),
      GoRoute(
        path: '/chat/list',
        builder: (context, state) => const ChatListScreen(),
      ),
      GoRoute(
        path: '/chat/thread',
        builder: (context, state) {
          final chatType = (state.extra ?? 'general').toString();
          return ChatThreadScreen(chatType: chatType);
        },
      ),
        GoRoute(
        path: '/recap/crear',
        builder: (context, state) {
          final raw = state.extra;
          RecapInput? parsed;
          if (raw is RecapInput) {
            parsed = raw.normalized();
          }
          final demo = RecapInput(
            route: const [
              LatLng(19.4326, -99.1332),
              LatLng(19.4370, -99.1280),
              LatLng(19.4400, -99.1220),
              LatLng(19.4440, -99.1180),
            ],
            distanceMeters: 3200,
            durationSeconds: 980,
          ).normalized();
          return RecapCreateScreen(input: parsed ?? demo);
        },
      ),
      GoRoute(
        path: '/recap/plan',
        builder: (context, state) => const RecapCheckoutPlanScreen(),
      ),
      GoRoute(
        path: '/menu/informacion-personal',
        builder: (context, state) => const InformacionPersonalScreen(),
      ),
      GoRoute(
        path: '/menu/grupo',
        builder: (context, state) => const MenuGrupoScreen(),
      ),
      GoRoute(
        path: '/menu/suscripciones',
        builder: (context, state) => const MenuSuscripcionesScreen(),
      ),
      GoRoute(
        path: '/menu/admin',
        builder: (context, state) => const MenuAdminScreen(),
      ),
      GoRoute(
        path: '/marketing/vender',
        builder: (context, state) => const MarketingSellStep1Screen(),
      ),
      GoRoute(
        path: '/marketing/vender/step2',
        builder: (context, state) {
          final draft = state.extra as MarketingSellDraft?;
          if (draft == null) return const MarketingSellStep1Screen();
          return MarketingSellStep2Screen(draft: draft);
        },
      ),
      GoRoute(
        path: '/marketing/vender/step3',
        builder: (context, state) {
          final draft = state.extra as MarketingSellDraft?;
          if (draft != null) return MarketingSellStep2Screen(draft: draft);
          return const MarketingSellStep1Screen();
        },
      ),
      GoRoute(
        path: '/marketing/vender/step4',
        builder: (context, state) {
          final draft = state.extra as MarketingSellDraft?;
          if (draft == null) return const MarketingSellStep1Screen();
          return MarketingSellStep4Screen(draft: draft);
        },
      ),
      GoRoute(
        path: '/marketing/comprar/envio',
        builder: (context, state) {
          final draft = state.extra as MarketingCheckoutDraft?;
          if (draft == null) return const MarketingScreen();
          return MarketingComprarEnvioScreen(draft: draft);
        },
      ),
      GoRoute(
        path: '/marketing/comprar/revision',
        builder: (context, state) {
          final draft = state.extra as MarketingCheckoutDraft?;
          if (draft == null) return const MarketingScreen();
          return MarketingComprarRevisionScreen(draft: draft);
        },
      ),
      GoRoute(
        path: '/marketing/comprar/pago',
        builder: (context, state) {
          final draft = state.extra as MarketingCheckoutDraft?;
          if (draft == null) return const MarketingScreen();
          return MarketingComprarPagoScreen(draft: draft);
        },
      ),
      GoRoute(
        path: '/recap/datos',
        builder: (context, state) {
          final draft = state.extra as RecapCheckoutDraft?;
          if (draft == null) {
            return const RecapCheckoutPlanScreen();
          }
          return RecapCheckoutDatosScreen(draft: draft);
        },
      ),
      GoRoute(
        path: '/recap/revision',
        builder: (context, state) {
          final draft = state.extra as RecapCheckoutDraft?;
          if (draft == null) {
            return const RecapCheckoutPlanScreen();
          }
          return RecapCheckoutRevisionScreen(draft: draft);
        },
      ),
      GoRoute(
        path: '/recap/pago',
        builder: (context, state) {
          final draft = state.extra as RecapCheckoutDraft?;
          if (draft == null) {
            return const RecapCheckoutPlanScreen();
          }
          return RecapCheckoutPagoScreen(draft: draft);
        },
      ),
      StatefulShellRoute(
        navigatorContainerBuilder: rollerStatefulShellNavigatorContainer,
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/inicio',
                builder: (context, state) {
                  final seg = state.uri.queryParameters['seguimiento']?.trim();
                  return RutaScreen(spectadorInicialId: seg == null || seg.isEmpty ? null : seg);
                },
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/marketing',
                builder: (context, state) => const MarketingScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/historial',
                builder: (context, state) => const HistorialScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/calendario',
                builder: (context, state) => const CalendarioScreen(),
                routes: [
                  GoRoute(
                    path: 'crear',
                    builder: (context, state) {
                      Map<String, dynamic>? ev;
                      var edicion = false;
                      final ex = state.extra;
                      if (ex is Map) {
                        final raw = ex['evento'];
                        if (raw is Map) {
                          ev = Map<String, dynamic>.from(raw);
                        }
                        edicion = ex['esEdicion'] == true;
                      }
                      return CrearEventoScreen(
                        eventoParaEditar: ev,
                        esEdicion: edicion,
                      );
                    },
                  ),
                  GoRoute(
                    path: 'vista-previa',
                    builder: (context, state) {
                      final draft = state.extra as EventoDraft?;
                      if (draft == null) {
                        return const CalendarioScreen();
                      }
                      return VistaPreviaEventoScreen(draft: draft);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/chat',
                builder: (context, state) => const ChatScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/rollertips',
                builder: (context, state) => const RollerTipsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/perfil',
                builder: (context, state) => const PerfilScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/menu',
                builder: (context, state) => const MenuScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class RollerApp extends ConsumerWidget {
  const RollerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authSessionProvider);
    final router = ref.watch(_routerProvider);
    final appLocale = ref.watch(appLocaleProvider);
    ref.watch(eventoRealtimeBootstrapProvider);
    return MaterialApp.router(
      title: 'RunSkateRoller',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      locale: appLocale.locale,
      scaffoldMessengerKey: eventoReminderMessengerKey,
      routerConfig: router,
      builder: (context, child) {
        if (session.isLoading) {
          return const ColoredBox(
            color: Color(0xFF0A0A0F),
            child: Center(
              child: CircularProgressIndicator(color: Color(0xFF00E5FF)),
            ),
          );
        }
        return child ?? const SizedBox.shrink();
      },
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('es'),
        Locale('en'),
      ],
    );
  }
}

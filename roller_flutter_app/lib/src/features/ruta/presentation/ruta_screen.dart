import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show ImageFilter;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kDebugMode, kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/l10n/app_locale.dart';
import '../../../core/location/device_location.dart';
import '../../../core/maps/mapbox_service.dart';
import '../../../core/ui/app_theme.dart';
import '../../../core/ui/rn_layered_styles.dart';
import '../../../core/ui/rn_mirror_layouts.dart';
import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import '../../../core/auth/staff_chat_access.dart';
import '../../historial/data/historial_providers.dart';
import '../../perfil/data/perfil_providers.dart';
import '../../recap/models/recap_input.dart';
import '../../seguimiento/data/seguimiento_repository.dart';
import 'widgets/ruta_compartir_sheet.dart';
import 'widgets/ruta_skate_marker.dart';

enum RutaToastKind { success, danger, neutral }

enum _PickField { origen, destino }

class _PendingPick {
  _PendingPick({required this.field, required this.label, required this.lng, required this.lat});

  final _PickField field;
  final String label;
  final double lng;
  final double lat;
}

class RutaScreen extends ConsumerStatefulWidget {
  const RutaScreen({super.key, this.spectadorInicialId});

  /// `?seguimiento=` al abrir `/inicio` (enlace compartido “Sígueme”).
  final String? spectadorInicialId;

  @override
  ConsumerState<RutaScreen> createState() => _RutaScreenState();
}

class _RutaScreenState extends ConsumerState<RutaScreen> {
  final _origenCtrl = TextEditingController();
  final _destinoCtrl = TextEditingController();

  final _focusOrigen = FocusNode();
  final _focusDestino = FocusNode();

  Timer? _debounce;
  StreamSubscription<Position>? _posSub;

  List<MapboxSuggestion> _sugOrigen = [];
  List<MapboxSuggestion> _sugDestino = [];

  _PendingPick? _confirmPick;
  List<double>? _originCoordsLngLat;
  List<double>? _destinationCoordsLngLat;
  LatLng? _userLatLng;

  bool _gpsLoading = false;
  bool _calculando = false;
  bool _routeRequested = false;

  List<LatLng> _routePts = [];
  double? _distanceM;
  double? _durSec;

  bool _tracking = false;
  String? _seguimientoId;
  /// Evita repetir snackbar cuando sugerencias devuelve [] por 401/403.
  bool _warnedMapboxSuggestionsAuth = false;
  bool _warnedMapboxTokenMissing = false;
  bool _warnedMapboxOfficialExampleRn = false;
  final List<LatLng> _trail = [];
  DateTime? _trackingStartMs;
  int? _lastPushMs;
  LatLng? _lastPushPt;

  /// Espectador vía enlace `?seguimiento=` (misma API que RN).
  bool _spectadorUrlHandled = false;
  bool _spectadorActivo = false;
  String? _spectadorIdEnCurso;
  String? _spectadorAlias;
  List<LatLng> _spectadorPts = [];
  Timer? _spectadorPoll;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      if (_origenCtrl.text.trim().isEmpty) {
        await _obtenerGps(origenSilent: true);
      }
      if (!mounted) return;
      final deep = widget.spectadorInicialId?.trim();
      if (deep != null && deep.isNotEmpty) {
        await _abrirSeguimientoDesdeUrl(deep);
      }
    });
    _focusOrigen.addListener(_onFocusOrig);
    _focusDestino.addListener(_onFocusDest);
  }

  /// Campo táctil compacto (54–56 px) con icono de contexto.
  Widget _rutaInput({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hint,
    required IconData prefixIcon,
    required ValueChanged<String> onChanged,
    VoidCallback? onTap,
    ValueChanged<String>? onSubmitted,
  }) {
    return SizedBox(
      height: 56,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 15, height: 1.25),
        textAlignVertical: TextAlignVertical.center,
        decoration: RnLayeredStyles.rutaTextField(
          hintText: hint,
          prefixIcon: Icon(prefixIcon, size: 20, color: const Color(0xFF64748B)),
        ),
        onTap: onTap,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
      ),
    );
  }

  /// Encabezado encima del campo (estilo RN label blanco legible sobre el panel).
  Widget _rutaFieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 4),
      child: Text(
        text,
        style: TextStyle(
          color: const Color(0xFFF8FAFC),
          fontSize: 13,
          fontWeight: FontWeight.w800,
          shadows: const [
            Shadow(offset: Offset(1, 1), blurRadius: 3, color: Color(0xBF000000)),
          ],
        ),
      ),
    );
  }

  bool get _showOrigenSug {
    final q = _origenCtrl.text.trim().length;
    if (q < 3 || _focusDestino.hasFocus) return false;
    return _focusOrigen.hasFocus || _sugOrigen.isNotEmpty;
  }

  bool get _showDestSug {
    final q = _destinoCtrl.text.trim().length;
    if (q < 3 || _focusOrigen.hasFocus) return false;
    return _focusDestino.hasFocus || _sugDestino.isNotEmpty;
  }

  void _onFocusOrig() {
    if (_focusOrigen.hasFocus) {
      setState(() => _sugDestino = []);
    }
  }

  void _onFocusDest() {
    if (_focusDestino.hasFocus) {
      setState(() => _sugOrigen = []);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _posSub?.cancel();
    _spectadorPoll?.cancel();
    _origenCtrl.dispose();
    _destinoCtrl.dispose();
    _focusOrigen.dispose();
    _focusDestino.dispose();
    super.dispose();
  }

  double? _parseCoord(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  void _applySpectatorPayload(Map<String, dynamic> data) {
    final o = data['origen'];
    if (o is String && o.trim().isNotEmpty) {
      _origenCtrl.text = o.trim();
    }
    final d = data['destino'];
    if (d is String && d.trim().isNotEmpty) {
      _destinoCtrl.text = d.trim();
    }
    final rawPts = data['puntos'];
    final next = <LatLng>[];
    if (rawPts is List) {
      for (final p in rawPts) {
        if (p is! Map) continue;
        final lat = _parseCoord(p['latitud']);
        final lng = _parseCoord(p['longitud']);
        if (lat != null && lng != null) next.add(LatLng(lat, lng));
      }
    }
    setState(() => _spectadorPts = next);
  }

  bool _sesionAutenticada() => ref.read(authSessionProvider).valueOrNull != null;

  /// Tras fallo / cancelación de enlace Sígueme: invitado → login; usuario → inicio limpio.
  void _navegarTrasCancelarEspectador() {
    if (!mounted) return;
    if (_sesionAutenticada()) {
      context.go('/inicio');
    } else {
      context.go('/login');
    }
  }

  void _salirModoEspectador() {
    _spectadorPoll?.cancel();
    _spectadorPoll = null;
    setState(() {
      _spectadorActivo = false;
      _spectadorIdEnCurso = null;
      _spectadorAlias = null;
      _spectadorPts = [];
    });
    if (!mounted) return;
    if (_sesionAutenticada()) {
      context.go('/inicio');
    } else {
      context.go('/login');
    }
  }

  Future<void> _abrirSeguimientoDesdeUrl(String id) async {
    if (_spectadorUrlHandled) return;

    if (_tracking) {
      _spectadorUrlHandled = true;
      _toast('Ya tienes un recorrido activo en este dispositivo.', kind: RutaToastKind.neutral);
      _navegarTrasCancelarEspectador();
      return;
    }

    Map<String, dynamic> first;
    try {
      first = await ref.read(seguimientoRepositoryProvider).fetchPublic(id);
    } catch (_) {
      _spectadorUrlHandled = true;
      if (mounted) {
        _toast('No se pudo cargar el recorrido compartido.', kind: RutaToastKind.danger);
        _navegarTrasCancelarEspectador();
      }
      return;
    }

    final aliasRaw =
        first['alias'] ?? first['usuario_alias'] ?? (first['usuario'] is Map ? (first['usuario'] as Map)['alias'] : null);
    final alias = aliasRaw is String && aliasRaw.trim().isNotEmpty ? aliasRaw.trim() : null;

    if (!mounted) return;
    final label = alias ?? 'este usuario';
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Sígueme'),
        content: Text('¿Quieres seguir en tiempo real a $label en su recorrido?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sí')),
        ],
      ),
    );

    if (!mounted) return;
    if (ok != true) {
      _spectadorUrlHandled = true;
      _navegarTrasCancelarEspectador();
      return;
    }

    _spectadorUrlHandled = true;
    setState(() {
      _spectadorActivo = true;
      _spectadorIdEnCurso = id;
      _spectadorAlias = alias;
    });
    _applySpectatorPayload(first);
    // Importante: no quitar `?seguimiento=` con un `go('/inicio')` aquí: si el visitante no
    // tiene sesión, el redirect global lo mandaría a /login y perdería el mapa en vivo.

    _spectadorPoll?.cancel();
    _spectadorPoll = Timer.periodic(const Duration(seconds: 2), (_) async {
      final cur = _spectadorIdEnCurso;
      if (cur == null || !mounted) return;
      try {
        final fresh = await ref.read(seguimientoRepositoryProvider).fetchPublic(cur);
        if (!mounted) return;
        _applySpectatorPayload(fresh);
        if (fresh['activo'] == false) {
          _toast('El recorrido terminó.', kind: RutaToastKind.danger);
          _salirModoEspectador();
        }
      } catch (_) {
        // Polling silencioso (red intermitente).
      }
    });
  }

  String? get _proximity {
    final u = _userLatLng;
    if (u == null) return null;
    return '${u.longitude},${u.latitude}';
  }

  void _toast(
    String msg, {
    RutaToastKind kind = RutaToastKind.neutral,
    bool skateStart = false,
  }) {
    final m = ScaffoldMessenger.maybeOf(context);
    if (m == null || !mounted) return;

    final borderColor = switch (kind) {
      RutaToastKind.success => const Color(0xFF00FF7F),
      RutaToastKind.danger => const Color(0xFFFF4A5A),
      RutaToastKind.neutral => const Color(0xFF38BDF8),
    };
    final iconGlow = borderColor.withValues(alpha: 0.45);

    IconData dangerIcon() {
      final lower = msg.toLowerCase();
      if (lower.contains('finalizado')) return LucideIcons.flag;
      return LucideIcons.alertCircle;
    }

    Widget leadingIcon() {
      if (skateStart && kind == RutaToastKind.success) {
        return Text(
          '🛼',
          style: TextStyle(
            fontSize: 22,
            height: 1,
            shadows: [
              Shadow(color: borderColor.withValues(alpha: 0.85), blurRadius: 10, offset: Offset.zero),
            ],
          ),
        );
      }
      final IconData icon = switch (kind) {
        RutaToastKind.success => LucideIcons.checkCircle,
        RutaToastKind.danger => dangerIcon(),
        RutaToastKind.neutral => LucideIcons.info,
      };
      return Icon(icon, size: 22, color: borderColor, shadows: [Shadow(color: iconGlow, blurRadius: 8)]);
    }

    final display = msg.trim().toUpperCase();
    final duration = Duration(seconds: msg.length > 110 ? 4 : 3);

    m.hideCurrentSnackBar();
    m.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        backgroundColor: Colors.transparent,
        padding: EdgeInsets.zero,
        margin: EdgeInsets.fromLTRB(
          14,
          0,
          14,
          RnBottomNavigationSlot.reservedBottomInset(context) + 14,
        ),
        duration: duration,
        content: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeOutCubic,
          builder: (context, t, _) {
            return Opacity(
              opacity: t.clamp(0.0, 1.0),
              child: Transform.translate(
                offset: Offset(0, (1 - t) * 22),
                child: Transform.scale(
                  scale: 0.94 + 0.06 * t,
                  alignment: Alignment.center,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: const Color(0xEE0D1117),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: borderColor, width: 1.5),
                          boxShadow: [
                            BoxShadow(color: borderColor.withValues(alpha: 0.22), blurRadius: 18, spreadRadius: 0),
                            const BoxShadow(color: Color(0x66000000), blurRadius: 24, offset: Offset(0, 10)),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(padding: const EdgeInsets.only(top: 1), child: leadingIcon()),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  display,
                                  maxLines: 5,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.orbitron(
                                    fontSize: 14,
                                    height: 1.35,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.65,
                                    color: Colors.white,
                                    shadows: const [
                                      Shadow(offset: Offset(0, 1), blurRadius: 6, color: Color(0xBF000000)),
                                    ],
                                  ),
                                ),
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
          },
        ),
      ),
    );
  }

  void _debounceSuggestions(void Function() fn) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 260), fn);
  }

  Future<void> _loadSuggestions(bool origen) async {
    final q = (origen ? _origenCtrl : _destinoCtrl).text.trim();
    if (q.length < 3) {
      setState(() {
        if (origen) {
          _sugOrigen = [];
        } else {
          _sugDestino = [];
        }
      });
      return;
    }
    if (MapboxService.explicitOfficialExampleConfigured()) {
      if (!mounted) return;
      setState(() {
        if (origen) {
          _sugOrigen = [];
        } else {
          _sugDestino = [];
        }
      });
      if (!_warnedMapboxOfficialExampleRn) {
        _warnedMapboxOfficialExampleRn = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _toast(
            'Mapbox: estás usando el token de ejemplo oficial (EXAMPLE_TOKEN de RN): no sirve para Places/Directions. '
            'Pon tu pk. en `.env` en la raíz de `roller_flutter_app` o en `--dart-define`.',
            kind: RutaToastKind.danger,
          );
        });
      }
      return;
    }
    if (MapboxService.token.trim().isEmpty) {
      if (!mounted) return;
      setState(() {
        if (origen) {
          _sugOrigen = [];
        } else {
          _sugDestino = [];
        }
      });
      if (!_warnedMapboxTokenMissing) {
        _warnedMapboxTokenMissing = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _toast(
            kIsWeb
                ? 'Sin token Mapbox no hay sugerencias. ${MapboxService.configUserHint}'
                : 'Sin token Mapbox no hay sugerencias. Añade `REACT_APP_MAPBOX_ACCESS_TOKEN` o `MAPBOX_ACCESS_TOKEN` '
                    'en `.env` (véase `.env.example`), `assets/dotenv/mapbox_env.env`, o `--dart-define`.',
            kind: RutaToastKind.danger,
          );
        });
      }
      return;
    }
    try {
      final list = await MapboxService.suggestions(q, proximityLngLat: _proximity);
      if (!mounted) return;
      setState(() {
        if (origen) {
          _sugOrigen = list;
        } else {
          _sugDestino = list;
        }
      });
      if (MapboxService.suggestionRequestWasUnauthorized && !_warnedMapboxSuggestionsAuth && mounted) {
        _warnedMapboxSuggestionsAuth = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _toast(
            'Mapbox bloqueó sugerencias (401/403). Revisa tu pk. en cuenta.mapbox.com; '
            'o configúralo en `.env`, `assets/dotenv/mapbox_env.env`, o `--dart-define`.',
            kind: RutaToastKind.danger,
          );
        });
      }
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        if (origen) {
          _sugOrigen = [];
        } else {
          _sugDestino = [];
        }
      });
      final code = e.response?.statusCode;
      if (code == 403 || code == 401) {
        _toast(
          'Mapbox bloqueó sugerencias ($code). Usa --dart-define=MAPBOX_ACCESS_TOKEN=pk...',
          kind: RutaToastKind.danger,
        );
      } else if (kDebugMode) {
        _toast('Mapbox sugerencias: ${e.message}', kind: RutaToastKind.neutral);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (origen) {
          _sugOrigen = [];
        } else {
          _sugDestino = [];
        }
      });
    }
  }

  Future<void> _obtenerGps({required bool origenSilent}) async {
    setState(() => _gpsLoading = true);
    try {
      final access = await DeviceLocation.ensureForTracking();
      if (!access.ok) {
        if (!origenSilent && mounted) {
          _toast(access.message ?? 'Sin permiso GPS.', kind: RutaToastKind.danger);
        }
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final ll = LatLng(pos.latitude, pos.longitude);
      if (!mounted) return;
      setState(() {
        _userLatLng = ll;
        _origenCtrl.text = 'Mi ubicación actual';
        _originCoordsLngLat = [pos.longitude, pos.latitude];
      });
    } catch (e) {
      if (!origenSilent && mounted) {
        _toast('No se obtuvo ubicación: $e', kind: RutaToastKind.danger);
      }
    } finally {
      if (mounted) setState(() => _gpsLoading = false);
    }
  }

  void _limpiaRutaPorCampos() {
    if (_origenCtrl.text.trim().isEmpty || _destinoCtrl.text.trim().isEmpty) {
      setState(() {
        _routeRequested = false;
        _routePts = [];
        _distanceM = null;
        _durSec = null;
        _confirmPick = null;
      });
    }
  }

  Future<void> _calcular() async {
    if (_confirmPick != null) {
      _toast('Primero confirma o cambia el punto seleccionado.', kind: RutaToastKind.neutral);
      return;
    }
    final o = _origenCtrl.text.trim();
    final d = _destinoCtrl.text.trim();
    if ((o.isEmpty && _originCoordsLngLat == null) || d.isEmpty) {
      _toast('Ingresa origen y destino.', kind: RutaToastKind.neutral);
      return;
    }
    if (MapboxService.token.isEmpty) {
      _toast(MapboxService.calcularTokenSnackMessage, kind: RutaToastKind.danger);
      return;
    }
    setState(() {
      _calculando = true;
      _routeRequested = true;
      _routePts = [];
      _distanceM = null;
      _durSec = null;
    });
    try {
      final res = await MapboxService.cyclingRoute(
        originText: o,
        destText: d,
        originCoordsLngLat: _originCoordsLngLat,
        destinationCoordsLngLat: _destinationCoordsLngLat,
      );
      final pts = res.coordinates.map((e) => LatLng(e[1], e[0])).toList();
      if (!mounted) return;
      setState(() {
        _routePts = pts;
        _distanceM = res.distanceMeters;
        _durSec = res.durationSeconds;
      });
    } catch (e) {
      if (!mounted) return;
      _toast('$e', kind: RutaToastKind.danger);
      setState(() {
        _routeRequested = false;
        _routePts = [];
        _distanceM = null;
        _durSec = null;
      });
    } finally {
      if (mounted) setState(() => _calculando = false);
    }
  }

  double _harvesineM(LatLng a, LatLng b) {
    const R = 6371000.0;
    double rad(double x) => x * math.pi / 180;
    final dLat = rad(b.latitude - a.latitude);
    final dLng = rad(b.longitude - a.longitude);
    final la1 = rad(a.latitude);
    final la2 = rad(b.latitude);
    final h =
        math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(la1) * math.cos(la2) * math.sin(dLng / 2) * math.sin(dLng / 2);
    return 2 * R * math.asin(math.min(1, math.sqrt(h)));
  }

  Future<void> _pushPuntoSiToca(double lat, double lng) async {
    final id = _seguimientoId;
    if (id == null || id.isEmpty) return;

    final now = DateTime.now().millisecondsSinceEpoch;
    final pt = LatLng(lat, lng);
    final prev = _lastPushPt;

    bool mover = prev == null;
    if (!mover && _lastPushMs != null) {
      mover = now - _lastPushMs! > 4000 || _harvesineM(prev, pt) > 25;
    }

    final repo = ref.read(seguimientoRepositoryProvider);
    if (mover) {
      _lastPushMs = now;
      _lastPushPt = pt;
      try {
        await repo.addLocationPoint(seguimientoId: id, latitude: lat, longitude: lng);
      } catch (_) {/* como RN */}
    }
  }

  Future<void> _iniciar() async {
    if (_tracking) {
      _toast('El seguimiento ya está en curso.', kind: RutaToastKind.neutral);
      return;
    }
    if (_routePts.isEmpty || _durSec == null || _distanceM == null) {
      _toast('Calcula primero una ruta.', kind: RutaToastKind.neutral);
      return;
    }

    final gps = await DeviceLocation.ensureForTracking();
    if (!gps.ok) {
      _toast(gps.message ?? 'Sin permiso GPS no se registra la ruta.', kind: RutaToastKind.danger);
      return;
    }

    final origenTxt = _origenCtrl.text.trim().isEmpty ? 'Mi ubicación actual' : _origenCtrl.text.trim();
    final destinoTxt = _destinoCtrl.text.trim();

    try {
      final data = await ref.read(seguimientoRepositoryProvider).create(origen: origenTxt, destino: destinoTxt);
      final id = (data['id'] ?? '').toString();
      _seguimientoId = id.isEmpty ? null : id;
      if (mounted && _seguimientoId != null) {
        _toast(
          'Recorrido iniciado: ya puedes compartir el enlace Sígueme.',
          kind: RutaToastKind.success,
          skateStart: true,
        );
      }
    } catch (_) {
      _seguimientoId = null;
      if (mounted) {
        _toast(
          'Sesión local: no se pudo crear seguimiento en servidor (¿sesión válida?).',
          kind: RutaToastKind.danger,
        );
      }
    }

    setState(() {
      _tracking = true;
      _trackingStartMs = DateTime.now();
      _trail.clear();
      _lastPushMs = null;
      _lastPushPt = null;
    });

    // Semilla inicial
    LatLng? seed;
    if (_originCoordsLngLat != null && _originCoordsLngLat!.length >= 2) {
      seed = LatLng(_originCoordsLngLat![1], _originCoordsLngLat![0]);
    } else if (_userLatLng != null) {
      seed = _userLatLng!;
    }
    if (seed != null) {
      _trail.add(seed);
    }

    _posSub?.cancel();
    _posSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 2,
      ),
    ).listen((pos) async {
      if (!mounted) return;
      final next = LatLng(pos.latitude, pos.longitude);
      setState(() {
        if (_trail.isEmpty) {
          _trail.add(next);
        } else {
          final last = _trail.last;
          if (_harvesineM(last, next) >= 2) {
            _trail.add(next);
          }
        }
      });
      await _pushPuntoSiToca(pos.latitude, pos.longitude);
    });
  }

  Future<void> _terminar() async {
    await _posSub?.cancel();
    _posSub = null;
    setState(() => _tracking = false);
    final id = _seguimientoId;
    if (id != null) {
      try {
        await ref.read(seguimientoRepositoryProvider).finish(id);
        ref.invalidate(historialRecorridosProvider);
        ref.invalidate(historialUserStatsProvider);
        ref.invalidate(historialLeaderboardProvider);
      } catch (_) {
        /**/
      }
      if (mounted) setState(() => _seguimientoId = null);
    }
    final mins = _trackingStartMs == null
        ? 0
        : math.max(1, DateTime.now().difference(_trackingStartMs!).inMinutes.round());
    if (mounted) {
      _toast(
        id != null
            ? 'Recorrido guardado en Historial · ~$mins min'
            : 'Recorrido finalizado · ~$mins min · puntos ${_trail.length}',
        kind: RutaToastKind.danger,
      );
    }
  }

  String _shareFollowUrl() {
    final id = _seguimientoId;
    if (id == null || id.isEmpty) return '';
    // RN usa `/?seguimiento=` en la web raíz; en Flutter la ruta real del mapa es `/inicio`.
    return Uri.base.resolve('/inicio?seguimiento=${Uri.encodeQueryComponent(id)}').toString();
  }

  String _buildShareText() {
    final distancia = _distanceM == null ? 'N/A' : _formatKmM(_distanceM!);
    final tiempo = _durSec == null ? 'N/A' : _formatDur(_durSec!);
    final urlSeguimiento = _shareFollowUrl();
    final origen = _origenCtrl.text.trim().isEmpty ? 'Mi ubicación actual' : _origenCtrl.text.trim();
    final destino = _destinoCtrl.text.trim().isEmpty ? '—' : _destinoCtrl.text.trim();

    final buf = StringBuffer()
      ..writeln('🛼 ¡Ruta Roller en camino! ⚡')
      ..writeln()
      ..writeln('📍 Origen: $origen')
      ..writeln('🏁 Destino: $destino')
      ..writeln('📏 Distancia: $distancia')
      ..writeln('⏱️ Tiempo estimado: $tiempo');
    if (urlSeguimiento.isNotEmpty) {
      buf
        ..writeln()
        ..writeln('👀 ¡Sígueme en tiempo real y únete a la rodada aquí! 👇')
        ..writeln(urlSeguimiento);
    }
    return buf.toString();
  }

  Future<void> _compartirRutaTexto() async {
    final text = _buildShareText();
    if (_seguimientoId == null || _seguimientoId!.isEmpty) {
      try {
        await Share.share(text);
      } catch (_) {
        await Clipboard.setData(ClipboardData(text: text));
        if (mounted) _toast('Texto copiado al portapapeles.', kind: RutaToastKind.success);
      }
      return;
    }

    Map<String, dynamic>? me;
    try {
      me = await ref.read(currentMeProvider.future);
    } catch (_) {
      me = null;
    }

    if (!mounted) return;
    await showRutaCompartirSheet(
      context: context,
      ref: ref,
      shareText: text,
      canStaffChat: canAccessStaffChat(me),
    );
  }

  Widget _suggestionBox({required List<MapboxSuggestion> items, required void Function(MapboxSuggestion) onTap}) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Material(
        color: const Color(0xFF0F172A),
        elevation: 12,
        shadowColor: Colors.black54,
        borderRadius: BorderRadius.circular(12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 220),
            child: ListView.builder(
              shrinkWrap: true,
              primary: false,
              physics: const ClampingScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: items.length,
              itemBuilder: (ctx, i) {
                final s = items[i];
                return Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => onTap(s),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                      child: Text(
                        s.placeName,
                        style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 13.5, height: 1.28),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  static const _trackingPanelGlass = BoxDecoration(
    color: Color.fromRGBO(2, 6, 23, 0.88),
    borderRadius: BorderRadius.all(Radius.circular(16)),
    border: Border.fromBorderSide(BorderSide(color: Color.fromRGBO(0, 255, 127, 0.32), width: 1.1)),
    boxShadow: [
      BoxShadow(color: Color.fromRGBO(56, 189, 248, 0.14), blurRadius: 14, spreadRadius: 0),
      BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.38), blurRadius: 12, offset: Offset(0, 6)),
    ],
  );

  Widget _pillRow() {
    if (_distanceM == null || _durSec == null) return const SizedBox.shrink();
    final cal = ((_distanceM! / 1000) * 50).round();
    return Row(
      children: [
        Expanded(
          child: _pill(
            icon: LucideIcons.gauge,
            accent: const Color(0xFF38BDF8),
            label: 'Distancia',
            value: _formatKmM(_distanceM!),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _pill(
            icon: LucideIcons.timer,
            accent: const Color(0xFF00FF7F),
            label: 'Tiempo',
            value: _formatDur(_durSec!),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _pill(
            icon: LucideIcons.flame,
            accent: const Color(0xFFFF9500),
            label: 'Calorías',
            value: '$cal',
          ),
        ),
      ],
    );
  }

  Widget _pill({
    required IconData icon,
    required Color accent,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 9),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: const Color.fromRGBO(15, 23, 42, 0.55),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(icon, size: 13, color: accent),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                    color: accent.withValues(alpha: 0.9),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, height: 1.1, color: Color(0xFFF8FAFC)),
          ),
        ],
      ),
    );
  }

  Widget _confirmCard() {
    final c = _confirmPick;
    if (c == null) return const SizedBox.shrink();
    final esO = c.field == _PickField.origen;
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: const Color.fromRGBO(15, 23, 42, 0.92),
        border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            esO ? 'Origen: confirmar punto' : 'Destino: confirmar punto',
            style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 14, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            c.label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color.fromRGBO(248, 250, 252, 0.85), fontSize: 12, height: 1.3),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      if (esO) {
                        _origenCtrl.text = '';
                      } else {
                        _destinoCtrl.text = '';
                      }
                      _confirmPick = null;
                    });
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.45)),
                  ),
                  child: const Text('Cambiar'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      if (esO) {
                        _originCoordsLngLat = [c.lng, c.lat];
                      } else {
                        _destinationCoordsLngLat = [c.lng, c.lat];
                      }
                      _confirmPick = null;
                      _routeRequested = false;
                      _routePts = [];
                      _distanceM = null;
                      _durSec = null;
                    });
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0891B2)),
                  child: const Text('Confirmar'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  LatLng _mapCenter() {
    final prev = _confirmPick;
    if (prev != null) return LatLng(prev.lat, prev.lng);
    if (_spectadorActivo && _spectadorPts.isNotEmpty) return _spectadorPts.last;
    if (_trail.isNotEmpty) return _trail.last;
    if (_routePts.isNotEmpty) return _routePts.first;
    return _userLatLng ?? const LatLng(19.4326, -99.1332);
  }

  Widget _mapLayer(double h) {
    final ctr = _mapCenter();
    return SizedBox(
      height: h,
      child: Stack(
          fit: StackFit.expand,
          children: [
            FlutterMap(
              key: ValueKey(
                  '${_tracking}_${_trail.length}_${ctr.latitude}_${ctr.longitude}_${_routePts.length}_${_previewPoint()}_${_spectadorActivo}_${_spectadorPts.length}_$_spectadorIdEnCurso'),
              options: MapOptions(
                initialCenter: ctr,
                initialZoom: _routePts.isEmpty ? 13.2 : 14,
                interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
              ),
              children: [
                // Carto Dark Matter (OSM): contraste brutal con la línea neón.
                TileLayer(
                  urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                  subdomains: const ['a', 'b', 'c', 'd'],
                  userAgentPackageName: 'roller_flutter_app',
                ),
                if (_routePts.isNotEmpty)
                  PolylineLayer(
                    polylines: [
                      // Halo eléctrico (mismo tono que el CTA “Calcular ruta”).
                      Polyline(
                        points: _routePts,
                        strokeWidth: 16,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: AppTheme.routeElectricCta.withValues(alpha: 0.22),
                      ),
                      Polyline(
                        points: _routePts,
                        strokeWidth: 11,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: const Color(0xFF00FF7F).withValues(alpha: 0.42),
                      ),
                      Polyline(
                        points: _routePts,
                        strokeWidth: 7,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: const Color(0xFF00FF7F),
                        borderStrokeWidth: 2,
                        borderColor: Colors.white.withValues(alpha: 0.35),
                      ),
                    ],
                  ),
                if (_tracking && _trail.length >= 2)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: _trail,
                        strokeWidth: 6,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: AppTheme.routeElectricCta.withValues(alpha: 0.55),
                      ),
                      Polyline(
                        points: _trail,
                        strokeWidth: 3.5,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: const Color(0xFF00FF7F).withValues(alpha: 0.88),
                      ),
                    ],
                  ),
                if (_spectadorActivo && _spectadorPts.length >= 2)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: _spectadorPts,
                        strokeWidth: 7,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: const Color(0xFFFF4A5A).withValues(alpha: 0.45),
                      ),
                      Polyline(
                        points: _spectadorPts,
                        strokeWidth: 4,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                        color: const Color(0xFFFF4A5A),
                        borderStrokeWidth: 1.5,
                        borderColor: Colors.white.withValues(alpha: 0.4),
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    if (_previewPoint() != null)
                      Marker(
                        point: _previewPoint()!,
                        width: 36,
                        height: 36,
                        child: const Icon(Icons.place, color: Color(0xFF38BDF8), size: 34),
                      ),
                    if (_spectadorActivo && _spectadorPts.isNotEmpty)
                      Marker(
                        point: _spectadorPts.last,
                        width: 32,
                        height: 32,
                        child: Icon(Icons.sports_score, color: const Color(0xFFFF4A5A), size: 30, shadows: [
                          Shadow(blurRadius: 10, color: const Color(0xFFFF4A5A).withValues(alpha: 0.55)),
                        ]),
                      ),
                    if (_tracking && _trail.isNotEmpty)
                      Marker(
                        point: _trail.last,
                        width: 36,
                        height: 36,
                        child: const RutaSkateMarker(),
                      ),
                  ],
                ),
              ],
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 0, 10, 5),
                child: Text(
                  '© OpenStreetMap contributors · © CARTO',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 9.5,
                    height: 1.15,
                    color: Colors.white.withValues(alpha: 0.42),
                    shadows: const [Shadow(blurRadius: 8, color: Colors.black87)],
                  ),
                ),
              ),
            ),
          ],
        ),
    );
  }

  LatLng? _previewPoint() {
    final c = _confirmPick;
    if (c == null) return null;
    return LatLng(c.lat, c.lng);
  }

  Widget? _trackingPanel() {
    if (_spectadorActivo) return null;
    if (!_routeRequested || _distanceM == null || _durSec == null) return null;
    return Container(
      decoration: _trackingPanelGlass,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF00FF7F).withValues(alpha: 0.15),
                  border: Border.all(color: const Color.fromRGBO(0, 255, 127, 0.45)),
                ),
                child: Text(
                  _tracking ? '🛼' : '📍',
                  style: const TextStyle(fontSize: 14, height: 1),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _tracking ? 'Recorrido en curso' : 'Ruta lista',
                      style: const TextStyle(
                        color: Color(0xFF34D399),
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      _tracking ? 'Comparte o termina cuando quieras' : 'Revisa el resumen y arranca',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, height: 1.2),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _pillRow(),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () {
              final input = RecapInput(
                route: List<LatLng>.from(_routePts),
                distanceMeters: _distanceM,
                durationSeconds: _durSec,
                origen: _origenCtrl.text,
                destino: _destinoCtrl.text,
              ).normalized();
              context.push('/recap/crear', extra: input);
            },
            icon: const Icon(LucideIcons.clapperboard, size: 17),
            label: const Text('Crear Recap', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(44),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.4)),
              foregroundColor: const Color(0xFFE2E8F0),
              backgroundColor: const Color.fromRGBO(15, 23, 42, 0.42),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 8),
          if (!_tracking)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _iniciar,
                style: ButtonStyle(
                  minimumSize: WidgetStateProperty.all(const Size.fromHeight(50)),
                  backgroundColor: WidgetStateProperty.all(const Color(0xFF00FF7F)),
                  foregroundColor: WidgetStateProperty.all(const Color(0xFF020617)),
                  elevation: WidgetStateProperty.all(6),
                  shadowColor: WidgetStateProperty.all(const Color(0x6600FF7F)),
                  shape: WidgetStateProperty.all(
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('🛼', style: TextStyle(fontSize: 18, height: 1)),
                    const SizedBox(width: 8),
                    Text(
                      '¡VAMOS! · Iniciar',
                      style: GoogleFonts.orbitron(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ElevatedButton.icon(
                  onPressed: _compartirRutaTexto,
                  icon: const Icon(LucideIcons.share2, size: 17),
                  label: const Text('Compartir ruta', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(46),
                    backgroundColor: const Color(0xFF0891B2),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: _terminar,
                  icon: const Icon(LucideIcons.square, size: 17),
                  label: const Text('Terminar ruta', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(46),
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appLocaleProvider).t;
    final hasRouteResult = _routePts.isNotEmpty && _distanceM != null && _durSec != null;
    final mapH = hasRouteResult
        ? (kIsWeb ? 300.0 : 280.0)
        : (kIsWeb ? 250.0 : 235.0);

    final form = <Widget>[];
    if (_spectadorActivo) {
      form.addAll([
        DecoratedBox(
          decoration: RnLayeredStyles.glassPanel(),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                const Text('🎯', style: TextStyle(fontSize: 20)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _spectadorAlias != null ? 'En vivo · $_spectadorAlias' : 'Siguiendo recorrido en vivo',
                    style: const TextStyle(color: Color(0xFFF8FAFC), fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ),
                TextButton(
                  onPressed: _salirModoEspectador,
                  child: const Text('Salir', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Mapa en vivo del compañero. Origen y destino se actualizan con los datos del servidor.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: const Color(0xFFCBD5F5),
                fontSize: 12,
                height: 1.32,
              ),
        ),
      ]);
    } else if (!_tracking) {
      form.addAll([
        Text(
          'Escribe o ten a la mano la calle y codigo postal para ubicar mejor origen y destino en el mapa.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: const Color(0xFFCBD5F5),
                fontSize: 12,
                height: 1.35,
              ),
        ),
        const SizedBox(height: 10),
        _rutaFieldLabel('Origen'),
        _rutaInput(
          controller: _origenCtrl,
          focusNode: _focusOrigen,
          prefixIcon: LucideIcons.navigation,
          hint: _gpsLoading ? 'Obteniendo tu ubicación...' : 'Ej: Lic. Primo Verdad, Col. Jardines, CDMX',
          onTap: () => setState(() => _sugDestino = []),
          onChanged: (v) {
            final gpsPreset = v.trim().startsWith('Mi ubicación actual');
            if (_originCoordsLngLat != null && !gpsPreset) {
              setState(() => _originCoordsLngLat = null);
            }
            _limpiaRutaPorCampos();
            setState(() {});
            _debounceSuggestions(() => _loadSuggestions(true));
          },
          onSubmitted: (_) => _focusDestino.requestFocus(),
        ),
        _suggestionBox(
          items: _showOrigenSug ? _sugOrigen : const [],
          onTap: (s) {
            setState(() {
              _origenCtrl.text = s.placeName;
              _sugOrigen = [];
              _confirmPick = _PendingPick(field: _PickField.origen, label: s.placeName, lng: s.lng, lat: s.lat);
            });
            _focusOrigen.unfocus();
          },
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _gpsLoading ? null : () => _obtenerGps(origenSilent: false),
          icon: Icon(
            _gpsLoading ? LucideIcons.loader2 : LucideIcons.locateFixed,
            size: 18,
            color: const Color(0xFFCBD5E1),
          ),
          label: Text(
            _gpsLoading ? 'Obteniendo GPS…' : 'Usar mi ubicación',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(46),
            side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.45)),
            foregroundColor: const Color(0xFFE2E8F0),
            backgroundColor: const Color.fromRGBO(15, 23, 42, 0.38),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _gpsLoading
              ? 'Obteniendo GPS...'
              : _originCoordsLngLat != null
                  ? 'Origen listo: GPS'
                  : _origenCtrl.text.trim().isNotEmpty
                      ? 'Origen listo: escrito'
                      : 'Origen: pendiente',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color.fromRGBO(248, 250, 252, 0.9), fontSize: 12, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 10),
        _rutaFieldLabel('Destino'),
        _rutaInput(
          controller: _destinoCtrl,
          focusNode: _focusDestino,
          prefixIcon: LucideIcons.mapPin,
          hint: 'Ej: Xitla, Col. Arenal 4ta Sección, CDMX',
          onTap: () => setState(() => _sugOrigen = []),
          onChanged: (v) {
            _limpiaRutaPorCampos();
            setState(() {});
            _debounceSuggestions(() => _loadSuggestions(false));
          },
        ),
        _suggestionBox(
          items: _showDestSug ? _sugDestino : const [],
          onTap: (s) {
            setState(() {
              _destinoCtrl.text = s.placeName;
              _sugDestino = [];
              _confirmPick = _PendingPick(field: _PickField.destino, label: s.placeName, lng: s.lng, lat: s.lat);
            });
            _focusDestino.unfocus();
          },
        ),
        const SizedBox(height: 10),
        RnMirrorRutaCalcularCta(
          label: _calculando ? 'Calculando...' : 'Calcular ruta',
          enabled:
              ((_origenCtrl.text.trim().isNotEmpty || _originCoordsLngLat != null) &&
                  _destinoCtrl.text.trim().isNotEmpty &&
                  !_calculando &&
                  (_confirmPick == null)),
          onPressed: _calcular,
        ),
        _confirmCard(),
      ]);
    }

    final me = ref.watch(currentMeProvider).valueOrNull;

    return Stack(
      fit: StackFit.expand,
      children: [
        RnMirrorRutaLayout(
          user: me,
          navTitle: t('navigation.title'),
          navSubtitle: t('navigation.subtitle'),
          formFields: form,
          bottomMap: _mapLayer(mapH),
          bottomMapHeight: mapH,
          trackingPanel: _trackingPanel(),
          isCalculating: _calculando,
        ),
      ],
    );
  }
}

String _formatKmM(double meters) {
  if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(2)} km';
  return '${meters.toStringAsFixed(0)} m';
}

String _formatDur(double seconds) {
  final s = seconds.round();
  final h = s ~/ 3600;
  final m = (s % 3600) ~/ 60;
  if (h > 0) return '${h}h ${m}m';
  return '${m}m';
}

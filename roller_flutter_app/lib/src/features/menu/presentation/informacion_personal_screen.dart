import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/l10n/app_locale.dart';
import '../../../core/ui/app_theme.dart';
import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import '../../auth/data/auth_repository.dart';
import '../../perfil/data/perfil_repository.dart';
import '../../perfil/presentation/perfil_screen.dart' show meProvider;

/// Espejo 1:1 de `InformacionPersonalScreen.tsx` (SIIG-ROLLER-FRONT): campos, chips, guardar, volver.
class InformacionPersonalScreen extends ConsumerStatefulWidget {
  const InformacionPersonalScreen({super.key});

  static const Color _cyan = Color(0xFF00D9FF);

  @override
  ConsumerState<InformacionPersonalScreen> createState() => _InformacionPersonalScreenState();
}

class _InformacionPersonalScreenState extends ConsumerState<InformacionPersonalScreen> {
  final _emailCtrl = TextEditingController();
  final _edadCtrl = TextEditingController();
  final _fechaCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();

  String _sexo = 'masculino';
  String _nacionalidad = 'español';
  bool _loading = false;
  bool _loadError = false;
  String? _loadErrorMsg;

  ({String type, String message})? _toast;

  @override
  void initState() {
    super.initState();
    _loading = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadFromApi());
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _edadCtrl.dispose();
    _fechaCtrl.dispose();
    _telefonoCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadFromApi() async {
    setState(() {
      _loading = true;
      _loadError = false;
      _loadErrorMsg = null;
    });
    try {
      final me = await ref.read(perfilRepositoryProvider).me();
      if (!mounted) return;
      _applyUserMap(me);
      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = true;
        _loadErrorMsg = e.toString();
      });
    }
  }

  void _applyUserMap(Map<String, dynamic> u) {
    _emailCtrl.text = (u['email'] ?? '').toString();
    final edad = u['edad'];
    _edadCtrl.text = edad is int ? '$edad' : (edad?.toString() ?? '18');
    final sx = (u['sexo'] ?? 'masculino').toString();
    _sexo = ['masculino', 'femenino', 'ambos'].contains(sx) ? sx : 'masculino';
    final na = (u['nacionalidad'] ?? 'español').toString();
    _nacionalidad = (na == 'inglés' || na == 'ingles') ? 'inglés' : 'español';
    ref.read(appLocaleProvider.notifier).setFromNacionalidad(_nacionalidad);
    _telefonoCtrl.text = (u['telefono'] ?? '').toString();

    final rawCumple = (u['cumpleaños'] ?? u['cumpleanos'] ?? '').toString();
    if (rawCumple.isNotEmpty) {
      if (RegExp(r'^\d{4}-\d{2}-\d{2}').hasMatch(rawCumple)) {
        final d = DateTime.tryParse(rawCumple.substring(0, 10));
        if (d != null) {
          _fechaCtrl.text =
              '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
        }
      } else {
        _fechaCtrl.text = rawCumple;
      }
    }
    setState(() {});
  }

  void _setToast(({String type, String message}) value) {
    setState(() => _toast = value);
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) setState(() => _toast = null);
    });
  }

  InputDecoration _dec(String label, {String? hint}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(color: Colors.white),
      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
      filled: true,
      fillColor: const Color(0xFF0F172A),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color.fromRGBO(0, 217, 255, 0.5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color.fromRGBO(0, 217, 255, 0.5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: InformacionPersonalScreen._cyan, width: 2),
      ),
    );
  }

  DateTime? _parseDdMmYyyy(String raw) {
    final s = raw.trim();
    final parts = s.split('/');
    if (parts.length != 3) return null;
    final d = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    final y = int.tryParse(parts[2]);
    if (d == null || m == null || y == null) return null;
    if (y < 1900 || y > DateTime.now().year + 1) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    final dt = DateTime(y, m, d);
    if (dt.year != y || dt.month != m || dt.day != d) return null;
    return dt;
  }

  void _onFechaChanged(String text) {
    var cleaned = text.replaceAll(RegExp(r'[^\d/]'), '');
    var formatted = cleaned;
    if (cleaned.length > 2 && cleaned[2] != '/') {
      formatted = '${cleaned.substring(0, 2)}/${cleaned.substring(2)}';
    }
    if (formatted.length > 5 && formatted[5] != '/') {
      formatted = '${formatted.substring(0, 5)}/${formatted.substring(5)}';
    }
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }
    _fechaCtrl.value = TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
    setState(() {});
  }

  Future<void> _handleSave() async {
    final fechaTexto = _fechaCtrl.text.trim();
    if (fechaTexto.length != 10) {
      _setToast((type: 'error', message: 'Ingresa la fecha en formato DD/MM/YYYY'));
      return;
    }
    final parsed = _parseDdMmYyyy(fechaTexto);
    if (parsed == null) {
      _setToast((type: 'error', message: 'Fecha inválida'));
      return;
    }
    final edad = int.tryParse(_edadCtrl.text.trim()) ?? 0;
    if (edad < 13 || edad > 120) {
      _setToast((type: 'error', message: 'Edad inválida'));
      return;
    }

    final isoDate = '${parsed.year.toString().padLeft(4, '0')}-'
        '${parsed.month.toString().padLeft(2, '0')}-'
        '${parsed.day.toString().padLeft(2, '0')}';

    setState(() {
      _loading = true;
      _toast = null;
    });
    try {
      final r = await ref.read(authRepositoryProvider).updatePersonalInfo(
            edad: edad,
            cumpleanosIsoDateOnly: isoDate,
            sexo: _sexo,
            nacionalidad: _nacionalidad,
            telefono: _telefonoCtrl.text.trim().isEmpty ? null : _telefonoCtrl.text.trim(),
          );
      if (!mounted) return;
      if (r.success) {
        ref.invalidate(meProvider);
        _setToast((type: 'success', message: 'Cambios guardados'));
        if (r.usuario != null) {
          _applyUserMap(r.usuario!);
        }
      } else {
        _setToast((type: 'error', message: r.error ?? 'No se pudo guardar los cambios'));
      }
    } catch (e) {
      if (mounted) {
        _setToast((type: 'error', message: 'No se pudo guardar los cambios'));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goRn(BuildContext context, RnMainRoute route) {
    if (!context.mounted) return;
    switch (route) {
      case RnMainRoute.ruta:
        context.go('/inicio');
        break;
      case RnMainRoute.marketing:
        context.go('/marketing');
        break;
      case RnMainRoute.historial:
        context.go('/historial');
        break;
      case RnMainRoute.calendario:
        context.go('/calendario');
        break;
      case RnMainRoute.chat:
        context.go('/chat');
        break;
      case RnMainRoute.rollertips:
        context.go('/rollertips');
        break;
      case RnMainRoute.menu:
        context.go('/menu');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return RnShellScaffold(
      activeRoute: RnMainRoute.menu,
      onNavigate: (r) => _goRn(context, r),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/patines-fondo-nuevo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          Positioned.fill(
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 3, sigmaY: 3),
                child: const ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.58)),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                20,
                12,
                20,
                RnBottomNavigationSlot.totalHeight + 24,
              ),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_loading && !_loadError) ...[
                        const Padding(
                          padding: EdgeInsets.only(bottom: 16),
                          child: Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8))),
                        ),
                      ],
                      if (_toast != null) ...[
                        DecoratedBox(
                          decoration: BoxDecoration(
                            color: _toast!.type == 'success'
                                ? const Color(0xFF2ECC71)
                                : const Color(0xFFFF3B30),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                            child: Text(
                              _toast!.message,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      Text(
                        'Información personal',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.permanentMarker(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          shadows: const [
                            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(1, 1)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Actualiza tus datos básicos',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.82),
                        ),
                      ),
                      const SizedBox(height: 18),
                      if (_loadError)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            'No se pudieron cargar los datos.\n$_loadErrorMsg',
                            style: const TextStyle(color: Color(0xFFFF8A80), height: 1.35),
                          ),
                        ),
                      TextField(
                        controller: _emailCtrl,
                        readOnly: true,
                        style: const TextStyle(color: Colors.white70),
                        decoration: _dec('Email'),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _edadCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: _dec('Edad', hint: '18'),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _fechaCtrl,
                        onChanged: _onFechaChanged,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: _dec('Fecha de cumpleaños', hint: 'DD/MM/YYYY'),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Sexo',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _choiceChip('masculino', 'masculino')),
                          const SizedBox(width: 8),
                          Expanded(child: _choiceChip('femenino', 'femenino')),
                          const SizedBox(width: 8),
                          Expanded(child: _choiceChip('ambos', 'Prefiero no decirlo')),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Nacionalidad',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _choiceChipNac('español', 'español')),
                          const SizedBox(width: 8),
                          Expanded(child: _choiceChipNac('inglés', 'inglés')),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _telefonoCtrl,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: Colors.white),
                        decoration: _dec('Número telefónico', hint: 'Ej: 5512345678'),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.iosPrimaryButtonBlue,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: AppTheme.iosPrimaryButtonBlue.withValues(alpha: 0.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            minimumSize: const Size(double.infinity, 48),
                          ),
                          onPressed: _loading ? null : _handleSave,
                          child: _loading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text(
                                  'Guardar cambios',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextButton(
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/menu');
                          }
                        },
                        child: Text(
                          'Volver',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.iosPrimaryButtonBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _choiceChip(String value, String label) {
    final active = _sexo == value;
    return Material(
      color: active ? const Color(0xFF0D2847) : const Color.fromRGBO(255, 255, 255, 0.08),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: () => setState(() {
          _toast = null;
          _sexo = value;
        }),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: active ? AppTheme.iosPrimaryButtonBlue : Colors.white.withValues(alpha: 0.25),
              width: 2,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: active ? AppTheme.iosPrimaryButtonBlue : Colors.white.withValues(alpha: 0.85),
            ),
          ),
        ),
      ),
    );
  }

  Widget _choiceChipNac(String value, String label) {
    final active = _nacionalidad == value;
    return Material(
      color: active ? const Color(0xFF0D2847) : const Color.fromRGBO(255, 255, 255, 0.08),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: () async {
          setState(() {
            _nacionalidad = value;
            _toast = null;
          });
          await ref.read(appLocaleProvider.notifier).setFromNacionalidad(value);
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: active ? AppTheme.iosPrimaryButtonBlue : Colors.white.withValues(alpha: 0.25),
              width: 2,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: active ? AppTheme.iosPrimaryButtonBlue : Colors.white.withValues(alpha: 0.85),
            ),
          ),
        ),
      ),
    );
  }
}

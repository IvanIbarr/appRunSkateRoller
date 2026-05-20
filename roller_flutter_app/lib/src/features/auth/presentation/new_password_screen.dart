import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import 'auth_navigation.dart';

/// Espejo visual de `ResetPasswordScreen.tsx` (RN): código + nueva contraseña.
class NewPasswordScreen extends StatefulWidget {
  const NewPasswordScreen({super.key, this.email});

  final String? email;

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  late final _emailCtrl = TextEditingController(text: widget.email ?? '');
  final _codeCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _newPasswordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  InputDecoration _fieldDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.permanentMarker(
        fontSize: 13,
        color: const Color.fromRGBO(226, 232, 240, 0.55),
      ),
      filled: true,
      fillColor: const Color.fromRGBO(2, 6, 23, 0.55),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.16)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.16)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.55), width: 2),
      ),
    );
  }

  Widget _label(String text) {
    return Text(
      text,
      style: GoogleFonts.permanentMarker(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: const Color.fromRGBO(226, 232, 240, 0.86),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: ColoredBox(color: Color(0xFF020617))),
          Positioned.fill(
            child: Image.asset(
              'assets/patines-fondo-nuevo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          const Positioned.fill(
            child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.58)),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24, 24, 24, RnBottomNavigationSlot.totalHeight + 32),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(2, 6, 23, 0.65),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.16)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Restablecer contraseña',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.permanentMarker(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFF8FAFC),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Ingresa el código de 4 dígitos que recibiste por correo.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.permanentMarker(
                            fontSize: 14,
                            color: const Color.fromRGBO(226, 232, 240, 0.86),
                            height: 18 / 14,
                          ),
                        ),
                        const SizedBox(height: 20),
                        _label('Email'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _emailCtrl,
                          enabled: !_loading,
                          keyboardType: TextInputType.emailAddress,
                          style: GoogleFonts.permanentMarker(fontSize: 15, color: const Color(0xFFF8FAFC)),
                          decoration: _fieldDecoration('correo@ejemplo.com'),
                        ),
                        const SizedBox(height: 12),
                        _label('Código'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _codeCtrl,
                          enabled: !_loading,
                          keyboardType: TextInputType.number,
                          style: GoogleFonts.permanentMarker(fontSize: 15, color: const Color(0xFFF8FAFC)),
                          decoration: _fieldDecoration('1234'),
                        ),
                        const SizedBox(height: 12),
                        _label('Nueva contraseña'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _newPasswordCtrl,
                          enabled: !_loading,
                          obscureText: true,
                          style: GoogleFonts.permanentMarker(fontSize: 15, color: const Color(0xFFF8FAFC)),
                          decoration: _fieldDecoration('Mínimo 6 caracteres'),
                        ),
                        const SizedBox(height: 12),
                        _label('Confirmar contraseña'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _confirmCtrl,
                          enabled: !_loading,
                          obscureText: true,
                          style: GoogleFonts.permanentMarker(fontSize: 15, color: const Color(0xFFF8FAFC)),
                          decoration: _fieldDecoration('Repite tu contraseña'),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _loading
                                ? null
                                : () async {
                                    setState(() => _loading = true);
                                    await Future<void>.delayed(const Duration(milliseconds: 500));
                                    if (mounted) setState(() => _loading = false);
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF38BDF8),
                              foregroundColor: const Color(0xFF0B1022),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: Text(
                              _loading ? 'Cambiando…' : 'Cambiar contraseña',
                              style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 46,
                          child: OutlinedButton(
                            onPressed: _loading ? null : () => authGoLoginOrPop(context),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.55)),
                              backgroundColor: const Color.fromRGBO(15, 23, 42, 0.25),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              foregroundColor: const Color(0xFFF8FAFC),
                            ),
                            child: Text(
                              'Regresar a inicio',
                              style: GoogleFonts.permanentMarker(fontSize: 14, fontWeight: FontWeight.w700),
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
        ],
      ),
    );
  }
}


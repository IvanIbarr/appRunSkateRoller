import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import 'auth_controller.dart';
import 'auth_navigation.dart';
import 'reset_password_new_nav.dart';

/// Espejo de `ForgotPasswordScreen.tsx` (RN): solicitud de código por correo.
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  /// jo***@gmail.com — privacidad en el diálogo de confirmación.
  static String maskEmail(String email) {
    final trimmed = email.trim();
    final at = trimmed.indexOf('@');
    if (at <= 0 || at >= trimmed.length - 1) return trimmed;
    final local = trimmed.substring(0, at);
    final domain = trimmed.substring(at + 1);
    if (local.length <= 2) {
      return '${local.isNotEmpty ? local[0] : ''}***@$domain';
    }
    return '${local.substring(0, 2)}***@$domain';
  }

  Future<void> _showCodeSentDialog(String email) async {
    final masked = maskEmail(email);
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF151B2E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.45)),
        ),
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF34D399).withValues(alpha: 0.2),
                border: Border.all(color: const Color(0xFF34D399), width: 1.5),
              ),
              alignment: Alignment.center,
              child: const Text('✓', style: TextStyle(fontSize: 20, color: Color(0xFF34D399))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Código enviado',
                style: GoogleFonts.permanentMarker(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFF8FAFC),
                ),
              ),
            ),
          ],
        ),
        content: Text(
          'Enviamos un código de recuperación a $masked. Revisa tu bandeja de entrada o correo no deseado.',
          style: GoogleFonts.permanentMarker(
            fontSize: 14,
            height: 1.45,
            color: const Color(0xFFCBD5E1),
          ),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                authGoNewPassword(context, email);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF38BDF8),
                foregroundColor: const Color(0xFF0B1022),
                elevation: 0,
                minimumSize: const Size(double.infinity, 52),
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                'Continuar',
                textAlign: TextAlign.center,
                style: GoogleFonts.permanentMarker(
                  fontSize: 15,
                  height: 1.15,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0B1022),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _sendCode() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa un email válido')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final ok = await ref.read(authControllerProvider.notifier).forgotPassword(email);
      if (!mounted) return;
      if (ok) {
        await _showCodeSentDialog(email);
      } else {
        final err = ref.read(authControllerProvider).error;
        final apiMsg = err is String
            ? err
            : err?.toString().replaceFirst('Exception: ', '');
        final msg = (apiMsg != null && apiMsg.isNotEmpty)
            ? apiMsg
            : 'No pudimos enviar el código. Verifica el correo e intenta nuevamente.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: const Color(0xFFFF3B30),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: ColoredBox(color: Color(0xFF0F172A))),
          Positioned.fill(
            child: Image.asset(
              'assets/patines-fondo-nuevo.jpeg',
              fit: BoxFit.cover,
            ),
          ),
          const Positioned.fill(
            child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.55)),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                20,
                32,
                20,
                RnBottomNavigationSlot.totalHeight + 40,
              ),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color.fromRGBO(15, 23, 42, 0.55),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color.fromRGBO(0, 0, 0, 0.25),
                              blurRadius: 12,
                              offset: Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Recuperar contraseña',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.permanentMarker(
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFFF8FAFC),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Te enviaremos un código de 4 dígitos al correo.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.permanentMarker(
                                fontSize: 13,
                                color: const Color(0xFFCBD5F5),
                                height: 18 / 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color.fromRGBO(15, 23, 42, 0.75),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color.fromRGBO(0, 0, 0, 0.28),
                              blurRadius: 16,
                              offset: Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Email',
                              style: GoogleFonts.permanentMarker(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFFCBD5F5),
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _emailCtrl,
                              enabled: !_loading,
                              keyboardType: TextInputType.emailAddress,
                              autocorrect: false,
                              style: GoogleFonts.permanentMarker(fontSize: 15, color: const Color(0xFFF8FAFC)),
                              decoration: InputDecoration(
                                hintText: 'correo@ejemplo.com',
                                hintStyle: GoogleFonts.permanentMarker(
                                  fontSize: 13,
                                  color: const Color.fromRGBO(226, 232, 240, 0.55),
                                ),
                                filled: true,
                                fillColor: const Color.fromRGBO(2, 6, 23, 0.55),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.12)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.12)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.55), width: 2),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _loading ? null : _sendCode,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF38BDF8),
                                  foregroundColor: const Color(0xFF0B1022),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: Text(
                                  _loading ? 'Enviando…' : 'Enviar código',
                                  style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      InkWell(
                        onTap: _loading ? null : () => authGoLoginOrPop(context),
                        child: Text(
                          'Volver al login',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.permanentMarker(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF38BDF8),
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
}

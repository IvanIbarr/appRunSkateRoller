import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import 'auth_navigation.dart';
import 'reset_password_new_nav.dart';

/// Espejo de `ForgotPasswordScreen.tsx` (RN): solicitud de código por correo.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _emailCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
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
                              keyboardType: TextInputType.emailAddress,
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
                                onPressed: () => authGoNewPassword(context, _emailCtrl.text),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF38BDF8),
                                  foregroundColor: const Color(0xFF0B1022),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: Text(
                                  'Enviar código',
                                  style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      InkWell(
                        onTap: () => authGoLoginOrPop(context),
                        child: Text(
                          'Volver al login',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.permanentMarker(
                            color: const Color(0xFF38BDF8),
                            fontWeight: FontWeight.w600,
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

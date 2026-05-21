import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_locale.dart';
import '../../../core/ui/app_theme.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authControllerProvider).isLoading;

    return Scaffold(
      body: LoginLayout(
        emailCtrl: _emailCtrl,
        passwordCtrl: _passwordCtrl,
        loading: isLoading,
        onLogin: () async {
          final ok = await ref
              .read(authControllerProvider.notifier)
              .login(email: _emailCtrl.text, password: _passwordCtrl.text);
          if (!context.mounted) return;
          if (ok) {
            context.go('/inicio');
          } else {
            final err = ref.read(authControllerProvider).error;
            final msg = err is String
                ? err
                : err?.toString().replaceFirst('Exception: ', '') ?? 'No fue posible iniciar sesión';
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(msg)),
            );
          }
        },
        onForgot: () {
          context.go('/reset-password');
        },
        onRegister: () {
          context.go('/register');
        },
      ),
    );
  }
}

class LoginLayout extends ConsumerWidget {
  const LoginLayout({
    super.key,
    required this.emailCtrl,
    required this.passwordCtrl,
    required this.loading,
    required this.onLogin,
    required this.onForgot,
    required this.onRegister,
  });

  final TextEditingController emailCtrl;
  final TextEditingController passwordCtrl;
  final bool loading;
  final VoidCallback onLogin;
  final VoidCallback onForgot;
  final VoidCallback onRegister;

  double _titleFontSize(double width) {
    const gutters = 68.0;
    final usable = (width - gutters).clamp(130.0, 2000.0);
    final fromWidth = (usable / 10.2).floorToDouble();
    // Espejo RN: min 23, max 56
    return fromWidth.clamp(23.0, 56.0);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(appLocaleProvider).t;
    final w = MediaQuery.of(context).size.width;
    final titleSize = _titleFontSize(w);
    final padH = 24.0;

    final titleStyle = GoogleFonts.permanentMarker(
      fontSize: titleSize,
      height: 1.14,
      letterSpacing: (titleSize * 0.04).clamp(0.5, 4.0),
      fontWeight: FontWeight.bold,
      color: const Color(0xFF333333),
      shadows: const [
        Shadow(color: Color.fromRGBO(255, 255, 255, 0.95), blurRadius: 5, offset: Offset(2, 2)),
      ],
    );

    return SafeArea(
      child: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: MediaQuery.of(context).size.height),
          child: Stack(
            children: [
              // Logo de fondo (posición absoluta)
              Positioned.fill(
                child: Image.asset(
                  'assets/logo.jpeg',
                  fit: BoxFit.cover,
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: padH),
                child: Column(
                  children: [
                    // Espejo RN: paddingTop 40
                    const SizedBox(height: 40),
                    // titleContainer
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      // Espejo RN: margen superior ya lo da el paddingTop
                      margin: const EdgeInsets.only(bottom: 20),
                      alignment: Alignment.center,
                      child: Text(
                        'RunSkateRoller',
                        style: titleStyle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    // form
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      margin: const EdgeInsets.only(top: 80, bottom: 20),
                      alignment: Alignment.center,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 400),
                        child: Column(
                          children: [
                            _RnInput(
                              label: t('login.email'),
                              controller: emailCtrl,
                              labelColor: Colors.white,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            _RnInput(
                              label: t('login.password'),
                              controller: passwordCtrl,
                              labelColor: Colors.white,
                              obscureText: true,
                              showToggle: true,
                            ),
                            const SizedBox(height: 8),
                            _RnButton(
                              title: loading ? t('login.loggingIn') : t('login.button'),
                              onTap: loading ? null : onLogin,
                              paddingVertical: 10,
                              paddingHorizontal: 18,
                              minHeight: 35,
                              textFontSize: 13,
                            ),
                            const SizedBox(height: 12),
                            GestureDetector(
                              onTap: loading ? null : onForgot,
                              child: Text(
                                t('login.forgot'),
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF0A84FF),
                                  fontWeight: FontWeight.w600,
                                  shadows: const [
                                    Shadow(color: Color.fromRGBO(0, 0, 0, 0.6), blurRadius: 2, offset: Offset(1, 1)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                      margin: const EdgeInsets.only(top: 20),
                      constraints: const BoxConstraints(minWidth: 280),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            t('login.register'),
                            style: GoogleFonts.inter(fontSize: 14, color: Colors.black, fontWeight: FontWeight.bold),
                          ),
                          GestureDetector(
                            onTap: loading ? null : onRegister,
                            child: Text(
                              t('login.registerLink'),
                              style: GoogleFonts.inter(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RnButton extends StatelessWidget {
  const _RnButton({
    required this.title,
    required this.onTap,
    required this.paddingVertical,
    required this.paddingHorizontal,
    required this.minHeight,
    required this.textFontSize,
  });

  final String title;
  final VoidCallback? onTap;
  final double paddingVertical;
  final double paddingHorizontal;
  final double minHeight;
  final double textFontSize;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.5 : 1.0,
        child: Container(
          constraints: BoxConstraints(minHeight: minHeight),
          padding: EdgeInsets.symmetric(vertical: paddingVertical, horizontal: paddingHorizontal),
          decoration: BoxDecoration(
            color: AppTheme.iosPrimaryButtonBlue,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: textFontSize,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}

class _RnInput extends StatefulWidget {
  const _RnInput({
    required this.label,
    required this.controller,
    required this.labelColor,
    this.keyboardType,
    this.obscureText = false,
    this.showToggle = false,
  });

  final String label;
  final TextEditingController controller;
  final Color labelColor;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool showToggle;

  @override
  State<_RnInput> createState() => _RnInputState();
}

class _RnInputState extends State<_RnInput> {
  bool _show = false;

  @override
  Widget build(BuildContext context) {
    final effectiveObscure = widget.obscureText && !_show;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              widget.label,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: widget.labelColor),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFDDDDDD)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: widget.controller,
                    keyboardType: widget.keyboardType,
                    obscureText: effectiveObscure,
                    enableInteractiveSelection: true,
                    textAlignVertical: TextAlignVertical.center,
                    style: GoogleFonts.inter(fontSize: 16, color: const Color(0xFF333333)),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      filled: false,
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                ),
                if (widget.showToggle)
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: GestureDetector(
                      onTap: () => setState(() => _show = !_show),
                      child: Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Text(_show ? '👁️' : '👁️‍🗨️', style: const TextStyle(fontSize: 20)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

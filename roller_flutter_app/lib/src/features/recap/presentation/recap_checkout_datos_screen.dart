import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../models/recap_checkout_draft.dart';

class RecapCheckoutDatosScreen extends StatefulWidget {
  const RecapCheckoutDatosScreen({super.key, required this.draft});

  final RecapCheckoutDraft draft;

  @override
  State<RecapCheckoutDatosScreen> createState() => _RecapCheckoutDatosScreenState();
}

class _RecapCheckoutDatosScreenState extends State<RecapCheckoutDatosScreen> {
  static const Color _cyanElectric = Color(0xFF38BDF8);
  static const Color _neonGreen = Color(0xFF00FF7F);
  static const Color _fieldFill = Color(0xE60F172A);
  static const Color _idleBorder = Color.fromRGBO(148, 163, 184, 0.38);
  static const Color _prefixTint = Color(0x62FFFFFF); // ~white38

  late final _name = TextEditingController(text: widget.draft.buyerName ?? '');
  late final _email = TextEditingController(text: widget.draft.buyerEmail ?? '');
  late final _phone = TextEditingController(text: widget.draft.buyerPhone ?? '');

  OutlineInputBorder _outlineBorder(Color color, double width, {double radius = 12}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(radius),
      borderSide: BorderSide(color: color, width: width),
    );
  }

  InputDecoration _datosDecoration({
    required String label,
    required IconData prefixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(prefixIcon, color: _prefixTint, size: 22),
      filled: true,
      fillColor: _fieldFill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 14),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
      labelStyle: TextStyle(
        color: Colors.white.withValues(alpha: 0.62),
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      floatingLabelStyle: TextStyle(
        color: _cyanElectric.withValues(alpha: 0.95),
        fontSize: 13,
        fontWeight: FontWeight.w700,
      ),
      enabledBorder: _outlineBorder(_idleBorder, 1),
      focusedBorder: _outlineBorder(_cyanElectric, 1.5),
      border: _outlineBorder(_idleBorder, 1),
      focusedErrorBorder: _outlineBorder(const Color(0xFFF87171), 1.5),
      errorBorder: _outlineBorder(const Color(0xFFF87171), 1),
    );
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  void _fillDemo() {
    _name.text = 'Ana López Demo';
    _email.text = 'ana.recap.demo@ejemplo.com';
    _phone.text = '5512345678';
    setState(() {});
  }

  void _next() {
    final n = _name.text.trim();
    final e = _email.text.trim();
    final t = _phone.text.trim();
    if (n.isEmpty || e.isEmpty || t.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Completa nombre, correo y teléfono (o usa datos de prueba).')),
      );
      return;
    }
    final nextDraft = widget.draft.copyWith(buyerName: n, buyerEmail: e, buyerPhone: t);
    context.go('/recap/revision', extra: nextDraft);
  }

  @override
  Widget build(BuildContext context) {
    const fieldStyle = TextStyle(color: Color(0xFFF8FAFC), fontSize: 15, fontWeight: FontWeight.w500);

    return PageScaffold(
      title: 'Tus datos',
      maxWidth: 820,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${widget.draft.planTitle} · \$${widget.draft.amountMx} MXN', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          ActionChip(
            onPressed: _fillDemo,
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
            backgroundColor: Colors.black.withValues(alpha: 0.26),
            side: BorderSide(color: Colors.cyan.withValues(alpha: 0.4), width: 1),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            label: Text(
              'Llenar con datos de prueba',
              style: TextStyle(
                fontSize: 11,
                height: 1.2,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
                color: Colors.cyanAccent.shade100,
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _name,
            style: fieldStyle,
            cursorColor: _cyanElectric,
            decoration: _datosDecoration(
              label: 'Nombre completo',
              prefixIcon: Icons.person_outline,
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _email,
            style: fieldStyle,
            cursorColor: _cyanElectric,
            decoration: _datosDecoration(
              label: 'Correo',
              prefixIcon: Icons.email_outlined,
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phone,
            style: fieldStyle,
            cursorColor: _cyanElectric,
            decoration: _datosDecoration(
              label: 'Teléfono (10 dígitos)',
              prefixIcon: Icons.phone_android_outlined,
            ),
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 20),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _next,
              borderRadius: BorderRadius.circular(14),
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: const LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      _cyanElectric,
                      Color(0xFF22D3EE),
                      _neonGreen,
                    ],
                    stops: [0.0, 0.48, 1.0],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _neonGreen.withValues(alpha: 0.3),
                      blurRadius: 12,
                      spreadRadius: 0,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: _cyanElectric.withValues(alpha: 0.28),
                      blurRadius: 10,
                      spreadRadius: 0,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: Center(
                    child: Text(
                      'Siguiente · Revisar',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.35,
                        color: Color(0xFF0B1224),
                      ),
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

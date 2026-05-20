import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Selectores tipo cilindro (Cupertino) para fecha y hora del evento.
abstract final class EventoDateTimeFormat {
  static final _dateFmt = DateFormat('dd/MM/yyyy');
  static final _timeFmt = DateFormat('h:mm a', 'es');

  static String formatDate(DateTime d) => _dateFmt.format(d);

  static String formatTime(TimeOfDay t) {
    final dt = DateTime(2000, 1, 1, t.hour, t.minute);
    return _timeFmt.format(dt);
  }

  static DateTime? parseDate(String raw) {
    final s = raw.trim();
    if (s.isEmpty) return null;
    for (final fmt in [_dateFmt, DateFormat('dd-MM-yyyy'), DateFormat('yyyy-MM-dd')]) {
      try {
        return fmt.parseStrict(s);
      } catch (_) {}
    }
    return DateTime.tryParse(s);
  }

  static TimeOfDay? parseTime(String raw) {
    final s = raw.trim();
    if (s.isEmpty) return null;
    try {
      final dt = _timeFmt.parseStrict(s);
      return TimeOfDay(hour: dt.hour, minute: dt.minute);
    } catch (_) {}
    final parts = s.split(':');
    if (parts.length >= 2) {
      final h = int.tryParse(parts[0].trim());
      final m = int.tryParse(parts[1].replaceAll(RegExp(r'[^0-9]'), ''));
      if (h != null && m != null && h >= 0 && h < 24 && m >= 0 && m < 60) {
        return TimeOfDay(hour: h, minute: m);
      }
    }
    return null;
  }
}

Future<DateTime?> showEventoDateWheelPicker(
  BuildContext context, {
  required DateTime initial,
  DateTime? minimumDate,
}) async {
  var picked = initial;
  final min = minimumDate ?? DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);

  return showModalBottomSheet<DateTime>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return _WheelSheet(
        title: 'Fecha de inicio',
        onConfirm: () => Navigator.pop(ctx, picked),
        child: SizedBox(
          height: 220,
          child: CupertinoTheme(
            data: const CupertinoThemeData(brightness: Brightness.dark),
            child: CupertinoDatePicker(
              mode: CupertinoDatePickerMode.date,
              initialDateTime: initial.isBefore(min) ? min : initial,
              minimumDate: min,
              maximumDate: DateTime.now().add(const Duration(days: 365 * 3)),
              onDateTimeChanged: (v) => picked = v,
            ),
          ),
        ),
      );
    },
  );
}

Future<TimeOfDay?> showEventoTimeWheelPicker(
  BuildContext context, {
  required TimeOfDay initial,
  required String title,
}) async {
  var picked = initial;

  return showModalBottomSheet<TimeOfDay>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return _WheelSheet(
        title: title,
        onConfirm: () => Navigator.pop(ctx, picked),
        child: SizedBox(
          height: 220,
          child: CupertinoTheme(
            data: const CupertinoThemeData(brightness: Brightness.dark),
            child: CupertinoDatePicker(
              mode: CupertinoDatePickerMode.time,
              initialDateTime: DateTime(2000, 1, 1, initial.hour, initial.minute),
              use24hFormat: false,
              onDateTimeChanged: (v) => picked = TimeOfDay(hour: v.hour, minute: v.minute),
            ),
          ),
        ),
      );
    },
  );
}

class EventoWheelPickerField extends StatelessWidget {
  const EventoWheelPickerField({
    super.key,
    required this.label,
    required this.value,
    required this.hint,
    required this.onTap,
    this.accentColor = const Color(0xFF00D9FF),
  });

  final String label;
  final String value;
  final String hint;
  final VoidCallback onTap;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final hasValue = value.trim().isNotEmpty;
    return Material(
      color: const Color(0xFF0F172A),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            labelStyle: const TextStyle(color: Colors.white),
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            suffixIcon: Icon(Icons.unfold_more, color: accentColor.withValues(alpha: 0.85)),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: accentColor.withValues(alpha: 0.5)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: accentColor.withValues(alpha: 0.5)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: accentColor, width: 2),
            ),
          ),
          child: Text(
            hasValue ? value : hint,
            style: TextStyle(
              color: hasValue ? Colors.white : Colors.white.withValues(alpha: 0.45),
              fontSize: 16,
            ),
          ),
        ),
      ),
    );
  }
}

class _WheelSheet extends StatelessWidget {
  const _WheelSheet({
    required this.title,
    required this.child,
    required this.onConfirm,
  });

  final String title;
  final Widget child;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color.fromRGBO(12, 16, 28, 0.98),
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        border: Border(top: BorderSide(color: Color.fromRGBO(0, 217, 255, 0.25))),
      ),
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.paddingOf(context).bottom + 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color.fromRGBO(148, 163, 184, 0.45),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar', style: TextStyle(color: Color(0xFF94A3B8))),
              ),
              Expanded(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF00D9FF),
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              TextButton(
                onPressed: onConfirm,
                child: const Text('Listo', style: TextStyle(color: Color(0xFF00D9FF), fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

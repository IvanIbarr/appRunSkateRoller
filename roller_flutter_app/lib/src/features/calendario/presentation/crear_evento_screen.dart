import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_mirror_layouts.dart';
import '../data/evento_repository.dart';
import '../models/evento_draft.dart';
import 'calendario_navigation.dart';
import 'widgets/evento_image_uploader.dart';
import 'widgets/evento_wheel_pickers.dart';

/// Espejo de `CrearEventoScreen.tsx` (fondo, formulario, ImageUploader, fecha/hora).
class CrearEventoScreen extends ConsumerStatefulWidget {
  const CrearEventoScreen({
    super.key,
    this.eventoParaEditar,
    this.esEdicion = false,
  });

  final Map<String, dynamic>? eventoParaEditar;
  final bool esEdicion;

  static const Color _cyan = Color(0xFF00D9FF);

  @override
  ConsumerState<CrearEventoScreen> createState() => _CrearEventoScreenState();
}

class _CrearEventoScreenState extends ConsumerState<CrearEventoScreen> {
  late final TextEditingController _tituloRutaCtrl;
  late final TextEditingController _puntoSalidaCtrl;
  late final TextEditingController _nivelCtrl;
  late final TextEditingController _descripcionCtrl;

  late DateTime _fechaInicio;
  late TimeOfDay _cita;
  late TimeOfDay _salida;

  String? _logoGrupoUri;
  String? _lugarDestinoUri;

  bool _loading = false;

  Map<String, dynamic>? get _ev => widget.eventoParaEditar;

  @override
  void initState() {
    super.initState();
    final e = _ev;
    _tituloRutaCtrl = TextEditingController(
      text: (e?['tituloRuta'] ?? e?['titulo'] ?? '').toString(),
    );
    _puntoSalidaCtrl = TextEditingController(
      text: (e?['puntoSalida'] ?? e?['puntoEncuentroDireccion'] ?? '').toString(),
    );
    _nivelCtrl = TextEditingController(text: (e?['nivel'] ?? '').toString());
    _descripcionCtrl = TextEditingController(
      text: (e?['descripcion'] ?? '').toString(),
    );

    final fiRaw = (e?['fechaInicio'] ?? e?['fecha'] ?? '').toString();
    _fechaInicio = EventoDateTimeFormat.parseDate(fiRaw) ?? DateTime.now();

    _cita = EventoDateTimeFormat.parseTime((e?['cita'] ?? e?['hora'] ?? '').toString()) ??
        const TimeOfDay(hour: 20, minute: 0);
    _salida = EventoDateTimeFormat.parseTime((e?['salida'] ?? '').toString()) ??
        const TimeOfDay(hour: 20, minute: 30);

    final logo = (e?['logoGrupo'] ?? '').toString();
    final dest = (e?['lugarDestino'] ?? '').toString();
    _logoGrupoUri = logo.isEmpty ? null : logo;
    _lugarDestinoUri = dest.isEmpty ? null : dest;
  }

  @override
  void dispose() {
    _tituloRutaCtrl.dispose();
    _puntoSalidaCtrl.dispose();
    _nivelCtrl.dispose();
    _descripcionCtrl.dispose();
    super.dispose();
  }

  InputDecoration _dec(String label, String hint) {
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
        borderSide: const BorderSide(color: CrearEventoScreen._cyan, width: 2),
      ),
    );
  }

  Widget _sectionCard({required String title, required List<Widget> children}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color.fromRGBO(0, 217, 255, 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: CrearEventoScreen._cyan,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Future<void> _pickFecha() async {
    final picked = await showEventoDateWheelPicker(context, initial: _fechaInicio);
    if (picked != null) setState(() => _fechaInicio = picked);
  }

  Future<void> _pickCita() async {
    final picked = await showEventoTimeWheelPicker(
      context,
      initial: _cita,
      title: 'Hora de cita',
    );
    if (picked != null) setState(() => _cita = picked);
  }

  Future<void> _pickSalida() async {
    final picked = await showEventoTimeWheelPicker(
      context,
      initial: _salida,
      title: 'Hora de salida',
    );
    if (picked != null) setState(() => _salida = picked);
  }

  Future<void> _handleCrearEvento() async {
    final tituloRuta = _tituloRutaCtrl.text.trim();
    final puntoSalida = _puntoSalidaCtrl.text.trim();
    final fechaInicio = EventoDateTimeFormat.formatDate(_fechaInicio);
    final cita = EventoDateTimeFormat.formatTime(_cita);
    final salida = EventoDateTimeFormat.formatTime(_salida);
    final nivel = _nivelCtrl.text.trim();

    if (tituloRuta.isEmpty) {
      _alert('Error', 'El título de la ruta es requerido');
      return;
    }
    if (puntoSalida.isEmpty) {
      _alert('Error', 'El punto de salida es requerido');
      return;
    }
    if (nivel.isEmpty) {
      _alert('Error', 'El nivel es requerido');
      return;
    }

    if (widget.esEdicion && (_ev?['id'] ?? '').toString().isNotEmpty) {
      final id = (_ev!['id'] ?? '').toString();
      setState(() => _loading = true);
      try {
        await ref.read(eventoRepositoryProvider).update(
              id: id,
              tituloRuta: tituloRuta,
              puntoSalida: puntoSalida,
              fechaInicio: fechaInicio,
              cita: cita,
              salida: salida,
              nivel: nivel,
              logoGrupo: _logoGrupoUri,
              lugarDestino: _lugarDestinoUri,
            );
        if (!mounted) return;
        ref.invalidate(eventosProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Evento actualizado correctamente')),
        );
        popOrGoCalendario(context);
      } on DioException catch (e) {
        if (!mounted) return;
        final data = e.response?.data;
        var msg = 'No se pudo actualizar el evento';
        if (data is Map && data['error'] != null) {
          msg = data['error'].toString();
        }
        _alert('Error', msg);
      } catch (e) {
        if (!mounted) return;
        _alert('Error', 'No se pudo actualizar: $e');
      } finally {
        if (mounted) setState(() => _loading = false);
      }
      return;
    }

    final draft = EventoDraft(
      tituloRuta: tituloRuta,
      puntoSalida: puntoSalida,
      fechaInicio: fechaInicio,
      cita: cita,
      salida: salida,
      nivel: nivel,
      logoGrupo: _logoGrupoUri,
      lugarDestino: _lugarDestinoUri,
      descripcion: _descripcionCtrl.text.trim().isEmpty ? null : _descripcionCtrl.text.trim(),
    );

    final published = await pushVistaPreviaIfRouter<bool?>(context, draft);
    if (!mounted) return;
    if (published == true) {
      ref.invalidate(eventosProvider);
      popOrGoCalendario(context);
    }
  }

  void _alert(String title, String body) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RnMirrorCrearEventoLayout(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RnMirrorCrearEventoHeader(
            title: widget.esEdicion ? 'Editar Evento' : 'Crear Nuevo Evento',
            onBack: () => popOneOrGoCalendario(context),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _sectionCard(
                  title: 'DETALLES DEL EVENTO',
                  children: [
                    TextField(
                      controller: _tituloRutaCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: _dec('Título de la Ruta', 'Ej: Rodada Nocturna Centro Histórico'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _puntoSalidaCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: _dec('Punto de Salida / Ubicación', 'Ej: Monumento a la Revolución'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _nivelCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: _dec('Nivel', 'Ej: Principiante, Intermedio, Avanzado'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _descripcionCtrl,
                      minLines: 3,
                      maxLines: 6,
                      style: const TextStyle(color: Colors.white),
                      decoration: _dec('Descripción', 'Detalles del recorrido, reglas, qué traer…'),
                    ),
                  ],
                ),
                _sectionCard(
                  title: 'FECHA Y HORARIOS',
                  children: [
                    EventoWheelPickerField(
                      label: 'Fecha Inicio',
                      value: EventoDateTimeFormat.formatDate(_fechaInicio),
                      hint: 'Toca para elegir fecha',
                      onTap: _pickFecha,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: EventoWheelPickerField(
                            label: 'Cita (hora)',
                            value: EventoDateTimeFormat.formatTime(_cita),
                            hint: 'Hora de cita',
                            onTap: _pickCita,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: EventoWheelPickerField(
                            label: 'Salida (hora)',
                            value: EventoDateTimeFormat.formatTime(_salida),
                            hint: 'Hora de salida',
                            onTap: _pickSalida,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                _sectionCard(
                  title: 'IMÁGENES',
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: EventoImageUploader(
                            label: 'Logo del Grupo',
                            imageUri: _logoGrupoUri,
                            onImageSelected: (v) => setState(() => _logoGrupoUri = v),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: EventoImageUploader(
                            label: 'Lugar del Destino',
                            imageUri: _lugarDestinoUri,
                            onImageSelected: (v) => setState(() => _lugarDestinoUri = v),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: CrearEventoScreen._cyan,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _loading ? null : _handleCrearEvento,
                    child: _loading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(
                            widget.esEdicion ? 'Actualizar Evento' : 'Crear Evento',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
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

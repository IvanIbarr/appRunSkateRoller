class EventoDraft {
  EventoDraft({
    required this.tituloRuta,
    required this.puntoSalida,
    required this.fechaInicio,
    required this.cita,
    required this.salida,
    required this.nivel,
    this.logoGrupo,
    this.lugarDestino,
    this.organizadorEmail,
    this.descripcion,
  });

  final String tituloRuta;
  final String puntoSalida;
  final String fechaInicio;
  final String cita;
  final String salida;
  final String nivel;
  final String? logoGrupo;
  final String? lugarDestino;
  final String? organizadorEmail;
  /// Texto libre (no enviado al API actual; solo UI / vista previa).
  final String? descripcion;
}


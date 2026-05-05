class MarketingCheckoutDraft {
  MarketingCheckoutDraft({
    required this.saleId,
    required this.brandModel,
    required this.priceMx,
    this.calle,
    this.numero,
    this.colonia,
    this.localidad,
    this.municipio,
    this.estado,
    this.codigoPostal,
    this.numeroExteriorDepto,
    this.indicaciones,
    this.tipoDomicilio,
    this.contactoNombre,
    this.contactoTelefono,
    this.formaPago,
  });

  final String saleId;
  final String brandModel;
  final String priceMx;

  final String? calle;
  final String? numero;
  final String? colonia;
  final String? localidad;
  final String? municipio;
  final String? estado;
  final String? codigoPostal;
  final String? numeroExteriorDepto;
  final String? indicaciones;
  final String? tipoDomicilio; // residencial/deposito/oficina/empresa
  final String? contactoNombre;
  final String? contactoTelefono;
  final String? formaPago; // tarjeta/transferencia/otro

  MarketingCheckoutDraft copyWith({
    String? calle,
    String? numero,
    String? colonia,
    String? localidad,
    String? municipio,
    String? estado,
    String? codigoPostal,
    String? numeroExteriorDepto,
    String? indicaciones,
    String? tipoDomicilio,
    String? contactoNombre,
    String? contactoTelefono,
    String? formaPago,
  }) {
    return MarketingCheckoutDraft(
      saleId: saleId,
      brandModel: brandModel,
      priceMx: priceMx,
      calle: calle ?? this.calle,
      numero: numero ?? this.numero,
      colonia: colonia ?? this.colonia,
      localidad: localidad ?? this.localidad,
      municipio: municipio ?? this.municipio,
      estado: estado ?? this.estado,
      codigoPostal: codigoPostal ?? this.codigoPostal,
      numeroExteriorDepto: numeroExteriorDepto ?? this.numeroExteriorDepto,
      indicaciones: indicaciones ?? this.indicaciones,
      tipoDomicilio: tipoDomicilio ?? this.tipoDomicilio,
      contactoNombre: contactoNombre ?? this.contactoNombre,
      contactoTelefono: contactoTelefono ?? this.contactoTelefono,
      formaPago: formaPago ?? this.formaPago,
    );
  }
}


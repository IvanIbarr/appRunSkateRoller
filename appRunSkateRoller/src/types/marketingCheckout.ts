export type TipoDomicilioCompra =
  | 'residencial'
  | 'deposito'
  | 'oficina'
  | 'empresa';

export type FormaPagoCompra =
  | 'tarjeta'
  | 'transferencia'
  | 'efectivo_contra_entrega';

/** Datos que viajan entre pasos del checkout de Marketing */
export type MarketingCheckoutDraft = {
  saleId: string;
  brandModel: string;
  priceMx?: string;
  photoUri?: string | null;
  ownerUserId?: string;
  usoUbicacionGps?: boolean;
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  estado?: string;
  municipio?: string;
  localidad?: string;
  colonia?: string;
  coloniasOpciones?: string[];
  numeroExteriorDepto?: string;
  indicaciones?: string;
  tipoDomicilio?: TipoDomicilioCompra;
  contactoNombre?: string;
  contactoTelefono?: string;
  formaPago?: FormaPagoCompra;
};

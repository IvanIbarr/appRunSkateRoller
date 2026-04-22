import type {MarketingCheckoutDraft} from '../types/marketingCheckout';
import type {RecapCheckoutDraft} from '../types/recapCheckout';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  ForgotPassword: undefined;
  ResetPassword: {email?: string} | undefined;
  RollerTips: undefined;
  RollerTipsProfile: {userId: string; displayName: string};
  RollerTipsArchive: undefined;
  Marketing: undefined;
  MarketingSellSkates: undefined;
  MarketingSellSkatesStep3: {category?: string} | undefined;
  MarketingSellSkatesStep4: {
    category?: string;
    brandModel?: string;
    priceMx?: string;
    photos?: Array<{uri: string; name?: string}>;
    homeDelivery?: boolean;
    deliveryFeeMx?: number;
    saleType?: 'gratis' | 'clasica' | 'premium' | null;
  } | undefined;
  MarketingComprarEnvio: {
    draft: Partial<MarketingCheckoutDraft> &
      Pick<MarketingCheckoutDraft, 'saleId' | 'brandModel'>;
  };
  MarketingComprarRevision: {draft: MarketingCheckoutDraft};
  MarketingComprarPago: {draft: MarketingCheckoutDraft};
  Home: undefined;
  Navegacion: {seguimientoId?: string} | undefined;
  Comunidad: undefined;
  Historial: undefined;
  Calendario: undefined;
  Menu: undefined;
  MenuVentas: undefined;
  SupportHelp: undefined;
  AdminBuzon: undefined;
  AdminUsuarios: undefined;
  AdminChats: undefined;
  AdminResetPassword: undefined;
  AdminVentasGenerales: undefined;
  MisSuscripciones: undefined;
  CrearRecap: undefined;
  RecapCheckoutPlan: undefined;
  RecapCheckoutDatos: {draft: RecapCheckoutDraft};
  RecapCheckoutRevision: {draft: RecapCheckoutDraft};
  RecapCheckoutPago: {draft: RecapCheckoutDraft};
  AgregarStaff: undefined;
  NombreGrupo: undefined;
  AgregarAlias: undefined;
  CambiarAlias: undefined;
  IntegrantesGrupo: undefined;
  CrearEvento: undefined;
  VistaPreviaEvento: {
    tituloRuta: string;
    puntoSalida: string;
    fechaInicio: string;
    cita: string;
    salida: string;
    nivel: string;
    logoGrupo: string | null;
    lugarDestino: string | null;
  };
};

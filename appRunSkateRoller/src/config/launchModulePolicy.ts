/**
 * Política de alcance por módulo y fase — alineada a la tabla «3.a Alcance por módulo»
 * en RunSkateRoller-hosting-VISUAL.html y §11 (opciones-hosting-costos.md).
 *
 * No sustituye tests ni backend: define **qué enfatizar, atenuar u ocultar en UI** según
 * `LAUNCH_PHASE` (1 Beta, 2 Público, 3 Crecer).
 *
 * Buenas prácticas:
 * - **Una matriz** aquí, no `if (phase===1)` repartido en 30 pantallas.
 * - Las pantallas consultan `getTabBarTreatment`, `showPhaseBannerOnRoute`, etc.
 * - Añadir módulo = fila + helpers; cambiar criterio = editar solo este archivo.
 */
import {LAUNCH_PHASE, type LaunchPhase} from './launchPhase';

/** Identificadores alineados a `BottomTabBar` (tabs[].id) */
export type TabModuleId =
  | 'rutas'
  | 'comunidad'
  | 'historial'
  | 'calendario'
  | 'rollertips'
  | 'marketing'
  | 'menu';

/** Cómo se muestra en la app */
export type TabTreatment = 'core' | 'attenuate' | 'full';

const TAB_ORDER: TabModuleId[] = [
  'rutas',
  'comunidad',
  'historial',
  'calendario',
  'rollertips',
  'marketing',
  'menu',
];

/**
 * Matriz: por fase, por pestaña.
 * - **core** (Núc. en el plan): calendario en F1 — foco de bugs, sin atenuar por política.
 * - **attenuate** (Parc.): ruta, chat, historial en F1 — visible pero con aviso/estilo.
 * - **full** (Sí): tips, menú; en F2/F3 casi todo full.
 * - **hidden** (Post. marketplace en F1): se quita de la barra; acceso vía Menú → Ventas si aplica.
 */
const MATRIX: Record<
  LaunchPhase,
  Record<TabModuleId, {inTabBar: boolean; treatment: TabTreatment}>
> = {
  1: {
    rutas: {inTabBar: true, treatment: 'attenuate'},
    comunidad: {inTabBar: true, treatment: 'attenuate'},
    historial: {inTabBar: true, treatment: 'attenuate'},
    calendario: {inTabBar: true, treatment: 'core'},
    rollertips: {inTabBar: true, treatment: 'full'},
    // Post. en el plan: no concentrar carga de marketplace en beta
    marketing: {inTabBar: false, treatment: 'attenuate'},
    menu: {inTabBar: true, treatment: 'full'},
  },
  2: {
    rutas: {inTabBar: true, treatment: 'full'},
    comunidad: {inTabBar: true, treatment: 'full'},
    historial: {inTabBar: true, treatment: 'full'},
    calendario: {inTabBar: true, treatment: 'full'},
    rollertips: {inTabBar: true, treatment: 'full'},
    marketing: {inTabBar: true, treatment: 'full'},
    menu: {inTabBar: true, treatment: 'full'},
  },
  3: {
    rutas: {inTabBar: true, treatment: 'full'},
    comunidad: {inTabBar: true, treatment: 'full'},
    historial: {inTabBar: true, treatment: 'full'},
    calendario: {inTabBar: true, treatment: 'full'},
    rollertips: {inTabBar: true, treatment: 'full'},
    marketing: {inTabBar: true, treatment: 'full'},
    menu: {inTabBar: true, treatment: 'full'},
  },
};

function row(tabId: TabModuleId) {
  return MATRIX[LAUNCH_PHASE][tabId];
}

export function isTabInBar(tabId: string): boolean {
  if (!isTabModuleId(tabId)) {
    return true;
  }
  return row(tabId).inTabBar;
}

export function getTabTreatment(tabId: string): TabTreatment {
  if (!isTabModuleId(tabId)) {
    return 'full';
  }
  return row(tabId).treatment;
}

export function isTabModuleId(id: string): id is TabModuleId {
  return (TAB_ORDER as string[]).includes(id);
}

/** Rutas de stack que alinean con tab (para banner en pantalla) */
const ROUTE_TO_TAB: Record<string, TabModuleId | null> = {
  Navegacion: 'rutas',
  Comunidad: 'comunidad',
  Historial: 'historial',
  Calendario: 'calendario',
  RollerTips: 'rollertips',
  Marketing: 'marketing',
  Menu: 'menu',
};

/**
 * Mostrar cinta informativa de fase bajo el header (solo si la política pide atenuar
 * o si quieres recordatorio en núcleo — por defecto solo attenuate, no en core).
 */
export function showPhaseBannerForCurrentRoute(
  screenRouteName: string,
  options?: {showOnCoreInBeta?: boolean},
): {show: boolean; text: string} {
  if (LAUNCH_PHASE === 1 && screenRouteName === 'Marketing') {
    return {
      show: true,
      text: 'Fase 1: marketplace y ventas — solo pruebas puntuales. Prioridad: calendario y estabilidad. En Fase 2 se abre a uso general.',
    };
  }
  if (screenRouteName === 'MenuVentas' && LAUNCH_PHASE === 1) {
    return {
      show: true,
      text: 'Fase 1: acceso a ventas es secundario. Reportá incidencias sin esperar carga de tienda.',
    };
  }
  const tab = ROUTE_TO_TAB[screenRouteName];
  if (!tab) {
    return {show: false, text: ''};
  }
  const {treatment, inTabBar} = row(tab);
  if (LAUNCH_PHASE !== 1) {
    return {show: false, text: ''};
  }
  if (treatment === 'attenuate' && inTabBar) {
    return {
      show: true,
      text: 'Fase 1 (beta): uso moderado en esta sección. Prioridad: calendario y estabilidad.',
    };
  }
  if (options?.showOnCoreInBeta && treatment === 'core') {
    return {
      show: true,
      text: 'Fase 1 (beta): calendario y eventos con prioridad. Reportá fallos al equipo.',
    };
  }
  return {show: false, text: ''};
}

/** Pestaña atenuada: UI puede bajar opacidad del tab */
export function isTabAttenuated(tabId: string): boolean {
  return isTabInBar(tabId) && getTabTreatment(tabId) === 'attenuate';
}

export function getOrderedTabModuleIdsForPhase(): TabModuleId[] {
  return TAB_ORDER.filter(id => row(id).inTabBar);
}

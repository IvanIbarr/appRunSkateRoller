/**
 * Fase de lanzamiento (RunSkateRoller) — alineada a `opciones-hosting-costos.md` y al HTML de hosting.
 *
 * | Código | Significado      | Infra típica (doc) |
 * |--------|------------------|--------------------|
 * | 1      | Beta / pruebas   | Escenario A        |
 * | 2      | Público suave    | B o C              |
 * | 3      | Crecer / escala  | D (parcial o full) |
 *
 * **Web:** definir `REACT_APP_LAUNCH_PHASE=1` | `2` | `3` en `.env` (webpack lo inyecta).
 * **Android / iOS:** `process.env` a menudo no trae `REACT_APP_*` sin herramienta extra; se usa
 * `NATIVE_LAUNCH_PHASE_FALLBACK` (cámbialo al generar un build de Play/TestFlight).
 */
export type LaunchPhase = 1 | 2 | 3;

/** Ajusta aquí al compilar un APK/AAB o IPA de beta/staging si no inyectas env en Metro. */
const NATIVE_LAUNCH_PHASE_FALLBACK: LaunchPhase = 1;

function parsePhase(raw: string | undefined): LaunchPhase | null {
  if (raw === '1' || raw === '2' || raw === '3') {
    return Number(raw) as LaunchPhase;
  }
  return null;
}

function getFromEnv(): LaunchPhase | null {
  try {
    if (typeof process === 'undefined' || !process.env) {
      return null;
    }
    return parsePhase(process.env.REACT_APP_LAUNCH_PHASE as string | undefined);
  } catch {
    return null;
  }
}

/**
 * Fase activa. Una sola fuente de verdad para `if (LAUNCH_PHASE >= 2)` o pantallas.
 */
export const LAUNCH_PHASE: LaunchPhase =
  getFromEnv() ?? NATIVE_LAUNCH_PHASE_FALLBACK;

const LABELS: Record<LaunchPhase, string> = {
  1: 'Beta (Fase 1)',
  2: 'Público (Fase 2)',
  3: 'Crecer (Fase 3)',
};

export function getLaunchPhaseLabel(): string {
  return LABELS[LAUNCH_PHASE];
}

export function isLaunchPhase(p: LaunchPhase): boolean {
  return LAUNCH_PHASE === p;
}

export function isBetaOrEarlier(): boolean {
  return LAUNCH_PHASE === 1;
}

export function isPublicOrLater(): boolean {
  return LAUNCH_PHASE >= 2;
}

export function isGrowth(): boolean {
  return LAUNCH_PHASE === 3;
}

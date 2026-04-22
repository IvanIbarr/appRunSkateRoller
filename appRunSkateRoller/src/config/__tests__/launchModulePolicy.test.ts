/**
 * Política de fase: humo (sin renderizar la app completa).
 */
describe('launchModulePolicy', () => {
  const origEnv = process.env.REACT_APP_LAUNCH_PHASE;

  const load = (phase: '1' | '2' | '3' | undefined) => {
    jest.resetModules();
    if (phase === undefined) {
      delete process.env.REACT_APP_LAUNCH_PHASE;
    } else {
      process.env.REACT_APP_LAUNCH_PHASE = phase;
    }
    return require('../launchModulePolicy');
  };

  afterAll(() => {
    jest.resetModules();
    if (origEnv === undefined) {
      delete process.env.REACT_APP_LAUNCH_PHASE;
    } else {
      process.env.REACT_APP_LAUNCH_PHASE = origEnv;
    }
  });

  it('Fase 1: calendario núcleo; marketing fuera de barra; ruta atenuada', () => {
    const m = load('1');
    expect(m.getTabTreatment('calendario')).toBe('core');
    expect(m.isTabInBar('marketing')).toBe(false);
    expect(m.isTabAttenuated('rutas')).toBe(true);
    expect(m.isTabInBar('menu')).toBe(true);
  });

  it('Fase 1: orden de pestañas visibles excluye marketing', () => {
    const m = load('1');
    const order = m.getOrderedTabModuleIdsForPhase();
    expect(order).not.toContain('marketing');
    expect(order).toContain('calendario');
  });

  it('Fase 2: marketing en barra; sin atenuación en rutas', () => {
    const m = load('2');
    expect(m.isTabInBar('marketing')).toBe(true);
    expect(m.isTabAttenuated('rutas')).toBe(false);
  });

  it('Fase 1: banner de ruta atenuada', () => {
    const m = load('1');
    const b = m.showPhaseBannerForCurrentRoute('Navegacion');
    expect(b.show).toBe(true);
    expect(b.text).toMatch(/Fase 1/);
  });

  it('Fase 1: banner de núcleo en calendario con opción', () => {
    const m = load('1');
    const b = m.showPhaseBannerForCurrentRoute('Calendario', {
      showOnCoreInBeta: true,
    });
    expect(b.show).toBe(true);
  });

  it('Fase 2: sin banner genérico de fase en rutas atenuadas', () => {
    const m = load('2');
    const b = m.showPhaseBannerForCurrentRoute('Navegacion');
    expect(b.show).toBe(false);
  });
});

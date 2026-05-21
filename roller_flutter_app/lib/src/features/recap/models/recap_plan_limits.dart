/// Límites por plan (paridad con `RecapTestScreen.tsx` / checkout).
abstract final class RecapPlanLimits {
  static const defaultPlanId = 'gratis0';

  static int maxPhotos(String planId) {
    switch (planId) {
      case 'pase25':
        return 15;
      case 'plus59':
      case 'plus479':
        return 60;
      case 'gratis0':
      default:
        return 5;
    }
  }

  /// Fotos dibujadas en el lienzo del video (esquinas + opcional centro).
  static int maxPhotosInVideo(String planId) => maxPhotos(planId).clamp(1, 5);

  static String planLabel(String planId) {
    switch (planId) {
      case 'pase25':
        return 'Pase Único';
      case 'plus59':
        return 'Plus';
      case 'plus479':
        return 'Plus Anual';
      default:
        return 'Gratis';
    }
  }
}

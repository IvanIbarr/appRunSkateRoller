import 'models/recap_input.dart';
import 'models/recap_photo.dart';
import 'models/recap_plan_limits.dart';

/// Estado del flujo recap entre pantallas (plan, fotos, último input de ruta).
abstract final class RecapFlowCache {
  static RecapInput? lastInput;
  static String planId = RecapPlanLimits.defaultPlanId;
  static final List<RecapPhoto> photos = [];

  static void setPlan(String id) => planId = id;

  static void clearPhotos() {
    for (final p in photos) {
      p.dispose();
    }
    photos.clear();
  }

  static void resetSession() {
    lastInput = null;
    planId = RecapPlanLimits.defaultPlanId;
    clearPhotos();
  }
}

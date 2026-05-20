import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'perfil_repository.dart';

/// Perfil actual (`GET /auth/me`). Invalidar tras cambiar avatar o foto.
final currentMeProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.watch(perfilRepositoryProvider).me();
});

void invalidateCurrentMe(WidgetRef ref) {
  ref.invalidate(currentMeProvider);
}

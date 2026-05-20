import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../perfil/data/perfil_repository.dart';
import '../../seguimiento/data/seguimiento_repository.dart' as seg;
import 'seguimiento_repository.dart' as hist;

final historialPeriodProvider = StateProvider<String>((ref) => 'all');
final historialLeaderboardPeriodProvider = StateProvider<String>((ref) => 'week');

final historialMeProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.watch(perfilRepositoryProvider).me();
});

final historialRecorridosProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final period = ref.watch(historialPeriodProvider);
  return ref.watch(hist.seguimientoRepositoryProvider).getHistory(period: period);
});

final historialUserStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final period = ref.watch(historialPeriodProvider);
  return ref.watch(_segRepoProvider).userStats(period: period);
});

final historialLeaderboardProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final period = ref.watch(historialLeaderboardPeriodProvider);
  return ref.watch(_segRepoProvider).leaderboard(period: period, limit: 10);
});

final _segRepoProvider = Provider<seg.SeguimientoRepository>((ref) {
  return seg.SeguimientoRepository(ref.watch(dioProvider));
});

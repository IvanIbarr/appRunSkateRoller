import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_config.dart';
import '../auth/auth_session.dart';

final dioProvider = Provider<Dio>((ref) {
  final session = ref.watch(authSessionProvider).valueOrNull;
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl(isWeb: kIsWeb),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        if (session != null) 'Authorization': 'Bearer ${session.token}',
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (e, handler) {
        handler.next(e);
      },
    ),
  );

  return dio;
});

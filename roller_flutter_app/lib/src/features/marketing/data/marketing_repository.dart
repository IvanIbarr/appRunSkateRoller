import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class MarketingRepository {
  MarketingRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> listSales() async {
    final res = await _dio.get('/marketing/sales');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('Respuesta inválida de marketing');
    }
    final list = data['sales'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> createSale({
    required String brandModel,
    required String category,
    required String priceMx,
    bool homeDelivery = false,
    int deliveryFeeMx = 0,
    String saleType = 'gratis',
    int listingFeeMx = 0,
    List<String> photoUris = const [],
  }) async {
    final res = await _dio.post(
      '/marketing/sales',
      data: {
        'brandModel': brandModel,
        'category': category,
        'priceMx': priceMx,
        'homeDelivery': homeDelivery,
        'deliveryFeeMx': deliveryFeeMx,
        'saleType': saleType,
        'listingFeeMx': listingFeeMx,
        if (photoUris.isNotEmpty) 'photoUris': photoUris,
      },
    );
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception((data is Map ? data['error'] : null) ?? 'Error publicando');
    }
    final sale = data['sale'];
    if (sale is! Map) throw Exception('Respuesta inválida (sale)');
    return Map<String, dynamic>.from(sale);
  }
}

final marketingRepositoryProvider = Provider<MarketingRepository>((ref) {
  return MarketingRepository(ref.watch(dioProvider));
});


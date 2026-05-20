class MarketingSellDraft {
  MarketingSellDraft({
    this.brandDetails = '',
    this.category,
    this.priceMx = '',
    this.homeDelivery = false,
    this.deliveryFeeMx = 0,
    this.saleType = 'gratis',
    this.listingFeeMx = 0,
    this.photoUris = const [],
    this.condition,
  });

  final String brandDetails;
  final String? category;
  final String priceMx;
  final bool homeDelivery;
  final int deliveryFeeMx;
  final String saleType;
  final int listingFeeMx;
  final List<String> photoUris;
  final String? condition;

  MarketingSellDraft copyWith({
    String? brandDetails,
    String? category,
    String? priceMx,
    bool? homeDelivery,
    int? deliveryFeeMx,
    String? saleType,
    int? listingFeeMx,
    List<String>? photoUris,
    String? condition,
  }) {
    return MarketingSellDraft(
      brandDetails: brandDetails ?? this.brandDetails,
      category: category ?? this.category,
      priceMx: priceMx ?? this.priceMx,
      homeDelivery: homeDelivery ?? this.homeDelivery,
      deliveryFeeMx: deliveryFeeMx ?? this.deliveryFeeMx,
      saleType: saleType ?? this.saleType,
      listingFeeMx: listingFeeMx ?? this.listingFeeMx,
      photoUris: photoUris ?? this.photoUris,
      condition: condition ?? this.condition,
    );
  }
}

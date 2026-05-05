class MarketingSellDraft {
  MarketingSellDraft({
    this.brandDetails = '',
    this.category,
    this.priceMx = '',
    this.homeDelivery = false,
    this.deliveryFeeMx = 0,
    this.saleType = 'gratis',
    this.listingFeeMx = 0,
  });

  final String brandDetails;
  final String? category;
  final String priceMx;
  final bool homeDelivery;
  final int deliveryFeeMx;
  final String saleType;
  final int listingFeeMx;

  MarketingSellDraft copyWith({
    String? brandDetails,
    String? category,
    String? priceMx,
    bool? homeDelivery,
    int? deliveryFeeMx,
    String? saleType,
    int? listingFeeMx,
  }) {
    return MarketingSellDraft(
      brandDetails: brandDetails ?? this.brandDetails,
      category: category ?? this.category,
      priceMx: priceMx ?? this.priceMx,
      homeDelivery: homeDelivery ?? this.homeDelivery,
      deliveryFeeMx: deliveryFeeMx ?? this.deliveryFeeMx,
      saleType: saleType ?? this.saleType,
      listingFeeMx: listingFeeMx ?? this.listingFeeMx,
    );
  }
}


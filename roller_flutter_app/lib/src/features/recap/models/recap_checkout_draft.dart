class RecapCheckoutDraft {
  RecapCheckoutDraft({
    required this.planId,
    required this.planTitle,
    required this.amountMx,
    this.buyerName,
    this.buyerEmail,
    this.buyerPhone,
    this.formaPago,
  });

  final String planId;
  final String planTitle;
  final int amountMx;
  final String? buyerName;
  final String? buyerEmail;
  final String? buyerPhone;
  final String? formaPago;

  RecapCheckoutDraft copyWith({
    String? buyerName,
    String? buyerEmail,
    String? buyerPhone,
    String? formaPago,
  }) {
    return RecapCheckoutDraft(
      planId: planId,
      planTitle: planTitle,
      amountMx: amountMx,
      buyerName: buyerName ?? this.buyerName,
      buyerEmail: buyerEmail ?? this.buyerEmail,
      buyerPhone: buyerPhone ?? this.buyerPhone,
      formaPago: formaPago ?? this.formaPago,
    );
  }
}


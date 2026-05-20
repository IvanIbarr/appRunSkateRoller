import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:roller_flutter_app/src/app.dart';

void main() {
  testWidgets('Muestra pantalla de login al iniciar', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: RollerApp()));
    await tester.pumpAndSettle();
    expect(find.text('Roller - Login'), findsOneWidget);
  });
}

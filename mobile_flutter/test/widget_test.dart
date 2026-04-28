import 'package:flutter_test/flutter_test.dart';
import 'package:ticketops_mobile/main.dart';

void main() {
  testWidgets('shows TicketOps login screen', (tester) async {
    await tester.pumpWidget(const TicketOpsMobileApp());

    expect(find.text('TicketOps'), findsOneWidget);
    expect(find.text('Enter mobile command'), findsOneWidget);
  });
}

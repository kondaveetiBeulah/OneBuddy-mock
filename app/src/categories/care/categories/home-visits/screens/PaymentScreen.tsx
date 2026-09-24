import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useBooking } from '../context/BookingContext';
import PaymentCheckoutScreen from '../../../../food/components/cart/PaymentCheckoutScreen';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

export function PaymentScreen({ navigation }: Props) {
  const { selectedDoctor, choosePayment, confirmBooking } = useBooking();
  const fee = selectedDoctor?.fee ?? 0;
  const totalAmount = fee + 50;

  return (
    <View style={styles.container}>
      <PaymentCheckoutScreen
        grandTotal={totalAmount}
        hideCOD={true}
        hideReceiptModal={true}
        title="Home Visit Payment"
        subtitle="256-bit Encrypted • Certified Healthcare"
        onBack={() => navigation.goBack()}
        onOrderSuccess={(details) => {
          // Map the detailed payment label to a proper PaymentMode type
          const rawLabel: string = details?.paymentModeLabel || '';
          const lowerLabel = rawLabel.toLowerCase();

          // Determine the correct PaymentMode based on the label from checkout
          let paymentMode: 'UPI' | 'Card' | 'Cash on Visit';
          if (lowerLabel.includes('card') || lowerLabel.includes('visa') || lowerLabel.includes('mastercard') || lowerLabel.includes('amex') || lowerLabel.includes('rupay')) {
            paymentMode = 'Card';
          } else if (lowerLabel.includes('cod') || lowerLabel.includes('cash')) {
            paymentMode = 'Cash on Visit';
          } else {
            // UPI, Net Banking, Wallet — all count as online payment (mapped to 'UPI')
            paymentMode = 'UPI';
          }

          choosePayment(paymentMode);
          confirmBooking(paymentMode);
          navigation.navigate('Confirmation');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

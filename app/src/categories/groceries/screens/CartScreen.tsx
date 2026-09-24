import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { CartScreen as CartScreenComponent } from '../components/CartScreen';

type CartScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  return (
    <CartScreenComponent
      navigation={navigation}
      onProceed={(totalAmount, couponDiscount = 0, tip = 0) =>
        navigation.navigate('Payment', {
          grandTotal: totalAmount,
          couponDiscount,
          tip,
        })
      }
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main');
        }
      }}
    />
  );
};

export default CartScreen;

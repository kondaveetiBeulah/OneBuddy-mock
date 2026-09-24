import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { styles } from '../theme/styles';
import { formatRupees, MOCK_TRANSACTIONS } from '../data/mockData';

export function WalletModal({
  visible,
  balance,
  onClose,
  onAddMoney,
}: {
  visible: boolean;
  balance: number;
  onClose: () => void;
  onAddMoney: () => void;
}) {
  return (
    <BottomSheet visible={visible} title="Wallet" onClose={onClose}>
      <Text style={styles.amountBig}>{formatRupees(balance)}</Text>
      <Text style={styles.amountCurrency}>Available balance</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={onAddMoney}>
        <Text style={styles.primaryBtnText}>Add money</Text>
      </TouchableOpacity>

      <Text style={[styles.inputLabel, { marginTop: 20 }]}>RECENT ACTIVITY</Text>
      <ScrollView style={{ maxHeight: 220, marginTop: 4 }} showsVerticalScrollIndicator={false}>
        {MOCK_TRANSACTIONS.map((txn, index) => (
          <View key={txn.id} style={[styles.txnRow, index === MOCK_TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.txnTitle}>{txn.title}</Text>
              <Text style={styles.txnDate}>{txn.date}</Text>
            </View>
            <Text style={[styles.txnAmount, txn.amount >= 0 ? styles.txnAmountPositive : styles.txnAmountNegative]}>
              {txn.amount >= 0 ? '+' : '-'}
              {formatRupees(Math.abs(txn.amount))}
            </Text>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

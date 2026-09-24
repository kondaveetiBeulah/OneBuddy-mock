import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../../context/CartContext';

export const ConflictModal: React.FC = () => {
    const { conflictModalState, resolveConflict, currentRestaurant } = useCart();

    if (!conflictModalState.isOpen || !conflictModalState.pendingRestaurant || !currentRestaurant) return null;

    return (
        <Modal
            visible={conflictModalState.isOpen}
            transparent
            animationType="fade"
            onRequestClose={() => resolveConflict(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Replace cart item?</Text>
                    <Text style={styles.description}>
                        Your cart contains dishes from {currentRestaurant.name}. Do you want to discard the selection and add dishes from {conflictModalState.pendingRestaurant.name}?
                    </Text>
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, styles.btnNo]} onPress={() => resolveConflict(false)}>
                            <Text style={styles.btnTextNo}>No</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnReplace]} onPress={() => resolveConflict(true)}>
                            <Text style={styles.btnTextReplace}>Replace</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnNo: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    btnReplace: {
        backgroundColor: '#F43F5E',
    },
    btnTextNo: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnTextReplace: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

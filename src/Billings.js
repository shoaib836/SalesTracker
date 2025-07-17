import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Billings = () => {
  const navigation = useNavigation();
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [newBill, setNewBill] = useState({
    vendor: '',
    amount: '',
    month: '',
    description: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedBills = await AsyncStorage.getItem('@company_bills');
        if (storedBills !== null) {
          setBills(JSON.parse(storedBills));
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save bills to storage whenever they change
  useEffect(() => {
    const saveBills = async () => {
      try {
        await AsyncStorage.setItem('@company_bills', JSON.stringify(bills));
      } catch (error) {
        console.error('Failed to save bills', error);
      }
    };

    if (!isLoading) {
      saveBills();
    }
  }, [bills, isLoading]);

  const addBill = async () => {
    if (!newBill.vendor || !newBill.amount || !newBill.month) {
      return;
    }

    const amountValue = parseFloat(newBill.amount);
    if (isNaN(amountValue)) return;

    const bill = {
      id: Date.now().toString(),
      vendor: newBill.vendor,
      amount: amountValue,
      month: newBill.month,
      description: newBill.description,
      date: new Date().toISOString(),
    };

    // Update bills state and storage
    const updatedBills = [bill, ...bills];
    setBills(updatedBills);
    await AsyncStorage.setItem('@company_bills', JSON.stringify(updatedBills));

    // Deduct from company balance (local state)
    const currentBalance = await AsyncStorage.getItem('@current_balance');
    const newBalance = parseFloat(currentBalance || 0) - amountValue;
    await AsyncStorage.setItem('@current_balance', newBalance.toString());

    // Reset form and close modal
    setNewBill({
      vendor: '',
      amount: '',
      month: '',
      description: '',
    });
    setShowAddBillModal(false);
  };

  const confirmDeleteBill = id => {
    setBillToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteBill = async () => {
    if (!billToDelete) return;

    const bill = bills.find(b => b.id === billToDelete);
    if (!bill) return;

    // Update bills state and storage
    const updatedBills = bills.filter(b => b.id !== billToDelete);
    setBills(updatedBills);
    await AsyncStorage.setItem('@company_bills', JSON.stringify(updatedBills));

    // Restore to company balance (local state)
    const currentBalance = await AsyncStorage.getItem('@current_balance');
    const newBalance = parseFloat(currentBalance || 0) + bill.amount;
    await AsyncStorage.setItem('@current_balance', newBalance.toString());

    // Reset delete state and close modal
    setBillToDelete(null);
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6a11cb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Monthly Bills</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bills List */}
      <FlatList
        data={bills}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.billCard}>
            <View style={styles.billHeader}>
              <Text style={styles.billVendor}>{item.vendor}</Text>
              <Text style={styles.billAmount}>
                Rs. {item.amount.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.billMonth}>{item.month}</Text>
            {item.description ? (
              <Text style={styles.billDescription}>{item.description}</Text>
            ) : null}
            <View style={styles.billFooter}>
              <Text style={styles.billDate}>
                Added: {new Date(item.date).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => confirmDeleteBill(item.id)}
                style={styles.deleteButton}
              >
                <Icon name="delete" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={48} color="#6a11cb" />
            <Text style={styles.emptyText}>No bills recorded yet</Text>
          </View>
        }
      />

      {/* Add Bill Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddBillModal(true)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Bill Modal */}
      <Modal
        visible={showAddBillModal}
        animationType="slide"
        onRequestClose={() => setShowAddBillModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddBillModal(false)}>
                  <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add New Bill</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Vendor Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter vendor name"
                      value={newBill.vendor}
                      onChangeText={text =>
                        setNewBill({ ...newBill, vendor: text })
                      }
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Amount (Rs.) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      value={newBill.amount}
                      onChangeText={text =>
                        setNewBill({ ...newBill, amount: text })
                      }
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Month *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter month (e.g., March 2025)"
                      value={newBill.month}
                      onChangeText={text =>
                        setNewBill({ ...newBill, month: text })
                      }
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, { height: 80 }]}
                      placeholder="Enter description (optional)"
                      multiline
                      value={newBill.description}
                      onChangeText={text =>
                        setNewBill({ ...newBill, description: text })
                      }
                    />
                  </View>

                  <Pressable
                    style={styles.submitButton}
                    onPress={addBill}
                    android_ripple={{ color: '#4a00e0' }}
                  >
                    <Text style={styles.submitButtonText}>Add Bill</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <Icon name="warning" size={32} color="#FFA000" />
              <Text style={styles.confirmTitle}>Confirm Delete</Text>
            </View>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this bill?
            </Text>
            <View style={styles.confirmButtonRow}>
              <Pressable
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                android_ripple={{ color: '#e0e0e0' }}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.deleteConfirm]}
                onPress={deleteBill}
                android_ripple={{ color: '#d32f2f' }}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#6a11cb',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billVendor: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
  },
  billMonth: {
    fontSize: 14,
    color: '#6a11cb',
    marginBottom: 8,
  },
  billDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billDate: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6a11cb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#6a11cb',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#6a11cb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmModal: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 16,
    padding: 24,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFA000',
    marginLeft: 12,
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteConfirm: {
    backgroundColor: '#d32f2f',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40, // Add some padding at the bottom
  },
  formContainer: {
    padding: 16,
    flex: 1, // Ensure form takes available space
  },
});

export default Billings;

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Expenditures = () => {
  const navigation = useNavigation();
  const [months, setMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [newExpenditure, setNewExpenditure] = useState({
    description: '',
    amount: '',
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenditureToDelete, setExpenditureToDelete] = useState(null);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Function to get current month and year
  const getCurrentMonthYear = () => {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    return `${monthName} ${year}`;
  };

  // Function to check if month exists
  const monthExists = (monthList, monthYear) => {
    return monthList.some(month => month.name === monthYear);
  };

  // Load months from storage
  useEffect(() => {
    const loadMonths = async () => {
      try {
        const storedMonths = await AsyncStorage.getItem(
          '@monthly_expenditures',
        );
        if (storedMonths !== null) {
          const parsedMonths = JSON.parse(storedMonths);
          const currentMonthYear = getCurrentMonthYear();

          // Add current month if it doesn't exist
          if (!monthExists(parsedMonths, currentMonthYear)) {
            const newMonth = {
              id: Date.now().toString(),
              name: currentMonthYear,
              total: 0,
            };
            const updatedMonths = [newMonth, ...parsedMonths];
            setMonths(updatedMonths);
            await AsyncStorage.setItem(
              '@monthly_expenditures',
              JSON.stringify(updatedMonths),
            );
          } else {
            setMonths(parsedMonths);
          }
        } else {
          // Initialize with default months if no data exists
          const defaultMonths = [
            { id: '1', name: 'June 2025', total: 0 },
            { id: '2', name: 'May 2025', total: 0 },
            { id: '3', name: 'April 2025', total: 0 },
            { id: '4', name: 'March 2025', total: 0 },
          ];
          setMonths(defaultMonths);
          await AsyncStorage.setItem(
            '@monthly_expenditures',
            JSON.stringify(defaultMonths),
          );
        }
      } catch (error) {
        console.error('Failed to load months', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonths();

    // Set up monthly check for new month
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1) {
        const checkNewMonth = async () => {
          const currentMonthYear = getCurrentMonthYear();
          const storedMonths = await AsyncStorage.getItem(
            '@monthly_expenditures',
          );
          if (storedMonths) {
            const parsedMonths = JSON.parse(storedMonths);
            if (!monthExists(parsedMonths, currentMonthYear)) {
              const newMonth = {
                id: Date.now().toString(),
                name: currentMonthYear,
                total: 0,
              };
              const updatedMonths = [newMonth, ...parsedMonths];
              setMonths(updatedMonths);
              await AsyncStorage.setItem(
                '@monthly_expenditures',
                JSON.stringify(updatedMonths),
              );
            }
          }
        };
        checkNewMonth();
      }
    }, 86400000); // Check once per day

    return () => clearInterval(interval);
  }, []);

  // Load expenditures when a month is selected
  const handleMonthPress = async month => {
    setSelectedMonth(month);
    try {
      const storedExpenditures = await AsyncStorage.getItem(
        `@expenditures_${month.id}`,
      );
      if (storedExpenditures !== null) {
        setExpenditures(JSON.parse(storedExpenditures));
      } else {
        setExpenditures([]);
      }
      setShowExpenditureModal(true);
    } catch (error) {
      console.error('Failed to load expenditures', error);
      setExpenditures([]);
      setShowExpenditureModal(true);
    }
  };

  // Save expenditures when they change
  useEffect(() => {
    const saveExpenditures = async () => {
      if (selectedMonth) {
        try {
          await AsyncStorage.setItem(
            `@expenditures_${selectedMonth.id}`,
            JSON.stringify(expenditures),
          );

          // Update month's total
          const total = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
          const updatedMonths = months.map(m =>
            m.id === selectedMonth.id ? { ...m, total } : m,
          );
          setMonths(updatedMonths);
          await AsyncStorage.setItem(
            '@monthly_expenditures',
            JSON.stringify(updatedMonths),
          );
        } catch (error) {
          console.error('Failed to save expenditures', error);
        }
      }
    };

    saveExpenditures();
  }, [expenditures]);

  // Deduct from balance
  const deductFromBalance = async amount => {
    try {
      const balanceData = await AsyncStorage.getItem('@current_balance');
      let currentBalance = balanceData ? parseFloat(balanceData) : 0;
      currentBalance -= amount;
      await AsyncStorage.setItem('@current_balance', currentBalance.toString());
      return true;
    } catch (error) {
      console.error('Failed to update balance', error);
      return false;
    }
  };

  // Add new expenditure
  const addExpenditure = async () => {
    if (
      !newExpenditure.description ||
      !newExpenditure.amount ||
      isNaN(newExpenditure.amount)
    ) {
      setErrorMessage('Please enter valid description and amount');
      setShowErrorModal(true);
      return;
    }
  
    const amount = parseFloat(newExpenditure.amount);
    if (amount <= 0) {
      setErrorMessage('Amount must be positive');
      setShowErrorModal(true);
      return;
    }
  
    // Deduct from balance
    const success = await deductFromBalance(amount);
    if (!success) {
      setErrorMessage('Failed to update balance');
      setShowErrorModal(true);
      return;
    }
  
    const newExp = {
      id: Date.now().toString(),
      description: newExpenditure.description,
      amount: amount,
      date: new Date().toLocaleDateString(),
    };
  
    setExpenditures([...expenditures, newExp]);
    setNewExpenditure({ description: '', amount: '' });
  };

  // Delete expenditure
  // Replace direct delete calls with confirmation modal:
  const confirmDeleteExpenditure = id => {
    setExpenditureToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteExpenditure = async () => {
    if (!expenditureToDelete) return;

    const expToDelete = expenditures.find(
      exp => exp.id === expenditureToDelete,
    );
    if (!expToDelete) return;

    // Add back to balance
    const success = await deductFromBalance(-expToDelete.amount);
    if (!success) {
      setErrorMessage('Failed to update balance');
      setShowErrorModal(true);
      return;
    }

    setExpenditures(expenditures.filter(exp => exp.id !== expenditureToDelete));
    setExpenditureToDelete(null);
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
        <Text style={styles.headerText}>Monthly Expenditures</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Months List */}
      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <FlatList
          data={months}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.monthCard}
              onPress={() => handleMonthPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.monthInfo}>
                <View style={styles.monthIcon}>
                  <Icon name="calendar-today" size={20} color="#6a11cb" />
                </View>
                <Text style={styles.monthName}>{item.name}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>
                  Rs. {(Number(item.total) || 0).toLocaleString()}
                </Text>
                <Icon name="chevron-right" size={24} color="#6a11cb" />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </Animated.View>

      {/* Expenditure Modal */}
      <Modal
        visible={showExpenditureModal}
        animationType="slide"
        onRequestClose={() => setShowExpenditureModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowExpenditureModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedMonth?.name} Expenditures
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {expenditures.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Icon name="receipt" size={48} color="#6a11cb" />
              </View>
              <Text style={styles.emptyText}>No expenditures recorded yet</Text>
            </View>
          ) : (
            <FlatList
              data={expenditures}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.expenditureItem}>
                  <View style={styles.expenditureInfo}>
                    <Text style={styles.expenditureDescription}>
                      {item.description}
                    </Text>
                    <Text style={styles.expenditureDate}>{item.date}</Text>
                  </View>
                  <View style={styles.expenditureAmountContainer}>
                    <Text style={styles.expenditureAmount}>
                      Rs. {(Number(item.amount) || 0).toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => confirmDeleteExpenditure(item.id)}
                      style={styles.deleteButton}
                    >
                      <Icon name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.expenditureList}
            />
          )}

          {/* Add Expenditure Form */}
          <View style={styles.addExpenditureContainer}>
            <Text style={styles.formTitle}>Add New Expenditure</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter description"
                placeholderTextColor="#888"
                value={newExpenditure.description}
                onChangeText={text =>
                  setNewExpenditure({ ...newExpenditure, description: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newExpenditure.amount}
                onChangeText={text =>
                  setNewExpenditure({ ...newExpenditure, amount: text })
                }
              />
            </View>
            <Pressable
              style={styles.addButton}
              onPress={addExpenditure}
              android_ripple={{ color: '#4a00e0' }}
            >
              <Text style={styles.addButtonText}>Add Expenditure</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.modalHeader}>
              <Icon name="error" size={32} color="#d32f2f" />
              <Text style={styles.modalTitle}>Error</Text>
            </View>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <Pressable
              style={[styles.modalButton, styles.okButton]}
              onPress={() => setShowErrorModal(false)}
              android_ripple={{ color: '#6a11cb' }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.modalHeader}>
              <Icon name="check-circle" size={32} color="#4CAF50" />
              <Text style={styles.modalTitle}>Success</Text>
            </View>
            <Text style={styles.modalText}>{successMessage}</Text>
            <Pressable
              style={[styles.modalButton, styles.okButton]}
              onPress={() => setShowSuccessModal(false)}
              android_ripple={{ color: '#6a11cb' }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
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
            <View style={styles.modalHeader}>
              <Icon name="warning" size={32} color="#FFA000" />
              <Text style={styles.modalTitle}>Confirm Delete</Text>
            </View>
            <Text style={styles.modalText}>
              Are you sure you want to delete this expenditure?
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                android_ripple={{ color: '#e0e0e0' }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.deleteConfirm]}
                onPress={deleteExpenditure}
                android_ripple={{ color: '#d32f2f' }}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Delete
                </Text>
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
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  monthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthIcon: {
    backgroundColor: 'rgba(106, 17, 203, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6a11cb',
    marginRight: 8,
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
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    backgroundColor: 'rgba(106, 17, 203, 0.1)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  expenditureList: {
    padding: 16,
  },
  expenditureItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  expenditureInfo: {
    flex: 1,
  },
  expenditureDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenditureDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  expenditureAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenditureAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6a11cb',
    marginRight: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addExpenditureContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6a11cb',
    marginBottom: 16,
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
  addButton: {
    backgroundColor: '#6a11cb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  addButtonText: {
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  okButton: {
    backgroundColor: '#6a11cb',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirm: {
    backgroundColor: '#d32f2f',
  },
});

export default Expenditures;

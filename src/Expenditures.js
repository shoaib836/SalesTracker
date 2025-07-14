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
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
        // First day of month
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

  // const resetDefaultMonths = async () => {
  //   try {
  //     const defaultMonths = [
  //       { id: '1', name: 'June 2025', total: 0 },
  //       { id: '2', name: 'May 2025', total: 0 },
  //       { id: '3', name: 'April 2025', total: 0 },
  //       { id: '4', name: 'March 2025', total: 0 },
  //     ];

  //     await AsyncStorage.removeItem('@monthly_expenditures');
  //     await AsyncStorage.setItem(
  //       '@monthly_expenditures',
  //       JSON.stringify(defaultMonths),
  //     );
  //     setMonths(defaultMonths);
  //     console.log('Default months reset successfully');
  //   } catch (error) {
  //     console.error('Error resetting default months', error);
  //   }
  // };

  // // Call this function when you want to reset
  // resetDefaultMonths();

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

  // Add this function to Expenditures.js
  const deductFromBalance = async amount => {
    try {
      const balanceData = await AsyncStorage.getItem('@current_balance');
      let currentBalance = balanceData ? parseFloat(balanceData) : 800000;

      // For adding expenditure (amount is positive), we deduct from balance
      // For deleting expenditure (amount is negative), we add back to balance
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
      Alert.alert('Error', 'Please enter valid description and amount');
      return;
    }

    const amount = parseFloat(newExpenditure.amount);
    if (amount <= 0) {
      Alert.alert('Error', 'Amount must be positive');
      return;
    }

    // Deduct from balance (pass positive amount to deduct)
    const success = await deductFromBalance(amount);
    if (!success) {
      Alert.alert('Error', 'Failed to update balance');
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
  const deleteExpenditure = async id => {
    const expenditureToDelete = expenditures.find(exp => exp.id === id);
    if (!expenditureToDelete) return;

    // Add back to balance (pass negative amount to add back)
    const success = await deductFromBalance(-expenditureToDelete.amount);
    if (!success) {
      Alert.alert('Error', 'Failed to update balance');
      return;
    }

    setExpenditures(expenditures.filter(exp => exp.id !== id));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Monthly Expenditures</Text>
        <View></View>
      </View>

      {/* Months List */}
      <FlatList
        data={months}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.monthCard}
            onPress={() => handleMonthPress(item)}
          >
            <Text style={styles.monthName}>{item.name}</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>
                Rs. {item.total.toLocaleString()}
              </Text>
              <Icon name="chevron-right" size={24} color="#666" />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {/* Expenditure Modal */}
      <Modal
        visible={showExpenditureModal}
        animationType="slide"
        onRequestClose={() => setShowExpenditureModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowExpenditureModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedMonth?.name} Expenditures
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {expenditures.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color="#ccc" />
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
                      Rs. {item.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteExpenditure(item.id)}
                    >
                      <Icon name="delete" size={20} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.expenditureList}
            />
          )}

          {/* Add Expenditure Form */}
          <View style={styles.addExpenditureContainer}>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newExpenditure.description}
              onChangeText={text =>
                setNewExpenditure({ ...newExpenditure, description: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={newExpenditure.amount}
              onChangeText={text =>
                setNewExpenditure({ ...newExpenditure, amount: text })
              }
            />
            <Pressable style={styles.addButton} onPress={addExpenditure}>
              <Text style={styles.addButtonText}>Add Expenditure</Text>
            </Pressable>
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
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  listContainer: {
    padding: 16,
  },
  monthCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
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
  expenditureList: {
    padding: 16,
  },
  expenditureItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenditureInfo: {
    flex: 1,
  },
  expenditureDescription: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  expenditureDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  expenditureAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenditureAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginRight: 12,
  },
  addExpenditureContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Expenditures;

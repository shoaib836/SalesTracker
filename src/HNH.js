import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HNH = () => {
  const navigation = useNavigation();
  const [months, setMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState({
    id: null,
    productName: '',
    amountReceived: '',
    productionCost: '',
    deliveryCost: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

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

  const monthExists = (monthList, monthYear) => {
    return monthList.some(month => month.name === monthYear);
  };

  const getCurrentMonthYear = () => {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    return `${monthName} ${year}`;
  };

  // Initialize with sample data if empty
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedMonths = await AsyncStorage.getItem('@hnh_months');
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

    loadData();
  }, []);

  const handleMonthPress = async month => {
    setSelectedMonth(month);
    try {
      const storedEntries = await AsyncStorage.getItem(
        `@hnh_entries_${month.id}`,
      );
      setEntries(storedEntries ? JSON.parse(storedEntries) : []);
      setShowEntryModal(true);
    } catch (error) {
      console.error('Failed to load entries', error);
      setEntries([]);
      setShowEntryModal(true);
    }
  };

  const saveEntries = async () => {
    if (!selectedMonth) return;

    try {
      await AsyncStorage.setItem(
        `@hnh_entries_${selectedMonth.id}`,
        JSON.stringify(entries),
      );

      // Update month summary
      const updatedMonths = months.map(m => {
        if (m.id === selectedMonth.id) {
          const income = entries.reduce(
            (sum, entry) => sum + parseFloat(entry.amountReceived || 0),
            0,
          );
          const cost = entries.reduce(
            (sum, entry) =>
              sum +
              (parseFloat(entry.productionCost || 0) +
                parseFloat(entry.deliveryCost || 0)),
            0,
          );
          return {
            ...m,
            orders: entries.length,
            income,
            cost,
            profit: income - cost,
          };
        }
        return m;
      });

      setMonths(updatedMonths);
      await AsyncStorage.setItem('@hnh_months', JSON.stringify(updatedMonths));
    } catch (error) {
      console.error('Failed to save entries', error);
    }
  };

  useEffect(() => {
    saveEntries();
  }, [entries]);

  const handleAddEntry = () => {
    setCurrentEntry({
      id: null,
      productName: '',
      amountReceived: '',
      productionCost: '',
      deliveryCost: '',
    });
    setIsEditing(false);
    setShowAddEditModal(true);
  };

  const handleEditEntry = entry => {
    setCurrentEntry({
      id: entry.id,
      productName: entry.productName,
      amountReceived: entry.amountReceived.toString(),
      productionCost: entry.productionCost
        ? entry.productionCost.toString()
        : '',
      deliveryCost: entry.deliveryCost ? entry.deliveryCost.toString() : '',
    });
    setIsEditing(true);
    setShowAddEditModal(true);
  };

  const saveEntry = () => {
    if (!currentEntry.productName || !currentEntry.amountReceived) {
      setErrorMessage('Product name and amount received are required');
      setShowErrorModal(true);
      return;
    }

    const entry = {
      id: currentEntry.id || Date.now().toString(),
      productName: currentEntry.productName,
      amountReceived: parseFloat(currentEntry.amountReceived),
      productionCost: currentEntry.productionCost
        ? parseFloat(currentEntry.productionCost)
        : 0,
      deliveryCost: currentEntry.deliveryCost
        ? parseFloat(currentEntry.deliveryCost)
        : 0,
      date: new Date().toLocaleDateString(),
    };

    if (isEditing) {
      setEntries(entries.map(e => (e.id === entry.id ? entry : e)));
    } else {
      setEntries([...entries, entry]);
    }

    setShowAddEditModal(false);
  };

  const confirmDeleteEntry = id => {
    setEntryToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteEntry = () => {
    if (!entryToDelete) return;
    setEntries(entries.filter(entry => entry.id !== entryToDelete));
    setEntryToDelete(null);
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
        <Text style={styles.headerText}>HideNHaute</Text>
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
              <View style={styles.monthHeader}>
                <View style={styles.monthIcon}>
                  <Icon name="calendar-today" size={20} color="#6a11cb" />
                </View>
                <Text style={styles.monthName}>{item.name}</Text>
              </View>
              <View style={styles.monthDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Orders</Text>
                  <Text style={styles.detailValue}>{item.orders}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Income</Text>
                  <Text style={styles.detailValue}>
                    Rs. {(Number(item.income) || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Cost</Text>
                  <Text style={styles.detailValue}>
                    Rs. {(Number(item.cost) || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Profit</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: item.profit >= 0 ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    Rs. {(Number(item.profit) || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </Animated.View>

      {/* Entries Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowEntryModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedMonth?.name} Entries</Text>
            <View style={{ width: 24 }} />
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Icon name="receipt" size={48} color="#6a11cb" />
              </View>
              <Text style={styles.emptyText}>No entries recorded yet</Text>
            </View>
          ) : (
            <FlatList
              data={entries}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.entryItem}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryProduct}>{item.productName}</Text>
                    <Text style={styles.entryDate}>{item.date}</Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryDetailText}>
                        Received: Rs. {item.amountReceived.toLocaleString()}
                      </Text>
                      <Text style={styles.entryDetailText}>
                        Cost: Rs.{' '}
                        {(
                          item.productionCost + item.deliveryCost
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      onPress={() => handleEditEntry(item)}
                      style={styles.editButton}
                    >
                      <Icon name="edit" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteEntry(item.id)}
                      style={styles.deleteButton}
                    >
                      <Icon name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.entryList}
            />
          )}

          <Pressable
            style={styles.addButton}
            onPress={handleAddEntry}
            android_ripple={{ color: '#4a00e0' }}
          >
            <Text style={styles.addButtonText}>Add New Entry</Text>
            <Icon name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      {/* Add/Edit Entry Modal */}
      <Modal
        visible={showAddEditModal}
        animationType="slide"
        onRequestClose={() => setShowAddEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddEditModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Entry' : 'Add New Entry'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                placeholderTextColor="#888"
                value={currentEntry.productName}
                onChangeText={text =>
                  setCurrentEntry({ ...currentEntry, productName: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount Received (Rs.) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount received"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentEntry.amountReceived}
                onChangeText={text =>
                  setCurrentEntry({ ...currentEntry, amountReceived: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Production Cost (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter production cost"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentEntry.productionCost}
                onChangeText={text =>
                  setCurrentEntry({ ...currentEntry, productionCost: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Delivery Cost (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter delivery cost"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentEntry.deliveryCost}
                onChangeText={text =>
                  setCurrentEntry({ ...currentEntry, deliveryCost: text })
                }
              />
            </View>

            <Pressable
              style={styles.submitButton}
              onPress={saveEntry}
              android_ripple={{ color: '#4a00e0' }}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Entry' : 'Save Entry'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Error Modal */}
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
              Are you sure you want to delete this entry?
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                android_ripple={{ color: '#e0e0e0' }}
              >
                <Text style={[styles.modalButtonText, { color: '#333' }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.deleteConfirm]}
                onPress={deleteEntry}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthIcon: {
    backgroundColor: 'rgba(106, 17, 203, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  monthDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
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
  entryList: {
    padding: 16,
  },
  entryItem: {
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
  entryInfo: {
    flex: 1,
  },
  entryProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entryDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  entryDetails: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryDetailText: {
    fontSize: 14,
    color: '#555',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#6a11cb',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#6a11cb',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 10,
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
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
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
  deleteConfirm: {
    backgroundColor: '#d32f2f',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HNH;

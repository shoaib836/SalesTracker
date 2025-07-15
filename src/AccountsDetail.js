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
  Animated,
  Easing,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountsDetail = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // State for accounts
  const [accounts, setAccounts] = useState([
    {
      id: '1',
      name: 'HNH',
      description: 'HideNHaute',
      color: '#6a11cb',
      months: [],
    },
    {
      id: '2',
      name: 'HSH',
      description: 'HandStitchHide',
      color: '#2575fc',
      months: [],
    },
    {
      id: '3',
      name: 'TLV',
      description: 'TheLeatherValley',
      color: '#11cbcb',
      months: [],
    },
  ]);

  // State for HNH functionality
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    description: '',
    color: '#6a11cb', // Default color
  });

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

    // Load data for all accounts
    loadAllAccountsData();
  }, []);

  const loadAllAccountsData = async () => {
    try {
      const storedAccounts = await AsyncStorage.getItem('@all_accounts');
      if (storedAccounts) {
        let parsedAccounts = JSON.parse(storedAccounts);

        // Add current month to each account if it doesn't exist
        parsedAccounts = parsedAccounts.map(account => ({
          ...account,
          months: addCurrentMonthIfNeeded(account),
        }));

        setAccounts(parsedAccounts);
        await AsyncStorage.setItem(
          '@all_accounts',
          JSON.stringify(parsedAccounts),
        );
      } else {
        // Initialize with default data if no data exists
        await initializeDefaultData();
      }
    } catch (error) {
      console.error('Failed to load accounts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultData = async () => {
    const currentMonthYear = getCurrentMonthYear();
    const defaultAccounts = accounts.map(account => ({
      ...account,
      months: [
        {
          id: Date.now().toString(),
          name: currentMonthYear,
          orders: 0,
          income: 0,
          cost: 0,
          profit: 0,
        },
        {
          id: '1',
          name: 'June 2025',
          orders: 0,
          income: 0,
          cost: 0,
          profit: 0,
        },
      ],
    }));

    setAccounts(defaultAccounts);
    await AsyncStorage.setItem(
      '@all_accounts',
      JSON.stringify(defaultAccounts),
    );
  };

  const getCurrentMonthYear = () => {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    return `${monthName} ${year}`;
  };

  // Helper function to check if month exists
  const monthExists = (monthList, monthYear) => {
    return monthList.some(month => month.name === monthYear);
  };

  // Function to add current month if it doesn't exist
  const addCurrentMonthIfNeeded = account => {
    const currentMonthYear = getCurrentMonthYear();
    const monthAlreadyExists = monthExists(account.months, currentMonthYear);

    if (!monthAlreadyExists) {
      const newMonth = {
        id: Date.now().toString(),
        name: currentMonthYear,
        orders: 0,
        income: 0,
        cost: 0,
        profit: 0,
      };
      return [newMonth, ...account.months];
    }
    return account.months;
  };

  const handleAccountPress = account => {
    setSelectedAccount(account);
  };

  const handleMonthPress = async (account, month) => {
    setSelectedAccount(account);
    setSelectedMonth(month);
    try {
      const storedEntries = await AsyncStorage.getItem(
        `@entries_${account.id}_${month.id}`,
      );
      setEntries(storedEntries ? JSON.parse(storedEntries) : []);
      setShowEntryModal(true);
    } catch (error) {
      console.error('Failed to load entries', error);
      setEntries([]);
      setShowEntryModal(true);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.name) {
      setErrorMessage('Account name is required');
      setShowErrorModal(true);
      return;
    }

    const currentMonthYear = getCurrentMonthYear();
    const account = {
      id: Date.now().toString(),
      name: newAccount.name,
      description: newAccount.description,
      color: newAccount.color,
      months: [
        {
          id: Date.now().toString(),
          name: currentMonthYear,
          orders: 0,
          income: 0,
          cost: 0,
          profit: 0,
        },
      ],
    };

    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);

    try {
      await AsyncStorage.setItem(
        '@all_accounts',
        JSON.stringify(updatedAccounts),
      );
    } catch (error) {
      console.error('Failed to save new account', error);
    }

    setNewAccount({
      name: '',
      description: '',
      color: '#6a11cb',
    });
    setShowAddAccountModal(false);
  };

  const saveEntries = async () => {
    if (!selectedAccount || !selectedMonth) return;

    try {
      await AsyncStorage.setItem(
        `@entries_${selectedAccount.id}_${selectedMonth.id}`,
        JSON.stringify(entries),
      );

      // Update month summary
      const updatedAccounts = accounts.map(account => {
        if (account.id === selectedAccount.id) {
          const updatedMonths = account.months.map(m => {
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

          return { ...account, months: updatedMonths };
        }
        return account;
      });

      setAccounts(updatedAccounts);
      await AsyncStorage.setItem(
        '@all_accounts',
        JSON.stringify(updatedAccounts),
      );
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

  const closeAccountModal = () => {
    setSelectedMonth(null);
    setShowEntryModal(false);
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
        <Text style={styles.headerText}>Accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Accounts List */}
      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <FlatList
          data={accounts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.accountCard}
              onPress={() => handleAccountPress(item)}
              activeOpacity={0.8}
            >
              <View
                style={[styles.accountIcon, { backgroundColor: item.color }]}
              >
                <Text style={styles.accountIconText}>
                  {item.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{item.name}</Text>
                <Text style={styles.accountDescription}>
                  {item.description}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#6a11cb" />
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {/* Add Account Button */}
      <TouchableOpacity
        style={styles.addAccountButton}
        onPress={() => setShowAddAccountModal(true)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Account Detail Modal */}
      <Modal
        visible={!!selectedAccount}
        animationType="slide"
        onRequestClose={() => setSelectedAccount(null)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: selectedAccount?.color || '#6a11cb' },
            ]}
          >
            <TouchableOpacity onPress={() => setSelectedAccount(null)}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedAccount?.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={selectedAccount?.months || []}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.monthCard}
                onPress={() => handleMonthPress(selectedAccount, item)}
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
          />
        </View>
      </Modal>

      {/* Entries Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        onRequestClose={closeAccountModal}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: selectedAccount?.color || '#6a11cb' },
            ]}
          >
            <TouchableOpacity onPress={closeAccountModal}>
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
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: selectedAccount?.color || '#6a11cb' },
            ]}
          >
            <TouchableOpacity onPress={() => setShowAddEditModal(false)}>
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
      {/* Add Account Modal */}
      <Modal
        visible={showAddAccountModal}
        animationType="slide"
        onRequestClose={() => setShowAddAccountModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { backgroundColor: '#6a11cb' }]}>
            <TouchableOpacity onPress={() => setShowAddAccountModal(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Account</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account name"
                placeholderTextColor="#888"
                value={newAccount.name}
                onChangeText={text =>
                  setNewAccount({ ...newAccount, name: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter description"
                placeholderTextColor="#888"
                value={newAccount.description}
                onChangeText={text =>
                  setNewAccount({ ...newAccount, description: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorOptions}>
                {[
                  '#6a11cb',
                  '#2575fc',
                  '#11cbcb',
                  '#ff6b6b',
                  '#4CAF50',
                  '#FFA000',
                ].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newAccount.color === color && styles.selectedColorOption,
                    ]}
                    onPress={() => setNewAccount({ ...newAccount, color })}
                  >
                    {newAccount.color === color && (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Pressable
              style={styles.submitButton}
              onPress={handleAddAccount}
              android_ripple={{ color: '#4a00e0' }}
            >
              <Text style={styles.submitButtonText}>Add Account</Text>
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
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  accountIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
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
    textAlign: 'center',
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
  addAccountButton: {
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
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default AccountsDetail;

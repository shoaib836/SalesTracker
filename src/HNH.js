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
} from 'react-native';
import React, { useState, useEffect } from 'react';
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

  // Initialize with sample data if empty
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedMonths = await AsyncStorage.getItem('@hnh_months');
        if (storedMonths !== null) {
          setMonths(JSON.parse(storedMonths));
        } else {
          const defaultMonths = [
            {
              id: '1',
              name: 'June 2025',
              orders: 0,
              income: 0,
              cost: 0,
              profit: 0,
            },
            {
              id: '2',
              name: 'May 2025',
              orders: 0,
              income: 0,
              cost: 0,
              profit: 0,
            },
            {
              id: '3',
              name: 'April 2025',
              orders: 0,
              income: 0,
              cost: 0,
              profit: 0,
            },
            {
              id: '4',
              name: 'March 2025',
              orders: 0,
              income: 0,
              cost: 0,
              profit: 0,
            },
          ];
          setMonths(defaultMonths);
          await AsyncStorage.setItem(
            '@hnh_months',
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

    // const resetDefaultMonths = async () => {
    //   try {
    //     const defaultMonths = [
    //       {
    //         id: '1',
    //         name: 'June 2025',
    //         orders: 0,
    //         income: 0,
    //         cost: 0,
    //         profit: 0,
    //       },
    //       {
    //         id: '2',
    //         name: 'May 2025',
    //         orders: 0,
    //         income: 0,
    //         cost: 0,
    //         profit: 0,
    //       },
    //       {
    //         id: '3',
    //         name: 'April 2025',
    //         orders: 0,
    //         income: 0,
    //         cost: 0,
    //         profit: 0,
    //       },
    //       {
    //         id: '4',
    //         name: 'March 2025',
    //         orders: 0,
    //         income: 0,
    //         cost: 0,
    //         profit: 0,
    //       },
    //     ];

    //     await AsyncStorage.removeItem('@hnh_months');
    //     await AsyncStorage.setItem(
    //       '@hnh_months',
    //       JSON.stringify(defaultMonths),
    //     );
    //     setMonths(defaultMonths);
    //     console.log('Default months reset successfully');
    //   } catch (error) {
    //     console.error('Error resetting default months', error);
    //   }
    // };

    // Call this function when you want to reset
    // resetDefaultMonths();

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
      Alert.alert('Error', 'Product name and amount received are required');
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

  const deleteEntry = id => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => setEntries(entries.filter(entry => entry.id !== id)),
      },
    ]);
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
        <Text style={styles.headerText}>HideNHaute</Text>
        <View style={{ width: 24 }} />
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
            <View style={styles.monthDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Orders</Text>
                <Text style={styles.detailValue}>{item.orders}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Income</Text>
                <Text style={styles.detailValue}>
                  Rs. {item.income.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cost</Text>
                <Text style={styles.detailValue}>
                  Rs. {item.cost.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Profit</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: item.profit >= 0 ? 'green' : 'red' },
                  ]}
                >
                  Rs. {item.profit.toLocaleString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {/* Entries Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedMonth?.name} Entries</Text>
            <View style={{ width: 24 }} />
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color="#ccc" />
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
                      <Text>
                        Received: Rs. {item.amountReceived.toLocaleString()}
                      </Text>
                      <Text>
                        Total Cost: Rs.{' '}
                        {(
                          item.productionCost + item.deliveryCost
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity onPress={() => handleEditEntry(item)}>
                      <Icon
                        name="edit"
                        size={20}
                        color="#1a237e"
                        style={styles.actionIcon}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEntry(item.id)}>
                      <Icon name="delete" size={20} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.entryList}
            />
          )}

          <Pressable style={styles.addButton} onPress={handleAddEntry}>
            <Text style={styles.addButtonText}>Add New Entry</Text>
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
            <TouchableOpacity onPress={() => setShowAddEditModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Entry' : 'Add New Entry'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Product Name *"
              value={currentEntry.productName}
              onChangeText={text =>
                setCurrentEntry({ ...currentEntry, productName: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Amount Received (Rs.) *"
              keyboardType="numeric"
              value={currentEntry.amountReceived}
              onChangeText={text =>
                setCurrentEntry({ ...currentEntry, amountReceived: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Production Cost (Rs.) - Optional"
              keyboardType="numeric"
              value={currentEntry.productionCost}
              onChangeText={text =>
                setCurrentEntry({ ...currentEntry, productionCost: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Delivery Cost (Rs.) - Optional"
              keyboardType="numeric"
              value={currentEntry.deliveryCost}
              onChangeText={text =>
                setCurrentEntry({ ...currentEntry, deliveryCost: text })
              }
            />

            <Pressable style={styles.submitButton} onPress={saveEntry}>
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Entry' : 'Save Entry'}
              </Text>
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
  monthDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
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
  entryList: {
    padding: 16,
  },
  entryItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
  },
  entryProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  entryDetails: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 15,
  },
  addButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HNH;

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
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CompanyFinances = () => {
  const navigation = useNavigation();
  const [assets, setAssets] = useState([]);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetAmount, setNewAssetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceToAdd, setBalanceToAdd] = useState('');
  const [assetToDelete, setAssetToDelete] = useState(null);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load assets
        const storedAssets = await AsyncStorage.getItem('@company_assets');
        if (storedAssets !== null) {
          const parsedAssets = JSON.parse(storedAssets);
          setAssets(parsedAssets);
          setTotalAssets(
            parsedAssets.reduce((sum, asset) => sum + asset.amount, 0),
          );
        } else {
          const defaultAssets = [];
          setAssets(defaultAssets);
          setTotalAssets(0);
          await AsyncStorage.setItem(
            '@company_assets',
            JSON.stringify(defaultAssets),
          );
        }

        // Load current balance
        const balanceData = await AsyncStorage.getItem('@current_balance');
        if (balanceData !== null) {
          setCurrentBalance(parseFloat(balanceData));
        } else {
          // Initialize with default balance if not exists
          const initialBalance = 800000;
          setCurrentBalance(initialBalance);
          await AsyncStorage.setItem(
            '@current_balance',
            initialBalance.toString(),
          );
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // const resetCurrentBalance = async () => {
  //   try {
  //     await AsyncStorage.removeItem('@current_balance');
  //     await AsyncStorage.setItem(
  //       '@current_balance',
  //       '0' // Must be a string
  //     );
  //     setCurrentBalance(0);
  //     console.log('Current Balance reset successfully');
  //     return true; // Indicate success
  //   } catch (error) {
  //     console.error('Error resetting Current Balance', error);
  //     return false; // Indicate failure
  //   }
  // };

  // // Call this function when you want to reset
  // resetCurrentBalance();

  const confirmDeleteAsset = id => {
    setAssetToDelete(id);
  };

  const cancelDeleteAsset = () => {
    setAssetToDelete(null);
  };

  const executeDeleteAsset = async () => {
    if (!assetToDelete) return;

    const assetToRemove = assets.find(asset => asset.id === assetToDelete);
    if (!assetToRemove) return;

    const updatedAssets = assets.filter(asset => asset.id !== assetToDelete);
    setAssets(updatedAssets);
    setTotalAssets(prevTotal => prevTotal - assetToRemove.amount);
    await AsyncStorage.setItem(
      '@company_assets',
      JSON.stringify(updatedAssets),
    );

    setAssetToDelete(null); // Close confirmation modal
  };

  const addAsset = async () => {
    if (!newAssetName || !newAssetAmount || isNaN(newAssetAmount)) {
      return;
    }

    const amountValue = parseFloat(newAssetAmount);
    if (amountValue <= 0) return;

    // Check if balance is sufficient
    if (amountValue > currentBalance) {
      alert('Insufficient balance to add this asset');
      return;
    }

    const newAsset = {
      id: Date.now(),
      name: newAssetName,
      amount: amountValue,
    };

    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    setTotalAssets(prevTotal => prevTotal + amountValue);

    // Deduct from current balance
    const newBalance = currentBalance - amountValue;
    setCurrentBalance(newBalance);

    // Save both to storage
    await AsyncStorage.setItem(
      '@company_assets',
      JSON.stringify(updatedAssets),
    );
    await AsyncStorage.setItem('@current_balance', newBalance.toString());

    setNewAssetName('');
    setNewAssetAmount('');
    setShowAddAssetModal(false);
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
        <Text style={styles.headerText}>Company Finances</Text>
        <View></View>
      </View>

      {/* Current Balance Card (completely separate from assets) */}
      <TouchableOpacity
        style={styles.balanceCard}
        onPress={() => setShowBalanceModal(true)}
      >
        <View style={styles.row}>
          <Icon name="account-balance-wallet" size={24} color="#FFFFFF" />
          <Text style={styles.balanceLabel}>Current Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          Rs. {currentBalance.toLocaleString()}
        </Text>
      </TouchableOpacity>

      {/* Assets Card (separate from current balance) */}
      <TouchableOpacity
        style={styles.assetsCard}
        onPress={() => setShowAssetsModal(true)}
      >
        <View style={styles.row}>
          <Icon name="business" size={24} color="#1a237e" />
          <Text style={styles.assetsLabel}>Total Assets</Text>
        </View>
        <Text style={styles.assetsAmount}>
          Rs. {totalAssets.toLocaleString()}
        </Text>
      </TouchableOpacity>

      {/* Assets List Modal */}
      <Modal
        visible={showAssetsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssetsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Company Assets</Text>

            <FlatList
              data={assets}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.assetItem}>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{item.name}</Text>
                    <Text style={styles.assetAmount}>
                      Rs. {item.amount.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDeleteAsset(item.id)}>
                    <Icon name="delete" size={24} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.assetsList}
            />

            <TouchableOpacity
              style={styles.addAssetButton}
              onPress={() => {
                setShowAssetsModal(false);
                setShowAddAssetModal(true);
              }}
            >
              <View style={styles.addButtonContent}>
                <Icon name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Add New Asset</Text>
              </View>
            </TouchableOpacity>

            <Pressable
              style={styles.closeButton}
              onPress={() => setShowAssetsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Asset Modal */}
      <Modal
        visible={showAddAssetModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Asset</Text>

            <TextInput
              style={styles.input}
              placeholder="Asset Name"
              value={newAssetName}
              onChangeText={setNewAssetName}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount (Rs.)"
              keyboardType="numeric"
              value={newAssetAmount}
              onChangeText={setNewAssetAmount}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddAssetModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.addButton]}
                onPress={addAsset}
              >
                <Text style={styles.buttonText}>Add Asset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!assetToDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeleteAsset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this asset?
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={cancelDeleteAsset}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.deleteButton]}
                onPress={executeDeleteAsset}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Balance Modal */}
      <Modal
        visible={showAddBalanceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add to Balance</Text>

            <TextInput
              style={styles.input}
              placeholder="Amount (Rs.)"
              keyboardType="numeric"
              value={balanceToAdd}
              onChangeText={setBalanceToAdd}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setBalanceToAdd('');
                  setShowAddBalanceModal(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.addButton]}
                onPress={async () => {
                  if (!balanceToAdd || isNaN(balanceToAdd)) {
                    return;
                  }
                  const amount = parseFloat(balanceToAdd);
                  if (amount <= 0) return;

                  const newBalance = currentBalance + amount;
                  setCurrentBalance(newBalance);
                  await AsyncStorage.setItem(
                    '@current_balance',
                    newBalance.toString(),
                  );
                  setBalanceToAdd('');
                  setShowAddBalanceModal(false);
                  setShowBalanceModal(false);
                }}
              >
                <Text style={styles.buttonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Balance Action Modal */}
      <Modal
        visible={showBalanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { padding: 20 }]}>
            <Text style={styles.modalTitle}>Balance Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowBalanceModal(false);
                setShowAddBalanceModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>Add to Balance</Text>
            </TouchableOpacity>

            <Pressable
              style={styles.closeButton}
              onPress={() => setShowBalanceModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
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
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  balanceCard: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  assetsLabel: {
    color: '#1a237e',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: '600',
  },
  assetsAmount: {
    color: '#1a237e',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 20,
    textAlign: 'center',
  },
  assetsList: {
    paddingBottom: 20,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    color: '#333',
  },
  assetAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  addAssetButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  addButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#1a237e',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
});

export default CompanyFinances;

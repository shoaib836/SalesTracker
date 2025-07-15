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
import firestore from '@react-native-firebase/firestore';

const CompanyFinances = () => {
  const assetsRef = firestore().collection('companyAssets');
  const balanceRef = firestore().collection('company').doc('balance');
  const navigation = useNavigation();
  const [assets, setAssets] = useState([]);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetAmount, setNewAssetAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceToAdd, setBalanceToAdd] = useState('');
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] =
    useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  // Load data from storage
  // Load data from Firestore
  useEffect(() => {
    // Initialize balance if it doesn't exist
    const initializeBalance = async () => {
      const doc = await balanceRef.get();
      if (!doc.exists) {
        await balanceRef.set({ amount: 0 });
      }
    };
  
    // Load balance
    const balanceUnsub = balanceRef.onSnapshot(doc => {
      if (doc.exists) {
        setCurrentBalance(doc.data().amount || 0);
      }
    });
  
    // Load assets
    const assetsUnsub = assetsRef
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const assetsData = [];
        let total = 0;
  
        querySnapshot.forEach(doc => {
          const asset = {
            id: doc.id,
            ...doc.data(),
          };
          assetsData.push(asset);
          total += asset.amount;
        });
  
        setAssets(assetsData);
        setTotalAssets(total);
        setIsLoading(false);
      });
  
    initializeBalance(); // Call the initialization
  
    return () => {
      balanceUnsub();
      assetsUnsub();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = balanceRef.onSnapshot((doc) => {
      if (doc.exists) {
        setCurrentBalance(doc.data().amount || 0);
      }
    });
    return () => unsubscribe();
  }, []);

  // const resetCompanyBalance = async () => {
  //   try {
  //     const initialBalance = 0; // Or whatever default value you want
  //     await AsyncStorage.setItem(
  //       '@current_balance',
  //       initialBalance.toString()
  //     );
  //   } catch (error) {
  //     console.error('Failed to reset balance', error);
  //     Alert.alert('Error', 'Failed to reset company balance');
  //   }
  // };

  // resetCompanyBalance();

  const handleAddBalance = async () => {
    if (!balanceToAdd || isNaN(balanceToAdd)) return;
  
    const amount = parseFloat(balanceToAdd);
    if (amount <= 0) return;
  
    try {
      await balanceRef.update({
        amount: firestore.FieldValue.increment(amount)
      });
  
      setBalanceToAdd('');
      setShowAddBalanceModal(false);
      setShowBalanceModal(false);
      
      setSuccessMessage('Balance updated successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding to balance:', error);
      setErrorMessage('Failed to update balance');
      setShowErrorModal(true);
    }
  };

  const confirmDeleteAsset = id => {
    setAssetToDelete(id);
  };

  const cancelDeleteAsset = () => {
    setAssetToDelete(null);
  };

  const addAsset = async () => {
    if (!newAssetName || !newAssetAmount || isNaN(newAssetAmount)) {
      return;
    }

    const amountValue = parseFloat(newAssetAmount);
    if (amountValue <= 0) return;

    try {
      // Check balance first
      const balanceDoc = await balanceRef.get();
      const currentBalance = balanceDoc.exists ? balanceDoc.data().amount : 0;

      if (amountValue > currentBalance) {
        setShowInsufficientBalanceModal(true);
        return;
      }

      // Run transaction to update balance and add asset
      await firestore().runTransaction(async transaction => {
        // Update balance
        transaction.update(balanceRef, {
          amount: firestore.FieldValue.increment(-amountValue),
        });

        // Add new asset
        const newAsset = {
          name: newAssetName,
          amount: amountValue,
          createdAt: firestore.FieldValue.serverTimestamp(),
        };
        transaction.set(assetsRef.doc(), newAsset);
      });

      // Reset form
      setNewAssetName('');
      setNewAssetAmount('');
      setShowAddAssetModal(false);

      setSuccessMessage('Asset added successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding asset:', error);
      setErrorMessage('Failed to add asset');
      setShowErrorModal(true);
    }
  };

  const executeDeleteAsset = async () => {
    if (!assetToDelete) return;

    try {
      const assetDoc = await assetsRef.doc(assetToDelete).get();
      if (!assetDoc.exists) return;

      const assetAmount = assetDoc.data().amount;

      // Run transaction to update balance and delete asset
      await firestore().runTransaction(async transaction => {
        // Update balance
        transaction.update(balanceRef, {
          amount: firestore.FieldValue.increment(assetAmount),
        });

        // Delete asset
        transaction.delete(assetsRef.doc(assetToDelete));
      });

      setAssetToDelete(null);

      setSuccessMessage('Asset deleted successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting asset:', error);
      setErrorMessage('Failed to delete asset');
      setShowErrorModal(true);
    }
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
        <Text style={styles.headerText}>Company Finances</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Current Balance Card */}
        <TouchableOpacity
          style={styles.balanceCard}
          onPress={() => setShowBalanceModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Icon name="account-balance-wallet" size={24} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Current Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            Rs. {currentBalance.toLocaleString()}
          </Text>
          <Text style={styles.cardSubtitle}>Available funds</Text>
        </TouchableOpacity>

        {/* Assets Card */}
        <TouchableOpacity
          style={styles.assetsCard}
          onPress={() => setShowAssetsModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: 'rgba(106, 17, 203, 0.1)' },
              ]}
            >
              <Icon name="business" size={24} color="#6a11cb" />
            </View>
            <Text style={[styles.cardTitle, { color: '#6a11cb' }]}>
              Total Assets
            </Text>
          </View>
          <Text style={styles.assetsAmount}>
            Rs. {totalAssets.toLocaleString()}
          </Text>
          <Text style={[styles.cardSubtitle, { color: '#666' }]}>
            Company assets value
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Assets List Modal */}
      <Modal
        visible={showAssetsModal}
        animationType="slide"
        onRequestClose={() => setShowAssetsModal(false)}
      >
        <View style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity
              onPress={() => setShowAssetsModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullModalTitle}>Company Assets</Text>
            <View style={{ width: 24 }} />
          </View>

          {assets.length === 0 ? (
            <View style={styles.fullEmptyContainer}>
              <View style={styles.emptyIcon}>
                <Icon name="business" size={48} color="#6a11cb" />
              </View>
              <Text style={styles.emptyText}>No assets recorded yet</Text>
            </View>
          ) : (
            <FlatList
              data={assets}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.fullAssetItem}>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{item.name}</Text>
                    <Text style={styles.assetDate}>
                      Added: {new Date(item.id).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.assetAmountContainer}>
                    <Text style={styles.assetAmountText}>
                      Rs. {item.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => confirmDeleteAsset(item.id)}
                      style={styles.deleteButton}
                    >
                      <Icon name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.fullAssetList}
            />
          )}

          <Pressable
            style={styles.fullAddButton}
            onPress={() => {
              setShowAssetsModal(false);
              setShowAddAssetModal(true);
            }}
            android_ripple={{ color: '#4a00e0' }}
          >
            <Text style={styles.addButtonText}>Add New Asset</Text>
            <Icon name="add" size={20} color="#fff" />
          </Pressable>
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
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAddAssetModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Asset</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Asset Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter asset name"
                placeholderTextColor="#888"
                value={newAssetName}
                onChangeText={setNewAssetName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newAssetAmount}
                onChangeText={setNewAssetAmount}
              />
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddAssetModal(false)}
                android_ripple={{ color: '#ccc' }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: '600', color: '#888' }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.addButton]}
                onPress={addAsset}
                android_ripple={{ color: '#4a00e0' }}
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
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <Icon name="warning" size={32} color="#d32f2f" />
              <Text style={styles.confirmTitle}>Confirm Delete</Text>
            </View>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this asset? This action cannot be
              undone.
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={cancelDeleteAsset}
                android_ripple={{ color: '#ccc' }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: '600', color: '#888' }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.deleteConfirm]}
                onPress={executeDeleteAsset}
                android_ripple={{ color: '#b71c1c' }}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Insufficient Balance Modal */}
      <Modal
        visible={showInsufficientBalanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInsufficientBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <Icon name="error" size={32} color="#d32f2f" />
              <Text style={styles.confirmTitle}>Insufficient Balance</Text>
            </View>
            <Text style={styles.confirmText}>
              You don't have enough balance to add this asset. Current balance:
              Rs. {currentBalance.toLocaleString()}
            </Text>

            <Pressable
              style={{
                paddingHorizontal: 20,
                paddingVertical: 5,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#888',
              }}
              onPress={() => setShowInsufficientBalanceModal(false)}
              android_ripple={{ color: '#ccc' }}
            >
              <Text style={[styles.buttonText, { color: '#888' }]}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Balance Modal */}
      {/* Add Balance Modal */}
<Modal
  visible={showAddBalanceModal}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowAddBalanceModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity
          onPress={() => setShowAddBalanceModal(false)}
          style={styles.modalCloseButton}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Add to Balance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Amount (Rs.)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount to add"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={balanceToAdd}
          onChangeText={setBalanceToAdd}
        />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setBalanceToAdd('');
            setShowAddBalanceModal(false);
          }}
          android_ripple={{ color: '#ccc' }}
        >
          <Text style={[styles.buttonText, { color: '#333' }]}>
            Cancel
          </Text>
        </Pressable>

        {/* Updated Pressable with handleAddBalance */}
        <Pressable
          style={[styles.button, styles.addButton]}
          onPress={handleAddBalance}
          android_ripple={{ color: '#4a00e0' }}
        >
          <Text style={styles.buttonText}>Add Funds</Text>
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
          <View style={styles.actionModal}>
            <Text style={styles.actionModalTitle}>Balance Actions</Text>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setShowBalanceModal(false);
                setShowAddBalanceModal(true);
              }}
              android_ripple={{ color: 'rgba(106, 17, 203, 0.2)' }}
            >
              <Icon name="add" size={24} color="#6a11cb" />
              <Text style={styles.actionButtonText}>Add to Balance</Text>
            </Pressable>

            <Pressable
              style={styles.closeActionButton}
              onPress={() => setShowBalanceModal(false)}
            >
              <Text style={styles.closeActionButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... (keep your existing styles the same)

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
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#6a11cb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  assetsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  assetsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6a11cb',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
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
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  assetsList: {
    padding: 16,
  },
  assetItem: {
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
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  assetDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  assetAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6a11cb',
    marginRight: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAssetButton: {
    backgroundColor: '#6a11cb',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAssetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  inputContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0', // Light gray background
    borderWidth: 1, // Add border
    borderColor: '#bdbdbd', // Slightly darker gray border
  },
  deleteConfirm: {
    backgroundColor: 'red', // Light gray background
    borderWidth: 1, // Add border
    borderColor: '#bdbdbd', // Slightly darker gray border
  },
  addButton: {
    backgroundColor: '#6a11cb',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmModal: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d32f2f',
    marginLeft: 12,
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  actionModal: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 16,
    padding: 24,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6a11cb',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6a11cb',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6a11cb',
    marginLeft: 12,
  },
  closeActionButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6a11cb',
  },
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fullModalHeader: {
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
  fullModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  fullEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fullAssetList: {
    padding: 16,
  },
  fullAssetItem: {
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
  fullAddButton: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 10,
  },
});

export default CompanyFinances;

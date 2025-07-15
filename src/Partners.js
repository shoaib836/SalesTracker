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

const Partners = () => {
  const navigation = useNavigation();
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [newDrawing, setNewDrawing] = useState({
    title: '',
    amount: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [drawingToDelete, setDrawingToDelete] = useState(null);
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

  // Load partners from storage
  useEffect(() => {
    const loadPartners = async () => {
      try {
        const storedPartners = await AsyncStorage.getItem('@partners');
        if (storedPartners !== null) {
          setPartners(JSON.parse(storedPartners));
        } else {
          const defaultPartners = [
            { id: 1, name: 'Umer Muti', drawings: 0, drawingsList: [] },
            { id: 2, name: 'Habibullah', drawings: 0, drawingsList: [] },
            { id: 3, name: 'Shoaib', drawings: 0, drawingsList: [] },
          ];
          setPartners(defaultPartners);
          await AsyncStorage.setItem(
            '@partners',
            JSON.stringify(defaultPartners),
          );
        }
      } catch (error) {
        console.error('Failed to load partners', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPartners();
  }, []);

  // Update company balance
  const updateCompanyBalance = async amountChange => {
    try {
      const currentBalanceData = await AsyncStorage.getItem('@current_balance');
      let currentBalance = currentBalanceData
        ? parseFloat(currentBalanceData)
        : 0;
      currentBalance -= amountChange;
      await AsyncStorage.setItem('@current_balance', currentBalance.toString());
    } catch (error) {
      console.error('Failed to update company balance', error);
    }
  };

  // Handle partner press
  const handlePartnerPress = async partner => {
    setSelectedPartner(partner);
    try {
      setDrawings(partner.drawingsList || []);
      setShowDrawingModal(true);
    } catch (error) {
      console.error('Failed to load drawings', error);
      setDrawings([]);
      setShowDrawingModal(true);
    }
  };

  // Add new drawing
  const addDrawing = async () => {
    if (!newDrawing.title || !newDrawing.amount || isNaN(newDrawing.amount)) {
      return;
    }

    const amountValue = parseFloat(newDrawing.amount);
    if (amountValue <= 0) return;

    const newDrawingEntry = {
      id: Date.now().toString(),
      title: newDrawing.title,
      amount: amountValue,
      date: new Date().toLocaleDateString(),
    };

    const updatedDrawings = [...drawings, newDrawingEntry];
    setDrawings(updatedDrawings);

    const updatedPartners = partners.map(p => {
      if (p.id === selectedPartner.id) {
        return {
          ...p,
          drawings: p.drawings + amountValue,
          drawingsList: updatedDrawings,
        };
      }
      return p;
    });

    setPartners(updatedPartners);
    await AsyncStorage.setItem('@partners', JSON.stringify(updatedPartners));
    await updateCompanyBalance(amountValue);
    setNewDrawing({ title: '', amount: '' });
  };

  // Delete drawing
  const confirmDeleteDrawing = id => {
    setDrawingToDelete(id);
    setShowDeleteModal(true);
  };

  const cancelDeleteDrawing = () => {
    setDrawingToDelete(null);
    setShowDeleteModal(false);
  };

  const deleteDrawing = async () => {
    if (!drawingToDelete) return;

    const drawingToRemove = drawings.find(d => d.id === drawingToDelete);
    if (!drawingToRemove) return;

    const updatedDrawings = drawings.filter(d => d.id !== drawingToDelete);
    setDrawings(updatedDrawings);

    const updatedPartners = partners.map(p => {
      if (p.id === selectedPartner.id) {
        return {
          ...p,
          drawings: p.drawings - drawingToRemove.amount,
          drawingsList: updatedDrawings,
        };
      }
      return p;
    });

    setPartners(updatedPartners);
    await AsyncStorage.setItem('@partners', JSON.stringify(updatedPartners));
    await updateCompanyBalance(-drawingToRemove.amount);

    setShowDeleteModal(false);
    setDrawingToDelete(null);
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
        <Text style={styles.headerText}>Partners</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Partners List */}
      <Animated.View
        style={[
          styles.partnersContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {partners.map(partner => (
          <TouchableOpacity
            key={partner.id}
            style={styles.partnerCard}
            onPress={() => handlePartnerPress(partner)}
            activeOpacity={0.8}
          >
            <View style={styles.partnerInfo}>
              <View style={styles.avatar}>
                <Icon name="person" size={24} color="#fff" />
              </View>
              <Text style={styles.partnerName}>{partner.name}</Text>
            </View>
            <View style={styles.drawingContainer}>
              <Text style={styles.drawingLabel}>Total Drawings:</Text>
              <Text style={styles.drawingAmount}>
                Rs. {partner.drawings.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Drawing Modal */}
      <Modal
        visible={showDrawingModal}
        animationType="slide"
        onRequestClose={() => setShowDrawingModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDrawingModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedPartner?.name}'s Drawings
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Drawings List */}
          {drawings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Icon name="receipt" size={48} color="#6a11cb" />
              </View>
              <Text style={styles.emptyText}>No drawings recorded yet</Text>
            </View>
          ) : (
            <FlatList
              data={drawings}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.drawingItem}>
                  <View style={styles.drawingInfo}>
                    <Text style={styles.drawingTitle}>{item.title}</Text>
                    <Text style={styles.drawingDate}>{item.date}</Text>
                  </View>
                  <View style={styles.drawingAmountContainer}>
                    <Text style={styles.drawingAmountText}>
                      Rs. {item.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => confirmDeleteDrawing(item.id)}
                      style={styles.deleteButton}
                    >
                      <Icon name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.drawingList}
            />
          )}

          {/* Add Drawing Form */}
          <View style={styles.addDrawingContainer}>
            <Text style={styles.formTitle}>Add New Drawing</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#888"
              value={newDrawing.title}
              onChangeText={text =>
                setNewDrawing({ ...newDrawing, title: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={newDrawing.amount}
              onChangeText={text =>
                setNewDrawing({ ...newDrawing, amount: text })
              }
            />
            <Pressable
              style={styles.addButton}
              onPress={addDrawing}
              android_ripple={{ color: '#4a00e0' }}
            >
              <Text style={styles.addButtonText}>Add Drawing</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeleteDrawing}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Icon name="warning" size={32} color="#d32f2f" />
              <Text style={styles.deleteModalTitle}>Confirm Delete</Text>
            </View>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this drawing? This action cannot
              be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDeleteDrawing}
                android_ripple={{ color: '#ccc' }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={deleteDrawing}
                android_ripple={{ color: '#b71c1c' }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#6a11cb',
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
    textAlign: 'center',
  },
  partnersContainer: {
    padding: 16,
    marginTop: 10,
  },
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'column',
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6a11cb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  drawingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  drawingLabel: {
    fontSize: 15,
    color: '#666',
  },
  drawingAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6a11cb',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#6a11cb',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
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
  drawingList: {
    padding: 16,
  },
  drawingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
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
  drawingInfo: {
    flex: 1,
  },
  drawingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  drawingDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  drawingAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawingAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6a11cb',
    marginRight: 15,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDrawingContainer: {
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
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#6a11cb',
    borderRadius: 10,
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
  deleteModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deleteModalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d32f2f',
    marginLeft: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmDeleteButton: {
    backgroundColor: '#d32f2f',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Partners;

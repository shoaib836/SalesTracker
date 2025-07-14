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
  
    // Load partners from storage
    useEffect(() => {
      const loadPartners = async () => {
        try {
          const storedPartners = await AsyncStorage.getItem('@partners');
          if (storedPartners !== null) {
            setPartners(JSON.parse(storedPartners));
          } else {
            // Initialize with default partners
            const defaultPartners = [
              { id: 1, name: 'Umer Muti', drawings: 0, drawingsList: [] },
              { id: 2, name: 'Habibullah', drawings: 0, drawingsList: [] },
              { id: 3, name: 'Shoaib', drawings: 0, drawingsList: [] },
            ];
            setPartners(defaultPartners);
            await AsyncStorage.setItem('@partners', JSON.stringify(defaultPartners));
          }
        } catch (error) {
          console.error('Failed to load partners', error);
        } finally {
          setIsLoading(false);
        }
      };
  
      loadPartners();
    }, []);

    // const resetPartnersData = async () => {
    //   try {
    //     // Define the default partners data
    //     const defaultPartners = [
    //       { id: 1, name: 'Umer Muti', drawings: 0, drawingsList: [] },
    //       { id: 2, name: 'Habibullah', drawings: 0, drawingsList: [] },
    //       { id: 3, name: 'Shoaib', drawings: 0, drawingsList: [] },
    //     ];
    
    //     // Update state
    //     setPartners(defaultPartners);
    //     setDrawings([]);
        
    //     // Save to AsyncStorage
    //     await AsyncStorage.setItem('@partners', JSON.stringify(defaultPartners));
        
    //     console.log('Partners data reset successfully');
    //     return true;
    //   } catch (error) {
    //     console.error('Error resetting partners data:', error);
    //     return false;
    //   }
    // };

    // resetPartnersData();
  
    // Update current balance in CompanyFinances when drawings change
    const updateCompanyBalance = async (amountChange) => {
      try {
        const currentBalanceData = await AsyncStorage.getItem('@current_balance');
        let currentBalance = currentBalanceData ? parseFloat(currentBalanceData) : 800000;
        currentBalance -= amountChange; // Deduct drawings from balance
        await AsyncStorage.setItem('@current_balance', currentBalance.toString());
      } catch (error) {
        console.error('Failed to update company balance', error);
      }
    };

     // Handle partner press - load drawings
     const handlePartnerPress = async (partner) => {
        setSelectedPartner(partner);
        try {
          // Load drawings from partner's drawingsList
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
  
      // Update drawings list
      const updatedDrawings = [...drawings, newDrawingEntry];
      setDrawings(updatedDrawings);
  
      // Update partner's total drawings and drawingsList
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
      
      // Update company balance
      await updateCompanyBalance(amountValue);
      
      setNewDrawing({ title: '', amount: '' });
    };
  
    // Delete drawing
    const deleteDrawing = async (id) => {
      const drawingToDelete = drawings.find(d => d.id === id);
      if (!drawingToDelete) return;
  
      // Update drawings list
      const updatedDrawings = drawings.filter(d => d.id !== id);
      setDrawings(updatedDrawings);
  
      // Update partner's total drawings and drawingsList
      const updatedPartners = partners.map(p => {
        if (p.id === selectedPartner.id) {
          return {
            ...p,
            drawings: p.drawings - drawingToDelete.amount,
            drawingsList: updatedDrawings,
          };
        }
        return p;
      });
  
      setPartners(updatedPartners);
      await AsyncStorage.setItem('@partners', JSON.stringify(updatedPartners));
      
      // Update company balance (add back the deleted drawing amount)
      await updateCompanyBalance(-drawingToDelete.amount);
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
          <Text style={styles.headerText}>Partners</Text>
          <View style={{ width: 24 }} />
        </View>
  
        {/* Partners List */}
        <View style={styles.partnersContainer}>
          {partners.map(partner => (
            <TouchableOpacity
              key={partner.id}
              style={styles.partnerCard}
              onPress={() => handlePartnerPress(partner)}
            >
              <View style={styles.partnerInfo}>
                <Icon name="person" size={24} color="#1a237e" />
                <Text style={styles.partnerName}>{partner.name}</Text>
              </View>
              <View style={styles.drawingContainer}>
                <Text style={styles.drawingLabel}>Drawings:</Text>
                <Text style={styles.drawingAmount}>
                  Rs. {partner.drawings.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
  
        {/* Drawing Modal */}
        <Modal
          visible={showDrawingModal}
          animationType="slide"
          onRequestClose={() => setShowDrawingModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDrawingModal(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedPartner?.name}'s Drawings
              </Text>
              <View style={{ width: 24 }} />
            </View>
  
            {drawings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="receipt" size={48} color="#ccc" />
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
                      <TouchableOpacity onPress={() => deleteDrawing(item.id)}>
                        <Icon name="delete" size={20} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.drawingList}
              />
            )}
  
            {/* Add Drawing Form */}
            <View style={styles.addDrawingContainer}>
              <TextInput
                style={styles.input}
                placeholder="Title"
                value={newDrawing.title}
                onChangeText={text => setNewDrawing({ ...newDrawing, title: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                keyboardType="numeric"
                value={newDrawing.amount}
                onChangeText={text => setNewDrawing({ ...newDrawing, amount: text })}
              />
              <Pressable
                style={styles.addButton}
                onPress={addDrawing}
              >
                <Text style={styles.addButtonText}>Add Drawing</Text>
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
    partnersContainer: {
      padding: 16,
    },
    partnerCard: {
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
    partnerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    partnerName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1a237e',
      marginLeft: 10,
    },
    drawingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    drawingLabel: {
      fontSize: 16,
      color: '#555',
    },
    drawingAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1a237e',
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
    drawingList: {
      padding: 16,
    },
    drawingItem: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    drawingInfo: {
      flex: 1,
    },
    drawingTitle: {
      fontSize: 16,
      color: '#333',
      fontWeight: '500',
    },
    drawingDate: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    drawingAmountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    drawingAmountText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1a237e',
      marginRight: 12,
    },
    addDrawingContainer: {
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
  
  export default Partners;
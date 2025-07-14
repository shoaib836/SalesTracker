import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AccountsDetail = () => {
  const navigation = useNavigation();

  const accounts = [
      { id: '1', name: 'HNH', description: 'HideNHaute' },
      { id: '2', name: 'HSH', description: 'HandStitchHide' },
      { id: '3', name: 'TLV', description: 'TheLeatherValley' },
  ];

  const navigateToAccount = (accountName) => {
      navigation.navigate(accountName);
  };

  return (
      <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerText}>Accounts</Text>
              <View style={{ width: 24 }} />
          </View>

          {/* Accounts List */}
          <ScrollView contentContainerStyle={styles.listContainer}>
              {accounts.map((account) => (
                  <TouchableOpacity
                      key={account.id}
                      style={styles.accountCard}
                      onPress={() => navigateToAccount(account.name)}
                  >
                      <View style={styles.accountIcon}>
                          <Text style={styles.accountIconText}>
                              {account.name.charAt(0)}
                              {account.name.charAt(1)}
                          </Text>
                      </View>
                      <View style={styles.accountInfo}>
                          <Text style={styles.accountName}>{account.name}</Text>
                          <Text style={styles.accountDescription}>{account.description}</Text>
                      </View>
                      <Icon name="chevron-right" size={24} color="#666" />
                  </TouchableOpacity>
              ))}
          </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
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
  accountCard: {
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
  },
  accountIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#1a237e',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
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
      color: '#1a237e',
      marginBottom: 4,
  },
  accountDescription: {
      fontSize: 14,
      color: '#666',
  },
});

export default AccountsDetail;
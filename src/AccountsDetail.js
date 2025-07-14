import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity,
    ScrollView,
    Animated,
    Easing
  } from 'react-native';
  import React, { useRef } from 'react';
  import { useNavigation } from '@react-navigation/native';
  import Icon from 'react-native-vector-icons/MaterialIcons';
  
  const AccountsDetail = () => {
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
  
    // Animation effects
    React.useEffect(() => {
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
        })
      ]).start();
    }, []);
  
    const accounts = [
      { id: '1', name: 'HNH', description: 'HideNHaute', color: '#6a11cb' },
      { id: '2', name: 'HSH', description: 'HandStitchHide', color: '#2575fc' },
      { id: '3', name: 'TLV', description: 'TheLeatherValley', color: '#11cbcb' },
    ];
  
    const navigateToAccount = (accountName) => {
      navigation.navigate(accountName);
    };
  
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
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <ScrollView contentContainerStyle={styles.listContainer}>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountCard}
                onPress={() => navigateToAccount(account.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                  <Text style={styles.accountIconText}>
                    {account.name.charAt(0)}
                    {account.name.charAt(1)}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountDescription}>{account.description}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Icon name="chevron-right" size={24} color="#6a11cb" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
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
    arrowContainer: {
      marginLeft: 8,
    },
  });
  
  export default AccountsDetail;
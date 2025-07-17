import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const menuItems = [
  { id: 1, title: 'Partners', screenName: 'Partners', icon: 'people' },
  { id: 2, title: 'Company Finances', screenName: 'CompanyFinances', icon: 'attach-money' },
  { id: 3, title: 'Account Details', screenName: 'AccountsDetails', icon: 'account-balance-wallet' },
  { id: 4, title: 'Expenditures', screenName: 'ExpenditureDetails', icon: 'pie-chart' },
  { id: 5, title: 'Billings', screenName: 'Billings', icon: 'payments' },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Digitalive</Text>
        <Text style={styles.subHeaderText}>Business Dashboard</Text>
      </View>

      {/* Menu Items */}
      <Animated.View 
        style={[
          styles.menuContainer,
          { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }
        ]}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate(item.screenName)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.menuItem,
              index === menuItems.length - 1 && { marginBottom: 0 }
            ]}>
              <View style={styles.iconContainer}>
                <Icon name={item.icon} size={28} color="#2575fc" />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fc',
  },
  header: {
    backgroundColor: '#6a11cb',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subHeaderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 5,
  },
  menuContainer: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#2575fc',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItemText: {
    color: '#2c3e50',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 15,
  },
  iconContainer: {
    backgroundColor: 'rgba(37, 117, 252, 0.1)',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
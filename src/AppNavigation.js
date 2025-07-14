import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from './src/HomeScreen';
import SplashScreen from './SplashScreen';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digitalive</Text>
    </View>
  );
};

const AppNavigation = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timer for 1 second
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // Clean up the timer
    return () => clearTimeout(timer);
  }, []);

  return isLoading ? <SplashScreen /> : <HomeScreen />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00008B',
  },
});

export default AppNavigation;

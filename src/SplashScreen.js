import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digitalive</Text>
    </View>
  );
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
    textShadowColor: 'rgba(0, 0, 139, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  }
});

export default SplashScreen;
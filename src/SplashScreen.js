import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const SplashScreen = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 2,
        tension: 60,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }]}>
        <Text style={styles.title}>Digitalive</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Business Dashboard</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#6a11cb',
    letterSpacing: 1,
    textShadowColor: 'rgba(106, 17, 203, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitleContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(106, 17, 203, 0.1)',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6a11cb',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
// App.js
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/SplashScreen';
import HomeScreen from './src/HomeScreen';
import AccountsDetail from './src/AccountsDetail';
import Partners from './src/Partners';
import CompanyFinances from './src/CompanyFinances';
import ExpenditureDetails from './src/Expenditures';
import Billings from './src/Billings';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AccountsDetails"
          component={AccountsDetail}
          options={{ title: 'Accounts Details', headerShown: false }}
        />
        <Stack.Screen
          name="Partners"
          component={Partners}
          options={{ title: 'Partners', headerShown: false }}
        />
        <Stack.Screen
          name="CompanyFinances"
          component={CompanyFinances}
          options={{ title: 'Company Finances', headerShown: false }}
        />
        <Stack.Screen
          name="ExpenditureDetails"
          component={ExpenditureDetails}
          options={{ title: 'Expenditure Details', headerShown: false }}
        />
        <Stack.Screen
          name="Billings"
          component={Billings}         
          options={{ title: 'Billings', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
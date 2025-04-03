import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashStack from './SplashStack';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator
        initialRouteName="SplashStack"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashStack" component={SplashStack} />
        <Stack.Screen name="AuthStack" component={AuthStack} />
        <Stack.Screen name="Tabs" component={BottomTabNavigator} />
        <Stack.Screen name="MainStack" component={MainStack} />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

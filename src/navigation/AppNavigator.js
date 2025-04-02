import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native';
import SplashStack from './SplashStack';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import EventStack from './EventStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
const AppNavigator = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashStack"
          screenOptions={{headerShown: false}}>
          <Stack.Screen name="SplashStack" component={SplashStack} />
          <Stack.Screen name="AuthStack" component={AuthStack} />
          <Stack.Screen name="MainStack" component={MainStack} />
          <Stack.Screen name="EventStack" component={EventStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default AppNavigator;
import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/Auth/LoginScreen';
import SignUp from '../Screens/Auth/SignUp';
import ForgetPassword from '../Screens/Auth/ForgetPassword';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator 
    initialRouteName="Login"
    screenOptions={{headerShown: false}}>
      {/* <Stack.Screen name="Welcome" component={Welcome} /> */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
      {/* <Stack.Screen name="CheckEmail" component={CheckEmail} /> */}
    </Stack.Navigator>
  );
};

export default AuthStack;

const styles = StyleSheet.create({});

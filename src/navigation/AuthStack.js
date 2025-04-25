import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../Screens/Auth/LoginScreen';
import SignUp from '../Screens/Auth/SignUp';
import ForgotPasswordScreen from '../Screens/Auth/ForgotPasswordScreen';
import HomeScreen from '../Screens/Home/HomeScreen';
import Login from '../Screens/Auth/Login';
import TDMUAuthScreen from '../Screens/Auth/TDMUAuthScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator 
    initialRouteName="LoginScreen"
    screenOptions={{headerShown: false}}>
      {/* <Stack.Screen name="Welcome" component={Welcome} /> */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="TDMUAuth" component={TDMUAuthScreen}/>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Home" component={HomeScreen}/>
      {/* <Stack.Screen name="CheckEmail" component={CheckEmail} /> */}
    </Stack.Navigator>
  );
};

export default AuthStack;

const styles = StyleSheet.create({});

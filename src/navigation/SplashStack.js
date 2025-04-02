import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Splash0 from '../Screens/Splash/Splash0'
import Splash1 from '../Screens/Splash/Splash1'
import Splash2 from '../Screens/Splash/Splash2'
import Splash3 from '../Screens/Splash/Splash3'
import {createStackNavigator} from '@react-navigation/stack';
const Stack = createStackNavigator();
const SplashStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash0" component={Splash0} />
      <Stack.Screen name="Splash1" component={Splash1} />
      <Stack.Screen name="Splash2" component={Splash2} />
      <Stack.Screen name="Splash3" component={Splash3} />
    </Stack.Navigator>
  )
}
export default SplashStack

const styles = StyleSheet.create({})
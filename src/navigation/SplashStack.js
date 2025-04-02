import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Splash0 from '../screens/Splash/Splash0'
import Splash1 from '../screens/Splash/Splash1'
import Splash2 from '../screens/Splash/Splash2'
import Splash3 from '../screens/Splash/Splash3'
import Splash4 from '../screens/Splash/Splash4'
import {createStackNavigator} from '@react-navigation/stack';
const Stack = createStackNavigator();
const SplashStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash0" component={Splash0} />
      <Stack.Screen name="Splash1" component={Splash1} />
      <Stack.Screen name="Splash2" component={Splash2} />
      <Stack.Screen name="Splash3" component={Splash3} />
      <Stack.Screen name="Splash4" component={Splash4} />
    </Stack.Navigator>
  )
}
export default SplashStack

const styles = StyleSheet.create({})
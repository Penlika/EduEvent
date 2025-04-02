import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react'
import HomeScreen from '../Screens/Home/HomeScreen'
import EventScreen from '../Screens/Home/EventScreen'

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
<Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="EventScreen" component={EventScreen} />
    
    </Stack.Navigator>
  )
}

export default MainStack
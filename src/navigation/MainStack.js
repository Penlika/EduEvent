import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import HomeScreen from '../Screens/Home/HomeScreen';
import EventScreen from '../Screens/Home/EventScreen';
import BottomTabNavigator from './BottomTabNavigator';
import AllCategory from '../Screens/Event/AllCategory';

const Stack = createStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="EventScreen" component={EventScreen} />
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen name="AllCategory" component={AllCategory} />
    </Stack.Navigator>
  );
};

export default MainStack;

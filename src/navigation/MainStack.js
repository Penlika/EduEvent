import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import HomeScreen from '../Screens/Home/HomeScreen';
import EventScreen from '../Screens/Home/EventScreen';
import BottomTabNavigator from './BottomTabNavigator';
import AllCategory from '../Screens/Event/AllCategory';
import EventDetail from '../component/EventDetail';
import Schedule from '../Screens/Schedules/Schedule';
import NewsDetail from '../component/NewDetail';

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
      <Stack.Screen name="EventDetail" component={EventDetail} />
      <Stack.Screen name="NewDetail" component={NewsDetail} />
      <Stack.Screen name="Schedule" component={Schedule} />
    </Stack.Navigator>
  );
};

export default MainStack;

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../Screens/Home/HomeScreen';
import MyCoursesScreen from '../Screens/Home/EventScreen';
import NewsletterScreen from '../Screens/Home/NewsletterScreen';
import ProfileScreen from '../Screens/Profile/ProfileScreen';
import SettingScreen from '../Screens/Profile/SettingScreen';
import Icon from 'react-native-vector-icons/Feather';
import { StyleSheet } from 'react-native';
import AllChatsScreen from '../Screens/Chat/AllChatsScreen';
import WeekSchedule from '../Screens/Profile/ScheduleScreen';
import CompletedEventsScreen from '../Screens/Profile/CompletedEventsScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Drawer.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Tabs" options={{ headerShown: false }}>
        {() => (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;

                switch (route.name) {
                  case 'Home':
                    iconName = 'home';
                    break;
                  case 'My Events':
                    iconName = 'file-text';
                    break;
                  case 'Inbox':
                    iconName = 'message-circle';
                    break;
                  case 'Newsletter':
                    iconName = 'rss';
                    break;
                  case 'Profile':
                    iconName = 'user';
                    break;
                  default:
                    iconName = 'circle';
                }

                return <Icon name={iconName} size={20} color={color} />;
              },
              tabBarActiveTintColor: '#0CA59D', // Highlight color (like in image)
              tabBarInactiveTintColor: '#2C2C2C',
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: route.name === 'My Courses' ? 'bold' : 'normal',
              },
              tabBarStyle: styles.tabBarStyle,
              headerShown: false,
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="My Events" component={MyCoursesScreen} />
            <Tab.Screen name="Inbox" component={AllChatsScreen} />
            <Tab.Screen name="Newsletter" component={NewsletterScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        )}
      </Drawer.Screen>
      <Drawer.Screen name="Account" component={ProfileScreen} />
      <Drawer.Screen name="Setting" component={SettingScreen} />
      <Drawer.Screen name="Schedule" component={WeekSchedule} />
      <Drawer.Screen name="Evaluate training results" component={CompletedEventsScreen} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: '#F5F8FF',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    height: 70,
    paddingBottom: 10,
    paddingTop: 5,
  },
});

export default BottomTabNavigator;

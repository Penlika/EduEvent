import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Import Drawer
import HomeScreen from '../Screens/Home/HomeScreen';
import EventScreen from '../Screens/Home/EventScreen';
import NewsletterScreen from '../Screens/Home/NewsletterScreen'; // Assume this exists
import HistoryScreen from '../Screens/Home/HistoryScreen'; // Assume this exists
import ProfileScreen from '../Screens/Profile/ProfileScreen'; // Import ProfileScreen
import Icon from 'react-native-vector-icons/Feather';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import SettingScreen from '../Screens/Profile/SettingScreen';
import Schedule from '../Screens/Schedules/Schedule';

// Create the Drawer navigator
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    // Add the Drawer.Navigator around the BottomTabNavigator
    <Drawer.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      {/* Bottom Tab Navigator */}
      <Drawer.Screen name="Tabs" options={{ headerShown: false }}>
        {() => (
          <Tab.Navigator
            screenOptions={{
              tabBarStyle: {
                backgroundColor: '#fff',
                borderTopWidth: 0,
                paddingBottom: 10,
                height: 70,
              },
              tabBarLabelStyle: {
                fontSize: 16,
              },
              headerShown: false, // Hide the header for each tab
            }}>
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="home" size={20} color={color} />,
              }}
            />
            <Tab.Screen
              name="Events"
              component={Schedule}
              options={{
                tabBarIcon: ({ color }) => <Icon name="calendar" size={20} color={color} />,
              }}
            />
            
            {/* Special Camera Tab in the middle */}
            <Tab.Screen
              name="Camera"
              component={View} // Placeholder, you can change this to your camera component
              options={{
                tabBarIcon: ({ color }) => (
                  <View style={styles.cameraIconWrapper}>
                    <Icon name="camera" size={30} color="white" />
                  </View>
                ),
                tabBarButton: () => (
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => { /* Camera press logic */ }}
                  >
                    <View style={styles.cameraIconWrapper}>
                      <Icon name="camera" size={30} color="white" />
                    </View>
                  </TouchableOpacity>
                ),
                tabBarStyle: {
                  backgroundColor: '#007BFF',
                  borderTopWidth: 0,
                  position: 'absolute',
                  bottom: 10,
                  left: '50%',
                  marginLeft: -35,
                  borderRadius: 50,
                  height: 60,
                  width: 60,
                },
              }}
            />

            <Tab.Screen
              name="Newsletter"
              component={NewsletterScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="mail" size={20} color={color} />,
              }}
            />
            <Tab.Screen
              name="History"
              component={HistoryScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="clock" size={20} color={color} />,
              }}
            />
          </Tab.Navigator>
        )}
      </Drawer.Screen>

      {/* Drawer Screen for Profile */}
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Setting" component={SettingScreen} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  cameraIconWrapper: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -35, // Centers the button in the middle
    backgroundColor: '#007BFF',
    borderRadius: 50,
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomTabNavigator;

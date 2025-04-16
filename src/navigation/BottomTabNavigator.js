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
import InboxScreen from '../Screens/Home/InboxScreen';
import Schedule from '../Screens/Schedules/Schedule';

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
            <Tab.Screen name="Inbox" component={InboxScreen} />
            <Tab.Screen name="Newsletter" component={NewsletterScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
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
      <Drawer.Screen name="Account" component={ProfileScreen} />
      <Drawer.Screen name="Setting" component={SettingScreen} />
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

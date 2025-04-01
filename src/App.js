import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/screens/LoginScreen/AuthContext';
import Splash0 from './screens/Splash/Splash0';
import Splash1 from './screens/Splash/Splash1';
import Splash2 from './screens/Splash/Splash2';
import Splash3 from './screens/Splash/Splash3';
import Splash4 from './screens/Splash/Splash4';
import LoginScreen from './screens/LoginScreen/Login';
import HomeScreen from './screens/HomeScreen';


const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash0"
          screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash0" component={Splash0} />
          <Stack.Screen name="Splash1" component={Splash1} />
          <Stack.Screen name="Splash2" component={Splash2} />
          <Stack.Screen name="Splash3" component={Splash3} />
          <Stack.Screen name="Splash4" component={Splash4} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;

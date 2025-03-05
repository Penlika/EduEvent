import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/Screens/LoginScreen/AuthContext';
import Home from './src/Home';
import Splash1 from './src/Splash1';
import Splash2 from './src/Splash2';
import Splash3 from './src/Splash3';
import Splash4 from './src/Splash4';
import Splash0 from './src/Splash0';
import LoginScreen from './src/Screens/LoginScreen/Login';

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
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;

// ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native'; // Add this import
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          const doc = await firestore().collection('USER').doc(user.uid).get();
          if (doc.exists) {
            const userMode = doc.data().mode;
            if (userMode) {
              setTheme(userMode);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        fetchTheme();
      } else {
        setTheme('light'); // Default theme when not logged in
        setIsLoading(false);
      }
    });

    return () => unsubscribe(); // Clean up listener
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {isLoading ? (
        // Loading indicator while fetching theme
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
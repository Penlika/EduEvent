import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { GoogleAuthProvider } from '@react-native-firebase/auth';
import {AuthContext} from '../LoginScreen/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { firestore } from '../../../firebaseConfig';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    GoogleSignin.configure({
        webClientId: '162244598463-g1hv1cgbnseadpu57gedumo5scpu6ke9.apps.googleusercontent.com', // Get this from Firebase console
    });
  
    const [loading, setLoading] = useState(false);
    const [calendar, setCalendar] = useState(null);
    
    const saveUserToFirestore = async (user) => {
      if (!user) return;
  
      try {
          const userRef = firestore().collection("USER").doc(user.uid);
          const doc = await userRef.get();
  
          if (!doc.exists) {
              // If user does not exist, create a new entry
              await userRef.set({
                  uid: user.uid,
                  name: user.displayName || "",
                  email: user.email || "",
                  photoURL: user.photoURL || "",
                  createdAt: firestore.FieldValue.serverTimestamp(), // Store createdAt for new users
              });
              console.log("New user registered in Firestore");
          } else {
              // User exists, update only the fields without modifying createdAt
              await userRef.set(
                  {
                      name: user.displayName || "",
                      email: user.email || "",
                      photoURL: user.photoURL || "",
                  },
                  { merge: true } // This ensures only the provided fields are updated, and createdAt stays the same
              );
              console.log("User already exists in Firestore, updated user information.");
          }
      } catch (error) {
          console.error("Firestore Error:", error);
      }
    };
    
    // TDMU Calendar API integration
    const fetchTDMUCalendar = async (user) => {
      try {
        setLoading(true);
        
        // Step 1: Get Google token for TDMU OAuth
        const googleUser = await GoogleSignin.getCurrentUser();
        const loginHint = encodeURIComponent(googleUser.user.email);
        
        // Creating the OAuth URL with the user's email
        const oauthUrl = `https://accounts.google.com/o/oauth2/iframerpc?action=issueToken&response_type=token&login_hint=${loginHint}&client_id=79837717230-kttlrk5m6c41mps51smaofmf6j6jso6d.apps.googleusercontent.com&origin=https%3A%2F%2Fdkmh.tdmu.edu.vn&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20openid&ss_domain=https%3A%2F%2Fdkmh.tdmu.edu.vn&auto=1`;
        
        // We need to handle this OAuth flow differently in a mobile app
        // This is a simplified representation - you might need a WebView to handle this
        console.log("Starting TDMU authentication flow");
        
        // Create an axios instance with proper headers for TDMU APIs
        const authToken = googleUser.idToken;
        const tdmuApi = axios.create({
          baseURL: 'https://dkmh.tdmu.edu.vn/api',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        
        // Step 1: Login to TDMU system with the Google token
        const loginResponse = await tdmuApi.post('/auth/login', {
          token: authToken,
          // You may need to check the actual required parameters
          // in the TDMU API documentation or by examining network requests
          grant_type: 'authorization_code' // Or whatever grant type they expect
        });
        
        console.log("TDMU Login successful");
        
        // Store authentication token or session cookie
        const tdmuAuthToken = loginResponse.data.token || '';
        tdmuApi.defaults.headers.common['Authorization'] = `Bearer ${tdmuAuthToken}`;
        
        // Step 3: Validate functions access
        await tdmuApi.get('/dkmh/w-checkvalidallchucnang');
        console.log("Functions validation successful");
        
        // Step 4: Get semester list
        const semesterResponse = await tdmuApi.get('/sch/w-locdshockytkbuser');
        const currentSemester = semesterResponse.data[0]; // Assuming first one is current
        console.log("Retrieved semester list");
        
        // Step 5: Get user list
        const userListResponse = await tdmuApi.get('/sch/w-locdsdoituongthoikhoabieu');
        console.log("Retrieved user list");
        
        // Step 6: Finally get calendar data
        const calendarResponse = await tdmuApi.get('/sch/w-locdstkbtuanusertheohocky', {
          params: {
            hocky: currentSemester.id,
            // Add any other required parameters
          }
        });
        
        console.log("Calendar data retrieved successfully");
        setCalendar(calendarResponse.data);
        
        // Store calendar data in AsyncStorage for later use
        await AsyncStorage.setItem('tdmu_calendar', JSON.stringify(calendarResponse.data));
        
        // Notify user of successful calendar retrieval
        Alert.alert("Success", "Your TDMU calendar has been successfully loaded!");
        
        return calendarResponse.data;
        
      } catch (error) {
        console.error("TDMU Calendar Error:", error?.response?.data || error?.message || error);
        Alert.alert(
          "Calendar Loading Error", 
          "Failed to load your TDMU calendar. Please try again later."
        );
        return null;
      } finally {
        setLoading(false);
      }
    };
  
    const handleGoogleLogin = async () => {
      try {
        setLoading(true);
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        await GoogleSignin.signOut(); // Force logout
        const userInfo = await GoogleSignin.signIn();
        
        if (!userInfo.idToken) {
          const tokens = await GoogleSignin.getTokens();
          if (!tokens.idToken) throw new Error("Google Sign-In failed: No idToken returned.");
          userInfo.idToken = tokens.idToken;
        }
    
        const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
    
        await saveUserToFirestore(userCredential.user);
    
        console.log("Google Sign-In Successful:", userCredential.user);
        
        // Fetch TDMU calendar after successful login
        await fetchTDMUCalendar(userCredential.user);
    
        navigation.replace("MainStack");
    
        return userCredential.user;
      } catch (error) {
        console.error("Google Sign-In Error:", error?.message || error);
        Alert.alert("Google Sign-In Error", error?.message || "An unexpected error occurred.");
        return null;
      } finally {
        setLoading(false);
      }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let's you in</Text>

      <TouchableOpacity 
        style={[styles.socialButton, loading && styles.disabledButton]} 
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Image source={require('../../assets/images/google.png')} style={styles.icon} />
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>( Or )</Text>

      <LinearGradient colors={['#0066FF', '#0052CC']} style={styles.signInButton}>
        <TouchableOpacity 
          style={styles.signInContent} 
          onPress={() => navigation.replace('Login')}
          disabled={loading}
        >
          <Text style={styles.signInText}>Sign In with Your Account</Text>
          <Icon name="arrow-right" size={width * 0.05} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <Text style={styles.footerText}>
        Don't have an Account?{' '}
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signUp}>SIGN UP</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#1D1D1D',
    marginBottom: height * 0.04,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: height * 0.015,
    borderRadius: width * 0.03,
    width: '90%',
    marginVertical: height * 0.01,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  icon: {
    width: width * 0.07,
    height: width * 0.07,
    marginRight: width * 0.03,
  },
  buttonText: {
    fontSize: width * 0.04,
    color: '#333',
    fontWeight: '500',
  },
  orText: {
    marginVertical: height * 0.02,
    fontSize: width * 0.04,
    color: '#7D7D7D',
  },
  signInButton: {
    width: '90%',
    borderRadius: width * 0.12,
    overflow: 'hidden',
  },
  signInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.02,
  },
  signInText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    marginRight: width * 0.03,
  },
  footerText: {
    marginTop: height * 0.02,
    fontSize: width * 0.035,
    color: '#7D7D7D',
  },
  signUp: {
    color: '#0066FF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
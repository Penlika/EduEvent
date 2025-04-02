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
  
    
    const handleGoogleLogin = async () => {
      try {
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
    
        navigation.replace("Home");
    
        return userCredential.user;
      } catch (error) {
        console.error("Google Sign-In Error:", error?.message || error);
        Alert.alert("Google Sign-In Error", error?.message || "An unexpected error occurred.");
        return null;
      }
    };
    
    
    const handleFacebookSignIn = async () => {
      try {
        LoginManager.setLoginBehavior("native_with_fallback");
        const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
        if (result.isCancelled) throw new Error("User cancelled the login process");
        const data = await AccessToken.getCurrentAccessToken();
        if (!data) throw new Error("Something went wrong obtaining the access token");
        const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
        const userCredential = await auth().signInWithCredential(facebookCredential);
        await saveUserToFirestore(userCredential.user);
        console.log("Facebook sign-in successful:", userCredential.user);
        return userCredential.user;
      } catch (error) {
        console.error("Facebook Sign-In Error:", error?.message || error);
        Alert.alert("Facebook Sign-In Error", error?.message || "An unexpected error occurred.");
      }
    };
    
    

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let’s you in</Text>

      <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
        <Image source={require('../../assets/images/google.png')} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignIn}>
        <Image source={require('../../assets/images/facebook.png')} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>( Or )</Text>

      <LinearGradient colors={['#0066FF', '#0052CC']} style={styles.signInButton}>
        <TouchableOpacity style={styles.signInContent} onPress={() => navigation.replace('Login')}>
          <Text style={styles.signInText}>Sign In with Your Account</Text>
          <Icon name="arrow-right" size={width * 0.05} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <Text style={styles.footerText}>
        Don’t have an Account?{' '}
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

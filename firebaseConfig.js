import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Initialize Firebase
const firebaseApp = initializeApp();

export { firebaseApp, auth, firestore };

import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBlStIeclSIYSu-PsNNyOqMJQDMpjUiJAM",
  authDomain: "ktgk-b761a.firebaseapp.com",
  projectId: "ktgk-b761a",
  storageBucket: "ktgk-b761a.appspot.com",
  messagingSenderId: "162244598463",
  appId: "1:162244598463:android:cce01c73bf04a41094c40a",
};

if (!initializeApp.apps.length) {
  initializeApp(firebaseConfig);
}

export { auth, firestore };

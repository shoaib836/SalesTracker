// firebase.js
import { AppRegistry } from 'react-native';
import { initializeApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

initializeApp(firebaseConfig);

export { firestore };
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTheme } from './ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QRScanner = ({ route, navigation }) => {
  const { eventId } = route.params;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse');
      setHasPermission(true);
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to location to verify your attendance.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleQRCodeScanned = async ({ data }) => {
    try {
      // Parse QR code data (expected format: "eventId:latitude:longitude")
      const [scannedEventId, eventLat, eventLon] = data.split(':');

      // Verify if scanned event ID matches the current event
      if (scannedEventId !== eventId) {
        Alert.alert('Error', 'Invalid QR code for this event');
        return;
      }

      // Get current location
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Calculate distance
          const distance = calculateDistance(
            latitude,
            longitude,
            parseFloat(eventLat),
            parseFloat(eventLon)
          );

          // Check if within 20 meters
          if (distance <= 20) {
            // Update event completion status
            const userId = auth().currentUser.uid;
            await firestore()
              .collection('USER')
              .doc(userId)
              .collection('schedule')
              .doc(eventId)
              .update({
                completed: true,
              });

            Alert.alert(
              'Success',
              'Event attendance confirmed!',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          } else {
            Alert.alert(
              'Error',
              'You must be within 20 meters of the event location'
            );
          }
        },
        (error) => Alert.alert('Error', 'Unable to get location'),
        { enableHighAccuracy: true }
      );
    } catch (error) {
      console.error('QR Scanner error:', error);
      Alert.alert('Error', 'Failed to process QR code');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>
      
      <QRCodeScanner
        onRead={handleQRCodeScanned}
        reactivate={true}
        reactivateTimeout={3000}
        showMarker={true}
        topContent={
          <Text style={[styles.headerText, { color: isDark ? '#fff' : '#000' }]}>
            Scan the event QR code
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default QRScanner;
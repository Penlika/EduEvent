import {Linking, PermissionsAndroid, Platform, StyleSheet, Text, View} from 'react-native';
import React, {useRef, useState, useEffect} from 'react';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {Link} from '@react-navigation/native';

const QRScanner = () => {
  const camera = useRef(null);
  const [switchCameraValue, setSwitchCameraValue] = useState('front');
  const [flash, setFlash] = useState('off');
  const [showBorder, setShowBorder] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const device = useCameraDevice(switchCameraValue);

  useEffect(() => {
    async function getPermission() {
      // camera permission
      const cameraPermission = await Camera.requestCameraPermission();
      console.log(cameraPermission, 'CameraPermission');
      if (cameraPermission === 'denied') await Linking.openSettings();
      //
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App need to your storage to save photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage Permission denied');
        }
      } catch (err) {
        console.log(err, 'line warning');
      }
    }

    getPermission(); 
  }, []);

  if (device == null) return <View style={styles.loadingContainer}></View>;

  return (
    <View style={[styles.main, {borderWidth: 2}]}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
    </View>
  );
};

export default QRScanner;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    borderColor: 'green',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
});

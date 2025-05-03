import React, {useRef, useEffect, useState} from 'react';
import {
  Linking,
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
// Hàm tính khoảng cách giữa hai điểm
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Khoảng cách tính bằng mét
};

const QRScanner = ({route, navigation}) => {
  const {eventId} = route.params; // Lấy eventId từ route.params
  const cameraRef = useRef(null);
  const device = useCameraDevice('back');
  const [isProcessing, setIsProcessing] = useState(false); // Ngăn quét lặp

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (codes.length > 0 && !isProcessing) {
        setIsProcessing(true);
        const qrValue = codes[0].value;
        console.log('QR Value:', qrValue, 'Event ID:', eventId); // Gỡ lỗi

        try {
          // Kiểm tra định dạng mã QR
          const parts = qrValue.split(':');
          if (parts.length !== 3) {
            Alert.alert(
              'Lỗi',
              'Định dạng mã QR không hợp lệ (cần: eventId:latitude:longitude)',
              [{text: 'OK', onPress: () => setIsProcessing(false)}],
            );
            return;
          }

          const [scannedEventId, eventLat, eventLon] = parts;
          if (!eventId) {
            Alert.alert('Lỗi', 'Không có ID sự kiện để so sánh', [
              {text: 'OK', onPress: () => setIsProcessing(false)},
            ]);
            return;
          }

          // Kiểm tra mã QR có khớp với sự kiện không
          if (scannedEventId !== eventId) {
            Alert.alert('Lỗi', `Mã QR không khớp với sự kiện ${eventId}`, [
              {text: 'OK', onPress: () => setIsProcessing(false)},
            ]);
            return;
          }

          // Kiểm tra vị trí
          Geolocation.getCurrentPosition(
            position => {
              const {latitude, longitude} = position.coords;
              const lat2 = parseFloat(eventLat);
              const lon2 = parseFloat(eventLon);

              // Kiểm tra tọa độ hợp lệ
              if (isNaN(lat2) || isNaN(lon2)) {
                Alert.alert('Lỗi', 'Tọa độ trong mã QR không hợp lệ', [
                  {text: 'OK', onPress: () => setIsProcessing(false)},
                ]);
                return;
              }

              const distance = calculateDistance(
                latitude,
                longitude,
                lat2,
                lon2,
              );

              if (distance <= 50) {
                // Bán kính 50m
                const userId = auth().currentUser.uid;
                const eventRef = firestore()
                  .collection('USER')
                  .doc(userId)
                  .collection('registeredEvents')
                  .doc(eventId);

                // Cập nhật trạng thái completed = true
                eventRef
                  .update({completed: true})
                  .then(() => {
                    Alert.alert(
                      'Thành Công',
                      `Mã QR khớp với sự kiện ${eventId} và bạn đang trong bán kính 50m`,
                      [{text: 'OK', onPress: () => navigation.goBack()}],
                    );
                  })
                  .catch(error => {
                    console.error('Lỗi cập nhật:', error);
                    Alert.alert(
                      'Lỗi',
                      'Không thể cập nhật trạng thái sự kiện',
                      [{text: 'OK'}],
                    );
                  });
              } else {
                Alert.alert('Lỗi', 'Bạn không nằm trong bán kính 50m', [
                  {text: 'OK', onPress: () => console.log('Alert closed')},
                ]);
              }
            },
            error => {
              console.error('Lỗi lấy vị trí:', error);
              Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại', [
                {text: 'OK', onPress: () => setIsProcessing(false)},
              ]);
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
          );
        } catch (error) {
          console.error('Lỗi xử lý mã QR:', error);
          Alert.alert('Lỗi', 'Không thể xử lý mã QR', [
            {text: 'OK', onPress: () => setIsProcessing(false)},
          ]);
        }
      }
    },
  });

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Yêu cầu quyền camera
        const cameraPermission = await Camera.requestCameraPermission();
        if (cameraPermission === 'denied') {
          await Linking.openSettings();
          return;
        }

        // Yêu cầu quyền vị trí
        if (Platform.OS === 'ios') {
          Geolocation.requestAuthorization('whenInUse');
        } else {
          const locationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Quyền Truy Cập Vị Trí',
              message:
                'Ứng dụng cần quyền truy cập vị trí để xác minh bạn đang ở gần sự kiện',
              buttonPositive: 'Đồng ý',
              buttonNegative: 'Hủy',
              buttonNeutral: 'Hỏi Sau',
            },
          );
          if (locationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Quyền truy cập vị trí bị từ chối');
            Alert.alert(
              'Cảnh Báo',
              'Bạn cần cấp quyền vị trí để xác minh sự kiện',
              [{text: 'OK', onPress: () => setIsProcessing(false)}],
            );
          }
        }

        // Yêu cầu quyền lưu trữ cho Android (nếu cần)
        if (Platform.OS === 'android') {
          const storagePermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Quyền Truy Cập Bộ Nhớ',
              message:
                'Ứng dụng cần quyền truy cập bộ nhớ để lưu dữ liệu quét QR',
              buttonPositive: 'Đồng ý',
              buttonNegative: 'Hủy',
              buttonNeutral: 'Hỏi Sau',
            },
          );
          if (storagePermission !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Quyền truy cập bộ nhớ bị từ chối');
          }
        }
      } catch (error) {
        console.error('Yêu cầu quyền thất bại:', error);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền', [
          {text: 'OK', onPress: () => setIsProcessing(false)},
        ]);
      }
    };

    requestPermissions();
  }, []);

  if (!device) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        codeScanner={codeScanner}
      />
    </View>
  );
};

export default QRScanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'green',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
});

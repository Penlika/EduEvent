import React, { useRef, useEffect } from 'react';
import {
  Linking,
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

const QRScanner = ({ eventId }) => {
  const cameraRef = useRef(null);
  const device = useCameraDevice('back'); // Camera sau thường tốt hơn cho quét QR

  // Cấu hình quét mã QR
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'], // Loại mã cần quét
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        const qrValue = codes[0].value;
        try {
          // Phân tích dữ liệu mã QR
          const [scannedEventId] = qrValue.split(':'); // Giả định mã QR có dạng "eventId:..."
          
          // Kiểm tra mã QR có khớp với sự kiện không
          if (scannedEventId === eventId) {
            Alert.alert('Thành Công', `Mã QR khớp với sự kiện ${eventId}`, [
              { text: 'OK', onPress: () => console.log('Alert closed') },
            ]);
          } else {
            Alert.alert('Lỗi', 'Mã QR không khớp với sự kiện này', [
              { text: 'OK', onPress: () => console.log('Alert closed') },
            ]);
          }
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể xử lý mã QR', [
            { text: 'OK', onPress: () => console.log('Alert closed') },
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

        // Yêu cầu quyền lưu trữ cho Android (nếu cần lưu dữ liệu quét)
        if (Platform.OS === 'android') {
          const storagePermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Quyền Truy Cập Bộ Nhớ',
              message: 'Ứng dụng cần quyền truy cập bộ nhớ để lưu dữ liệu quét QR',
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
        codeScanner={codeScanner} // Kích hoạt quét mã QR
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
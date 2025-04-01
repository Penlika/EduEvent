import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
//Gửi thông báo khi có sự kiện (ví dụ sự kiện sắp diễn ra, thay đổi trạng thái sự kiện). sendLocalNotification("Edu Event", "Sự kiện diễn ra trong 1 giờ nữa!");
export const sendLocalNotification = (title, body) => {
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { seconds: 1 }
  });
};

export const showAlert = (message) => {
  Alert.alert("Thông báo", message);
};
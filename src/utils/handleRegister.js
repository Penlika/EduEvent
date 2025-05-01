import {Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const handleRegister = async event => {
  const user = auth().currentUser;
  if (!user) {
    Alert.alert('Lỗi', 'Bạn cần đăng nhập để đăng ký sự kiện.');
    return;
  }

  try {
    const userRef = firestore().collection('USER').doc(user.uid);

    await userRef.update({
      registeredEvents: firestore.FieldValue.arrayUnion({
        id: event.id,
        title: event.title,
        location: event.location,
        time: event.time,
        category: event.category,
        complete: false,
        registeredAt: new Date().toISOString(),
      }),
    });

    //   Gửi vào Firestore: thông báo đăng ký sự kiện thành công
        await firestore()
          .collection('USER')
          .doc(user.uid)
          .collection('notifications')
          .add({
            title: 'Đăng ký sự kiện thành công',
            body: `Bạn đã đăng ký tham gia sự kiện "${event.title}".`,
            type: 'event_joined', // bạn đã xử lý icon cho type này
            isRead: false,
            timestamp: firestore.FieldValue.serverTimestamp(),
          });
  
    Alert.alert('Thành công', '✅ Bạn đã đăng ký sự kiện thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký sự kiện:', error);
    Alert.alert('Lỗi', 'Đăng ký sự kiện thất bại. Vui lòng thử lại.');
  }
};

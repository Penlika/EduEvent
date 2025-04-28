import {View, Text, TouchableOpacity, Image} from 'react-native';
import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';

const HeaderNotificationButton = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('USER')
      .doc(userId)
      .collection('notifications')
      .where('isRead', '==', false) // chỉ lấy noti chưa đọc
      .onSnapshot(snapshot => {
        setUnreadCount(snapshot.size);
      });

    return unsubscribe;
  }, []);

  return (
    <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen')}>
      <View>
        <Image
          source={require('../assets/images/notificationIcon.png')}
          style={{width: 30, height: 30}}
        />
        {unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            right: -5,
            top: -5,
            backgroundColor: 'red',
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>{unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default HeaderNotificationButton;

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Khi màn hình tập trung, đánh dấu tất cả thông báo là đã đọc
  useFocusEffect(
    useCallback(() => {
      const markAllAsRead = async () => {
        const userId = auth().currentUser?.uid;
        if (!userId) return;

        const snapshot = await firestore()
          .collection('USER')
          .doc(userId)
          .collection('notifications')
          .where('isRead', '==', false)
          .get();

        const batch = firestore().batch();
        snapshot.forEach(doc => {
          batch.update(doc.ref, { isRead: true });
        });

        await batch.commit();
      };

      markAllAsRead();
    }, [])
  );

  // Fetch các thông báo để hiển thị
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('USER')
      .doc(userId)
      .collection('notifications')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        const notifList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifList);
      });

    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Nhóm thông báo theo ngày
  const groupNotificationsByDate = () => {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    const sections = [];
    const todayNoti = [];
    const yesterdayNoti = [];
    const otherNoti = {};

    notifications.forEach(item => {
      const createdAt = moment(
        item.timestamp?.toDate ? item.timestamp.toDate() : item.timestamp
      );
      if (createdAt.isSame(today, 'd')) {
        todayNoti.push(item);
      } else if (createdAt.isSame(yesterday, 'd')) {
        yesterdayNoti.push(item);
      } else {
        const formattedDate = createdAt.format('MMM DD, YYYY');
        if (!otherNoti[formattedDate]) {
          otherNoti[formattedDate] = [];
        }
        otherNoti[formattedDate].push(item);
      }
    });

    if (todayNoti.length > 0) {
      sections.push({ title: 'Today', data: todayNoti });
    }
    if (yesterdayNoti.length > 0) {
      sections.push({ title: 'Yesterday', data: yesterdayNoti });
    }
    Object.keys(otherNoti).forEach(date => {
      sections.push({ title: date, data: otherNoti[date] });
    });

    return sections;
  };

  const sections = groupNotificationsByDate();  
  

  const getIconByType = type => {
    switch (type) {
      case 'new_event':
        return require('../../assets/icons/event.png');
      case 'event_joined':
        return require('../../assets/icons/success.png');
      case 'event_failed':
        return require('../../assets/icons/fail.png');
      case 'account_setup':
        return require('../../assets/icons/account.png');
      default:
        return require('../../assets/icons/default.png');
    }
  };

  const renderNotificationItem = ({ item }) => {
    const icon = getIconByType(item.type);

    return (
      <View
        style={{
          backgroundColor: '#F5F7FB',
          padding: 15,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 5,
        }}
      >
        <Image
          source={icon}
          style={{ width: 60, height: 60, marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            {item.title}
          </Text>
          <Text style={{ color: 'gray', marginTop: 5 }}>{item.body}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 10 ,backgroundColor:'white'}}
        >
          <Icon name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1C1C1E' }}>
          Notifications
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderNotificationItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginVertical: 5, 
            }}
          >
            {title}
          </Text>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default NotificationScreen;

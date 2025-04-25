import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';

const AllChatsScreen = () => {
  const navigation = useNavigation();
  const currentUserId = auth().currentUser.uid;
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUserId)
      .onSnapshot(async snapshot => {
        const chatsData = [];

        for (const doc of snapshot.docs) {
          const chat = doc.data();
          const organizerId = chat.participants.find(
            id => id !== currentUserId,
          );

          const userDoc = await firestore()
            .collection('organizer')
            .doc(organizerId)
            .get();
          const userData = userDoc.data();

          chatsData.push({
            id: doc.id,
            lastMessage: chat.lastMessage || '',
            unreadCount: chat.unreadCount?.[currentUserId] || 0,
            createdAt:
              chat.createdAt?.toDate().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }) || '',
            organizer: {
              id: organizerId,
              name: userData?.name || 'Unknown',
              avatar: userData?.avatar || null,
            },
          });
        }

        setChats(chatsData);
      });

    return () => unsubscribe();
  }, [currentUserId]);

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        navigation.navigate('ChatScreen', {
          currentUserId,
          organizerId: item.organizer.id,
        })
      }>
      <Image
        source={
          item.organizer.avatar
            ? {uri: item.organizer.avatar}
            : require('../../assets/icons/default-avatar.png')
        }
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.organizer.name}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.rightContainer}>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount.toString().padStart(2, '0')}
            </Text>
          </View>
        )}
        <Text style={styles.timeText}>{item.createdAt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.title}>Indox</Text>
        <TouchableOpacity onPress={() => {}}>
          <Icon name="search" size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default AllChatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#ccc',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  message: {
    fontSize: 24,
    color: '#545454',
    marginTop: 4,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 55,
  },
  unreadBadge: {
    backgroundColor: '#0057FF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
    alignSelf: 'flex-end',
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  separator: {
    height: 1,
    backgroundColor: '#EEF1F6',
    marginLeft: 83,
  },
});

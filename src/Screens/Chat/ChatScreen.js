import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';
import uuid from 'react-native-uuid';

const ChatScreen = ({navigation}) => {
  const route = useRoute();
  const {currentUserId, organizerId} = route.params;

  const chatId = [currentUserId, organizerId].sort().join('_');

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const [organizerName, setOrganizerName] = useState('');

  useEffect(() => {
    const fetchOrganizerName = async () => {
      try {
        const userDoc = await firestore()
          .collection('organizer')
          .doc(organizerId)
          .get();
        if (userDoc.exists) {
          const data = userDoc.data();
          setOrganizerName(data.name || 'Organizer');
        } else {
          setOrganizerName('Organizer');
        }
      } catch (error) {
        console.error('Error fetching organizer name:', error);
        setOrganizerName('Organizer');
      }
    };

    fetchOrganizerName();
  }, [organizerId]);

  useEffect(() => {
    const checkChatExistence = async () => {
      const chatRef = firestore().collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();
  
      if (!chatDoc.exists) {
        await chatRef.set({
          createdAt: firestore.FieldValue.serverTimestamp(),
          participants: [currentUserId, organizerId],
          unreadCount: {
            [currentUserId]: 0,
            [organizerId]: 0,
          },
        });
      } else {
        // Reset unread count của currentUser khi mở chat
        await chatRef.update({
          [`unreadCount.${currentUserId}`]: 0,
        });
      }
    };
  
    checkChatExistence();
  

    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const msgList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgList);
      });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (imageUrl = null) => {
    if (!inputText && !imageUrl) return;
  
    const otherUserId = organizerId;
  
    const message = {
      text: inputText,
      senderId: currentUserId,
      imageUrl: imageUrl || null,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
  
    const chatRef = firestore().collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();
    const unread = chatDoc.exists && chatDoc.data().unreadCount?.[otherUserId] || 0;
  
    await chatRef.collection('messages').add(message);
  
    await chatRef.update({
      lastMessage: inputText || '[image]',
      [`unreadCount.${otherUserId}`]: unread + 1,
    });
  
    setInputText('');
  };
  

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'pho  to',
      quality: 0.5,
    });

    if (!result.didCancel && !result.errorCode && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      const filename = `${uuid.v4()}.jpg`;

      const ref = storage().ref(`chat_images/${chatId}/${filename}`);
      await ref.putFile(uri);

      const downloadURL = await ref.getDownloadURL();
      sendMessage(downloadURL);
    }
  };

  const renderItem = ({item}) => {
    const isMe = item.senderId === currentUserId;

    return (
      <View
        style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          backgroundColor: isMe ? '#E8F1FF' : '#4C935E',
          borderRadius: 16,
          padding: 12,
          marginVertical: 4,
          marginHorizontal: 10,
          maxWidth: '75%',
        }}>
        {item.imageUrl && (
          <Image
            source={{uri: item.imageUrl}}
            style={{width: 180, height: 180, borderRadius: 12, marginBottom: 8}}
          />
        )}
        {item.text ? (
          <Text
            style={{
              fontWeight: '600',
              color: isMe ? '#111' : '#fff',
              fontSize: 14,
            }}>
            {item.text}
          </Text>
        ) : null}
        {item.createdAt && (
          <Text
            style={{
              fontSize: 10,
              alignSelf: 'flex-end',
              color: isMe ? '#555' : '#fff',
              marginTop: 4,
            }}>
            {item.createdAt
              .toDate()
              .toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: '#f8fbff'}}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.left}>
          <Image
            source={require('../../assets/icons/back.png')}
            style={[styles.icon, {width: 36}]}
          />
          <Text style={styles.organizerName}> {organizerName}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={{paddingVertical: 10}}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 24,
          borderTopWidth: 1,
          borderColor: '#e0e0e0',
          backgroundColor: '#fff',
          marginBottom: 12,
        }}>
        <TextInput
          placeholder="Message"
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{
            flex: 1,
            backgroundColor: '#F5F9FF',
            borderRadius: 25,
            paddingHorizontal: 15,
            paddingVertical: 8,
            fontSize: 18,
            maxHeight: 120,
          }}
        />
        <TouchableOpacity onPress={pickImage}>
          <Text style={{fontSize: 22, marginRight: 8}}>📎</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sendMessage()}>
          <Image
            source={require('../../assets/icons/sendmess.png')}
            style={{width: 48, height: 48, marginLeft: 10}}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  header: {
    height: 60,
    marginTop: 24,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9ff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e1f4b',
    marginLeft: 10,
  },
  icon: {
    width: 24,
    height: 20,
    tintColor: '#1e1f4b',
  },
  organizerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e1f4b',
  },
});

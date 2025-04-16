import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Schedule = ({navigation}) => {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('Completed'); // hoặc 'Completed'
  const [searchText, setSearchText] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };
  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      const user = auth().currentUser;
      if (!user) return;

      try {
        const userDoc = await firestore()
          .collection('USER')
          .doc(user.uid)
          .get();
        const registered = userDoc.data()?.registeredEvents || [];
        setEvents(registered);
      } catch (err) {
        console.error('Lỗi lấy sự kiện đã đăng ký:', err);
      }
    };

    fetchRegisteredEvents();
  }, []);
  // search
  const filteredEvents = events
    .filter(event =>
      event.title.toLowerCase().includes(searchText.toLowerCase()),
    )
    .filter(event => {
      if (activeTab === 'Completed') {
        return event.complete === true;
      } else {
        return event.complete !== true;
      }
    });

  const renderEventItem = ({item}) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.category}>{item.category}</Text>
        {activeTab === 'Completed' && (
          <View style={styles.checkCircle}>
            <Icon name="check-circle" size={25} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.time}>
        {item.time?.toDate?.().toLocaleString('vi-VN')} | {item.location}
      </Text>
      <TouchableOpacity>
        <Text style={styles.certificate}>VIEW CERTIFICATE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={30} color="#202244" />
        </TouchableOpacity>
        <Text style={styles.header}>My Schedule</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && styles.tabActive]}
          onPress={() => setActiveTab('Completed')}>
          <Text
            style={
              activeTab === 'Completed' ? styles.tabTextActive : styles.tabText
            }>
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Ongoing' && styles.tabActive]}
          onPress={() => setActiveTab('Ongoing')}>
          <Text
            style={
              activeTab === 'Ongoing' ? styles.tabTextActive : styles.tabText
            }>
            Ongoing
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item, index) => item.id + index}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default Schedule;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,

    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  tab: {
    width: '40%',
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#00695c',
  },
  tabText: {
    color: '#202244',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 30,
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    height: 140,
    borderRadius: 15,
    margin: 16,
    padding: 16,
    elevation: 50,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    color: '#f57c00',
    fontWeight: 'bold',
  },
  completedIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 5,
  },
  time: {
    color: '#777',
    marginBottom: 8,
  },
  certificate: {
    position: 'absolute',
    right: 5,
    color: '#1e88e5',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  backBtn: {
    borderRadius: 24,
    padding: 16,
    alignSelf: 'flex-start',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  checkCircle: {
    position: 'absolute',
    right: 5,
    top: -30,
    backgroundColor: '#4CAF50', // màu xanh lá
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

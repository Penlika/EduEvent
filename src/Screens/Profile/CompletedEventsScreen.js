import React, { useState, useEffect } from 'react';
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

const CompletedEventsScreen = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('Participated');
  const [searchText, setSearchText] = useState('');
  const [totalPoints, setTotalPoints] = useState(0);
  const [participatedCount, setParticipatedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

  // Fetch userId from Firebase Authentication
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, []);

  // Fetch events data from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      if (!userId) return;

      try {
        const snapshot = await firestore()
          .collection('USER')
          .doc(userId)
          .collection('registeredEvents')
          .get();

        const eventsData = await Promise.all(
          snapshot.docs.map(async doc => {
            const eventId = doc.id;
            const eventDoc = await firestore()
              .collection('event')
              .doc(eventId)
              .get();

            const point = eventDoc.exists ? eventDoc.data().point || 0 : 0;
            const completed = doc.data().completed === true; // Standardize completed to true/false
            return {
              id: doc.id,
              title: doc.data().title || 'No Title',
              address: doc.data().address || '',
              category: doc.data().category || 'Unknown',
              time: doc.data().time?.toDate?.(),
              host: eventDoc.exists ? eventDoc.data().host || 'Unknown' : 'Unknown', // Use host instead of location
              completed, // Ensure completed is true/false
              points: typeof point === 'string' ? Number(point) : point,
            };
          }),
        );

        // Log data for debugging
        console.log('Events Data:', eventsData);

        setEvents(eventsData);

        // Calculate total points for attended events
        const participatedEvents = eventsData.filter(event => event.completed);
        const calculatedPoints = participatedEvents.reduce(
          (sum, event) => sum + event.points,
          0,
        );
        setTotalPoints(calculatedPoints);

        // Count attended and missed events
        setParticipatedCount(participatedEvents.length);
        setMissedCount(eventsData.length - participatedEvents.length);
      } catch (error) {
        console.error('Error fetching events: ', error);
      }
    };

    fetchEvents();
  }, [userId]);

  // Filter events by tab and search
  const filteredEvents = events
    .filter(event =>
      event.title.toLowerCase().includes(searchText.toLowerCase()),
    )
    .filter(event => {
      if (activeTab === 'Participated') {
        return event.completed === true;
      } else {
        return event.completed === false;
      }
    });

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.category}>{item.category}</Text>
        {activeTab === 'Participated' && (
          <View style={styles.checkCircle}>
            <Icon name="check-circle" size={25} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.time}>
        {item.time?.toLocaleString('en-US')} | {item.host}
      </Text>
      {activeTab === 'Participated' && (
        <Text style={styles.points}>Points: {item.points}</Text>
      )}
    </View>
  );

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={30} color="#202244" />
        </TouchableOpacity>
        <Text style={styles.header}>Evaluate Training Results</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.totalPoints}>Total Points: {totalPoints}/12</Text>
        <Text style={styles.summaryText}>
          Events Attended: {participatedCount}
        </Text>
        <Text style={styles.summaryText}>Events Missed: {missedCount}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Participated' && styles.tabActive]}
          onPress={() => setActiveTab('Participated')}
        >
          <Text
            style={
              activeTab === 'Participated' ? styles.tabTextActive : styles.tabText
            }
          >
            Joined
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Missed' && styles.tabActive]}
          onPress={() => setActiveTab('Missed')}
        >
          <Text
            style={
              activeTab === 'Missed' ? styles.tabTextActive : styles.tabText
            }
          >
            Missed
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  summaryContainer: {
    padding: 16,
    alignItems: 'center',
  },
  totalPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#777',
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
    fontSize: 14,
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
  checkCircle: {
    position: 'absolute',
    right: 5,
    top: -30,
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  points: {
    position: 'absolute',
    right: 15,
    bottom: 20,
    color: '#1e88e5',
    fontWeight: 'bold',
  },
});

export default CompletedEventsScreen;
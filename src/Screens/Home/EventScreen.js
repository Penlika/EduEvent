import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../component/ThemeContext';
import axios from 'axios';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const EventScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('Completed');
  const [searchText, setSearchText] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const user = auth().currentUser;

  // Translation states
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  
  // Google Translate API key
  const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDcmLnMFuSVamZ8NeQ-DJFie0nEsiPug8Q';
  
  // Original content that needs translation
  const originalContent = {
    mySchedule: 'My Schedule',
    searchPlaceholder: 'Search for...',
    completed: 'Completed',
    ongoing: 'Ongoing',
    viewCertificate: 'VIEW CERTIFICATE',
  };
  
  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});

  const handleBack = () => {
    navigation.goBack();
  };

  // Setup real-time listener for language changes and fetch events
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to user document changes in Firestore
    const unsubscribe = firestore()
      .collection('USER')
      .doc(user.uid)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const userData = snapshot.data();
            if (userData.language && userData.language !== currentLang) {
              // Language has changed, update
              setCurrentLang(userData.language);
              
              // If switching to English, reset to original content
              if (userData.language === 'en') {
                console.log('Switching to English - resetting translations');
                setTranslations({...originalContent});
              } else {
                // Otherwise translate
                translateAllContent(userData.language);
              }
            }
          }
        },
        error => {
          console.error("Firestore snapshot error:", error);
        }
      );
    
    // Initial language fetch and translation
    fetchUserLanguage();
    
    // Fetch registered events
    fetchRegisteredEvents();
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Function to fetch user's language preference from Firestore
  const fetchUserLanguage = async () => {
    if (user) {
      try {
        const doc = await firestore().collection('USER').doc(user.uid).get();
        if (doc.exists) {
          const userLang = doc.data().language || 'en';
          
          // Update current language state
          setCurrentLang(userLang);
          
          // If English, explicitly reset to original content
          if (userLang === 'en') {
            console.log('Language is English - resetting to original content');
            setTranslations({...originalContent});
            setTranslationCache({});
          } 
          // Only translate if the language is different and not English
          else if (userLang !== 'en') {
            translateAllContent(userLang);
          }
        }
      } catch (err) {
        console.log('Error fetching user language:', err);
        // Default to English on error
        setCurrentLang('en');
        setTranslations({...originalContent});
      }
    }
  };

  // Function to translate text using Google Translate API
  const translateText = async (text, targetLang) => {
    // Return original if language is English or text is empty
    if (targetLang === 'en' || !text) return text;
    
    // Check if translation is already in cache
    const cacheKey = `${text}-${targetLang}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }
    
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {},
        {
          params: {
            q: text,
            target: targetLang,
            format: 'text',
            key: GOOGLE_TRANSLATE_API_KEY,
          },
        }
      );
      
      const translatedText = response.data.data.translations[0].translatedText;
      
      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));
      
      return translatedText;
    } catch (error) {
      console.error('Translation API error:', error);
      return text; // Return original text on error
    }
  };

  // Function to translate all content at once
  const translateAllContent = async (targetLang) => {
    // Explicit check for English
    if (targetLang === 'en') {
      console.log('TranslateAllContent: Setting to English');
      setTranslations({...originalContent});
      setTranslationCache({});
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const translationPromises = Object.entries(originalContent).map(async ([key, value]) => {
        const translatedText = await translateText(value, targetLang);
        return [key, translatedText];
      });
      
      const translatedEntries = await Promise.all(translationPromises);
      const newTranslations = Object.fromEntries(translatedEntries);
      
      setTranslations(newTranslations);
    } catch (error) {
      console.error('Translation batch error:', error);
      // Fallback to original content on error
      setTranslations({...originalContent});
    } finally {
      setIsTranslating(false);
    }
  };

  // Helper function to get translated text with safety fallback
  const getText = (key) => {
    // Explicitly check if language is English to use original content
    if (currentLang === 'en') {
      return originalContent[key] || key;
    }
    return translations[key] || originalContent[key] || key;
  };

  const fetchRegisteredEvents = async () => {
    if (!user) return;

    try {
      const userDoc = await firestore()
        .collection('USER')
        .doc(user.uid)
        .get();
      const registered = userDoc.data()?.registeredEvents || [];
      setEvents(registered);
    } catch (err) {
      console.error('Error fetching registered events:', err);
    }
  };

  // Search and filter functionality
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

  const renderEventItem = ({ item }) => (
    <View style={[
      styles.eventCard,
      { backgroundColor: isDark ? '#1A1A1A' : '#f9f9f9' }
    ]}>
      <View style={styles.eventHeader}>
        <Text style={[styles.category, { color: isDark ? '#FF9800' : '#f57c00' }]}>
          {item.category}
        </Text>
        {activeTab === 'Completed' && (
          <View style={[styles.checkCircle, { backgroundColor: isDark ? '#66BB6A' : '#4CAF50' }]}>
            <Icon name="check-circle" size={25} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
        {item.title}
      </Text>
      <Text style={[styles.time, { color: isDark ? '#bbb' : '#777' }]}>
        {item.time?.toDate?.().toLocaleString('vi-VN')} | {item.location}
      </Text>
      <TouchableOpacity>
        <Text style={[styles.certificate, { color: isDark ? '#42A5F5' : '#1e88e5' }]}>
          {getText('viewCertificate')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading indicator while translating
  if (isTranslating) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDark ? '#000' : '#F8FAFF' 
      }}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 20, color: isDark ? '#fff' : '#000' }}>
          Translating...
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#000' : '#fff' }
    ]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={30} color={isDark ? '#fff' : '#202244'} />
        </TouchableOpacity>
        <Text style={[
          styles.header,
          { color: isDark ? '#fff' : '#000' }
        ]}>
          {getText('mySchedule')}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder={getText('searchPlaceholder')}
          value={searchText}
          onChangeText={setSearchText}
          style={[
            styles.searchInput,
            { 
              backgroundColor: isDark ? '#1A1A1A' : '#f1f1f1',
              color: isDark ? '#fff' : '#000' 
            }
          ]}
          placeholderTextColor={isDark ? '#aaa' : '#999'}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Completed' && styles.tabActive,
            { backgroundColor: activeTab === 'Completed' ? '#1976D2' : isDark ? '#333' : '#e0e0e0' }
          ]}
          onPress={() => setActiveTab('Completed')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Completed' && styles.tabTextActive,
              { color: activeTab === 'Completed' ? '#fff' : isDark ? '#fff' : '#202244' }
            ]}>
            {getText('completed')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Ongoing' && styles.tabActive,
            { backgroundColor: activeTab === 'Ongoing' ? '#1976D2' : isDark ? '#333' : '#e0e0e0' }
          ]}
          onPress={() => setActiveTab('Ongoing')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Ongoing' && styles.tabTextActive,
              { color: activeTab === 'Ongoing' ? '#fff' : isDark ? '#fff' : '#202244' }
            ]}>
            {getText('ongoing')}
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

export default EventScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: wp(5),
    marginBottom: 15,
  },
  tab: {
    width: '40%',
    height: hp(5),
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#00695c',
  },
  tabText: {
    fontSize: wp(3.5),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tabTextActive: {
    fontSize: wp(3.5),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 30,
  },
  eventCard: {
    height: hp(18),
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
    fontWeight: 'bold',
  },
  title: {
    fontSize: wp(4),
    fontWeight: '600',
    marginVertical: 5,
  },
  time: {
    marginBottom: 8,
  },
  certificate: {
    position: 'absolute',
    right: 5,
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(5),
  },
  backBtn: {
    borderRadius: 24,
    padding: 16,
    alignSelf: 'flex-start',
  },
  header: {
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  checkCircle: {
    position: 'absolute',
    right: 5,
    top: -30,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
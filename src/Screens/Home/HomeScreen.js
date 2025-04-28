import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import ImageListWithDots from '../../component/ImageListWithDots';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTheme} from '../../component/ThemeContext';
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import HeaderNotificationButton from '../../component/HeaderNotificationButton';

const HomeScreen = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();
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
    greeting: 'Hi, ALEX',
    learnToday: 'What would you like to learn today?',
    searchPlaceholder: 'Search for...',
    categories: 'Categories',
    seeAll: 'SEE ALL',
    popularEvent: 'Popular Event',
    allFilter: 'All',
    recentEvents: 'Recent Events',
    generalEvents: 'General Events',
    scientificConference: 'Scientific Conference',
    seminarTitle: 'SEMINAR ON BIOTECHNOLOGY AND SMART AGRICULTURE',
    people: 'People',
    topMentor: 'Top Mentor',
    mentorText: 'Mentor',
    faculty1: 'Viện CNTT & CDS',
    faculty2: 'Khoa Ngoại Ngữ',
  };

  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});

  // Setup real-time listener for language changes
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
          console.error('Firestore snapshot error:', error);
        },
      );

    // Initial language fetch and translation
    fetchUserLanguage();

    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Also check language when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserLanguage();
      return () => {};
    }, []),
  );

  // Fetch user's language preference from Firestore
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
        },
      );

      const translatedText = response.data.data.translations[0].translatedText;

      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText,
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation API error:', error);
      return text; // Return original text on error
    }
  };

  // Function to translate all content at once
  const translateAllContent = async targetLang => {
    // Explicit check for English
    if (targetLang === 'en') {
      console.log('TranslateAllContent: Setting to English');
      setTranslations({...originalContent});
      setTranslationCache({});
      return;
    }

    setIsTranslating(true);

    try {
      const translationPromises = Object.entries(originalContent).map(
        async ([key, value]) => {
          const translatedText = await translateText(value, targetLang);
          return [key, translatedText];
        },
      );

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
  const getText = key => {
    // Explicitly check if language is English to use original content
    if (currentLang === 'en') {
      return originalContent[key] || key;
    }
    return translations[key] || originalContent[key] || key;
  };

  if (isTranslating) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? '#000' : '#F8FAFF',
        }}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{marginTop: 20, color: isDark ? '#fff' : '#000'}}>
          Translating...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000' : '#F8FAFF',
        paddingHorizontal: wp(5),
      }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: hp(4),
        }}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Text
            style={{
              fontSize: wp(6),
              fontWeight: 'bold',
              color: isDark ? '#fff' : '#000',
            }}>
            {getText('greeting')}
          </Text>
        </TouchableOpacity>
        <HeaderNotificationButton />
      </View>
      <Text style={{fontSize: wp(4), color: isDark ? '#ccc' : 'gray'}}>
        {getText('learnToday')}
      </Text>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1A1A1A' : '#fff',
          borderRadius: wp(5),
          paddingHorizontal: wp(4),
          marginVertical: hp(2),
          height: hp(6),
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 50,
        }}>
        <Image
          source={require('../../assets/icons/searchIcon.png')}
          style={{width: 20, height: 20, tintColor: isDark ? '#fff' : '#000'}}
        />
        <TextInput
          placeholder={getText('searchPlaceholder')}
          placeholderTextColor={isDark ? '#aaa' : '#999'}
          style={{
            flex: 1,
            fontSize: wp(4),
            color: isDark ? '#fff' : '#000',
          }}
        />
        <TouchableOpacity>
          <Image
            source={require('../../assets/images/tuneIcon.png')}
            style={{
              width: 30,
              height: 30,
              tintColor: isDark ? '#fff' : '#000',
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View>
        <ImageListWithDots navigation={navigation} />
      </View>

      {/* Categories */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: hp(3),
        }}>
        <Text
          style={{
            fontSize: wp(5),
            fontWeight: 'bold',
            color: isDark ? '#fff' : '#000',
          }}>
          {getText('categories')}
        </Text>
        <Text
          style={{fontSize: wp(4), color: '#007BFF'}}
          onPress={() => navigation.navigate('AllCategory')}>
          {getText('seeAll')}{' '}
        </Text>
      </View>
      <View style={{flexDirection: 'row', marginTop: hp(1)}}>
        <Text
          style={{
            fontSize: wp(4),
            fontWeight: 'bold',
            marginRight: wp(3),
            color: isDark ? '#fff' : '#000',
          }}>
          {getText('faculty1')}
        </Text>
        <Text style={{fontSize: wp(4), color: isDark ? '#aaa' : 'gray'}}>
          {getText('faculty2')}
        </Text>
      </View>

      {/* Popular Event */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: hp(3),
        }}>
        <Text
          style={{
            fontSize: wp(5),
            fontWeight: 'bold',
            color: isDark ? '#fff' : '#000',
          }}>
          {getText('popularEvent')}
        </Text>
        <Text style={{fontSize: wp(4), color: '#007BFF'}}>
          {getText('seeAll')}
        </Text>
      </View>

      {/* Event Filters */}
      <View style={{flexDirection: 'row', marginTop: hp(2)}}>
        {[
          {key: 'allFilter', text: 'All'},
          {key: 'recentEvents', text: 'Recent Events'},
          {key: 'generalEvents', text: 'General Events'},
        ].map((item, index) => {
          const isSelected = index === 1;
          return (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: isSelected
                  ? '#007BFF'
                  : isDark
                  ? '#333'
                  : '#EAEAEA',
                paddingHorizontal: wp(3),
                paddingVertical: hp(1),
                borderRadius: wp(5),
                marginRight: wp(2),
              }}>
              <Text
                style={{
                  color: isSelected ? 'white' : isDark ? '#fff' : '#000',
                  fontSize: wp(3.5),
                }}>
                {getText(item.key)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Event Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{marginTop: hp(2)}}>
        {[1, 2].map((_, index) => (
          <TouchableOpacity
            key={index}
            style={{
              width: wp(50),
              height: hp(20),
              backgroundColor: isDark ? '#111' : '#000',
              marginRight: wp(3),
              borderRadius: wp(3),
              padding: wp(3),
              justifyContent: 'flex-end',
            }}
            onPress={() =>
              navigation.navigate('EventDetail', {
                eventId: 'TqtxnwNYHGDhzHvNCJse',
              })
            }>
            <Text
              style={{fontSize: wp(3.5), color: 'orange', fontWeight: 'bold'}}>
              {getText('scientificConference')}
            </Text>
            <Text
              style={{
                fontSize: wp(4),
                fontWeight: 'bold',
                color: 'white',
              }}>
              {getText('seminarTitle')}
            </Text>
            <Text style={{fontSize: wp(3.5), color: 'white'}}>
              120 {getText('people')} | ⭐ 4.2
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Top Mentors */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: hp(3),
        }}>
        <Text
          style={{
            fontSize: wp(5),
            fontWeight: 'bold',
            color: isDark ? '#fff' : '#000',
          }}>
          {getText('topMentor')}
        </Text>
        <Text style={{fontSize: wp(4), color: '#007BFF'}}>
          {getText('seeAll')}
        </Text>
      </View>
      <View style={{flexDirection: 'row', marginTop: hp(2)}}>
        {[1, 2, 3, 4].map((_, index) => (
          <View
            key={index}
            style={{
              width: wp(20),
              height: wp(20),
              backgroundColor: isDark ? '#222' : 'black',
              borderRadius: wp(10),
              marginRight: wp(2),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{color: 'white'}}>
              {getText('mentorText')} {index + 1}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

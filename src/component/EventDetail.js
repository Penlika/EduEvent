import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  useColorScheme as _useColorScheme,
  Alert,
} from 'react-native';
import {firebase} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import moment from 'moment';
import {useTheme} from './ThemeContext'; // Import the theme context
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import axios from 'axios';

import {handleRegister} from '../utils/handleRegister';

const EventDetail = ({route, navigation}) => {
  const {eventId} = route.params;
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const userId = auth().currentUser?.uid;
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Get theme from context
  const {theme} = useTheme();
  const isDark = theme === 'dark';
  // Translation states
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});

  // Google Translate API key
  const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDcmLnMFuSVamZ8NeQ-DJFie0nEsiPug8Q';

  // Original content that needs translation
  const originalContent = {
    about: 'About',
    trailer: 'Trailer',
    organizer: 'Organizer',
    whatYouGet: "What You'll Get",
    reviews: 'Reviews',
    seeAll: 'SEE ALL',
    register: 'Register for the event',
    noTrailer: 'No trailer video available.',
    noEventData: 'No event data found.',
    loading: 'Loading...',
  };

  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});

  // Setup real-time listener for language changes
  useEffect(() => {
    if (!userId) return;

    // Subscribe to user document changes in Firestore
    const unsubscribe = firestore()
      .collection('USER')
      .doc(userId)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const userData = snapshot.data();
            if (userData.language && userData.language !== currentLang) {
              // Language has changed, update
              setCurrentLang(userData.language);

              // If switching to English, reset to original content
              if (userData.language === 'en') {
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

  // Fetch user's language preference from Firestore
  const fetchUserLanguage = async () => {
    if (userId) return; {
      try {
        const doc = await firestore().collection('USER').doc(userId).get();
        if (doc.exists && doc.data().language) {
          const userLang = doc.data().language;

          // Only update if language has changed
          if (userLang !== currentLang) {
            setCurrentLang(userLang);

            // If language is not English, translate content
            if (userLang !== 'en') {
              translateAllContent(userLang);
            } else {
              // Reset to original content for English
              setTranslations({...originalContent});
            }
          }
        }
      } catch (err) {
        console.log('Error fetching user language:', err);
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
    if (targetLang === 'en') {
      setTranslations({...originalContent});
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

  // Helper function to get translated text
  const getText = key => {
    return translations[key] || originalContent[key] || key;
  };

  // Generate dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#F7F8FB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#121212' : '#F7F8FB',
    },
    eventCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#fff',
      borderRadius: 12,
      marginTop: -4,
      margin: 16,
      padding: 16,
      elevation: 5,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.8 : 0.3,
      shadowRadius: 4,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginVertical: 8,
      color: isDark ? '#FFFFFF' : '#2F2F2F',
    },
    categoryText: {
      fontSize: 14,
      color: '#FF6F00', // Orange works in both themes
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 4,
      marginRight: 8,
      fontSize: 14,
      color: isDark ? '#CCCCCC' : '#333',
    },
    separator: {
      marginHorizontal: 4,
      color: isDark ? '#CCCCCC' : '#333',
    },
    aboutText: {
      fontSize: 14,
      color: isDark ? '#AAAAAA' : '#555',
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      margin: 16,
      color: isDark ? '#FFFFFF' : '#2F2F2F',
    },
    instructorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1E1E' : '#fff',
      borderRadius: 12,
      margin: 16,
      padding: 16,
      elevation: 5,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.8 : 0.3,
      shadowRadius: 4,
    },
    instructorName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#333',
    },
    instructorField: {
      fontSize: 14,
      color: isDark ? '#AAAAAA' : '#777',
    },
    benefitText: {
      marginLeft: 8,
      fontSize: 14,
      color: isDark ? '#CCCCCC' : '#333',
    },
    reviewItem: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1E1E1E' : '#fff',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      margin: 16,
      elevation: 3,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.8 : 0.3,
      shadowRadius: 3,
    },
    reviewName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#333',
    },
    reviewContent: {
      marginTop: 4,
      fontSize: 14,
      color: isDark ? '#AAAAAA' : '#555',
    },
    tabItem: {
      marginRight: 16,
      fontSize: 16,
      color: isDark ? '#888888' : '#aaa',
    },
    activeTabItem: {
      color: isDark ? '#FFFFFF' : '#2F2F2F',
      fontWeight: 'bold',
    },
    trailerWrapper: {
      width: '100%',
      height: 200,
      backgroundColor: isDark ? '#333333' : '#eee',
      justifyContent: 'center',
      alignItems: 'center',
    },
    noTrailerText: {
      color: isDark ? '#AAAAAA' : '#555',
    },
  });

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (!eventId) {
          console.warn('eventId bị null hoặc undefined');
          return;
        }

        const docRef = firebase.firestore().collection('event').doc(eventId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          setEventData(docSnap.data());
        } else {
          console.warn('Không tìm thấy sự kiện với eventId:', eventId);
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu sự kiện: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (userId && eventId) {
        try {
          const registrationDoc = await firestore()
            .collection('USER')
            .doc(userId)
            .collection('registeredEvents')
            .doc(eventId)
            .get();

          // Add console.log for debugging
          console.log('Registration check:', {
            exists: registrationDoc.exists,
            eventId: eventId,
            userId: user.uid
          });
          
          setIsRegistered(registrationDoc.exists);
        } catch (error) {
          console.error('Error checking registration:', error);
          setIsRegistered(false); // Ensure false on error
        }
      }
    };

    checkRegistration();
  }, [userId, eventId]);

  const handleBack = () => {
    navigation.goBack();
  };

  if (isTranslating) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000'} />
        <Text style={{color: isDark ? '#FFFFFF' : '#000'}}>
          {getText('loading')}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000'} />
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <Text style={{color: isDark ? '#FFFFFF' : '#000'}}>
          {getText('noEventData')}
        </Text>
      </View>
    );
  }
  // gọi chức năng đăng ký sụ kiện để thêm sự kiẹn vào scheduleschedule
  const onPressRegister = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please login to register for events');
      return;
    }

    try {
      // Clear any previous registration check
      setIsRegistered(false);
      
      // Check if already registered
      const registrationDoc = await firestore()
        .collection('USER')
        .doc(userId)
        .collection('registeredEvents')
        .doc(eventId)
        .get();

      if (!registrationDoc.exists) {
        Alert.alert('Error', 'You have already registered for this event');
        setIsRegistered(true);
        return;
      }

      await firestore()
        .collection('USER')
        .doc(userId)
        .collection('registeredEvents')
        .doc(eventId)
        .set({
          eventId: eventId,
          title: eventData.title || '',
          location: eventData.location || '',
          time: eventData.time || '',
          category: eventData.category || '',
          registeredAt: firestore.Timestamp.now(),
          completed: false,
          image: eventData.image || '',
          organizerId: eventData.organizerId || ''
        });

      setIsRegistered(true);
      Alert.alert('Success', 'Successfully registered for the event');
      //   Gửi vào Firestore: thông báo đăng ký sự kiện thành công
      await firestore()
      .collection('USER')
      .doc(userId)
      .collection('notifications')
      .add({
        title: 'Đăng ký sự kiện thành công',
        body: `Bạn đã đăng ký tham gia sự kiện "${eventData.title}".`,
        type: 'event_joined',
        isRead: false,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      // qua event screen
      navigation.navigate('EventScreen');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register for the event');
      setIsRegistered(false);
    }
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {eventData.image ? (
          <ImageBackground
            source={{uri: eventData.image}}
            style={{...styles.headerImg, marginTop: 30}}
            resizeMode="cover">
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          </ImageBackground>
        ) : (
          <View style={[styles.headerImg, {backgroundColor: 'black'}]}>
            <TouchableOpacity
              onPress={handleBack}
              style={{...styles.backBtn, marginTop: 30}}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Card info chung */}
        <View style={dynamicStyles.eventCard}>
          {/* Badge Category */}
          <Text style={dynamicStyles.categoryText}>
            {eventData.category || 'Category'}
          </Text>
          {/* Rating */}
          <View style={styles.ratingWrapper}>
            <Icon name="star" size={16} color="#f2c94c" />
            <Text
              style={{
                ...styles.ratingText,
                color: isDark ? '#FFFFFF' : '#333',
              }}>
              {eventData.rating ? eventData.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>

          {/* Title & Info */}
          <Text style={dynamicStyles.eventTitle} numberOfLines={2}>
            {eventData.title}
          </Text>

          <View style={styles.infoRow}>
            <Icon
              name="map-marker"
              size={16}
              color={isDark ? '#CCCCCC' : '#333'}
            />
            <Text style={dynamicStyles.infoText}>
              {eventData.location || 'Khu vuc chua duoc them'}
            </Text>
            <Text style={dynamicStyles.separator}>|</Text>
            <Icon
              name="clock-outline"
              size={16}
              color={isDark ? '#CCCCCC' : '#333'}
            />
            <Text style={dynamicStyles.infoText}>
              {eventData.time
                ? eventData.time.toDate().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '13:30'}
            </Text>
          </View>

          {/* quantity */}
          <Text
            style={{...styles.quantity, color: isDark ? '#64B5F6' : '#1E88E5'}}>
            {eventData.quantity
              ? `${eventData.quantity}/${eventData.quantitymax}`
              : '0/500'}
          </Text>

          {/* Tabs: About / Trailer (demo) */}
          <View style={styles.tabWrapper}>
            <TouchableOpacity onPress={() => setActiveTab('about')}>
              <Text
                style={[
                  dynamicStyles.tabItem,
                  activeTab === 'about' && dynamicStyles.activeTabItem,
                ]}>
                {getText('about')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('trailer')}>
              <Text
                style={[
                  dynamicStyles.tabItem,
                  activeTab === 'trailer' && dynamicStyles.activeTabItem,
                ]}>
                {getText('trailer')}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'about' ? (
            <Text style={dynamicStyles.aboutText}>
              {eventData.about || 'Thông tin mô tả sự kiện...'}
            </Text>
          ) : (
            <View style={dynamicStyles.trailerWrapper}>
              {eventData.trailerId ? (
                <YoutubePlayer
                  height={200}
                  width={360}
                  play={false}
                  videoId={eventData.trailerId}
                />
              ) : (
                <Text style={dynamicStyles.noTrailerText}>
                  {getText('noTrailer')}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Instructor */}
        <Text style={dynamicStyles.sectionTitle}>{getText('organizer')}</Text>
        <View style={dynamicStyles.instructorContainer}>
          {/* Giả sử eventData.instructor = { name, avatar, field } */}
          <Image
            source={{uri: eventData.organizer?.avatar}}
            style={styles.instructorAvatar}
          />
          <View style={{marginLeft: 10}}>
            <Text style={dynamicStyles.instructorName}>
              {eventData.organizer?.name || 'Robert jr'}
            </Text>
            <Text style={dynamicStyles.instructorField}>
              {eventData.organizer?.field || 'Graphic Design'}
            </Text>
          </View>
          {/* Icon chat */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ChatScreen', { currentUserId: userId , organizerId: eventData.organizerId })
            }
            style={{marginLeft: 'auto'}}>
            <Icon
              name="chat-processing-outline"
              size={30}
              color={isDark ? '#CCCCCC' : '#333'}
            />
          </TouchableOpacity>
        </View>

        {/* What You'll Get */}
        <Text style={dynamicStyles.sectionTitle}>{getText('whatYouGet')}</Text>
        {eventData.benefits?.map((item, index) => (
          <View style={styles.benefitItem} key={index}>
            <Icon
              name={item.icon}
              size={20}
              color={isDark ? '#CCCCCC' : '#000'}
              style={styles.benefitIcon}
            />
            <Text style={dynamicStyles.benefitText}>{item.text}</Text>
          </View>
        ))}

        {/* Reviews */}
        <View style={styles.reviewHeader}>
          <Text style={dynamicStyles.sectionTitle}>{getText('reviews')}</Text>
          <TouchableOpacity>
            <Text
              style={{
                ...styles.seeAllText,
                color: isDark ? '#64B5F6' : '#1E88E5',
              }}>
              {getText('seeAll')}
            </Text>
          </TouchableOpacity>
        </View>
        {eventData.reviews?.map((review, index) => (
          <View style={dynamicStyles.reviewItem} key={index}>
            <View style={styles.reviewAvatarWrapper}>
              <Image
                source={{uri: review.avatar}}
                style={styles.reviewAvatar}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={dynamicStyles.reviewName}>{review.name}</Text>
              <View style={styles.reviewRating}>
                <Icon name="star" size={14} color="#f2c94c" />
                <Text
                  style={{
                    ...styles.reviewRatingText,
                    color: isDark ? '#FFFFFF' : '#333',
                  }}>
                  {review.rating.toFixed(1)}
                </Text>
              </View>
              <Text style={dynamicStyles.reviewContent}>{review.content}</Text>
              <View style={styles.reviewFooter}>
                <Icon name="favorite" size={14} color="red" />
                <Text
                  style={{
                    ...styles.reviewLikes,
                    color: isDark ? '#CCCCCC' : '#333',
                  }}>
                  {review.likes}
                </Text>
                <Text
                  style={{
                    ...styles.reviewTime,
                    color: isDark ? '#777777' : '#999',
                  }}>
                  {review.timeAgo
                    ? moment(review.timeAgo.toDate()).fromNow()
                    : 'Chưa có thời gian'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.registerBtn,
          isRegistered && { backgroundColor: '#28a745' }
        ]} 
        onPress={() => {
          if (isRegistered) {
            navigation.navigate('QRScanner', { eventId });
          } else {
            onPressRegister();
          }
        }}
      >
        <Text style={styles.registerBtnText}>
          {isRegistered ? 'Scan QR Code' : getText('register')}
        </Text>
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: 'white',
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 5,
          shadowOffset: {width: 0, height: 2},
        }}>
          <Icon 
            name={isRegistered ? "qrcode-scan" : "arrow-right"} 
            size={30} 
            color={isRegistered ? '#28a745' : '#007AFF'} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default EventDetail;

// Static styles that don't change based on theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImg: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 16,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contentContainer: {
    paddingBottom: 80,
  },
  ratingWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 16,
  },
  benefitIcon: {
    marginRight: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    fontSize: 14,
    marginRight: 16,
  },
  reviewAvatarWrapper: {
    marginRight: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    marginLeft: 4,
    fontSize: 13,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewLikes: {
    marginLeft: 4,
    marginRight: 12,
    fontSize: 13,
  },
  reviewTime: {
    fontSize: 13,
    marginLeft: 'auto',
  },
  registerBtn: {
    position: 'absolute',
    bottom: '4%',
    right: '10%',
    left: '10%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  registerBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

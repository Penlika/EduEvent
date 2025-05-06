import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
  ToastAndroid,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import moment from 'moment';
import {useTheme} from './ThemeContext';
import CommentAndRating from '../component/CommentAndRating';
import axios from 'axios';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import Geolocation from '@react-native-community/geolocation';

// Hàm tính khoảng cách giữa hai điểm
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Khoảng cách tính bằng mét
};

const EventDetail = ({route, navigation}) => {
  const {eventId} = route.params;
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const userId = auth().currentUser?.uid;
  const [isRegistered, setIsRegistered] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [translationCache, setTranslationCache] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventComments, setEventComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [isEventCompleted, setIsEventCompleted] = useState(false);
  const [quantity, setQuantity] = useState(0);
  // Camera setup
  const cameraRef = useRef(null);
  const device = useCameraDevice('back');

  // Get theme from context
  const {theme} = useTheme();
  const isDark = theme === 'dark';

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
    loginRequired: 'Please login to register for events',
    alreadyRegistered: 'You have already registered for this event',
    registrationSuccess: 'Successfully registered for the event',
    registrationFailed: 'Failed to register for the event',
    invalidQR: 'Invalid QR code format (required: eventId:latitude:longitude)',
    noEventId: 'No event ID to compare',
    qrMismatch: 'QR code does not match the event',
    invalidCoords: 'Invalid coordinates in QR code',
    outOfRange: 'You are not within 50m radius',
    locationError: 'Unable to retrieve current location',
    qrError: 'Unable to process QR code',
    permissionDenied:
      'You need to grant location permission to verify the event',
    cameraDenied: 'You need to grant camera permission to scan QR code',
    success: 'QR code matches the event and you are within 50m radius',
    updateError: 'Unable to update event status',
    noCamera: 'No camera found',
  };

  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});

  // Setup real-time listener for language changes
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('USER')
      .doc(userId)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const userData = snapshot.data();
            if (userData.language && userData.language !== currentLang) {
              setCurrentLang(userData.language);
              if (userData.language === 'en') {
                setTranslations({...originalContent});
              } else {
                translateAllContent(userData.language);
              }
            }
          }
        },
        error => {
          console.error('Firestore snapshot error:', error);
        },
      );

    fetchUserLanguage();
    return () => unsubscribe();
  }, [userId, currentLang]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!eventId) return;
      
      try {
        const commentsSnapshot = await firestore()
          .collection('event')
          .doc(eventId)
          .collection('CommentsAndRatings')
          .orderBy('timestamp', 'desc')
          .get();
        
        const commentsData = commentsSnapshot.docs.map(doc => ({
          ...doc.data(),
          commentId: doc.id
        }));
        
        // Sort comments to show current user's comment first
        const sortedComments = commentsData.sort((a, b) => {
          const currentUserId = auth().currentUser?.uid;
          if (a.userId === currentUserId) return -1;
          if (b.userId === currentUserId) return 1;
          return 0;
        });
        
        setEventComments(sortedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    
    fetchComments();
  }, [eventId]);

  const handleUserCommentDeleted = async () => {
    // Refresh the event data to update the ratings
    try {
      const docRef = firestore().collection('event').doc(eventId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        setEventData(docSnap.data());
      }
    } catch (error) {
      console.error('Error refreshing event data:', error);
    }
  };
  // Fetch user's language preference from Firestore
  const fetchUserLanguage = async () => {
    if (!userId) return;
    try {
      const doc = await firestore().collection('USER').doc(userId).get();
      if (doc.exists && doc.data().language) {
        const userLang = doc.data().language;
        if (userLang !== currentLang) {
          setCurrentLang(userLang);
          if (userLang !== 'en') {
            translateAllContent(userLang);
          } else {
            setTranslations({...originalContent});
          }
        }
      }
    } catch (err) {
      console.log('Error fetching user language:', err);
    }
  };

  // Function to translate text using Google Translate API
  const translateText = async (text, targetLang) => {
    if (targetLang === 'en' || !text) return text;
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
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText,
      }));
      return translatedText;
    } catch (error) {
      console.error('Translation API error:', error);
      return text;
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
      setTranslations({...originalContent});
    } finally {
      setIsTranslating(false);
    }
  };

  // Helper function to get translated text
  const getText = key => {
    return translations[key] || originalContent[key] || key;
  };

  // First add this helper function to determine time slot and periods
  const getTimeSlotDetails = (eventTime) => {
    const hours = eventTime.getHours();
    if (hours < 12) {
      return {
        timeSlot: 'morning',
        startPeriod: 1,
        endPeriod: 5
      };
    } else {
      return {
        timeSlot: 'afternoon', 
        startPeriod: 6,
        endPeriod: 10
      };
    }
  };

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (!eventId) {
          console.warn('eventId is null or undefined');
          return;
        }

        const docRef = firestore().collection('event').doc(eventId);
        const unsubscribe = docRef.onSnapshot((docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            setEventData(data);
            setQuantity(data.quantity || 0);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching event data: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Check registration status
  useEffect(() => {
    const checkRegistration = async () => {
      if (!userId || !eventId) {
        setIsRegistered(false);
        return;
      }

      try {
        const registrationDoc = await firestore()
          .collection('USER')
          .doc(userId)
          .collection('registeredEvents')
          .where('eventId', '==', eventId)
          .get();

        setIsRegistered(!registrationDoc.empty);

        // Debug logging
        console.log('Registration check:', {
          userId,
          eventId,
          isRegistered: !registrationDoc.empty,
          docsFound: registrationDoc.size
        });

      } catch (error) {
        console.error('Error checking registration:', error);
        setIsRegistered(false);
      }
    };

    checkRegistration();
  }, [userId, eventId]);

  // Request permissions for QR scanning
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermission();
        if (cameraPermission === 'denied') {
          Alert.alert('Lỗi', getText('cameraDenied'), [
            {text: 'OK', onPress: () => setIsScanning(false)},
          ]);
          return;
        }

        if (Platform.OS === 'ios') {
          Geolocation.requestAuthorization('whenInUse');
        } else {
          const locationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Quyền Truy Cập Vị Trí',
              message:
                'Ứng dụng cần quyền truy cập vị trí để xác minh bạn đang ở gần sự kiện',
              buttonPositive: 'Đồng ý',
              buttonNegative: 'Hủy',
              buttonNeutral: 'Hỏi Sau',
            },
          );
          if (locationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Lỗi', getText('permissionDenied'), [
              {text: 'OK', onPress: () => setIsScanning(false)},
            ]);
          }
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    if (isScanning) {
      requestPermissions();
    }
  }, [isScanning]);

  // QR code scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (codes.length > 0 && !isProcessing) {
        setIsProcessing(true);
        const qrValue = codes[0].value;
        console.log('QR Value:', qrValue, 'Event ID:', eventId);

        try {
          const parts = qrValue.split(':');
          const [scannedEventId, eventLat, eventLon] = parts;

          // Kiểm tra eventId khớp trước tiên
          if (scannedEventId === eventId) {
            const lat2 = parseFloat(eventLat);
            const lon2 = parseFloat(eventLon);

            Geolocation.getCurrentPosition(
              position => {
                const {latitude, longitude} = position.coords;
                const distance = calculateDistance(
                  latitude,
                  longitude,
                  lat2,
                  lon2,
                );

                if (distance <= 50) {
                  const eventRef = firestore()
                    .collection('USER')
                    .doc(userId)
                    .collection('registeredEvents')
                    .doc(eventId);

                  eventRef
                    .update({completed: true})
                    .then(() => {
                      firestore()
                        .collection('USER')
                        .doc(userId)
                        .collection('notifications')
                        .add({
                          title: 'Sự kiện đã hoàn thành',
                          body: `Bạn đã hoàn thành sự kiện "${eventData.title}".`,
                          type: 'event_completed',
                          isRead: false,
                          timestamp: firestore.FieldValue.serverTimestamp(),
                        })
                        .then(() => {
                          Alert.alert('Thành Công', getText('success'), [
                            {text: 'OK', onPress: () => setIsScanning(false)},
                          ]);
                        });
                    })
                    .catch(() => {
                      Alert.alert('Lỗi', getText('updateError'), [
                        {text: 'OK', onPress: () => setIsProcessing(false)},
                      ]);
                    });
                } else {
                  Alert.alert('Lỗi', getText('outOfRange'), [
                    {text: 'OK', onPress: () => setIsProcessing(false)},
                  ]);
                }
              },
              error => {
                console.error('Lỗi lấy vị trí:', error);
                Alert.alert('Lỗi', getText('locationError'), [
                  {text: 'OK', onPress: () => setIsProcessing(false)},
                  {text: 'Mở Cài Đặt', onPress: () => Linking.openSettings()},
                ]);
              },
              {timeout: 10000, maximumAge: 10000},
            );
          } else if (!eventId) {
            Alert.alert('Lỗi', getText('noEventId'), [
              {text: 'OK', onPress: () => setIsProcessing(false)},
            ]);
          } else {
            Alert.alert('Lỗi', getText('qrMismatch'), [
              {text: 'OK', onPress: () => setIsProcessing(false)},
            ]);
          }
        } catch (error) {
          console.error('Lỗi xử lý mã QR:', error);
          Alert.alert('Lỗi', getText('qrError'), [
            {text: 'OK', onPress: () => setIsProcessing(false)},
          ]);
        } finally {
          setTimeout(() => setIsProcessing(false), 1000);
        }
      }
    },
  });

  // Function to extract YouTube video ID
  const VideoPlayer = ({ url }) => {
    const videoInfo = getVideoInfo(url);
    
    if (!videoInfo) {
      return <Text>Invalid video URL</Text>;
    }
    
    if (videoInfo.platform === 'youtube') {
      return (
        <YoutubePlayer
          height={200}
          width={360}
          play={false}
          videoId={videoInfo.id}
        />
      );
    } else if (videoInfo.platform === 'drive') {
    return (
      <WebView
        style={{ height: 200, width: 360 }}
        source={{ 
          html: `
            <html>
              <body style="margin:0;padding:0;overflow:hidden;display:flex;justify-content:center;align-items:center;background-color:black;">
                <iframe src="https://drive.google.com/file/d/${videoInfo.id}/preview" 
                  width="100%" height="100%" 
                  frameborder="0" allowfullscreen
                  style="overflow:hidden;position:absolute;top:0;left:0;right:0;bottom:0;">
                </iframe>
              </body>
            </html>
          `
        }}
        originWhitelist={['*']}
        allowsFullscreenVideo
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    );
    } else if (videoInfo.platform === 'facebook') {
      return (
        <WebView
          style={{ height: 200, width: 360 }}
          source={{ uri: `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${videoInfo.id}` }}
          allowsFullscreenVideo
        />
      );
    }
    
    return <Text>Unsupported video platform</Text>;
  };
  
  // Extract video ID and platform from URL
  const getVideoInfo = (url) => {
    if (!url) return null;
  
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        platform: 'youtube',
        id: youtubeMatch[1],
      };
    }
  
    // Google Drive
    const driveRegex = /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/;
    const driveMatch = url.match(driveRegex);
    if (driveMatch) {
      return {
        platform: 'drive',
        id: driveMatch[1],
      };
    }
  
    // Facebook
    const facebookRegex = /facebook\.com\/.*\/videos\/(?:[a-zA-Z0-9._-]+\/)?(\d+)/;
    const facebookMatch = url.match(facebookRegex);
    if (facebookMatch) {
      return {
        platform: 'facebook',
        id: facebookMatch[1],
      };
    }
  
    return null;
  };
  

  // Handle event registration
// Handle event registration
const onPressRegister = async () => {
  if (!userId) {
    Alert.alert('Error', getText('loginRequired'));
    return;
  }

  try {
    // Check if already registered
    const registrationDoc = await firestore()
      .collection('USER')
      .doc(userId)
      .collection('registeredEvents')
      .where('eventId', '==', eventId)
      .get();

    if (!registrationDoc.empty) {
      Alert.alert('Error', getText('alreadyRegistered'));
      setIsRegistered(true);
      return;
    }

    const eventTime = eventData.time.toDate();
    const { startPeriod, endPeriod } = getTimeSlotDetails(eventTime);

    // Create the schedule entry
    const scheduleEntry = {
      ten_mon: eventData.title,
      ma_nhom: eventData.category,
      thoi_gian: eventData.time,
      ten_giang_vien: eventData.organizer?.name || 'N/A',
      dia_diem: eventData.host || 'N/A',
      tiet_bat_dau: startPeriod,
      so_tiet: endPeriod - startPeriod + 1,
      thu_kieu_so: eventTime.getDay() + 1, // Convert JS day (0-6) to schedule day (1-7)
      ngay_hoc: eventData.time,
    };

    // Use transaction to ensure atomicity and data integrity
    await firestore().runTransaction(async (transaction) => {
      // Get the current event document
      const eventRef = firestore().collection('event').doc(eventId);
      const eventDoc = await transaction.get(eventRef);
      
      if (!eventDoc.exists) {
        throw new Error('Event does not exist!');
      }
      
      // Calculate the new quantity (current + 1)
      const currentQuantity = eventDoc.data().quantity || 0;
      const newQuantity = currentQuantity + 1;
      
      // Update the quantity in the event document
      transaction.update(eventRef, {
        quantity: newQuantity
      });
      
      // Add to registeredEvents
      const registeredEventRef = firestore()
        .collection('USER')
        .doc(userId)
        .collection('registeredEvents')
        .doc(eventId);

      transaction.set(registeredEventRef, {
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

      // Add to schedule
      const scheduleRef = firestore()
        .collection('USER')
        .doc(userId)
        .collection('schedule')
        .doc(eventId);

      transaction.set(scheduleRef, scheduleEntry);
    });

    setIsRegistered(true);
    setQuantity(quantity + 1); // Update local state to reflect new quantity
    Alert.alert('Success', getText('registrationSuccess'));

    // Add notification
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

    navigation.navigate('EventScreen');
  } catch (error) {
    console.error('Registration error:', error);
    Alert.alert('Error', getText('registrationFailed'));
    setIsRegistered(false);
  }
};

  // Add the unregister function
// Add the unregister function
const handleUnregister = async () => {
  Alert.alert(
    'Unregister',
    'Are you sure you want to unregister from this event?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Unregister',
        style: 'destructive',
        onPress: async () => {
          try {
            await firestore().runTransaction(async (transaction) => {
              // Get references to all documents we need to update/delete
              const eventRef = firestore().collection('event').doc(eventId);
              const userEventRef = firestore()
                .collection('USER')
                .doc(userId)
                .collection('registeredEvents')
                .doc(eventId);
              const scheduleRef = firestore()
                .collection('USER')
                .doc(userId)
                .collection('schedule')
                .doc(eventId);
              
              // Verify the event exists
              const eventDoc = await transaction.get(eventRef);
              if (!eventDoc.exists) {
                throw new Error('Event does not exist!');
              }

              // Decrease the quantity field in the event document
              const currentQuantity = eventDoc.data().quantity || 0;
              // Ensure quantity doesn't go below 0
              const newQuantity = Math.max(0, currentQuantity - 1);
              transaction.update(eventRef, {
                quantity: newQuantity
              });

              // Delete from user's registered events
              transaction.delete(userEventRef);
              
              // Delete from user's schedule
              transaction.delete(scheduleRef);
            });

            setIsRegistered(false);
            setQuantity(Math.max(0, quantity - 1)); // Update local state
            ToastAndroid.show('Successfully unregistered!', ToastAndroid.SHORT);
            
            // Add notification about unregistration
            await firestore()
              .collection('USER')
              .doc(userId)
              .collection('notifications')
              .add({
                title: 'Hủy đăng ký sự kiện',
                body: `Bạn đã hủy đăng ký tham gia sự kiện "${eventData.title}".`,
                type: 'event_unregistered',
                isRead: false,
                timestamp: firestore.FieldValue.serverTimestamp(),
              });
            
          } catch (error) {
            console.error('Unregister error:', error);
            Alert.alert('Error', error.toString());
          }
        },
      },
    ],
  );
};

  // Handle back navigation
  const handleBack = () => {
    setIsScanning(false);
    navigation.goBack();
  };

  // Dynamic styles based on theme
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
      color: '#FF6F00',
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
    errorText: {
      color: isDark ? '#FFFFFF' : '#000',
      fontSize: 16,
      marginBottom: 20,
    },
    backBtn: {
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 24,
      padding: 16,
      alignSelf: 'flex-start',
    },
    circleBtn: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    
    buttonIcon: {
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
    },
  });

  // Handle QR scanning
  const handleQRScan = () => {
    setIsScanning(true);
  };

  // Check if user can view comments
  useEffect(() => {
    const checkEventCompletionStatus = async () => {
      if (!userId || !eventId) return;
      
      try {
        const eventDoc = await firestore()
          .collection('USER')
          .doc(userId)
          .collection('registeredEvents')
          .doc(eventId)
          .get();
        
        setShowComments(eventDoc.exists && eventDoc.data()?.completed === true);
      } catch (error) {
        console.error('Error checking event completion:', error);
        setShowComments(false);
      }
    };

    checkEventCompletionStatus();
  }, [userId, eventId]);

  // Check event completion status
  useEffect(() => {
    const checkEventCompletion = async () => {
      if (!userId || !eventId) return;

      try {
        const eventDoc = await firestore()
          .collection('USER')
          .doc(userId)
          .collection('registeredEvents')
          .doc(eventId)
          .get();

        setIsEventCompleted(eventDoc.exists && eventDoc.data()?.completed === true);
      } catch (error) {
        console.error('Error checking event completion:', error);
      }
    };

    checkEventCompletion();
  }, [userId, eventId]);

  if (isTranslating) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000'} />
        <Text style={dynamicStyles.errorText}>{getText('loading')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000'} />
        <Text style={dynamicStyles.errorText}>{getText('loading')}</Text>
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <Text style={dynamicStyles.errorText}>{getText('noEventData')}</Text>
      </View>
    );
  }

  if (isScanning) {
    if (!device) {
      return (
        <View style={dynamicStyles.container}>
          <Text style={dynamicStyles.errorText}>{getText('noCamera')}</Text>
          <TouchableOpacity onPress={handleBack} style={dynamicStyles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={dynamicStyles.container}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          codeScanner={codeScanner}
        />
        <TouchableOpacity onPress={handleBack} style={dynamicStyles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
      <ImageCarousel 
        images={eventData?.images || []} 
        onBack={handleBack}
        style={styles.headerImg}
      />

        {/* Card info chung */}
        <View style={dynamicStyles.eventCard}>
          {/* Badge Category */}
          <Text style={dynamicStyles.categoryText}>
            {eventData.category || 'Category'}
          </Text>
          {/* Rating */}
          <View style={styles.ratingWrapper}>
            <Text
              style={{
                ...styles.ratingText,
                color: isDark ? '#FFFFFF' : '#333',
              }}>
                ({eventData.ratings_count ? eventData.ratings_count : 'N/A'})
            </Text>
            <Icon name="star" size={16} color="#f2c94c" />
            <Text
              style={{
                ...styles.ratingText,
                color: isDark ? '#FFFFFF' : '#333',
              }}>
              {eventData.average_rating ? eventData.average_rating.toFixed(1) : 'N/A'}
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
              {eventData.host || 'Khu vực chưa được thêm'}
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

          {/* Quantity */}
          <Text
            style={{ ...styles.quantity, color: isDark ? '#64B5F6' : '#1E88E5' }}>
            {(eventData.quantity ?? 0)}/{eventData.quantitymax}
          </Text>


          {/* Tabs: About / Trailer */}
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
              {eventData.videoUrl ? (
                <VideoPlayer url={eventData.videoUrl} />
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
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ChatScreen', {
                currentUserId: userId,
                organizerId: eventData.organizerId,
              })
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

        {/* Comments section */}
        {showComments && (
          <CommentAndRating
            id={eventId}
            targetCollection="event"
            comments={eventComments}
            setComments={setEventComments}
            onUserCommentDeleted={handleUserCommentDeleted}
            isDarkMode={isDark}
            requirePurchase={true}
          />
        )}
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

      {/* Bottom buttons */}
      {isRegistered && !isEventCompleted ? (
      <View style={{ flexDirection: 'row', position: 'absolute', bottom: '4%', right: '10%', left: '10%' }}>
        <TouchableOpacity
          style={[styles.registerBtn, { backgroundColor: '#28a745' }]}
          onPress={handleQRScan}
        >
          <Text style={styles.registerBtnText}>Scan QR Code</Text>
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
              name="qrcode-scan"
              size={30}
              color="#28a745"
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.circleBtn, { marginLeft: 285 }]}
          onPress={handleUnregister}
        >
        <Icon name="close-circle" size={70} color="#dc3545" />
        </TouchableOpacity>
      </View>
      ) : !isRegistered && (
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={onPressRegister}
        >
          <Text style={styles.registerBtnText}>{getText('register')}</Text>
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
              name="arrow-right"
              size={30}
              color="#007AFF"
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Static styles that don't change based on theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 80,
  },
  headerImg: {
    width: '100%',
    height: 250,
    marginTop: 30,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 16,
    alignSelf: 'flex-start',
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
    width:300,
  },
  registerBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default EventDetail;

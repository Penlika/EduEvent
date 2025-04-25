import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { firebase } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons'; 


const EventCard = ({ route, navigation }) => {
  const { eventId } = route.params || {}; 
  // truyền eventId từ HomeScreen qua navigation

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const docRef = firebase.firestore().collection('event').doc(eventId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          setEventData(docSnap.data());
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu sự kiện: ', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy dữ liệu sự kiện.</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Header với nút Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#202244" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{eventData.title || 'Event Detail'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Card info chung */}
        <View style={styles.eventCard}>
          {/* Badge Category */}
          <Text style={styles.categoryText}>{eventData.category || 'Category'}</Text>
          {/* Rating */}
          <View style={styles.ratingWrapper}>
            <Icon name="star" size={16} color="#f2c94c" />
            <Text style={styles.ratingText}>
              {eventData.rating ? eventData.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>

          {/* Title & Info */}
          <Text style={styles.eventTitle} numberOfLines={2}>
            {eventData.title}
          </Text>

          <View style={styles.infoRow}>
            <Icon name="location-pin" size={16} color="#333" />
            <Text style={styles.infoText}>{eventData.location || 'Khu K23'}</Text>
            <Text style={styles.separator}>|</Text>
            <Icon name="access-time" size={16} color="#333" />
            <Text style={styles.infoText}>{eventData.time || '13:30'}</Text>
          </View>

          {/* Price */}
          <Text style={styles.priceText}>
            {eventData.price ? `${eventData.price}/500` : '399/500'}
          </Text>

          {/* Tabs: About / Trailer (demo) */}
          <View style={styles.tabWrapper}>
            <Text style={[styles.tabItem, { color: '#2F2F2F', fontWeight: 'bold' }]}>About</Text>
            <Text style={styles.tabItem}>Trailer</Text>
          </View>

          {/* About content */}
          <Text style={styles.aboutText}>
            {eventData.about || 'Thông tin mô tả sự kiện...'}
          </Text>
        </View>

        {/* Instructor */}
        <Text style={styles.sectionTitle}>Organizer</Text>
        <View style={styles.instructorContainer}>
          {/* Giả sử eventData.instructor = { name, avatar, field } */}
          <Image
            source={{ uri: eventData.organizer?.avatar }}
            style={styles.instructorAvatar}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.instructorName}>{eventData.organizer?.name || 'Robert jr'}</Text>
            <Text style={styles.instructorField}>{eventData.organizer?.field || 'Graphic Design'}</Text>
          </View>
          {/* Icon chat hay comment */}
          <Icon name="chat-bubble-outline" size={20} color="#333" style={{ marginLeft: 'auto' }} />
        </View>

        {/* What You'll Get */}
        <Text style={styles.sectionTitle}>What You’ll Get</Text>
        <View style={styles.benefitItem}>
          <Icon name="check-circle-outline" size={20} color="#333" />
          <Text style={styles.benefitText}>Share Experience</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="devices" size={20} color="#333" />
          <Text style={styles.benefitText}>Access Mobile, Desktop & TV</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="signal-cellular-alt" size={20} color="#333" />
          <Text style={styles.benefitText}>Beginner Level</Text>
        </View>
        {/* ... Thêm các mục khác tương tự ... */}

        {/* Reviews */}
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>SEE ALL</Text>
          </TouchableOpacity>
        </View>
        {eventData.reviews?.map((review, index) => (
          <View style={styles.reviewItem} key={index}>
            <View style={styles.reviewAvatarWrapper}>
              <Image
                source={{ uri: review.avatar }}
                style={styles.reviewAvatar}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>{review.name}</Text>
              <View style={styles.reviewRating}>
                <Icon name="star" size={14} color="#f2c94c" />
                <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.reviewContent}>{review.content}</Text>
              <View style={styles.reviewFooter}>
                <Icon name="favorite" size={14} color="red" />
                <Text style={styles.reviewLikes}>{review.likes}</Text>
                <Text style={styles.reviewTime}>{review.timeAgo}</Text>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* Nút đăng ký tham gia */}
      <TouchableOpacity style={styles.registerBtn}>
        <Text style={styles.registerBtnText}>Register for the event</Text>
        <Icon name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default EventCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80, // chừa khoảng trống cho nút Register
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    color: '#FF6F00',
    marginBottom: 8,
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
    color: '#333',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
    color: '#2F2F2F',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 4,
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
  separator: {
    marginHorizontal: 4,
    color: '#333',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 12,
  },
  tabWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabItem: {
    marginRight: 16,
    fontSize: 16,
    color: '#aaa',
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#2F2F2F',
  },
  instructorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  instructorField: {
    fontSize: 14,
    color: '#777',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1E88E5',
  },
  reviewItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    elevation: 1,
  },
  reviewAvatarWrapper: {
    marginRight: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#333',
  },
  reviewContent: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
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
    color: '#333',
  },
  reviewTime: {
    fontSize: 13,
    color: '#999',
    marginLeft: 'auto',
  },
  registerBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: '600',
  },
});

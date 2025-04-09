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
} from 'react-native';
import {firebase} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import moment from 'moment';
import {auth} from '../../firebaseConfig';
const EventDetail = ({route, navigation}) => {
  const {eventId} = route.params;
  // truyền eventId từ HomeScreen qua navigation
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about'); // hoặc 'trailer'

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
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header với hình ảnh làm nền */}
        {eventData.image ? (
          <ImageBackground
            source={{uri: eventData.image}}
            style={{...styles.headerImg, marginTop: 30}}
            resizeMode="cover">
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Icon name="arrow-back" size={24} color="#fff" />
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
        <View style={styles.eventCard}>
          {/* Badge Category */}
          <Text style={styles.categoryText}>
            {eventData.category || 'Category'}
          </Text>
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
            <Icon name="map-marker" size={16} color="#333" />
            <Text style={styles.infoText}>
              {eventData.location || 'Khu vuc chua duoc them'}
            </Text>
            <Text style={styles.separator}>|</Text>
            <Icon name="clock-outline" size={16} color="#333" />
            <Text style={styles.infoText}>
              {eventData.time
                ? eventData.time.toDate().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '13:30'}
            </Text>
          </View>

          {/* quantity */}
          <Text style={styles.quantity}>
            {eventData.quantity
              ? `${eventData.quantity}/${eventData.quantitymax}`
              : '0/500'}
          </Text>

          {/* Tabs: About / Trailer (demo) */}
          <View style={styles.tabWrapper}>
            <TouchableOpacity onPress={() => setActiveTab('about')}>
              <Text
                style={[
                  styles.tabItem,
                  activeTab === 'about' && {
                    color: '#2F2F2F',
                    fontWeight: 'bold',
                  },
                ]}>
                About
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('trailer')}>
              <Text
                style={[
                  styles.tabItem,
                  activeTab === 'trailer' && {
                    color: '#2F2F2F',
                    fontWeight: 'bold',
                  },
                ]}>
                Trailer
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'about' ? (
            <Text style={styles.aboutText}>
              {eventData.about || 'Thông tin mô tả sự kiện...'}
            </Text>
          ) : (
            <View style={styles.trailerWrapper}>
              {eventData.trailerId ? (
                <YoutubePlayer
                  height={200}
                  width={360}
                  play={false}
                  videoId={eventData.trailerId}
                />
              ) : (
                <Text>Không có video trailer.</Text>
              )}
            </View>
          )}
        </View>

        {/* Instructor */}
        <Text style={styles.sectionTitle}>Instructor</Text>
        <View style={styles.instructorContainer}>
          {/* Giả sử eventData.instructor = { name, avatar, field } */}
          <Image
            source={{uri: eventData.instructor?.avatar}}
            style={styles.instructorAvatar}
          />
          <View style={{marginLeft: 10}}>
            <Text style={styles.instructorName}>
              {eventData.instructor?.name || 'Robert jr'}
            </Text>
            <Text style={styles.instructorField}>
              {eventData.instructor?.field || 'Graphic Design'}
            </Text>
          </View>
          {/* Icon chat */}
          <Icon
            name="chat-processing-outline"
            size={30}
            color="#333"
            style={{marginLeft: 'auto'}}
          />
        </View>

        {/* What You'll Get */}
        <Text style={styles.sectionTitle}>What You'll Get</Text>
        {eventData.benefits?.map((item, index) => (
          <View style={styles.benefitItem} key={index}>
            <Icon
              name={item.icon}
              size={20}
              color="#000"
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>{item.text}</Text>
          </View>
        ))}

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
                source={{uri: review.avatar}}
                style={styles.reviewAvatar}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.reviewName}>{review.name}</Text>
              <View style={styles.reviewRating}>
                <Icon name="star" size={14} color="#f2c94c" />
                <Text style={styles.reviewRatingText}>
                  {review.rating.toFixed(1)}
                </Text>
              </View>
              <Text style={styles.reviewContent}>{review.content}</Text>
              <View style={styles.reviewFooter}>
                <Icon name="favorite" size={14} color="red" />
                <Text style={styles.reviewLikes}>{review.likes}</Text>
                <Text style={styles.reviewTime}>
                  {review.timeAgo
                    ? moment(review.timeAgo.toDate()).fromNow()
                    : 'Chưa có thời gian'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Nút đăng ký tham gia */}
      <TouchableOpacity style={styles.registerBtn}>
        <Text style={styles.registerBtnText}>Register for the event</Text>
        <View
          style={{
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
          
          <Icon name="arrow-right" size={30} color="#007AFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default EventDetail;

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
  headerImg: {
    width: '100%',
    height: '300',
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
    paddingBottom: 80, // chừa khoảng trống cho nút Register
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: -4,
    margin: 16,
    padding: 16,
    elevation: 50,
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
  quantity: {
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
    margin: 16,
    color: '#2F2F2F',
  },
  instructorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 50,
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
    marginLeft: 16,
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
    marginRight: 8,
    color: '#1E88E5',
  },
  reviewItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    margin: 16,
    elevation: 25,
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
    bottom: '4%',
    right: '10%',
    left:"10%",
    flexDirection: 'row',
    justifyContent:"space-between",
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
  tabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  tabItem: {
    fontSize: 16,
    color: '#999',
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  trailerWrapper: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  benefitIcon: {
    marginRight: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
  },
});

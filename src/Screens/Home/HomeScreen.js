import React from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImageListWithDots from '../../component/ImageListWithDots';


const HomeScreen = () => {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFF', paddingHorizontal: wp(5) }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: hp(3) }}>
        <Text style={{ fontSize: wp(6), fontWeight: 'bold' }}>Hi, ALEX</Text>
        <Image source={require('../../assets/images/notificationIcon.png')} style={{ width: 30, height: 30 }} />
      </View>
      <Text style={{ fontSize: wp(4), color: 'gray' }}>What would you like to learn today?</Text>

      {/* Search Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: wp(5),
        paddingHorizontal: wp(4),
        marginVertical: hp(2),
        height: hp(6),
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 50
      }}>
         <Image source={require('../../assets/images/searchIcon.png')} style={{ width: 20, height: 20 }} />
        <TextInput
          placeholder="Search for..."
          style={{ flex: 1, fontSize: wp(4) }}
        />
        <TouchableOpacity>
        <Image source={require('../../assets/images/tuneIcon.png')} style={{ width: 30, height: 30 }} />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View>
        <ImageListWithDots/>
      </View>

      {/* Categories */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(3) }}>
        <Text style={{ fontSize: wp(5), fontWeight: 'bold' }}>Categories</Text>
        <Text style={{ fontSize: wp(4), color: '#007BFF' }}>SEE ALL </Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: hp(1) }}>
        <Text style={{ fontSize: wp(4), fontWeight: 'bold', marginRight: wp(3) }}>Viện CNTT & CDS</Text>
        <Text style={{ fontSize: wp(4), color: 'gray' }}>Khoa Ngoại Ngữ</Text>
      </View>

      {/* Popular Event */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(3) }}>
        <Text style={{ fontSize: wp(5), fontWeight: 'bold' }}>Popular Event</Text>
        <Text style={{ fontSize: wp(4), color: '#007BFF' }}>SEE ALL</Text>
      </View>

      {/* Event Filters */}
      <View style={{ flexDirection: 'row', marginTop: hp(2) }}>
        {['All', 'Recent Events', 'General Events'].map((item, index) => (
          <TouchableOpacity key={index} style={{
            backgroundColor: index === 1 ? '#007BFF' : '#EAEAEA',
            paddingHorizontal: wp(3),
            paddingVertical: hp(1),
            borderRadius: wp(5),
            marginRight: wp(2)
          }}>
            <Text style={{ color: index === 1 ? 'white' : 'black', fontSize: wp(3.5) }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: hp(2) }}>
        {[1, 2].map((_, index) => (
          <View key={index} style={{
            width: wp(50),
            height: hp(20),
            backgroundColor: 'black',
            marginRight: wp(3),
            borderRadius: wp(3),
            padding: wp(3),
            justifyContent: 'flex-end'
          }}>
            <Text style={{ fontSize: wp(3.5), color: 'orange', fontWeight: 'bold' }}>Scientific Conference</Text>
            <Text style={{ fontSize: wp(4), fontWeight: 'bold', color: 'white' }}>SEMINAR ON BIOTECHNOLOGY AND SMART AGRICULTURE</Text>
            <Text style={{ fontSize: wp(3.5), color: 'white' }}>120 People | ⭐ 4.2</Text>
          </View>
        ))}
      </ScrollView>

      {/* Top Mentors */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(3) }}>
        <Text style={{ fontSize: wp(5), fontWeight: 'bold' }}>Top Mentor</Text>
        <Text style={{ fontSize: wp(4), color: '#007BFF' }}>SEE ALL</Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: hp(2) }}>
        {[1, 2, 3, 4].map((_, index) => (
          <View key={index} style={{
            width: wp(20),
            height: wp(20),
            backgroundColor: 'black',
            borderRadius: wp(10),
            marginRight: wp(2),
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ color: 'white' }}>Mentor {index + 1}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

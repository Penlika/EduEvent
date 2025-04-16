import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Header = ({ navigation }) => {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: hp(3) }}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Text style={{ fontSize: wp(6), fontWeight: 'bold' }}>Hi, ALEX</Text>
        </TouchableOpacity>
        <Image source={require('../assets/images/notificationIcon.png')} style={{ width: 30, height: 30 }} />
      </View>
    );
  };
  

export default Header

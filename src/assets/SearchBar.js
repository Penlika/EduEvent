import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

const SearchBar = () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: wp(5), paddingHorizontal: wp(4), marginVertical: hp(2), height: hp(6), shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 50 }}>
        <Image source={require('../../assets/icons/searchIcon.png')} style={{ width: 20, height: 20 }} />
        <TextInput placeholder="Search for..." style={{ flex: 1, fontSize: wp(4) }} />
        <TouchableOpacity>
          <Image source={require('../../assets/images/tuneIcon.png')} style={{ width: 30, height: 30 }} />
        </TouchableOpacity>
      </View>
    );
  };

export default SearchBar

const styles = StyleSheet.create({})
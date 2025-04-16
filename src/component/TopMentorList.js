import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

const TopMentorList = () => {
    return (
      <View style={{ flexDirection: 'row', marginTop: hp(2) }}>
        {[1, 2, 3, 4].map((_, index) => (
          <View key={index} style={{ width: wp(20), height: wp(20), backgroundColor: 'black', borderRadius: wp(10), marginRight: wp(2), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white' }}>Mentor {index + 1}</Text>
          </View>
        ))}
      </View>
    );
  };
export default TopMentorList

const styles = StyleSheet.create({})
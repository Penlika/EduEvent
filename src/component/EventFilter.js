import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

const EventFilter = () => {
    return (
      <View style={{ flexDirection: 'row', marginTop: hp(2) }}>
        {['All', 'Recent Events', 'General Events'].map((item, index) => (
          <TouchableOpacity key={index} style={{ backgroundColor: index === 1 ? '#007BFF' : '#EAEAEA', paddingHorizontal: wp(3), paddingVertical: hp(1), borderRadius: wp(5), marginRight: wp(2) }}>
            <Text style={{ color: index === 1 ? 'white' : 'black', fontSize: wp(3.5) }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
export default EventFilter

const styles = StyleSheet.create({})
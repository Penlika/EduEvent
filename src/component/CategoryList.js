import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

const CategoryList = ({ navigation }) => {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(3) }}>
        <Text style={{ fontSize: wp(5), fontWeight: 'bold' }}>Categories</Text>
        <Text style={{ fontSize: wp(4), color: '#007BFF' }} onPress={() => navigation.navigate('AllCategory')}>SEE ALL</Text>
      </View>
    );
  };

export default CategoryList

const styles = StyleSheet.create({})
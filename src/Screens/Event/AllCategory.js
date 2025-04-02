import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
const categories = [
  {name: '3D Design', icon: require('../../assets/icons/3d.png')},
  {name: 'Graphic Design', icon: require('../../assets/icons/graphic.png')},
  {name: 'Web Development', icon: require('../../assets/icons/web.png')},
  {name: 'SEO & Marketing', icon: require('../../assets/icons/seo.png')},
  {
    name: 'Finance & Accounting',
    icon: require('../../assets/icons/finance.png'),
  },
  {
    name: 'Personal Development',
    icon: require('../../assets/icons/personal.png'),
  },
  {name: 'Office Productivity', icon: require('../../assets/icons/office.png')},
  {name: 'HR Management', icon: require('../../assets/icons/hr.png')},
];

const AllCategory = ({navigation}) => {
  return (
    <ScrollView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={{padding: 16, paddingTop: '20%'}}>
        <View style={{flexDirection: 'row',}}>
          <TouchableOpacity
            style={{margin: 5}}
            onPress={() => navigation.navigate('HomeScreen')}>
            <Image
              source={require('../../assets/icons/left.png')}
              style={{width: 26.5, height: 20}}
            />
          </TouchableOpacity>
          <Text style={{fontSize: 24, fontWeight: 'bold',marginLeft:10}}>
            All Category
          </Text></View>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFF',
            borderRadius: wp(5),
            paddingHorizontal: wp(4),
            marginVertical: hp(2),
            height: hp(6),
            marginBottom: hp(2),
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 50,
          }}>
          <TextInput
            placeholder="Search for.."
            placeholderTextColor="#BCC0C8"
            style={{
              flex: 1,
              fontSize: wp(4),
              paddingVertical: hp(1),
            }}
          />
          <TouchableOpacity style={{marginLeft: 10}}>
            <Image
              source={require('../../assets/icons/search.png')}
              style={{width: 38, height: 38}}
            />
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
          {categories.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                width: '50%',
                backgroundColor: '#FFF',
                padding: 20,
                borderRadius: 10,
                marginBottom: 16,
                alignItems: 'center',
              }}>
              <Image
                source={item.icon}
                style={{width: 58, height: 58, marginBottom: 10}}
              />
              <Text style={{fontSize: 16, textAlign: 'center'}}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default AllCategory;

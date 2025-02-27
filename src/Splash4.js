import {
  View,
  Text,
  ImageBackground,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect} from 'react';
import * as Animatable from 'react-native-animatable';
const Splash4 = ({navigation}) => {
  return (
    <ImageBackground
      source={require('../image/splash4.png')}
      style={{
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: '10%',
        backgroundColor: 'black',
      }}
      resizeMode="cover">
      <Animatable.Text
        style={{color: 'white', fontSize: 24, fontWeight: '400'}}
        duration={2000}
        animation="lightSpeedIn">
        Easy Odering Services
      </Animatable.Text>
      <Animatable.Text
        style={{color: 'white', fontSize: 12, fontWeight: '400'}}
        duration={2000}
        animation="lightSpeedIn">
        Anithing which you want for your vehicle
      </Animatable.Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 30,
          marginTop: 20,
          width: '70%',
          borderWidth: 1,
          borderColor: 'white',
        }}>
        <Text
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
          }}>
          NEXT
        </Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default Splash4;

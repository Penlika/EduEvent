import {View, ImageBackground, TouchableOpacity, Text} from 'react-native';
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
const Splash3 = ({navigation}) => {
  return (
    <ImageBackground
      source={require('../image/splash1.png')}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '10%',
        backgroundColor: 'black',
      }}
      resizeMode="cover">
      <Animatable.Text
        style={{color: 'black', fontSize: 30, fontWeight: '600',textAlign:'center'}}
        duration={2000}
        animation="lightSpeedIn">
        Add points directly
      </Animatable.Text>

      <Animatable.Text
        style={{
          color: 'black',
          fontSize: 16,
          fontWeight: '800',
          textAlign: 'center',
          marginHorizontal: 40,
        }}
        duration={2000}
        animation="lightSpeedIn">
        Analyse your scores and Track your results
      </Animatable.Text>

      {/* Nút Skip */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50, // Điều chỉnh cho phù hợp với status bar
          right: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        }}
        onPress={() => navigation.navigate('Home')}>
        <Text style={{fontSize: 16, fontWeight: '600', color: 'black'}}>
          Skip
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#007AFF',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 30,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 5,
          shadowOffset: {width: 0, height: 2},
        }}
        onPress={() => navigation.navigate('Home')}>
        <Text
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            marginRight: 8,
          }}>
          Get Started
        </Text>
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
          <MaterialIcons name="arrow-forward" size={30} color="#007AFF" />
        </View>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default Splash3;

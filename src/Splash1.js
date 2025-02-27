import { View, ImageBackground, TouchableOpacity, Text } from 'react-native';
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

const Splash1 = ({ navigation }) => {
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
      resizeMode="cover"
    >
      <Animatable.Text
        style={{ color: 'black', fontSize: 40, fontWeight: '600' }}
        duration={2000}
        animation="lightSpeedIn"
      >
        Edu Event
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
        animation="lightSpeedIn"
      >
        Smart event management application, easy connection and optimized user
        experience..!
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
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: 'black' }}>Skip</Text>
      </TouchableOpacity>

      {/* Nút chuyển tiếp */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Splash2')}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            backgroundColor: '#007AFF',
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <MaterialIcons name="arrow-forward" size={30} color="white" />
        </View>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default Splash1;

import {StyleSheet, ImageBackground, View} from 'react-native';
import React, {useEffect} from 'react';
const Splash0 = ({navigation}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Splash1'); // Chuyển sang màn hình Splash1
    }, 2000);

    return () => clearTimeout(timer); // Xóa timeout khi component unmount
  }, [navigation]);
  return (
    <ImageBackground
      source={require('../image/splash0.png')}
      style={{
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: '10%',
        backgroundColor: 'black',
      }}
      resizeMode="cover">

    </ImageBackground>
  );
};

export default Splash0;

const styles = StyleSheet.create({});

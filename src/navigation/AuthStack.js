import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const AuthStack = () => {
  return (
    <View>
      <Text>
        AuthStack quản lý các màn hình liên quan đến xác thực người dùng (đăng
        nhập, đăng ký). AuthStack quản lý các màn hình xác thực. Bao gồm 2 màn
        hình chính: LoginScreen: Màn hình đăng nhập RegisterScreen: Màn hình
        đăng ký headerShown: false giúp UI gọn gàng hơn. Người dùng có thể
        chuyển đổi giữa các màn hình đăng nhập và đăng ký.
      </Text>
    </View>
  );
};

export default AuthStack;

const styles = StyleSheet.create({});

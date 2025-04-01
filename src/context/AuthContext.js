import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const AuthContext = () => {
  return (
    <View>
      <Text>
        Quản lý trạng thái xác thực người dùng (đăng nhập, đăng xuất, thông tin
        người dùng). dùng trong components: gọi API xác thực
      </Text>
    </View>
  );
};

export default AuthContext;

const styles = StyleSheet.create({});

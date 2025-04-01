import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const AppNavigator = () => {
  return (
    <View>
      <Text>
        Đây là thành phần chính quản lý tất cả các stack (ngăn xếp màn hình) của
        ứng dụng. Sử dụng NavigationContainer để quản lý điều hướng chính. Sử
        dụng createNativeStackNavigator để điều hướng dạng stack (ngăn xếp màn
        hình). Dựa vào trạng thái đăng nhập (user từ hook useAuth), hiển thị
        AuthStack hoặc EventStac
      </Text>
    </View>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({});

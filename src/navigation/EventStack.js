import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const EventStack = () => {
  return (
    <View>
      <Text>
        EventStack quản lý các màn hình liên quan đến sự kiện sau khi đăng nhập
        thành công. Sử dụng createBottomTabNavigator để tạo thanh điều hướng dưới
        cùng (Bottom Tab). Các màn hình trong EventStack bao gồm:
        EventListScreen: Danh sách sự kiện NotificationScreen: Danh sách thông
        báo ProfileScreen: Hồ sơ người dùng Sử dụng Ionicons từ Expo để hiển thị
        icon cho từng tab. Cài đặt tabBarActiveTintColor và
        tabBarInactiveTintColor để tùy chỉnh màu sắc tab.
      </Text>
    </View>
  );
};

export default EventStack;

const styles = StyleSheet.create({});

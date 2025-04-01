import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const useAuth = () => {
    const { user, loading, login, logout } = useContext(AuthContext);
  
    return {
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user, // Trả về true nếu đã đăng nhập
    };
  };

export default useAuth

const styles = StyleSheet.create({})
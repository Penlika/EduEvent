import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Profile Info */}
      <Image source={require('../../assets/images/profilePlaceholder.png')} style={styles.profileImage} />
      <Text style={styles.name}>Alex Johnson</Text>
      <Text style={styles.email}>alex@example.com</Text>

      {/* Actions */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    paddingTop: hp(5),
  },
  backButton: {
    position: 'absolute',
    top: hp(2),
    left: wp(5),
  },
  backText: {
    fontSize: wp(4),
    color: '#007BFF',
  },
  profileImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    marginVertical: hp(2),
  },
  name: {
    fontSize: wp(6),
    fontWeight: 'bold',
  },
  email: {
    fontSize: wp(4),
    color: 'gray',
    marginBottom: hp(2),
  },
  button: {
    width: wp(80),
    padding: hp(2),
    backgroundColor: '#007BFF',
    borderRadius: wp(5),
    alignItems: 'center',
    marginTop: hp(2),
  },
  buttonText: {
    fontSize: wp(4),
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';

const ProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [editMode, setEditMode] = useState({
    username: false,
    address: false,
    phone: false,
    paymentMethod: false,
  });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setEmail(user.email);
      firestore()
        .collection('USER')
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            setUsername(userData.name || '');
            setProfilePic(userData.photoURL || null);
            setAddress(userData.address || '');
            setPhone(userData.phone || '');
            setPaymentMethod(userData.paymentMethod || '');
          }
        });
    }
  }, []);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const user = auth().currentUser;
      if (user) {
        await user.updatePassword(newPassword);
        Alert.alert('Success', 'Password updated successfully.');
        setPasswordModalVisible(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password. Please try again.');
      console.error(error);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    const user = auth().currentUser;

    if (user) {
      try {
        await firestore().collection('users').doc(user.uid).update({ [field]: value });
        Alert.alert('Success', `${field} updated successfully.`);
        setEditMode((prev) => ({ ...prev, [field]: false }));
      } catch (error) {
        Alert.alert('Error', `Failed to update ${field}. Please try again.`);
      }
    }
  };

  const handleChooseProfilePic = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
      });

      if (image) {
        const user = auth().currentUser;
        const storageRef = storage().ref(`profilePictures/${user.uid}`);
        const response = await fetch(image.path);
        const blob = await response.blob();

        await storageRef.put(blob);
        const downloadURL = await storageRef.getDownloadURL();

        firestore()
          .collection('USER')
          .doc(user.uid)
          .update({ profilePic: downloadURL });

        setProfilePic(downloadURL);
        Alert.alert('Success', 'Profile picture updated successfully.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const renderEditableField = (label, value, setValue, fieldName) => (
    <View style={styles.InputContainerComponent}>
      <Ionicons
        style={styles.InputIcon}
        name={
          fieldName === 'username'
            ? 'person-outline'
            : fieldName === 'address'
            ? 'home-outline'
            : fieldName === 'phone'
            ? 'call-outline'
            : 'card-outline'
        }
        size={18}
        color="#52555A"
      />
      <TextInput
        placeholder={label}
        value={value}
        onChangeText={setValue}
        editable={editMode[fieldName]}
        style={[
          styles.TextInputContainer,
          !editMode[fieldName] && styles.TextInputNonEditable,
        ]}
      />
      <TouchableOpacity
        onPress={() => {
          if (editMode[fieldName]) {
            handleFieldUpdate(fieldName, value);
          } else {
            setEditMode((prev) => ({ ...prev, [fieldName]: true }));
          }
        }}
        style={styles.EditButton}
      >
        <Text style={styles.EditButtonText}>
          {editMode[fieldName] ? 'Save' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor="#0C0F14" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        <Text style={styles.ScreenTitle}>Account Settings</Text>

        <View style={styles.ProfilePicContainer}>
          <TouchableOpacity onPress={handleChooseProfilePic}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.ProfilePic} />
            ) : (
              <Ionicons name="person-circle-outline" size={100} color="#52555A" />
            )}
          </TouchableOpacity>
        </View>

        {renderEditableField('Username', username, setUsername, 'username')}
        {renderEditableField('Address', address, setAddress, 'address')}
        {renderEditableField('Phone', phone, setPhone, 'phone')}

        <View style={styles.InputContainerComponent}>
          <Ionicons
            style={styles.InputIcon}
            name="mail-outline"
            size={18}
            color="#52555A"
          />
          <TextInput
            placeholder="Email"
            value={email}
            editable={false}
            style={[styles.TextInputContainer, styles.TextInputNonEditable]}
          />
        </View>
        <TouchableOpacity
          style={styles.ButtonContainer}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.ButtonText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        transparent
        visible={passwordModalVisible}
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.ModalContainer}>
          <View style={styles.ModalContent}>
            <Text style={styles.ModalTitle}>Change Password</Text>

            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.ModalInput}
            />
            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.ModalInput}
            />

            <View style={styles.ModalButtonRow}>
              <TouchableOpacity
                style={[styles.ModalButton, styles.CancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.ButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ModalButton, styles.SaveButton]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.ButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: '#0C0F14',
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  ScreenTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    paddingLeft: 30,
    marginVertical: 30,
  },
  ProfilePicContainer: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  ProfilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#D17842',
  },
  InputContainerComponent: {
    flexDirection: 'row',
    marginHorizontal: 30,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#141921',
    alignItems: 'center',
  },
  InputIcon: {
    marginHorizontal: 20,
  },
  TextInputContainer: {
    flex: 1,
    height: 60,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  TextInputNonEditable: {
    backgroundColor: '#141921',
  },
  ButtonContainer: {
    backgroundColor: '#D17842',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 30,
  },
  ButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  EditButton: {
    marginRight: 20,
  },
  EditButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#D17842',
  },
  ModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ModalContent: {
    width: '80%',
    backgroundColor: '#141921',
    borderRadius: 20,
    padding: 20,
  },
  ModalTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 20,
  },
  ModalInput: {
    backgroundColor: '#52555A',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    color: '#0C0F14',
  },
  ModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  ModalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  CancelButton: {
    backgroundColor: '#DC3535',
  },
  SaveButton: {
    backgroundColor: '#D17842',
  },
});

export default ProfileScreen;

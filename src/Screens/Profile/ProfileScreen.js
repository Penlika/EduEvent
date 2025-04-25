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
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import axios from 'axios';
import { useTheme } from '../../component/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
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
  
  // Translation states
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  
  // Google Translate API key
  const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDcmLnMFuSVamZ8NeQ-DJFie0nEsiPug8Q';
  
  // Original content that needs translation
  const originalContent = {
    accountSettings: 'Account Settings',
    username: 'Username',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    changePassword: 'Change Password',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    modalTitle: 'Change Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordSuccess: 'Password updated successfully.',
    passwordError: 'Failed to update password. Please try again.',
    passwordMismatch: 'Passwords do not match.',
    fieldUpdateSuccess: '{field} updated successfully.',
    fieldUpdateError: 'Failed to update {field}. Please try again.',
    profilePicSuccess: 'Profile picture updated successfully.',
    profilePicError: 'Failed to upload image. Please try again.'
  };
  
  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});

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
            
            // Set language
            if (userData.language) {
              setCurrentLang(userData.language);
              if (userData.language !== 'en') {
                translateAllContent(userData.language);
              } else {
                setTranslations({...originalContent});
              }
            }
          }
        });
    }

    // Setup real-time listener for language changes
    const unsubscribe = firestore()
      .collection('USER')
      .doc(user.uid)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const userData = snapshot.data();
            if (userData.language && userData.language !== currentLang) {
              // Language has changed, update
              setCurrentLang(userData.language);
              
              // If switching to English, reset to original content
              if (userData.language === 'en') {
                console.log('Switching to English - resetting translations');
                setTranslations({...originalContent});
              } else {
                // Otherwise translate
                translateAllContent(userData.language);
              }
            }
          }
        },
        error => {
          console.error("Firestore snapshot error:", error);
        }
      );
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Function to translate text using Google Translate API
  const translateText = async (text, targetLang) => {
    // Return original if language is English or text is empty
    if (targetLang === 'en' || !text) return text;
    
    // Check if translation is already in cache
    const cacheKey = `${text}-${targetLang}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }
    
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {},
        {
          params: {
            q: text,
            target: targetLang,
            format: 'text',
            key: GOOGLE_TRANSLATE_API_KEY,
          },
        }
      );
      
      const translatedText = response.data.data.translations[0].translatedText;
      
      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));
      
      return translatedText;
    } catch (error) {
      console.error('Translation API error:', error);
      return text; // Return original text on error
    }
  };

  // Function to translate all content at once
  const translateAllContent = async (targetLang) => {
    // Explicit check for English
    if (targetLang === 'en') {
      console.log('TranslateAllContent: Setting to English');
      setTranslations({...originalContent});
      setTranslationCache({});
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const translationPromises = Object.entries(originalContent).map(async ([key, value]) => {
        const translatedText = await translateText(value, targetLang);
        return [key, translatedText];
      });
      
      const translatedEntries = await Promise.all(translationPromises);
      const newTranslations = Object.fromEntries(translatedEntries);
      
      setTranslations(newTranslations);
    } catch (error) {
      console.error('Translation batch error:', error);
      // Fallback to original content on error
      setTranslations({...originalContent});
    } finally {
      setIsTranslating(false);
    }
  };

  // Helper function to get translated text with safety fallback
  const getText = (key, params = {}) => {
    // Explicitly check if language is English to use original content
    let text;
    if (currentLang === 'en') {
      text = originalContent[key] || key;
    } else {
      text = translations[key] || originalContent[key] || key;
    }
    
    // Replace any parameters in the text (like {field})
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
    
    return text;
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', getText('passwordMismatch'));
      return;
    }

    try {
      const user = auth().currentUser;
      if (user) {
        await user.updatePassword(newPassword);
        Alert.alert('Success', getText('passwordSuccess'));
        setPasswordModalVisible(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      Alert.alert('Error', getText('passwordError'));
      console.error(error);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    const user = auth().currentUser;

    if (user) {
      try {
        await firestore().collection('USER').doc(user.uid).update({ [field]: value });
        Alert.alert('Success', getText('fieldUpdateSuccess', { field }));
        setEditMode((prev) => ({ ...prev, [field]: false }));
      } catch (error) {
        Alert.alert('Error', getText('fieldUpdateError', { field }));
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
          .update({ photoURL: downloadURL });

        setProfilePic(downloadURL);
        Alert.alert('Success', getText('profilePicSuccess'));
      }
    } catch (error) {
      Alert.alert('Error', getText('profilePicError'));
    }
  };

  const renderEditableField = (label, value, setValue, fieldName) => (
    <View style={[
      styles.InputContainerComponent,
      { backgroundColor: isDark ? '#141921' : '#F5F5F5' }
    ]}>
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
        color={isDark ? '#52555A' : '#888888'}
      />
      <TextInput
        placeholder={getText(fieldName)}
        value={value}
        onChangeText={setValue}
        editable={editMode[fieldName]}
        placeholderTextColor={isDark ? '#52555A' : '#888888'}
        style={[
          styles.TextInputContainer,
          { color: isDark ? '#FFFFFF' : '#000000' },
          !editMode[fieldName] && { backgroundColor: isDark ? '#141921' : '#F5F5F5' },
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
        <Text style={[styles.EditButtonText, { color: isDark ? '#D17842' : '#0066CC' }]}>
          {editMode[fieldName] ? getText('save') : getText('edit')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isTranslating) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDark ? '#0C0F14' : '#FFFFFF' 
      }}>
        <ActivityIndicator size="large" color={isDark ? '#D17842' : '#0066CC'} />
        <Text style={{ marginTop: 20, color: isDark ? '#FFFFFF' : '#000000' }}>Translating...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.ScreenContainer, { backgroundColor: isDark ? '#0C0F14' : '#FFFFFF' }]}>
      <StatusBar backgroundColor={isDark ? '#0C0F14' : '#FFFFFF'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        <Text style={[styles.ScreenTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {getText('accountSettings')}
        </Text>

        <View style={styles.ProfilePicContainer}>
          <TouchableOpacity onPress={handleChooseProfilePic}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={[styles.ProfilePic, { borderColor: isDark ? '#D17842' : '#0066CC' }]} />
            ) : (
              <Ionicons name="person-circle-outline" size={100} color={isDark ? '#52555A' : '#888888'} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={[
          styles.InputContainerComponent,
          { backgroundColor: isDark ? '#141921' : '#F5F5F5' }
        ]}>
          <Ionicons
            style={styles.InputIcon}
            name="mail-outline"
            size={18}
            color={isDark ? '#52555A' : '#888888'}
          />
          <TextInput
            placeholder={getText('email')}
            value={email}
            editable={false}
            placeholderTextColor={isDark ? '#52555A' : '#888888'}
            style={[
              styles.TextInputContainer,
              { color: isDark ? '#FFFFFF' : '#000000', backgroundColor: isDark ? '#141921' : '#F5F5F5' }
            ]}
          />
        </View>

        {renderEditableField(getText('username'), username, setUsername, 'username')}
        {renderEditableField(getText('address'), address, setAddress, 'address')}
        {renderEditableField(getText('phone'), phone, setPhone, 'phone')}
        
        <TouchableOpacity
          style={[styles.ButtonContainer, { backgroundColor: isDark ? '#D17842' : '#0066CC' }]}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.ButtonText}>{getText('changePassword')}</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Password Change Modal */}
      <Modal
        transparent
        visible={passwordModalVisible}
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.ModalContainer}>
          <View style={[styles.ModalContent, { backgroundColor: isDark ? '#141921' : '#F5F5F5' }]}>
            <Text style={[styles.ModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {getText('modalTitle')}
            </Text>

            <TextInput
              placeholder={getText('newPassword')}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
              style={[
                styles.ModalInput,
                { 
                  backgroundColor: isDark ? '#52555A' : '#E0E0E0',
                  color: isDark ? '#FFFFFF' : '#000000'
                }
              ]}
            />
            <TextInput
              placeholder={getText('confirmPassword')}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
              style={[
                styles.ModalInput,
                { 
                  backgroundColor: isDark ? '#52555A' : '#E0E0E0',
                  color: isDark ? '#FFFFFF' : '#000000'
                }
              ]}
            />

            <View style={styles.ModalButtonRow}>
              <TouchableOpacity
                style={[styles.ModalButton, styles.CancelButton, { backgroundColor: isDark ? '#DC3535' : '#FF6B6B' }]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.ButtonText}>{getText('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ModalButton, styles.SaveButton, { backgroundColor: isDark ? '#D17842' : '#0066CC' }]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.ButtonText}>{getText('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  ScreenTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
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
  },
  InputContainerComponent: {
    flexDirection: 'row',
    marginHorizontal: 30,
    marginBottom: 20,
    borderRadius: 20,
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
  },
  ButtonContainer: {
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
  },
  ModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ModalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
  },
  ModalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 20,
  },
  ModalInput: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
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
    marginHorizontal: 5,
  },
  CancelButton: {},
  SaveButton: {},
});

export default ProfileScreen;
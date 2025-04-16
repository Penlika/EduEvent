import { StyleSheet, Text, View, Switch, Alert, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../component/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Make sure to install this package
import axios from 'axios';
// Language Context for app-wide translation
export const LanguageContext = React.createContext({
  currentLang: 'en',
  setLanguage: () => {},
  translate: (text) => text,
  isTranslating: false
});

export const useLanguage = () => useContext(LanguageContext);
const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDcmLnMFuSVamZ8NeQ-DJFie0nEsiPug8Q';
// Language options
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

// Configuration for local LibreTranslate server
const TRANSLATE_API = {
  url: 'http://10.0.2.2:5000/translate',
};

const SettingScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const user = auth().currentUser;
  const { theme, setTheme } = useTheme();
  const navigation = useNavigation();
  
  // Sample translations for this screen
  const staticTexts = {
    darkMode: 'Dark Mode',
    language: 'Language',
    logout: 'Logout', 
    logoutSuccess: 'Logged out',
    logoutMessage: 'You have been successfully logged out.',
    selectLanguage: 'Select a language',
    translationError: 'Translation failed. Check your connection.'
  };
  
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // Fetch user's mode and language from Firebase
    const fetchUserSettings = async () => {
      try {
        const doc = await firestore().collection('USER').doc(user.uid).get();
        if (doc.exists) {
          const userData = doc.data();
          
          // Set theme
          if (userData.mode === 'dark') {
            setIsDarkMode(true);
            setTheme('dark');
          } else {
            setIsDarkMode(false);
            setTheme('light');
          }
          
          // Set language if it exists
          if (userData.language) {
            setCurrentLang(userData.language);
            if (userData.language !== 'en') {
              translateTexts(userData.language);
            }
          }
        }
      } catch (err) {
        console.log('Error fetching user settings:', err);
      }
    };

    fetchUserSettings();
  }, []);

  // Get translated text or return original
  const getText = (key) => {
    if (isTranslating) return 'Translating...';
    if (currentLang === 'en') return staticTexts[key] || key;
    return translations[key] || staticTexts[key] || key;
  };

  // Function to translate text - can be used for any text in the app
  const translateText = async (text, targetLang) => {
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
  
      const translated = response.data.data.translations[0].translatedText;
      return translated;
    } catch (error) {
      console.error('Google Translate API error:', error);
      return text; // fallback
    }
  };

  // Translate all static texts for this screen
  const translateTexts = async (targetLang) => {
    if (targetLang === 'en') {
      setTranslations({});
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const translationPromises = Object.entries(staticTexts).map(async ([key, value]) => {
        const translatedText = await translateText(value, targetLang);
        return [key, translatedText];
      });
      
      const translatedEntries = await Promise.all(translationPromises);
      setTranslations(Object.fromEntries(translatedEntries));
    } catch (error) {
      console.error('Translation batch error:', error);
      Alert.alert('Translation Failed', 'Could not translate content. Using English instead.');
    } finally {
      setIsTranslating(false);
    }
  };

  const changeLanguage = async (langCode) => {
    if (langCode === currentLang) {
      setDropdownVisible(false);
      return;
    }
    
    setCurrentLang(langCode);
    setDropdownVisible(false);
    
    // Translate texts if not English
    if (langCode !== 'en') {
      translateTexts(langCode);
    } else {
      setTranslations({});
    }
    
    try {
      await firestore().collection('USER').doc(user.uid).update({
        language: langCode,
      });
    } catch (err) {
      console.log('Error updating language:', err);
    }
  };

  const toggleTheme = async (value) => {
    setIsDarkMode(value);
    const newMode = value ? 'dark' : 'light';
    setTheme(newMode);

    try {
      await firestore().collection('USER').doc(user.uid).update({
        mode: newMode,
      });
    } catch (err) {
      console.log('Error updating theme mode:', err);
    }
  };

  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => {
        Alert.alert(
          getText('logoutSuccess'), 
          getText('logoutMessage')
        );
        // Navigate to login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      })
      .catch((error) => {
        console.error('Logout Error:', error);
      });
  };

  const testConnection = async () => {
    try {
      const response = await fetch(TRANSLATE_API.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'Hello',
          source: 'en',
          target: 'fr',
          format: 'text'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        Alert.alert('Connection Successful', `Translation test: Hello → ${data.translatedText}`);
      } else {
        const errorText = await response.text();
        Alert.alert('Connection Error', `Error: ${errorText}`);
      }
    } catch (error) {
      Alert.alert('Connection Failed', `Could not connect to LibreTranslate server at ${TRANSLATE_API.url}. Error: ${error.message}`);
    }
  };

  const textColor = theme === 'dark' ? '#fff' : '#000';
  const backgroundColor = theme === 'dark' ? '#000' : '#fff';
  const secondaryColor = theme === 'dark' ? '#333' : '#f0f0f0';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isTranslating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ color: textColor, marginTop: 10 }}>Translating...</Text>
        </View>
      )}
      
      {translationError && (
        <View style={[styles.errorBanner, { backgroundColor: '#ffdddd' }]}>
          <Text style={{ color: '#ff0000' }}>
            {translationError} Check your LibreTranslate connection.
          </Text>
          <TouchableOpacity onPress={() => setTranslationError(null)}>
            <Icon name="close" size={20} color="#ff0000" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.settingItem}>
        <Text style={[styles.settingTitle, { color: textColor }]}>
          {getText('darkMode')}
        </Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} />
      </View>
      
      <View style={styles.settingItem}>
        <Text style={[styles.settingTitle, { color: textColor }]}>
          {getText('language')}
        </Text>
        <TouchableOpacity 
          style={[styles.dropdown, { backgroundColor: secondaryColor }]}
          onPress={() => setDropdownVisible(true)}
        >
          <Text style={{ color: textColor }}>
            {LANGUAGES.find(lang => lang.code === currentLang)?.name || 'English'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: '#ff3b30' }]} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>{getText('logout')}</Text>
      </TouchableOpacity>
      
      {/* Language Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {getText('selectLanguage')}
            </Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLang === lang.code && { backgroundColor: '#007bff' }
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[
                  styles.languageOptionText,
                  { color: currentLang === lang.code ? '#fff' : textColor }
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Export a Language Provider for app-wide translations
export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  const user = auth().currentUser;

  useEffect(() => {
    // Load user's language preference
    const fetchLanguage = async () => {
      if (user) {
        try {
          const doc = await firestore().collection('USER').doc(user.uid).get();
          if (doc.exists && doc.data().language) {
            setCurrentLang(doc.data().language);
          }
        } catch (err) {
          console.log('Error fetching language:', err);
        }
      }
    };

    fetchLanguage();
  }, [user]);

  const setLanguage = async (langCode) => {
    setCurrentLang(langCode);
    
    if (user) {
      try {
        await firestore().collection('USER').doc(user.uid).update({
          language: langCode,
        });
      } catch (err) {
        console.log('Error updating language:', err);
      }
    }
  };

  const translate = async (text) => {
    if (currentLang === 'en' || !text) return text;
    
    // Check cache first
    const cacheKey = `${text}-${currentLang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];
    
    setIsTranslating(true);
    
    try {
      // Prepare request body
      const requestBody = {
        q: text,
        source: 'en',
        target: currentLang,
        format: 'text'
      };
      
      // Add API key if provided
      if (TRANSLATE_API.apiKey) {
        requestBody.api_key = TRANSLATE_API.apiKey;
      }
      
      const response = await fetch(TRANSLATE_API.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const data = await response.json();
      const translatedText = data.translatedText;
      
      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, translate, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  testButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 8,
  },
  languageOptionText: {
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  }
});
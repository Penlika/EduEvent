import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Linking, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

const NewsDetail = ({ route, navigation }) => {
  const { article } = route.params;
  const [loadingImages, setLoadingImages] = useState({});
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const user = auth().currentUser;
  
  // Translation states
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  
  // Google Translate API key
  const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDcmLnMFuSVamZ8NeQ-DJFie0nEsiPug8Q';
  
  // Original content that needs translation
  const originalContent = {
    backButtonText: '← Back',
    noImagesText: 'No images available for this article',
    imageCaption: 'Image',
    cannotOpenUrl: 'Cannot open this URL',
    translating: 'Translating...'
  };
  
  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});
  
  // Article-specific translations
  const [translatedArticle, setTranslatedArticle] = useState({
    title: null,
    content: null,
    author: null
  });
  
  // Function to open article in browser
  const openArticleLink = async () => {
    if (article.url) {
      const canOpen = await Linking.canOpenURL(article.url);
      if (canOpen) {
        await Linking.openURL(article.url);
      } else {
        alert(getText('cannotOpenUrl'));
      }
    }
  };

  // Track image loading status
  const handleImageLoadStart = (index) => {
    setLoadingImages(prev => ({...prev, [index]: true}));
  };

  const handleImageLoadEnd = (index) => {
    setLoadingImages(prev => ({...prev, [index]: false}));
  };

  // Check if we have valid images
  const hasValidImages = article.imageUrls && Array.isArray(article.imageUrls) && article.imageUrls.length > 0;

  // Setup real-time listener for language changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to user document changes in Firestore
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
                setTranslations({...originalContent});
                setTranslatedArticle({
                  title: null,
                  content: null, 
                  author: null
                });
                // Clear translation cache when switching to English
                setTranslationCache({});
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
    
    // Initial language fetch and translation
    fetchUserLanguage();
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Fetch user's language preference from Firestore
  const fetchUserLanguage = async () => {
    if (user) {
      try {
        const doc = await firestore().collection('USER').doc(user.uid).get();
        if (doc.exists && doc.data().language) {
          const userLang = doc.data().language;
          
          // Only update if language has changed
          if (userLang !== currentLang) {
            setCurrentLang(userLang);
            
            // If language is not English, translate content
            if (userLang !== 'en') {
              translateAllContent(userLang);
            } else {
              // Reset to original content for English
              setTranslations({...originalContent});
              setTranslatedArticle({
                title: null,
                content: null,
                author: null
              });
              // Clear translation cache when switching to English
              setTranslationCache({});
            }
          }
        }
      } catch (err) {
        console.log('Error fetching user language:', err);
      }
    }
  };

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
    if (targetLang === 'en') {
      setTranslations({...originalContent});
      setTranslatedArticle({
        title: null,
        content: null,
        author: null
      });
      // Clear translation cache when switching to English
      setTranslationCache({});
      return;
    }
    
    setIsTranslating(true);
    
    try {
      // Translate UI elements
      const translationPromises = Object.entries(originalContent).map(async ([key, value]) => {
        const translatedText = await translateText(value, targetLang);
        return [key, translatedText];
      });
      
      const translatedEntries = await Promise.all(translationPromises);
      const newTranslations = Object.fromEntries(translatedEntries);
      
      setTranslations(newTranslations);

      // Translate article content
      const translatedTitle = await translateText(article.title, targetLang);
      const translatedContent = await translateText(article.content, targetLang);
      const translatedAuthor = article.author ? await translateText(article.author, targetLang) : null;
      
      setTranslatedArticle({
        title: translatedTitle,
        content: translatedContent,
        author: translatedAuthor
      });
    } catch (error) {
      console.error('Translation batch error:', error);
      // Fallback to original content on error
      setTranslations({...originalContent});
      setTranslatedArticle({
        title: null,
        content: null,
        author: null
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // Helper function to get translated text
  const getText = (key) => {
    return translations[key] || originalContent[key] || key;
  };

  if (isTranslating) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDark ? '#000' : '#FFF' 
      }}>
        <ActivityIndicator size="large" color="#0064C2" />
        <Text style={{ marginTop: 20, color: isDark ? '#fff' : '#000' }}>
          {getText('translating')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: isDark ? '#000' : '#FFF' }
    ]}>
      <ScrollView 
        style={[
          styles.container,
          { backgroundColor: isDark ? '#000' : '#FFF' }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[
              styles.backButtonText,
              { color: isDark ? '#75a7ff' : '#0064C2' }
            ]}>
              {getText('backButtonText')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Article content */}
        <View style={styles.contentContainer}>
          <Text style={[
            styles.title,
            { color: isDark ? '#FFF' : '#333' }
          ]}>
            {currentLang !== 'en' && translatedArticle.title ? translatedArticle.title : article.title}
          </Text>
          
          <View style={styles.metadataContainer}>
            <Text style={[
              styles.date,
              { color: isDark ? '#AAA' : '#666' }
            ]}>
              {article.date}
            </Text>
            {article.author && (
              <Text style={[
                styles.author,
                { color: isDark ? '#AAA' : '#666' }
              ]}>
                By {currentLang !== 'en' && translatedArticle.author ? translatedArticle.author : article.author}
              </Text>
            )}
          </View>
          
          <Text style={[
            styles.content,
            { color: isDark ? '#DDD' : '#333' }
          ]}>
            {currentLang !== 'en' && translatedArticle.content ? translatedArticle.content : article.content}
          </Text>
          
        </View>
        
        {/* Images section at the end */}
        {hasValidImages ? (
          <View style={styles.imagesSection}>
            {article.imageUrls.map((imageUrl, index) => (
              <View key={index} style={[
                styles.imageWrapper,
                { backgroundColor: isDark ? '#222' : '#F8F8F8' }
              ]}>
                {loadingImages[index] && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color="#0064C2" />
                  </View>
                )}
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.fullWidthImage}
                  resizeMode="contain"
                  onLoadStart={() => handleImageLoadStart(index)}
                  onLoadEnd={() => handleImageLoadEnd(index)}
                />
                <Text style={[
                  styles.imageCaption,
                  { color: isDark ? '#AAA' : '#666' }
                ]}>
                  {getText('imageCaption')} {index + 1}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noImagesSection}>
            <Text style={[
              styles.noImagesText,
              { color: isDark ? '#777' : '#999' }
            ]}>
              {getText('noImagesText')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NewsDetail;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 14,
    marginRight: 12,
  },
  author: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  linkButton: {
    backgroundColor: '#0064C2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagesSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  imagesSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  imageWrapper: {
    marginBottom: 25,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageLoadingContainer: {
    position: 'absolute',
    width: '100%',
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    zIndex: 1,
  },
  fullWidthImage: {
    width: '100%',
    height: width * 0.6,
    backgroundColor: '#F0F0F0',
  },
  imageCaption: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  noImagesSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  noImagesText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});
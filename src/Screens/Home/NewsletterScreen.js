// NewsletterScreen.js
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../component/ThemeContext'
import axios from 'axios'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'

// Your Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBlStIeclSIYSu-PsNNyOqMJQDMpjUiJAM",
  authDomain: "ktgk-b761a.firebaseapp.com",
  projectId: "ktgk-b761a",
  storageBucket: "ktgk-b761a.appspot.com",
  messagingSenderId: "162244598463",
  appId: "1:162244598463:android:cce01c73bf04a41094c40a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Google Translate API key
const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDcmLnMFuSVamZ8NeQ-DJFie0nEsiPug8Q';

const NewsletterScreen = ({ navigation }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const user = auth().currentUser;

  // Translation states
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});

  // Original content that needs translation
  const originalContent = {
    headerTitle: 'TDMU News',
    loadingText: 'Loading news...',
    noImageText: 'No Image',
    retryButtonText: 'Retry',
    refreshButtonText: 'Refresh',
    emptyText: 'No news available',
    unknownAuthor: 'Unknown'
  };

  // Storage for translated content
  const [translations, setTranslations] = useState({...originalContent});

  // Function to fetch news from Firebase
  const fetchNewsFromFirebase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newsCollection = collection(db, "tdmu_news");
      
      // Make sure we sort by createdAt timestamp for reliable sorting
      const newsQuery = query(newsCollection, orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await getDocs(newsQuery);
      
      const newsData = [];
      querySnapshot.forEach((doc) => {
        // Ensure we have consistent data structure
        const data = doc.data();
        newsData.push({ 
          id: doc.id, 
          ...data,
          // Convert Firestore timestamps to JS Date if needed
          createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
          // Ensure imageUrls is always an array
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : 
                    (data.images ? (Array.isArray(data.images) ? data.images : []) : [])
        });
      });
      
      // Utility to parse "dd/MM/yyyy HH:mm —" format
      const parseDateString = (str) => {
        if (!str) return new Date(0); // fallback to epoch for bad dates
        const cleaned = str.replace("—", "").trim(); // remove trailing em dash
        const [day, month, yearAndTime] = cleaned.split("/");
        if (!day || !month || !yearAndTime) return new Date(0);
        const [year, time] = yearAndTime.split(" ");
        return new Date(`${year}-${month}-${day}T${time}:00`);
      };

      // Sort using parsed date
      newsData.sort((a, b) => {
        return parseDateString(b.date) - parseDateString(a.date); // descending
      });

      setNews(newsData);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load news. Please try again.");
      setLoading(false);
    }
  };

  // Function to run the scraper API and update Firebase
  const runNewsScraper = async () => {
    try {
      setRefreshing(true);
      
      // Replace with your actual scraper API endpoint
      const response = await fetch('https://us-central1-ktgk-b761a.cloudfunctions.net/runTDMUScraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: 'your-api-key' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to run scraper');
      }
      
      const data = await response.json();
      
      // Update Firebase with new data
      if (data && data.articles && data.articles.length > 0) {
        await updateFirebaseWithNewData(data.articles);
      }
      
      // Fetch updated news from Firebase
      await fetchNewsFromFirebase();
      
      setRefreshing(false);
    } catch (err) {
      console.error("Error running scraper:", err);
      setError("Failed to update news. Please try again.");
      setRefreshing(false);
      
      // Still try to load existing data from Firebase
      await fetchNewsFromFirebase();
    }
  };

  // Function to update Firebase with new scraped data
  const updateFirebaseWithNewData = async (articles) => {
    try {
      const newsCollection = collection(db, "tdmu_news");
      
      // Get existing news to avoid duplicates
      const querySnapshot = await getDocs(newsCollection);
      const existingUrls = new Set();
      
      querySnapshot.forEach((doc) => {
        existingUrls.add(doc.data().url);
      });
      
      // Add only new articles
      for (const article of articles) {
        if (!existingUrls.has(article.url)) {
          await addDoc(newsCollection, {
            title: article.title,
            content: article.content,
            date: article.date,
            author: article.author,
            url: article.url,
            // Handle both "image_urls" and "images" field names
            imageUrls: article.image_urls || article.images || [],
            createdAt: new Date()
          });
        }
      }
      
      console.log("Firebase updated with new articles");
    } catch (err) {
      console.error("Error updating Firebase:", err);
      throw err;
    }
  };

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
    fetchNewsFromFirebase();
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Also check language when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserLanguage();
      fetchNewsFromFirebase();
      return () => {};
    }, [])
  );

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
      if (news.length > 0) {
        const resetNews = news.map(item => ({
          ...item,
          translatedTitle: null,
          translatedContent: null,
          translatedAuthor: null
        }));
        setNews(resetNews);
      }
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

      // Also translate news titles and content if we have any loaded
      if (news.length > 0) {
        const translatedNews = await Promise.all(
          news.map(async (item) => {
            const translatedTitle = await translateText(item.title, targetLang);
            const translatedContent = await translateText(item.content, targetLang);
            const translatedAuthor = item.author ? await translateText(item.author, targetLang) : getText('unknownAuthor');
            
            return {
              ...item,
              translatedTitle,
              translatedContent,
              translatedAuthor
            };
          })
        );
        
        setNews(translatedNews);
      }
    } catch (error) {
      console.error('Translation batch error:', error);
      // Fallback to original content on error
      setTranslations({...originalContent});
    } finally {
      setIsTranslating(false);
    }
  };

  // Helper function to get translated text
  const getText = (key) => {
    return translations[key] || originalContent[key] || key;
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    await runNewsScraper();
  };

  // Get first valid image URL from the item
  const getFirstImageUrl = (item) => {
    // Check if imageUrls exists and has at least one valid URL
    if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
      // Find the first valid URL
      for (const url of item.imageUrls) {
        if (typeof url === 'string' && url.trim().startsWith('http')) {
          return url;
        }
      }
    }
    
    // Handle legacy "images" field if present
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      for (const url of item.images) {
        if (typeof url === 'string' && url.trim().startsWith('http')) {
          return url;
        }
      }
    }
    
    return null;
  };

  // Render each news item
  const renderNewsItem = ({ item }) => {
    // Get the first valid image URL
    const firstImageUrl = getFirstImageUrl(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.newsItem, 
          { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }
        ]}
        onPress={() => {
          // Navigate to detail screen
          navigation.navigate('NewDetail', { article: item });
        }}
      >
        <View style={styles.imageContainer}>
          {firstImageUrl ? (
            <Image 
              source={{ uri: firstImageUrl }} 
              style={styles.newsImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              styles.newsImage, 
              styles.noImage, 
              { backgroundColor: isDark ? '#333' : '#E0E0E0' }
            ]}>
              <Text style={[
                styles.noImageText, 
                { color: isDark ? '#AAA' : '#999' }
              ]}>
                {getText('noImageText')}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.newsContent}>
          <Text 
            style={[
              styles.newsTitle, 
              { color: isDark ? '#FFF' : '#333' }
            ]} 
            numberOfLines={2}
          >
            {currentLang !== 'en' && item.translatedTitle ? item.translatedTitle : item.title}
          </Text>
          <Text 
            style={[
              styles.newsDate, 
              { color: isDark ? '#AAA' : '#666' }
            ]}
          >
            {item.date}
          </Text>
          <Text 
            style={[
              styles.newsAuthor, 
              { color: isDark ? '#888' : '#888' }
            ]}
          >
            {currentLang !== 'en' && item.translatedAuthor 
              ? item.translatedAuthor 
              : (item.author || getText('unknownAuthor'))}
          </Text>
          <Text 
            style={[
              styles.newsExcerpt, 
              { color: isDark ? '#CCC' : '#555' }
            ]} 
            numberOfLines={3}
          >
            {currentLang !== 'en' && item.translatedContent ? item.translatedContent : item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isTranslating) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDark ? '#000' : '#F8FAFF' 
      }}>
        <ActivityIndicator size="large" color="#0064C2" />
        <Text style={{ marginTop: 20, color: isDark ? '#fff' : '#000' }}>
          Translating...
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#000' : '#F5F5F5' }
    ]}>
      <Text style={[
        styles.headerTitle,
        { color: isDark ? '#75a7ff' : '#0064C2' }
      ]}>
        {getText('headerTitle')}
      </Text>
      
      {error && (
        <View style={[
          styles.errorContainer,
          { backgroundColor: isDark ? '#331111' : '#FFF0F0' }
        ]}>
          <Text style={[
            styles.errorText,
            { color: isDark ? '#FF6B6B' : '#D32F2F' }
          ]}>
            {error}
          </Text>
          <TouchableOpacity 
            onPress={fetchNewsFromFirebase} 
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>
              {getText('retryButtonText')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0064C2" />
          <Text style={[
            styles.loadingText,
            { color: isDark ? '#AAA' : '#666' }
          ]}>
            {getText('loadingText')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id || item.url}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0064C2"]}
              tintColor={isDark ? "#75a7ff" : "#0064C2"}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={[
                  styles.emptyText,
                  { color: isDark ? '#AAA' : '#666' }
                ]}>
                  {getText('emptyText')}
                </Text>
                <TouchableOpacity 
                  onPress={runNewsScraper} 
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>
                    {getText('refreshButtonText')}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

export default NewsletterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    marginHorizontal: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  newsItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imageDotContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginHorizontal: 2,
  },
  moreImagesText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  newsAuthor: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  newsExcerpt: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0064C2',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
});
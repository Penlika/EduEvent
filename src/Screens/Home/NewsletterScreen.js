import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'

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

const NewsletterScreen = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch news from Firebase
  const fetchNewsFromFirebase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newsCollection = collection(db, "tdmu_news");
      const newsQuery = query(newsCollection, orderBy("date", "desc"), limit(50));
      const querySnapshot = await getDocs(newsQuery);
      
      const newsData = [];
      querySnapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() });
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
            imageUrls: article.image_urls || [],
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

  // Run when component mounts
  useEffect(() => {
    fetchNewsFromFirebase();
  }, []);

  // Run when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      runNewsScraper();
      return () => {
        // Cleanup function when screen loses focus (optional)
      };
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    await runNewsScraper();
  };

  // Render each news item
  const renderNewsItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.newsItem}
        onPress={() => {
          // Navigate to detail screen
          // navigation.navigate('NewsDetail', { article: item });
        }}
      >
        {item.imageUrls && item.imageUrls.length > 0 && (
          <Image 
            source={{ uri: item.imageUrls[0] }} 
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle}>{item.title}</Text>
          <Text style={styles.newsDate}>{item.date}</Text>
          <Text style={styles.newsAuthor}>{item.author}</Text>
          <Text style={styles.newsExcerpt} numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>TDMU News</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchNewsFromFirebase} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0064C2" />
          <Text style={styles.loadingText}>Loading news...</Text>
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
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No news available</Text>
                <TouchableOpacity onPress={runNewsScraper} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Refresh</Text>
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
    backgroundColor: '#F5F5F5',
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    marginHorizontal: 10,
    color: '#0064C2',
  },
  listContainer: {
    paddingBottom: 20,
  },
  newsItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  newsDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  newsAuthor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  newsExcerpt: {
    fontSize: 14,
    color: '#555',
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
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
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
    color: '#666',
    marginBottom: 16,
  },
});
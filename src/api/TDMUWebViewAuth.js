import React, { useState, useRef } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Component for handling TDMU authentication and calendar fetch
const TDMUWebViewAuth = ({ visible, onClose, onSuccess, userEmail }) => {
  const [status, setStatus] = useState('Initializing...');
  const webViewRef = useRef(null);
  
  // This script will be injected into the WebView to handle the flow
  const injectedJavaScript = `
    // Store original fetch and XMLHttpRequest for interception
    const originalFetch = window.fetch;
    const originalXhr = window.XMLHttpRequest.prototype.open;
    
    // Intercept fetch requests
    window.fetch = async function(url, options) {
      const response = await originalFetch(url, options);
      
      // Check if this is the calendar data request
      if (url.includes('/sch/w-locdstkbtuanusertheohocky')) {
        try {
          const responseClone = response.clone();
          const jsonData = await responseClone.json();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'calendar_data',
            data: jsonData
          }));
        } catch (e) {
          console.error('Error intercepting fetch:', e);
        }
      }
      
      return response;
    };
    
    // Intercept XMLHttpRequest
    window.XMLHttpRequest.prototype.open = function(method, url) {
      const xhr = this;
      const originalSend = xhr.send;
      
      xhr.send = function(body) {
        const oldOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            if (url.includes('/sch/w-locdstkbtuanusertheohocky')) {
              try {
                const jsonData = JSON.parse(xhr.responseText);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'calendar_data',
                  data: jsonData
                }));
              } catch (e) {}
            }
          }
          if (oldOnReadyStateChange) {
            oldOnReadyStateChange.apply(this, arguments);
          }
        };
        originalSend.apply(this, arguments);
      };
      
      return originalXhr.apply(this, arguments);
    };
    
    true;
  `;
  
  const handleMessage = async (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'calendar_data') {
        // Save the calendar data to AsyncStorage
        await AsyncStorage.setItem('tdmu_calendar', JSON.stringify(message.data));
        setStatus('Calendar data retrieved successfully!');
        
        // Notify parent component of success
        onSuccess(message.data);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };
  
  // Navigation state change handler to track progress
  const handleNavigationStateChange = (navState) => {
    if (navState.url.includes('dkmh.tdmu.edu.vn')) {
      setStatus('Logged in to TDMU system, fetching calendar...');
      
      // After successful login, inject script to navigate to calendar
      webViewRef.current?.injectJavaScript(`
        // Navigate to the calendar page
        if (!window.location.href.includes('/TraCuu/ThoiKhoaBieu')) {
          window.location.href = 'https://dkmh.tdmu.edu.vn/TraCuu/ThoiKhoaBieu';
        }
        true;
      `);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>TDMU Calendar</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.statusText}>{status}</Text>
        
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://dkmh.tdmu.edu.vn/' }}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1D',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#0066FF',
    fontSize: 16,
  },
  statusText: {
    padding: 10,
    textAlign: 'center',
    fontWeight: '500',
    color: '#0066FF',
  }
});

export default TDMUWebViewAuth;
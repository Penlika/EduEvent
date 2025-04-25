import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ActivityIndicator,
  Alert 
} from 'react-native';
import TDMUOAuthWebView from './';
import TDMUApiService from '../services/TDMUApiService';
import Icon from 'react-native-vector-icons/Feather';

const TDMUAuthFlow = ({ onSuccess, onCancel }) => {
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Handle the token received from the WebView
  const handleTokenReceived = async (token) => {
    try {
      setIsProcessing(true);
      setIsWebViewVisible(false);
      
      // Setup TDMU API with the token
      await TDMUApiService.setup(token);
      
      // Call login endpoint
      await TDMUApiService.login(token);
      
      // Validate functions
      await TDMUApiService.validateFunctions();
      
      // Fetch calendar data
      const result = await TDMUApiService.fetchCalendarComplete();
      
      // Notify parent component of successful authentication
      onSuccess(result);
    } catch (error) {
      console.error('TDMU Auth Error:', error);
      setError(error.message || 'Failed to authenticate with TDMU system');
      Alert.alert(
        'Authentication Error',
        'Failed to connect to TDMU system. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle WebView errors
  const handleWebViewError = (errorMsg) => {
    setIsWebViewVisible(false);
    setError(errorMsg);
    Alert.alert(
      'Authentication Error',
      errorMsg || 'Failed to authenticate with Google. Please try again.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => setIsWebViewVisible(true)}
        disabled={isProcessing}
      >
        <Icon name="calendar" size={20} color="#0066FF" />
        <Text style={styles.linkText}>Link TDMU Calendar</Text>
      </TouchableOpacity>
      
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color="#0066FF" />
          <Text style={styles.processingText}>Connecting to TDMU...</Text>
        </View>
      )}
      
      <Modal
        visible={isWebViewVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>TDMU Authentication</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsWebViewVisible(false);
                if (onCancel) onCancel();
              }}
            >
              <Icon name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <TDMUOAuthWebView
            onTokenReceived={handleTokenReceived}
            onError={handleWebViewError}
            onClose={() => setIsWebViewVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  linkText: {
    color: '#0066FF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  processingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
});

export default TDMUAuthFlow;
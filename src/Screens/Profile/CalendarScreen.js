import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TDMUApiService from '../../api/TDMUApiService';
import { useFocusEffect } from '@react-navigation/native';

const CalendarScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendar, setCalendar] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);

  // Load calendar data when screen mounts or comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCalendarData();
    }, [])
  );

  // Function to load calendar data
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Try to get cached data first
      const cachedCalendar = await TDMUApiService.getCachedCalendar();
      
      if (cachedCalendar) {
        processCalendarData(cachedCalendar);
      }
      
      // Check if we have an auth token
      const token = await AsyncStorage.getItem('tdmu_auth_token');
      
      if (!token) {
        // If no token, we can't fetch fresh data
        setLoading(false);
        if (!cachedCalendar) {
          Alert.alert(
            "Authentication Required", 
            "Please log in to view your calendar"
          );
        }
        return;
      }
      
      // Setup API with token
      await TDMUApiService.setup(token);
      
      // Fetch fresh calendar data
      const result = await TDMUApiService.fetchCalendarComplete();
      
      if (result && result.calendar) {
        processCalendarData(result.calendar);
        setCurrentSemester(result.semester);
      }
    } catch (error) {
      console.error("Error loading calendar:", error);
      Alert.alert(
        "Calendar Error", 
        "Failed to load calendar data. " + (error.message || "Please try again later.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Process and organize calendar data
  const processCalendarData = (data) => {
    if (!data || !Array.isArray(data)) {
      console.error("Invalid calendar data format");
      return;
    }
    
    // Extract unique weeks from calendar data
    const uniqueWeeks = [...new Set(data.map(item => item.tuan))].sort();
    setWeeks(uniqueWeeks);
    
    // If no week is selected, select the first one
    if (!selectedWeek && uniqueWeeks.length > 0) {
      setSelectedWeek(uniqueWeeks[0]);
    }
    
    // Store the full calendar data
    setCalendar(data);
  };

  // Handler for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadCalendarData();
  };

  // Get classes for the selected week
  const getClassesForSelectedWeek = () => {
    if (!selectedWeek || !calendar || calendar.length === 0) return [];
    
    return calendar.filter(item => item.tuan === selectedWeek);
  };

  // Render a class/schedule item
  const renderClassItem = ({ item }) => {
    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <Text style={styles.className}>{item.tenmon}</Text>
          <Text style={styles.classCode}>{item.mamon}</Text>
        </View>
        
        <View style={styles.classDetails}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Time: </Text>
            {item.tiet} | {item.thu} | {formatDateString(item.ngay)}
          </Text>
          
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Room: </Text>
            {item.phong}
          </Text>
          
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Lecturer: </Text>
            {item.giangvien || "Not specified"}
          </Text>
        </View>
      </View>
    );
  };

  // Helper function to format date
  const formatDateString = (dateStr) => {
    if (!dateStr) return "N/A";
    
    try {
      // Assuming dateStr is in format "YYYY-MM-DD" or something similar
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch (error) {
      return dateStr; // Return original if parsing fails
    }
  };

  // Render week selector buttons
  const renderWeekSelector = () => {
    return (
      <View style={styles.weekSelector}>
        <Text style={styles.sectionTitle}>Select Week:</Text>
        <FlatList
          horizontal
          data={weeks}
          keyExtractor={(item) => item.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.weekButton,
                selectedWeek === item && styles.weekButtonSelected
              ]}
              onPress={() => setSelectedWeek(item)}
            >
              <Text style={[
                styles.weekButtonText,
                selectedWeek === item && styles.weekButtonTextSelected
              ]}>
                Week {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Class Schedule</Text>
      {currentSemester && (
        <Text style={styles.semesterInfo}>
          {currentSemester.ten || "Current Semester"}
        </Text>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      ) : (
        <>
          {renderWeekSelector()}
          
          <FlatList
            data={getClassesForSelectedWeek()}
            keyExtractor={(item, index) => `class-${item.id || index}`}
            renderItem={renderClassItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                No classes found for this week.
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1D',
    marginBottom: 8,
  },
  semesterInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  weekSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  weekButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  weekButtonSelected: {
    backgroundColor: '#0066FF',
  },
  weekButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  weekButtonTextSelected: {
    color: '#FFF',
  },
  listContainer: {
    paddingBottom: 16,
  },
  classCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1D1D',
    flex: 1,
  },
  classCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  classDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#555',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CalendarScreen;
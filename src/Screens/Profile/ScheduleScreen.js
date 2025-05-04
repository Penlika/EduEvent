import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  SectionList,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

const ScheduleScreen = () => {
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [semesterCode, setSemesterCode] = useState(null);
  const [semesterName, setSemesterName] = useState(null);
  const [groupedSchedule, setGroupedSchedule] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [daysWithClasses, setDaysWithClasses] = useState({});
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [firebaseEvents, setFirebaseEvents] = useState([]);
  
  // Vietnamese day name conversion
  const dayNames = {
    2: 'Thứ hai',
    3: 'Thứ ba', 
    4: 'Thứ tư',
    5: 'Thứ năm',
    6: 'Thứ sáu',
    7: 'Thứ bảy',
    1: 'Chủ nhật',
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (scheduleData.length > 0) {
      // Process all weeks for dropdown
      const availableWeeks = scheduleData.map(item => ({
        weekNumber: item.tuan_hoc_ky,
        weekInfo: item?.thong_tin_tuan || '',
        weekDate: item?.thong_tin_tuan?.match(/\[từ ngày (.*?) đến ngày (.*?)\]/) || []
      }));
      
      setWeeks(availableWeeks);
      
      // Determine current week - if we have a current week from API, use it
      // Otherwise, default to the first week
      if (currentWeek) {
        setSelectedWeek(currentWeek);
      } else if (!selectedWeek && availableWeeks.length > 0) {
        // Try to find current date and match to a week range
        const now = new Date();
        let foundCurrentWeek = false;
        
        for (const week of availableWeeks) {
          if (week.weekDate && week.weekDate[1] && week.weekDate[2]) {
            const startParts = week.weekDate[1].split('/');
            const endParts = week.weekDate[2].split('/');
            
            if (startParts.length === 3 && endParts.length === 3) {
              const startDate = new Date(
                parseInt('20' + startParts[2]), 
                parseInt(startParts[1]) - 1, 
                parseInt(startParts[0])
              );
              const endDate = new Date(
                parseInt('20' + endParts[2]), 
                parseInt(endParts[1]) - 1, 
                parseInt(endParts[0])
              );
              
              if (now >= startDate && now <= endDate) {
                setSelectedWeek(week.weekNumber);
                setCurrentWeek(week.weekNumber);
                foundCurrentWeek = true;
                break;
              }
            }
          }
        }
        
        // If no current week found, use first week
        if (!foundCurrentWeek && availableWeeks.length > 0) {
          setSelectedWeek(availableWeeks[0].weekNumber);
        }
      }
      
      // Process schedule data for the selected week
      processScheduleData();
    }
  }, [scheduleData, searchQuery, filterDay, selectedWeek]);

  // Process the raw schedule data into a grouped format for display
  const processScheduleData = () => {
    const filteredData = scheduleData.filter(item => 
      selectedWeek === null || item.tuan_hoc_ky === selectedWeek
    );
    
    const weeks = {};
    const daysHavingClasses = {};
    
    // Find the currently selected week's date range
    const selectedWeekData = filteredData.find(item => item.tuan_hoc_ky === selectedWeek);
    const weekInfo = selectedWeekData?.thong_tin_tuan || '';
    const weekDate = weekInfo.match(/\[từ ngày (.*?) đến ngày (.*?)\]/);
    
    // Parse dates properly for comparison
    const weekStartDate = weekDate ? new Date(weekDate[1].split('/').reverse().join('-')) : null;
    const weekEndDate = weekDate ? new Date(weekDate[2].split('/').reverse().join('-')) : null;
    
    filteredData.forEach(item => {
      const weekInfo = item?.thong_tin_tuan || '';
      const weekDate = weekInfo.match(/\[từ ngày (.*?) đến ngày (.*?)\]/);
      const startDate = weekDate ? weekDate[1] : '';
      const endDate = weekDate ? weekDate[2] : '';
      
      const classes = [...(item?.ds_thoi_khoa_bieu || [])];
      
      // Add Firebase events that fall within this week
      if (weekStartDate && weekEndDate) {
        const events = firebaseEvents.filter(event => {
          const eventDate = new Date(event.ngay_hoc);
          eventDate.setHours(0, 0, 0, 0);
          weekStartDate.setHours(0, 0, 0, 0);
          weekEndDate.setHours(0, 0, 0, 0);
          
          return eventDate >= weekStartDate && eventDate <= weekEndDate;
        });
        
        // Add valid events to classes array
        events.forEach(event => {
          if (event.tiet_bat_dau && event.so_tiet) {
            // Calculate day number (1-7) from the event date
            const eventDate = new Date(event.ngay_hoc);
            // Get day of week (0-6, where 0 is Sunday)
            let dayNumber = eventDate.getDay();
            // Convert to our format (1-7, where 1 is Sunday)
            dayNumber = dayNumber === 0 ? 1 : dayNumber + 1;

            classes.push({
              ...event,
              type: 'event',
              ma_phong: event.dia_diem,
              ten_giang_vien: event.ten_giang_vien || 'N/A',
              ten_mon: event.ten_mon || 'Untitled Event',
              thu_kieu_so: dayNumber // Use calculated day number instead of stored one
            });
          }
        });
      }
      
      // Skip weeks with no classes
      if (classes.length === 0) return;
      
      // Apply filters
      const filteredClasses = classes.filter(classItem => {
        const matchesSearch = searchQuery === '' || 
          classItem.ten_mon.toLowerCase().includes(searchQuery.toLowerCase()) ||
          classItem.ten_giang_vien.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDay = filterDay === null || classItem.thu_kieu_so === filterDay;
        
        // Track days that have classes for highlighting
        if (matchesSearch) {
          daysHavingClasses[classItem.thu_kieu_so] = true;
        }
        
        return matchesSearch && matchesDay;
      });
      
      // Skip weeks that have no classes after filtering
      if (filteredClasses.length === 0) return;
      
      if (!weeks[item.tuan_hoc_ky]) {
        weeks[item.tuan_hoc_ky] = {
          title: `Tuần ${item.tuan_hoc_ky} (${startDate} - ${endDate})`,
          data: filteredClasses,
          weekNumber: item.tuan_hoc_ky
        };
      } else {
        weeks[item.tuan_hoc_ky].data = [...weeks[item.tuan_hoc_ky].data, ...filteredClasses];
      }
    });
    
    // Set days with classes for UI highlighting
    setDaysWithClasses(daysHavingClasses);
    
    // Convert to array and sort by week number
    const groupedData = Object.values(weeks).sort((a, b) => a.weekNumber - b.weekNumber);
    setGroupedSchedule(groupedData);
  };

  const fetchSchedule = async (selectedSemesterCode = null) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('tdmu_token');
      if (!token) throw new Error('Missing TDMU token.');

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // 1. INITIATE session (required!)
      await axios.post(
        'https://dkmh.tdmu.edu.vn/api/dkmh/w-checkvalidallchucnang',
        {
          ma_menu: '1',
          additional: {
            paging: { limit: 1, page: 1 },
            ordering: [{ name: null, order_type: 1 }],
          },
        },
        { headers }
      );

      // 2. Get all semester info
      const semesterRes = await axios.post(
        'https://dkmh.tdmu.edu.vn/api/sch/w-locdshockytkbuser',
        {
          filter: { is_tieng_anh: null },
          additional: {
            paging: { limit: 100, page: 1 },
            ordering: [{ name: 'hoc_ky', order_type: 1 }],
          },
        },
        { headers }
      );
      
      const semesterInfo = semesterRes.data?.data;
      const activeHocKy = semesterInfo?.hoc_ky_theo_ngay_hien_tai;
      const semesterList = semesterInfo?.ds_hoc_ky || [];
      
      // Store all semesters for selection
      setSemesters(semesterList);
      
      // Determine which semester to load
      let hocKy;
      
      if (selectedSemesterCode) {
        // User selected a specific semester
        hocKy = selectedSemesterCode;
        
        // Find the semester name
        const selectedSemester = semesterList.find(s => s.hoc_ky === selectedSemesterCode);
        if (selectedSemester) {
          setSemesterName(selectedSemester.ten_hoc_ky);
        }
      } else if (activeHocKy) {
        // Use active semester from API
        const currentSemester = semesterList.find((item) => item.hoc_ky === activeHocKy);
        if (!currentSemester) throw new Error('Current semester not found in list');
        hocKy = currentSemester.hoc_ky;
        setSemesterName(currentSemester.ten_hoc_ky);
      } else if (semesterList.length > 0) {
        // Fallback to first semester in list
        hocKy = semesterList[0].hoc_ky;
        setSemesterName(semesterList[0].ten_hoc_ky);
      } else {
        throw new Error('No semesters available');
      }
      
      setSemesterCode(hocKy);

      // 3. Load config (required before schedule fetch)
      await axios.post(
        'https://dkmh.tdmu.edu.vn/api/sch/w-locdsdoituongthoikhoabieu',
        {},
        { headers }
      );

      // 4. Get schedule for that semester
      const scheduleRes = await axios.post(
        'https://dkmh.tdmu.edu.vn/api/sch/w-locdstkbtuanusertheohocky',
        {
          filter: { hoc_ky: hocKy, ten_hoc_ky: '' },
          additional: {
            paging: { limit: 100, page: 1 },
            ordering: [{ name: null, order_type: null }],
          },
        },
        { headers }
      );

      // Store the received data
      const receivedData = scheduleRes.data?.data?.ds_tuan_tkb || [];
      setScheduleData(receivedData);
    } catch (error) {
      console.error('Schedule Fetch Error:', error.response?.data || error.message);
      Alert.alert(
        'Lỗi tải dữ liệu', 
        'Không thể tải lịch học. Vui lòng kiểm tra đăng nhập TDMU của bạn.',
        [{ text: 'Thử lại', onPress: () => fetchSchedule() }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Replace the existing fetchFirebaseEvents function with this:
  const fetchFirebaseEvents = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const userEventsRef = firebase
        .firestore()
        .collection('USER')
        .doc(currentUser.uid)
        .collection('schedule');

      // Create real-time listener
      const unsubscribe = userEventsRef.onSnapshot(
        (snapshot) => {
          const events = [];
          snapshot.forEach(doc => {
            const eventData = doc.data();
            // Convert Firestore Timestamp to Date
            const eventDate = eventData.ngay_hoc?.toDate() || new Date(eventData.ngay_hoc);
            
            events.push({
              ...eventData,
              id: doc.id,
              ngay_hoc: eventDate,
              type: 'event'
            });
          });
          setFirebaseEvents(events);
        },
        (error) => {
          console.error('Firestore real-time sync error:', error);
          Alert.alert('Error', 'Failed to sync personal events');
        }
      );

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
      Alert.alert('Error', 'Failed to initialize event sync');
    }
  };

  // Add this useEffect to handle the real-time listener lifecycle
  useEffect(() => {
    let unsubscribe;
    
    if (scheduleData.length > 0) {
      // Set up Firebase real-time listener
      fetchFirebaseEvents().then(unsubscribeFunc => {
        unsubscribe = unsubscribeFunc;
      });
    }

    // Cleanup function to remove listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [scheduleData]); // Only re-run if scheduleData changes

  // Update the formatClassTime function to handle 10 periods
  const formatClassTime = (startPeriod, totalPeriods) => {
    // Define period time slots with breaks
    const periodTimes = {
      1: { start: '07:00', end: '07:50' },
      2: { start: '07:50', end: '08:40' },
      3: { start: '08:40', end: '09:30' },
      // 20-minute break
      4: { start: '09:50', end: '10:40' },
      5: { start: '10:40', end: '11:30' },
      // Lunch break
      6: { start: '12:30', end: '13:20' },
      7: { start: '13:20', end: '14:10' },
      8: { start: '14:10', end: '15:00' },
      9: { start: '15:00', end: '15:50' },
      10: { start: '15:50', end: '16:40' }
    };

    // Add visual indicators for breaks
    const breakIndicators = {
      3: ' → 20p nghỉ → ',
      5: ' → Nghỉ trưa → '
    };

    const endPeriod = startPeriod + (totalPeriods - 1);
    
    if (!periodTimes[startPeriod] || !periodTimes[endPeriod]) {
      return `Tiết ${startPeriod} - ${endPeriod}`;
    }

    let timeString = `${periodTimes[startPeriod].start} - `;

    // Add break indicators if the class spans across breaks
    for (let i = startPeriod; i < endPeriod; i++) {
      if (breakIndicators[i]) {
        timeString += periodTimes[i].end + breakIndicators[i];
      }
    }

    timeString += periodTimes[endPeriod].end;

    return timeString;
  };

  // Check if class is online
  const isOnlineClass = (room) => {
    return room?.toLowerCase().includes('online') || room?.toLowerCase().includes('elearning');
  };

  // Update TimeSidebar component
  const TimeSidebar = () => (
    <View style={styles.timeSidebar}>
      {[...Array(10)].map((_, index) => (
        <View key={index} style={styles.periodContainer}>
          <Text style={styles.periodText}>Tiết {index + 1}</Text>
        </View>
      ))}
    </View>
  );

  // Update renderClassItem component to handle events
  const renderClassItem = ({ item }) => {
    const PERIOD_HEIGHT = 45;
    const topPosition = (item.tiet_bat_dau - 1) * PERIOD_HEIGHT;
    const height = item.so_tiet * PERIOD_HEIGHT;
    
    // Check if the item is an event
    const isEvent = item.type === 'event';
    
    return (
      <View style={[
        styles.card,
        {
          position: 'absolute',
          top: topPosition,
          height: height,
          left: 0,
          right: 0,
          marginLeft: 8,
          marginRight: 8
        },
        isEvent && styles.eventCard // Add special styling for events
      ]}>
        <Text style={[styles.subject, isEvent && styles.eventSubject]}>
          {isEvent ? '🎉 ' : ''}{item.ten_mon}
        </Text>
        {item.ma_nhom && (
          <Text style={styles.groupText}>
            {isEvent ? 'Field: ' : 'Nhóm: '}{item.ma_nhom}
          </Text>
        )}
        <View style={styles.classDetails}>
          <Text style={styles.detailText}>
            Thời gian: {dayNames[item.thu_kieu_so] || `Thứ ${item.thu}`}
          </Text>
          {isEvent ? (
            <Text style={styles.detailText}>
              Địa điểm: {item.dia_diem || 'Không có'}
            </Text>
          ) : (
            <Text style={styles.detailText}>Địa điểm: {item.ma_phong}</Text>
          )}
          <Text style={styles.detailText}>
            {isEvent ? 'Người tổ chức: ' : 'GV: '}{item.ten_giang_vien}
          </Text>
          <Text style={styles.detailText}>
            Ngày: {new Date(item.ngay_hoc).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  // Format week display for dropdown
  const formatWeekTitle = (weekItem) => {
    if (!weekItem) return 'Chọn tuần';
    
    const startDate = weekItem.weekDate[1] || '';
    const endDate = weekItem.weekDate[2] || '';
    
    return `Tuần ${weekItem.weekNumber} (${startDate} - ${endDate})`;
  };

  // Handle semester selection
  const selectSemester = (semesterCode, semesterName) => {
    setSemesterModalVisible(false);
    if (semesterCode !== semesterCode) {
      fetchSchedule(semesterCode);
    }
  };

  // Render semester item for FlatList
  const renderSemesterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.semesterOption,
        item.hoc_ky === semesterCode && styles.selectedSemesterOption
      ]}
      onPress={() => selectSemester(item.hoc_ky, item.ten_hoc_ky)}
    >
      <Text style={[
        styles.semesterOptionText,
        item.hoc_ky === semesterCode && styles.selectedSemesterOptionText
      ]}>
        {item.ten_hoc_ky}
      </Text>
      <Text style={styles.semesterDateText}>
        {item.ngay_bat_dau_hk} - {item.ngay_ket_thuc_hk}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải lịch học...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {/* Semester Header with selection button */}
          <TouchableOpacity 
            style={styles.semesterHeader}
            onPress={() => setSemesterModalVisible(true)}
          >
            <Text style={styles.title}>📅 {semesterName || 'Chọn học kỳ'}</Text>
            <Text style={styles.changeSemester}>▼ Thay đổi học kỳ</Text>
          </TouchableOpacity>
          
          {/* Week selector dropdown */}
          <View style={styles.weekSelectorContainer}>
            <Text style={styles.weekSelectorLabel}>Chọn tuần:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedWeek}
                onValueChange={(itemValue) => setSelectedWeek(itemValue)}
                style={styles.picker}
              >
                {weeks.map((week) => (
                  <Picker.Item 
                    key={week.weekNumber} 
                    label={formatWeekTitle(week)} 
                    value={week.weekNumber} 
                  />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Search bar */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm môn học, giảng viên..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Day filter buttons in a row */}
          <View style={styles.dayFilterContainer}>
            <TouchableOpacity
              style={[styles.dayFilter, filterDay === null && styles.dayFilterActive]}
              onPress={() => setFilterDay(null)}
            >
              <Text style={[styles.dayFilterText, filterDay === null && styles.dayFilterTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            
            {/* Monday through Saturday */}
            {[2, 3, 4, 5, 6, 7].map(day => {
              const hasClasses = daysWithClasses[day];
              
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayFilter, 
                    filterDay === day ? styles.dayFilterActive : (hasClasses && !filterDay ? styles.dayFilterHasClasses : {})
                  ]}
                  onPress={() => setFilterDay(filterDay === day ? null : day)}
                >
                  <Text style={[
                    styles.dayFilterText,
                    (filterDay === day || (hasClasses && !filterDay)) && styles.dayFilterTextActive
                  ]}>
                    T{day === 7 ? '7' : day}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* Sunday (CN) */}
            <TouchableOpacity
              style={[
                styles.dayFilter, 
                filterDay === 1 ? styles.dayFilterActive : (daysWithClasses[1] && !filterDay ? styles.dayFilterHasClasses : {})
              ]}
              onPress={() => setFilterDay(filterDay === 1 ? null : 1)}
            >
              <Text style={[
                styles.dayFilterText,
                (filterDay === 1 || (daysWithClasses[1] && !filterDay)) && styles.dayFilterTextActive
              ]}>
                CN
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Schedule List */}
          {groupedSchedule.length > 0 ? (
            <View style={styles.scheduleContainer}>
              <TimeSidebar />
              <View style={styles.scheduleContent}>
                {groupedSchedule.map((section, sectionIndex) => 
                  section.data.map((item, itemIndex) => (
                    <React.Fragment key={`${sectionIndex}-${itemIndex}-${item.id || itemIndex}`}>
                      {renderClassItem({ item })}
                    </React.Fragment>
                  ))
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Không có lịch học</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Semester Selection Modal */}
      <Modal
        visible={semesterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSemesterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn học kỳ</Text>
            
            <FlatList
              data={semesters}
              renderItem={renderSemesterItem}
              keyExtractor={item => item.hoc_ky.toString()}
              contentContainerStyle={styles.semesterList}
            />
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSemesterModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  semesterHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1D',
    textAlign: 'center',
  },
  changeSemester: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 4,
  },
  weekSelectorContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  searchBar: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  dayFilter: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
    alignItems: 'center',
    marginBottom: 4,
  },
  dayFilterActive: {
    backgroundColor: '#3B82F6',
  },
  dayFilterHasClasses: {
    backgroundColor: '#10B981', // Green for days with classes
  },
  dayFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1D',
  },
  dayFilterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: 24,
  },
  sectionHeader: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  subject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  groupText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  classDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1D',
    marginBottom: 16,
    textAlign: 'center',
  },
  semesterList: {
    paddingBottom: 8,
  },
  semesterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  selectedSemesterOption: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  semesterOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1D',
  },
  semesterDateText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  selectedSemesterOptionText: {
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scheduleContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  timeSidebar: {
    width: 60,
    backgroundColor: '#0066CC',
    height: 450, // Match scheduleContent height
  },
  periodContainer: {
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
  },
  periodText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleContent: {
    flex: 1,
    position: 'relative',
    height: 450, // Keep this height fixed
    backgroundColor: '#FFFFFF' // Add background color to hide excess space
  },
  eventCard: {
    backgroundColor: '#FEF3C7', // Light yellow background for events
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Orange accent
  },
  eventSubject: {
    color: '#D97706', // Darker orange for event title
  }
});

export default ScheduleScreen;
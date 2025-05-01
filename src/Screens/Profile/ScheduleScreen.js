import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  SectionList,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ScheduleScreen = () => {
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [semesterCode, setSemesterCode] = useState(null);
  const [groupedSchedule, setGroupedSchedule] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState(null);
  
  // Vietnamese day name conversion
  const dayNames = {
    1: 'Thứ hai',
    2: 'Thứ ba',
    3: 'Thứ tư',
    4: 'Thứ năm',
    5: 'Thứ sáu',
    6: 'Thứ bảy',
    7: 'Chủ nhật',
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (scheduleData.length > 0) {
      processScheduleData();
    }
  }, [scheduleData, searchQuery, filterDay]);

  // Process the raw schedule data into a grouped format for the SectionList
  const processScheduleData = () => {
    const weeks = {};
    
    scheduleData.forEach(item => {
      const weekInfo = item?.thong_tin_tuan || '';
      const weekDate = weekInfo.match(/\[từ ngày (.*?) đến ngày (.*?)\]/);
      const startDate = weekDate ? weekDate[1] : '';
      const endDate = weekDate ? weekDate[2] : '';
      
      const classes = item?.ds_thoi_khoa_bieu || [];
      
      // Skip weeks with no classes
      if (classes.length === 0) return;
      
      // Apply filters
      const filteredClasses = classes.filter(classItem => {
        const matchesSearch = searchQuery === '' || 
          classItem.ten_mon.toLowerCase().includes(searchQuery.toLowerCase()) ||
          classItem.ten_giang_vien.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDay = filterDay === null || classItem.thu_kieu_so === filterDay;
        
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
    
    // Convert to array and sort by week number
    const groupedData = Object.values(weeks).sort((a, b) => a.weekNumber - b.weekNumber);
    setGroupedSchedule(groupedData);
  };

  const fetchSchedule = async () => {
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

      // 2. Get current semester info
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
      
      // Find the active semester
      if (!activeHocKy) throw new Error('No current semester code found');
      
      const currentSemester = semesterList.find((item) => item.hoc_ky === activeHocKy);
      if (!currentSemester) throw new Error('Current semester not found in list');
      
      const hocKy = currentSemester.hoc_ky;
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

  // Convert class period to display time
  const formatClassTime = (startPeriod, totalPeriods) => {
    // This is an approximation - replace with actual time periods if available
    const periodTimes = {
      1: '07:00', 2: '07:45', 3: '08:30', 4: '09:30', 
      5: '10:15', 6: '11:00', 7: '13:00', 8: '13:45',
      9: '14:30', 10: '15:30', 11: '16:15', 12: '17:00',
      13: '17:45', 14: '18:30', 15: '19:15', 16: '20:00'
    };
    
    const endPeriod = startPeriod + totalPeriods - 1;
    const startTime = periodTimes[startPeriod] || `Tiết ${startPeriod}`;
    const endTime = periodTimes[endPeriod + 1] || `Tiết ${endPeriod}`;
    
    return `${startTime} - ${endTime}`;
  };

  // Check if class is online
  const isOnlineClass = (room) => {
    return room.toLowerCase().includes('online') || room.toLowerCase().includes('elearning');
  };

  const renderClassItem = ({ item }) => {
    // Determine if the class is online
    const online = isOnlineClass(item.ma_phong);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.subject}>{item.ten_mon}</Text>
          <View style={[
            styles.badge, 
            online ? styles.onlineBadge : styles.physicBadge
          ]}>
            <Text style={styles.badgeText}>
              {online ? 'Online' : 'Phòng học'}
            </Text>
          </View>
        </View>
        
        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>Thời gian:</Text>
            <Text style={styles.detailContent}>
              {dayNames[item.thu_kieu_so] || `Thứ ${item.thu}`} ({formatClassTime(item.tiet_bat_dau, item.so_tiet)})
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>Địa điểm:</Text>
            <Text style={styles.detailContent}>
              {item.ma_phong.split('-')[0]}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>Giảng viên:</Text>
            <Text style={styles.detailContent}>{item.ten_giang_vien}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>Ngày học:</Text>
            <Text style={styles.detailContent}>
              {new Date(item.ngay_hoc).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
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
          <Text style={styles.title}>📅 Lịch học học kỳ: {semesterCode}</Text>
          
          {/* Search and filter bar */}
          <View style={styles.filterContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm môn học, giảng viên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <View style={styles.dayFilterContainer}>
              <TouchableOpacity
                style={[styles.dayFilter, filterDay === null && styles.dayFilterActive]}
                onPress={() => setFilterDay(null)}
              >
                <Text style={styles.dayFilterText}>Tất cả</Text>
              </TouchableOpacity>
              
              {[2, 3, 4, 5, 6, 7].map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayFilter, filterDay === day && styles.dayFilterActive]}
                  onPress={() => setFilterDay(filterDay === day ? null : day)}
                >
                  <Text style={styles.dayFilterText}>T{day === 1 ? 2 : day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {groupedSchedule.length > 0 ? (
            <SectionList
              sections={groupedSchedule}
              keyExtractor={(item, index) => item.id_tkb || index.toString()}
              renderItem={renderClassItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.list}
              stickySectionHeadersEnabled={true}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery || filterDay ? 
                  'Không tìm thấy lịch học phù hợp với bộ lọc' : 
                  'Không có lịch học nào trong học kỳ này'}
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.refreshButton} onPress={fetchSchedule}>
            <Text style={styles.refreshButtonText}>🔄 Làm mới</Text>
          </TouchableOpacity>
        </View>
      )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1D1D1D',
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 16,
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
  },
  dayFilter: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  dayFilterActive: {
    backgroundColor: '#3B82F6',
  },
  dayFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D1D1D',
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
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0052CC',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  onlineBadge: {
    backgroundColor: '#DCFCE7',
  },
  physicBadge: {
    backgroundColor: '#EFF6FF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    width: 80,
  },
  detailContent: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
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
});

export default ScheduleScreen;
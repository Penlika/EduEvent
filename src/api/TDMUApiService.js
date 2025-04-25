import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TDMUApiService {
  constructor() {
    this.api = axios.create({
      baseURL: 'https://dkmh.tdmu.edu.vn/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; TDMUMobileApp/1.0)'
      }
    });
    
    // Add response interceptor for handling common errors
    this.api.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error?.response?.data || error?.message);
        return Promise.reject(error);
      }
    );
  }

  // Initialize API with auth token
  async setup(token) {
    try {
      // Store token
      await AsyncStorage.setItem('tdmu_auth_token', token);
      
      // Set default authorization header
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return true;
    } catch (error) {
      console.error('TDMU API setup error:', error);
      return false;
    }
  }

  // Step 1: Login to TDMU system
  async login(googleToken) {
    try {
      const response = await this.api.post('/auth/login', {
        token: googleToken
      });
      
      // If the API returns a new token, update it
      if (response.data && response.data.token) {
        await this.setup(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('TDMU login error:', error);
      throw error;
    }
  }

  // Step 2: Validate access to functions
  async validateFunctions() {
    try {
      const response = await this.api.get('/dkmh/w-checkvalidallchucnang');
      return response.data;
    } catch (error) {
      console.error('Validate functions error:', error);
      throw error;
    }
  }

  // Step 3: Get semester list
  async getSemesters() {
    try {
      const response = await this.api.get('/sch/w-locdshockytkbuser');
      
      // Cache the result
      if (response.data) {
        await AsyncStorage.setItem('tdmu_semesters', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      console.error('Get semesters error:', error);
      throw error;
    }
  }

  // Step 4: Get target users
  async getUsers() {
    try {
      const response = await this.api.get('/sch/w-locdsdoituongthoikhoabieu');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  // Step 5: Get calendar by semester
  async getCalendar(semesterId, userId = null) {
    try {
      // Build query parameters
      const params = { hocky: semesterId };
      if (userId) params.user = userId;
      
      const response = await this.api.get('/sch/w-locdstkbtuanusertheohocky', { params });
      
      // Cache the result
      if (response.data) {
        await AsyncStorage.setItem(
          `tdmu_calendar_${semesterId}`, 
          JSON.stringify(response.data)
        );
      }
      
      return response.data;
    } catch (error) {
      console.error('Get calendar error:', error);
      throw error;
    }
  }

  // Complete flow to fetch calendar
  async fetchCalendarComplete() {
    try {
      // Step 1 & 2 should already be done at login
      
      // Step 3: Get semesters
      const semesters = await this.getSemesters();
      if (!semesters || semesters.length === 0) {
        throw new Error('No semesters found');
      }
      
      // Get the current/latest semester
      const currentSemester = semesters[0];
      
      // Step 4: Get users (might not be needed if we're just getting the current user's calendar)
      // const users = await this.getUsers();
      
      // Step 5: Get calendar for current semester
      const calendar = await this.getCalendar(currentSemester.id);
      
      return {
        calendar,
        semester: currentSemester
      };
    } catch (error) {
      console.error('Complete calendar fetch error:', error);
      throw error;
    }
  }

  // Helper method to check if we have cached calendar data
  async getCachedCalendar(semesterId) {
    try {
      const cachedData = await AsyncStorage.getItem(
        semesterId ? `tdmu_calendar_${semesterId}` : 'tdmu_calendar_latest'
      );
      
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('Get cached calendar error:', error);
      return null;
    }
  }
}

export default new TDMUApiService();
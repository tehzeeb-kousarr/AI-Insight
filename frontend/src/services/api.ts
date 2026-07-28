import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insight_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Setting {
  id: number;
  user_id: number;
  eye_sensitivity: number;
  head_sensitivity: number;
  blink_sensitivity: number;
  dwell_time: number;
  cursor_speed: number;
  smoothness: number;
  is_eye_tracking_enabled: boolean;
  is_head_tracking_enabled: boolean;
  is_voice_commands_enabled: boolean;
  voice_language: string;
  theme: string;
  camera_device: number;
  microphone_device: string;
}

export interface VoiceCommand {
  id: number;
  user_id: number;
  phrase: string;
  action: string;
  is_custom: boolean;
}

export interface SystemStatus {
  camera_status: boolean;
  eye_detection_status: boolean;
  head_tracking_status: boolean;
  voice_recognition_status: boolean;
  calibration_status: boolean;
  current_cursor_pos: { x: number; y: number };
  fps: number;
  cpu_usage: number;
  memory_usage: number;
  today_usage_seconds: number;
}

export interface ReportStats {
  today_usage_seconds: number;
  weekly_usage_seconds: number;
  voice_commands_today: number;
  clicks_today: number;
  calibrations_total: number;
  estimated_accuracy: number;
  voice_distribution: Array<{ name: string; value: number }>;
  weekly_chart_data: Array<{ day: string; hours: number }>;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string | null;
  timestamp: string;
}

// API Endpoints
export const authApi = {
  login: async (formData: FormData) => {
    const response = await api.post<{ access_token: string; token_type: string }>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const settingsApi = {
  get: async () => {
    const response = await api.get<Setting>('/settings');
    return response.data;
  },
  update: async (settings: Partial<Setting>) => {
    const response = await api.put<Setting>('/settings', settings);
    return response.data;
  },
};

export const calibrationApi = {
  clear: async () => {
    const response = await api.post<{ message: string }>('/calibration/clear');
    return response.data;
  },
  recordPoint: async (point: { screen_x: number; screen_y: number; eye_x: number; eye_y: number }) => {
    const response = await api.post<{ message: string; total_points: number }>('/calibration/point', point);
    return response.data;
  },
  fit: async () => {
    const response = await api.post<{ message: string; weights: any }>('/calibration/fit');
    return response.data;
  },
  get: async () => {
    const response = await api.get('/calibration');
    return response.data;
  },
};

export const voiceApi = {
  list: async () => {
    const response = await api.get<VoiceCommand[]>('/voice-commands');
    return response.data;
  },
  listPredefined: async () => {
    const response = await api.get<Record<string, string>>('/voice-commands/predefined');
    return response.data;
  },
  create: async (cmd: { phrase: string; action: string }) => {
    const response = await api.post<VoiceCommand>('/voice-commands', cmd);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/voice-commands/${id}`);
    return response.data;
  },
};

export const reportsApi = {
  getStats: async () => {
    const response = await api.get<ReportStats>('/reports/stats');
    return response.data;
  },
  exportPdfUrl: () => `${API_BASE_URL}/reports/export/pdf`,
  exportExcelUrl: () => `${API_BASE_URL}/reports/export/excel`,
};

export const logsApi = {
  list: async (limit = 100) => {
    const response = await api.get<ActivityLog[]>(`/logs?limit=${limit}`);
    return response.data;
  },
  clear: async () => {
    const response = await api.delete('/logs');
    return response.data;
  },
};

export const systemApi = {
  getStatus: async () => {
    const response = await api.get<SystemStatus>('/status');
    return response.data;
  },
  videoFeedUrl: 'http://localhost:8000/api/video_feed',
};

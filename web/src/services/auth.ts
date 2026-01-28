import api from './api';
import { UserCreate, User, Token, UserUpdate } from '@schema';

export const authApi = {
  login: async (email: string, password: string): Promise<Token> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  register: async (userData: UserCreate): Promise<User> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateMe: async (userData: UserUpdate): Promise<User> => {
    const response = await api.patch('/auth/me', userData);
    return response.data;
  },
};
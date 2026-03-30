import api from './api';
import * as SecureStore from 'expo-secure-store';

export const sendOtp = async (phone: string) => {
  const response = await api.post('/auth/otp/send', { phone });
  return response.data;
};

export const verifyOtp = async (phone: string, otp: string) => {
  const response = await api.post('/auth/otp/verify', { phone, otp });
  if (response.data.access_token) {
    await SecureStore.setItemAsync('worker_jwt', response.data.access_token);
  }
  return response.data;
};

export interface RegisterPayload {
  phone: string;
  name: string;
  city: string;
  dark_store_zone: string;
  avg_daily_earnings: number;
  upi_id: string;
  device_model: string;
  device_os_version: string;
  sim_carrier?: string;
  sim_registration_date?: string;
}

export const register = async (data: RegisterPayload) => {
  const response = await api.post('/auth/register', data);
  if (response.data.access_token) {
    await SecureStore.setItemAsync('worker_jwt', response.data.access_token);
  }
  return response.data;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync('worker_jwt');
};

export const getToken = async () => {
  return await SecureStore.getItemAsync('worker_jwt');
};

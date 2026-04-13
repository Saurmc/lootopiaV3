import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api.constants';

export const TOKEN_KEY = 'lootopia_jwt';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Ajout automatique du Bearer token sur chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Propagation des erreurs telles quelles (le store gère le 401)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

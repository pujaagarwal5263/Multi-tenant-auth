import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface AuthModesResponse {
  success: boolean;
  data?: {
    authMethods: string[];
  };
  message?: string;
}

export const getAuthModes = async (email: string): Promise<AuthModesResponse> => {
  const response = await api.get<AuthModesResponse>('/auth/auth-modes', {
    params: { email },
  });
  return response.data;
};

export default api;

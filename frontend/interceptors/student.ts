"use client";
import axios from 'axios';
import { getSession } from 'next-auth/react';

// createStudentApi returns an axios instance configured to call the backend API.
// It prefers cookie-based auth (withCredentials: true). If a short-lived token
// is passed or available via next-auth session, it will also attach it as
// an Authorization header.
export const createStudentApi = async ({ token }: { token?: string } = {}) => {
  const session = await getSession();

  const serverApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  serverApi.interceptors.request.use((config) => {
    const authToken = token || (session as any)?.token;
    if (authToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${authToken}`,
      };
    }
    return config;
  });

  return serverApi;
};

export default createStudentApi;
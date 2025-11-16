'use client';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

export const createStudentApi = async ({ token }: { token: string }) => {
    // Use client-side getSession instead of getServerSession




    const serverApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_SERVER_API_URL || 'http://localhost:5000/api',
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    });

    // Add interceptor to include token in requests
    serverApi.interceptors.request.use((config) => {
        if (token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`
            };
        }
        return config;
    });

    return serverApi;
};
'use client';
import axios from 'axios';
import { getSession } from 'next-auth/react';

export const createAdminApi = async () => {
    // Use client-side getSession instead of getServerSession
    const session = await getSession();

  

    const serverApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_SERVER_API_URL || 'http://localhost:5000/api',
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    });

    // Add interceptor to include token in requests
    serverApi.interceptors.request.use((config) => {
        if (session?.token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${session.token}`
            };
        }
        return config;
    });

    return serverApi;
};
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        // Wait for auth state to load before redirecting
        if (!isLoading) {
            if (isAuthenticated) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        }
    }, [router, isAuthenticated, isLoading]);

    // Show simple loading state while determining auth status
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center">
                <div className="mb-8">
                    <Image
                        src="/logo.svg"
                        alt="Household Expenses Tracker"
                        width={80}
                        height={80}
                        className="mx-auto"
                        priority
                    />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Household Expenses Tracker</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">Manage your household expenses with ease</p>
                <div className="flex justify-center">
                    <div className="animate-pulse w-8 h-8 rounded-full bg-blue-500"></div>
                </div>
            </div>
        </div>
    );
}

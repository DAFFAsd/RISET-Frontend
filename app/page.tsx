'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from './AuthForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: number;
  username: string;
  saldo: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-bg">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={checkAuth} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <main className="flex flex-col items-center justify-center gap-8 p-8 max-w-2xl w-full">
        <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold mb-2">
              🍔 Hoomi Food
            </CardTitle>
            <CardDescription className="text-lg text-white/90">
              Selamat datang, <span className="font-semibold">{user.username}</span>!
            </CardDescription>
            <div className="mt-4 p-4 bg-white/20 rounded-lg">
              <p className="text-sm text-white/70">Saldo Anda</p>
              <p className="text-3xl font-bold text-green-300">
                Rp {user.saldo.toLocaleString('id-ID')}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={() => router.push('/chat')}
              className="w-full py-6 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg"
              size="lg"
            >
              🤖 Chat dengan HooMi AI
            </Button>
            <p className="text-sm text-white/70 text-center">
              Pesan makanan dari berbagai restoran dengan mudah menggunakan HooMi AI
            </p>
            <Button
              onClick={handleLogout}
              className="w-full bg-slate-800/80 border border-white/20 text-white hover:bg-slate-700/80 hover:border-white/30"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

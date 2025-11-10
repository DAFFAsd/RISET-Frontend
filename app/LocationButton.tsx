'use client'

import { useState } from 'react';
import { submitLocation } from './actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LocationButton() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleLocationRequest = async () => {
    setLoading(true);
    setStatus('Meminta izin lokasi...');

    if (!navigator.geolocation) {
      setStatus('Geolocation tidak didukung oleh browser Anda');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        try {
          setStatus('Mengirim data ke server...');
          const result = await submitLocation(locationData);
          
          if (result.success) {
            setStatus(`✓ ${result.message}`);
          }
        } catch (error) {
          setStatus('❌ Gagal mengirim data ke server');
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Izin lokasi ditolak';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage = '❌ Permintaan lokasi timeout';
            break;
          default:
            errorMessage = '❌ Terjadi kesalahan';
            break;
        }
        setStatus(errorMessage);
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <Button
        onClick={handleLocationRequest}
        disabled={loading}
        className="w-full py-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold shadow-lg"
        size="lg"
      >
        {loading ? 'Memproses...' : 'Izinkan Akses Lokasi'}
      </Button>
      
      {status && (
        <Card className={`p-4 w-full text-center ${
          status.includes('✓') ? 'bg-green-100 text-green-800 border-green-300' : 
          status.includes('❌') ? 'bg-red-100 text-red-800 border-red-300' : 
          'bg-blue-100 text-blue-800 border-blue-300'
        }`}>
          {status}
        </Card>
      )}
    </div>
  );
}

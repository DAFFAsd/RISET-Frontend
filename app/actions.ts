'use server'

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export async function submitLocation(locationData: LocationData) {
  console.log('=== Data Lokasi Diterima di Server ===');
  console.log('Latitude:', locationData.latitude);
  console.log('Longitude:', locationData.longitude);
  console.log('Accuracy:', locationData.accuracy, 'meters');
  console.log('Timestamp:', new Date(locationData.timestamp).toLocaleString());
  console.log('=====================================');

  // Simulasi pemrosesan data
  return {
    success: true,
    message: 'Data lokasi berhasil diterima dan diproses di server',
    receivedAt: new Date().toISOString(),
  };
}

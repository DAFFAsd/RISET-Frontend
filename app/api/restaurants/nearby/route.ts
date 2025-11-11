import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyD1mK-KGo_Ul2WI1KQe7NjlRbQfZVyDXSY';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseInt(searchParams.get('radius') || '5000');
    const keyword = searchParams.get('keyword') || '';

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Build Google Places API URL
    let placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;
    
    // Add keyword if provided
    if (keyword) {
      placesUrl += `&keyword=${encodeURIComponent(keyword)}`;
    }

    try {
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();
      
      if (placesData.status === 'OK' && placesData.results) {
        const restaurants = placesData.results.slice(0, 10).map((place: any) => {
          const distance = calculateDistance(
            latitude, 
            longitude, 
            place.geometry.location.lat, 
            place.geometry.location.lng
          );
          
          return {
            id: place.place_id,
            name: place.name,
            description: place.vicinity,
            imageUrl: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              : null,
            rating: place.rating || 0,
            distance: Math.round(distance),
            distanceText: distance < 1000 
              ? `${Math.round(distance)} m` 
              : `${(distance / 1000).toFixed(1)} km`,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            isOpen: place.opening_hours?.open_now,
            types: place.types,
            priceLevel: place.price_level
          };
        }).sort((a: any, b: any) => a.distance - b.distance);

        return NextResponse.json({
          success: true,
          restaurants,
          userLocation: {
            latitude,
            longitude
          },
          totalFound: restaurants.length,
          keyword: keyword || null
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Google Places API error: ${placesData.status}`,
          restaurants: [],
          totalFound: 0
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Google Places API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch from Google Places API' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Find nearby restaurants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

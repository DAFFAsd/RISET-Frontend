import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyD1mK-KGo_Ul2WI1KQe7NjlRbQfZVyDXSY';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseInt(searchParams.get('radius') || '5000');
    const keyword = searchParams.get('keyword') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

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
        // Prepare destinations for Distance Matrix API
        const slicedResults = placesData.results.slice(0, limit);
        const destinations = slicedResults
          .map((place: any) => `${place.geometry.location.lat},${place.geometry.location.lng}`)
          .join('|');
        
        // Call Distance Matrix API to get accurate distances
        const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latitude},${longitude}&destinations=${destinations}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const distanceResponse = await fetch(distanceMatrixUrl);
        const distanceData = await distanceResponse.json();
        
        const restaurants = slicedResults.map((place: any, index: number) => {
          let distance = 0;
          let distanceText = 'N/A';
          
          // Get distance from Distance Matrix API if available
          if (distanceData.status === 'OK' && distanceData.rows[0]?.elements[index]?.status === 'OK') {
            distance = distanceData.rows[0].elements[index].distance.value; // in meters
            distanceText = distanceData.rows[0].elements[index].distance.text;
          }
          
          return {
            id: place.place_id,
            name: place.name,
            description: place.vicinity,
            imageUrl: place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              : null,
            rating: place.rating || 0,
            distance: distance,
            distanceText: distanceText,
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
          keyword: keyword || null,
          limit: limit
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

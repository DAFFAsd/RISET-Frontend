import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const result = await query(
      'SELECT id, name, description, image_url, rating FROM restaurants ORDER BY name'
    );

    return NextResponse.json({
      success: true,
      restaurants: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        rating: parseFloat(row.rating)
      }))
    });

  } catch (error) {
    console.error('Get restaurants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);

    if (isNaN(restaurantId)) {
      return NextResponse.json(
        { error: 'Invalid restaurant ID' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT id, name, description, price, image_url, available FROM menu_items WHERE restaurant_id = $1 AND available = true ORDER BY name',
      [restaurantId]
    );

    return NextResponse.json({
      success: true,
      menuItems: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        imageUrl: row.image_url,
        available: row.available
      }))
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

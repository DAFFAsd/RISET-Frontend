import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

interface OrderItem {
  menuItemId: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const client = await getClient();
  
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { restaurantId, items, deliveryAddress } = await req.json();

    if (!restaurantId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant ID and items are required' },
        { status: 400 }
      );
    }

    // Begin transaction
    await client.query('BEGIN');

    // Calculate total amount
    let totalAmount = 0;
    const orderItems: Array<{
      menuItemId: number;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const menuResult = await client.query(
        'SELECT id, name, price, available FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [item.menuItemId, restaurantId]
      );

      if (menuResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 404 }
        );
      }

      const menuItem = menuResult.rows[0];

      if (!menuItem.available) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Menu item ${menuItem.name} is not available` },
          { status: 400 }
        );
      }

      const price = parseFloat(menuItem.price);
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price,
        subtotal
      });
    }

    // Check user balance
    const balanceResult = await client.query(
      'SELECT saldo FROM users WHERE id = $1 FOR UPDATE',
      [user.id]
    );

    const currentBalance = parseFloat(balanceResult.rows[0].saldo);

    if (currentBalance < totalAmount) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          balance: currentBalance,
          required: totalAmount,
          shortfall: totalAmount - currentBalance
        },
        { status: 400 }
      );
    }

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, restaurant_id, total_amount, status, delivery_address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user.id, restaurantId, totalAmount, 'pending', deliveryAddress || 'Not specified']
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.menuItemId, item.quantity, item.price, item.subtotal]
      );
    }

    // Deduct balance
    const newBalance = currentBalance - totalAmount;
    await client.query(
      'UPDATE users SET saldo = $1, updated_at = NOW() WHERE id = $2',
      [newBalance, user.id]
    );

    // Record transaction
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, -totalAmount, 'payment', `Payment for order #${orderId}`, currentBalance, newBalance]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Order berhasil dibuat! Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
      order: {
        id: orderId,
        totalAmount,
        items: orderItems
      },
      balance: newBalance
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT o.id, o.total_amount, o.status, o.delivery_address, o.created_at,
              r.name as restaurant_name
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows.map(row => ({
        id: row.id,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        deliveryAddress: row.delivery_address,
        restaurantName: row.restaurant_name,
        createdAt: row.created_at
      }))
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

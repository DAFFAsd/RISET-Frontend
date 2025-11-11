import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

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
      'SELECT id, amount, type, description, balance_before, balance_after, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [user.id]
    );

    return NextResponse.json({
      success: true,
      transactions: result.rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.amount),
        type: row.type,
        description: row.description,
        balanceBefore: parseFloat(row.balance_before),
        balanceAfter: parseFloat(row.balance_after),
        createdAt: row.created_at
      }))
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

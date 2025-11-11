import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

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

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be greater than 0' },
        { status: 400 }
      );
    }

    // Begin transaction
    await client.query('BEGIN');

    // Get current balance
    const currentBalance = await client.query(
      'SELECT saldo FROM users WHERE id = $1 FOR UPDATE',
      [user.id]
    );

    const balanceBefore = parseFloat(currentBalance.rows[0].saldo);
    const balanceAfter = balanceBefore + amount;

    // Update balance
    await client.query(
      'UPDATE users SET saldo = $1, updated_at = NOW() WHERE id = $2',
      [balanceAfter, user.id]
    );

    // Record transaction
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, amount, 'topup', 'Top up saldo', balanceBefore, balanceAfter]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Berhasil top up Rp ${amount.toLocaleString('id-ID')}`,
      balance: balanceAfter
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Top up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

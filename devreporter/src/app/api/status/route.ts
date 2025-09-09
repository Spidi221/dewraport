import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for development - replace with real status checks
    const status = {
      isOnline: true,
      apartmentsCount: 156,
      lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
      errorsCount: 0,
      nextSync: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(), // 8h from now
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
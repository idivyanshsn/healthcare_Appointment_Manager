import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  return NextResponse.redirect(
    new URL(`/?calendarSynced=true&code=${code || ''}&state=${state || ''}`, request.url)
  );
}

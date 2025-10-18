import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to the favicon.ico route
  return NextResponse.redirect(new URL('/favicon.ico', request.url));
}

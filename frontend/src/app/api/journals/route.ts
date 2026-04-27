import { NextResponse } from 'next/server';
import { recommendJournals } from '@/services/journal-recommender';

export async function GET(request: Request) {
  // SECURITY: Mock authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'general';
  const domain = searchParams.get('domain') || 'science';
  
  const journals = await recommendJournals(topic, domain);
  return NextResponse.json(journals);
}

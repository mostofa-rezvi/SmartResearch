import { NextResponse } from 'next/server';
import { ForumService } from '@/services/forum-service';

export async function GET() {
  const threads = await ForumService.getThreads();
  return NextResponse.json(threads);
}

export async function POST(request: Request) {
  // SECURITY: Mock authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const thread = await ForumService.createThread(data);
  return NextResponse.json(thread);
}

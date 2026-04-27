import { NextResponse } from 'next/server';
import { ChecklistService } from '@/services/publication-checklist';

export async function GET(request: Request) {
  // SECURITY: Mock authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = ChecklistService.getTemplates();
  const checklist = await ChecklistService.getUserChecklist('mock-user');
  
  return NextResponse.json({ templates, checklist });
}

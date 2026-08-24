import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symptoms } = body;

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return NextResponse.json(
        { success: false, error: 'Symptoms description text is required.' },
        { status: 400 }
      );
    }

    const summary = await llmService.generatePreVisitSummary(symptoms);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

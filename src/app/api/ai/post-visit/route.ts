import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctorNotes, prescriptions } = body;

    if (!doctorNotes || typeof doctorNotes !== 'string' || !doctorNotes.trim()) {
      return NextResponse.json(
        { success: false, error: 'Clinical doctor notes are required for post-visit summary.' },
        { status: 400 }
      );
    }

    const summary = await llmService.generatePostVisitSummary(doctorNotes, prescriptions);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

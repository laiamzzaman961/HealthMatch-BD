import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseQueryWithLLM } from '@/lib/parser';

const RequestSchema = z.object({
  text: z.string().min(1, 'Message text is required'),
  lang: z.enum(['en', 'bn']).optional().default('en'),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { text, lang } = parsed.data;
    const result = await parseQueryWithLLM(text, lang);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Error in /api/parse:', err);
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        fallbackMessage: 'Our assistant is busy, please use the form below',
        error: err instanceof Error ? err.message : 'Unknown server error',
      },
      { status: 500 }
    );
  }
}

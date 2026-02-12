import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processToolWithAI } from '@/lib/tools/openai-tools';
import pdf from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Geo-restriction: Only allow US users
        const vercelCountry = request.headers.get('x-vercel-ip-country');
        const cfCountry = request.headers.get('cf-ipcountry');
        const detectedCountry = vercelCountry || cfCountry;

        // If we can detect the country and it's not US, block the request
        // (skip check if no country header is available — e.g., localhost)
        if (detectedCountry && detectedCountry !== 'US') {
            return NextResponse.json(
                { error: 'This service is currently available only in the United States. Coming to your country soon!' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const email = formData.get('email') as string | null;
        const name = formData.get('name') as string | null;
        const toolId = formData.get('toolId') as string | null;

        if (!file || !email || !toolId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Parse PDF to text
        let resumeText = "";
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const data = await pdf(buffer);
            resumeText = data.text;
        } catch (parseError) {
            console.error('PDF Parse Error:', parseError);
            return NextResponse.json({ error: 'Failed to parse resume PDF' }, { status: 422 });
        }

        if (!resumeText || resumeText.trim().length < 100) {
            return NextResponse.json({ error: 'Resume text is too short or could not be extracted' }, { status: 422 });
        }

        // 2. Process with AI
        const aiResponse = await processToolWithAI(resumeText, toolId);
        const { extracted_stats, tool_result } = aiResponse;

        // 3. Save Lead to database
        const supabase = await createClient();

        // Use insert with select to get the ID back
        const { data: lead, error: dbError } = await (supabase.from('leads') as any)
            .insert({
                email,
                full_name: name || extracted_stats?.user_fullname || null,
                user_fullname: name || extracted_stats?.user_fullname || null,
                user_current_title: extracted_stats?.user_current_title || null,
                user_phone: extracted_stats?.user_phone || null,
                tool_used: toolId,
                tool_result_data: tool_result,
                extraction_data: extracted_stats,
                parsed_data: {
                    ...extracted_stats,
                    resume_text_preview: resumeText.slice(0, 1000),
                }
            })
            .select('id')
            .single();

        if (dbError) {
            console.error('Database lead capture error:', dbError);
            // Non-fatal for the user experience, but we should log it
        }

        return NextResponse.json({
            success: true,
            lead_id: lead?.id,
            tool_data: tool_result,
            extracted: extracted_stats
        });

    } catch (error: any) {
        console.error('Tool processing error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

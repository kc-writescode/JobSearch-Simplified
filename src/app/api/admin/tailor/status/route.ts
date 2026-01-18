import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        if (!jobId) {
            return NextResponse.json({ error: 'Missing job_id parameter' }, { status: 400 });
        }

        // Fetch tailored resume using service role to bypass RLS
        const { data: tailoredResume, error } = await supabase
            .from('tailored_resumes')
            .select('*, jobs:job_id(id, title, company)')
            .eq('job_id', jobId)
            .single();

        if (error || !tailoredResume) {
            return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
        }

        return NextResponse.json({ data: tailoredResume });
    } catch (error) {
        console.error('Admin Tailor status API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

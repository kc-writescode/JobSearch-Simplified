import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS for admin/VA uploads
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const jobId = formData.get('jobId') as string;

        if (!file || !jobId) {
            return NextResponse.json({ error: 'Missing file or jobId' }, { status: 400 });
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Create path: proofs/{jobId}/{timestamp}_{filename}
        // We use 'resumes' bucket as established convention in ApplicationWorkspace
        const filePath = `proofs/${jobId}/${Date.now()}_${sanitizedName}`;

        const { error } = await supabase.storage
            .from('resumes')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ path: filePath });
    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

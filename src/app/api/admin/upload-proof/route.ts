import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const jobId = formData.get('jobId') as string;
        const type = formData.get('type') as string || 'proof';

        if (!file || !jobId) {
            return NextResponse.json({ error: 'Missing file or jobId' }, { status: 400 });
        }

        // Check file size (10MB limit)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 413 });
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Create path: {type}s/{jobId}/{timestamp}_{filename}
        const folder = type === 'custom_resume' ? 'custom_resumes' : 'proofs';
        const filePath = `${folder}/${jobId}/${Date.now()}_${sanitizedName}`;

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
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

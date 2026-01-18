import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
    }

    // Download the file from Supabase storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(path);

    if (error) {
      console.error('Storage download error:', error);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // Get file extension from path
    const fileName = path.split('/').pop() || 'resume.pdf';

    // Return the file as a response
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

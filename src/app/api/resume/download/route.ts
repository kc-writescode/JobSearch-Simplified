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
    const taskId = searchParams.get('taskId');
    const type = searchParams.get('type');

    if (!path && (!taskId || type !== 'tailored')) {
      return NextResponse.json({ error: 'Missing file path or task context' }, { status: 400 });
    }

    // Handle tailored resume generation on the fly
    if (type === 'tailored' && taskId) {
      const { data: tailored, error: fetchError } = await (supabase
        .from('tailored_resumes') as any)
        .select(`
          tailored_summary, 
          tailored_experience, 
          tailored_skills,
          jobs (title, company)
        `)
        .eq('job_id', taskId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !tailored) {
        console.error('Tailored resume fetch error:', fetchError);
        return NextResponse.json({ error: 'Tailored resume data not found' }, { status: 404 });
      }

      const content = `
TAILORED RESUME: ${tailored.jobs?.title || 'Position'} at ${tailored.jobs?.company || 'Company'}
Generated via AI Assistant

PROFESSIONAL SUMMARY
${tailored.tailored_summary}

SKILLS
${(tailored.tailored_skills || []).join(', ')}

EXPERIENCE
${(tailored.tailored_experience || []).map((exp: any) => `
${exp.role} | ${exp.company}
${(exp.tailored_bullets || []).map((b: string) => `• ${b}`).join('\n')}
`).join('\n')}
      `.trim();

      const fileName = `Tailored_Resume_${(tailored.jobs?.company || 'Selected').replace(/\s+/g, '_')}.txt`;

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Default behavior for original resumes
    if (!path) return NextResponse.json({ error: 'Missing file path' }, { status: 400 });

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

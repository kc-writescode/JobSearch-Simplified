import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: taskId } = await context.params;
    const body = await request.json();
    const { status, proofOfWork } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      status: mapTaskStatusToJobStatus(status),
      updated_at: new Date().toISOString(),
    };

    // Add applied_at and submission_proof when marking as applied
    if (status === 'Applied') {
      updateData.applied_at = new Date().toISOString();

      // Determine submission proof content
      if (proofOfWork?.proofPath) {
        // New explicit path field
        updateData.submission_proof = proofOfWork.proofPath;
      } else if (proofOfWork?.screenshotUrl && !proofOfWork.screenshotUrl.startsWith('data:')) {
        // Legacy field containing path or URL (not base64)
        updateData.submission_proof = proofOfWork.screenshotUrl;
      } else if (proofOfWork?.submissionLink) {
        // Fallback to link
        updateData.submission_proof = proofOfWork.submissionLink;
      }
    }

    // Update job status
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', taskId)
      .select();

    if (error) throw error;

    return NextResponse.json(data?.[0] || {}, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

function mapTaskStatusToJobStatus(status: string): string {
  switch (status) {
    case 'Applying':
      return 'saved';
    case 'Applied':
      return 'applied';
    default:
      return status.toLowerCase();
  }
}

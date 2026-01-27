import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const serverSupabase = await createServerClient();

    const { id: taskId } = await context.params;
    const body = await request.json();
    const { status, proofOfWork, cannotApplyReason, assignedTo, assignmentStatus } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = mapTaskStatusToJobStatus(status);
    }

    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (assignmentStatus !== undefined) updateData.assignment_status = assignmentStatus;

    // Identify the current administrator from the session
    const { data: { user: adminUser } } = await serverSupabase.auth.getUser();

    // Add applied_at, submission_proof, and applied_by when marking as applied
    if (status === 'Applied') {
      updateData.applied_at = new Date().toISOString();
      if (adminUser) {
        updateData.applied_by = adminUser.id;
      }

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

    // Add cannot_apply_reason when marking as trashed
    if (status === 'Trashed' && cannotApplyReason) {
      updateData.cannot_apply_reason = cannotApplyReason;
    }

    // Build the query
    let query = supabase
      .from('jobs')
      .update(updateData)
      .eq('id', taskId);

    // CRITICAL: If this is a claim attempt, ensure the job is still unassigned
    // This prevents race conditions where two admins claim the same job simultaneously
    if (assignedTo !== undefined) {
      query = query.is('assigned_to', null);
    }

    // Update job status
    const { data, error } = await query.select();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update task in database' },
        { status: 400 }
      );
    }

    // If no data was returned but no error, it means the .is('assigned_to', null) condition failed
    if (assignedTo !== undefined && (!data || data.length === 0)) {
      return NextResponse.json(
        { error: 'This mission has already been claimed by another agent.' },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(data?.[0] || {}, { status: 200 });
  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
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
    case 'Trashed':
      return 'trashed';
    default:
      return status.toLowerCase();
  }
}

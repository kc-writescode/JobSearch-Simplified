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
    const { status, proofOfWork, cannotApplyReason, assignedTo, assignmentStatus, labels } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = mapTaskStatusToJobStatus(status);
    }

    if (assignedTo !== undefined) {
      updateData.assigned_to = assignedTo;
      // Clear overdue flag when re-claiming a previously overdue job
      if (assignedTo !== null) {
        updateData.overdue_released_at = null;
        updateData.previous_assignee = null;
      }
    }
    if (assignmentStatus !== undefined) updateData.assignment_status = assignmentStatus;
    if (labels !== undefined) updateData.labels = labels;

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

      // Handle custom resume proof
      if (proofOfWork?.customResumePath) {
        updateData.custom_resume_proof = proofOfWork.customResumePath;
      }

    }

    // Add cannot_apply_reason and trashed_at when marking as trashed
    if (status === 'Trashed') {
      updateData.trashed_at = new Date().toISOString();
      if (cannotApplyReason) {
        updateData.cannot_apply_reason = cannotApplyReason;
      }
    }

    // NEW (PART 1): If submitting (marking as Applied), ensure we capture ownership
    // This repairs cases where assignment was lost and prevents unauthorized submissions
    if (status === 'Applied' && adminUser) {
      // Set the assignment to the current user (in case it was null)
      updateData.assigned_to = adminUser.id;
    }

    // Build the query
    let query = supabase
      .from('jobs')
      .update(updateData)
      .eq('id', taskId);

    // CRITICAL: If this is a claim attempt, enforce limits and race-condition safety
    if (assignedTo !== undefined) {
      // Enforce active claim limit of 5 per admin
      const MAX_ACTIVE_CLAIMS = 5;
      const { count: activeClaims, error: countError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', assignedTo)
        .not('status', 'in', '("applied","trashed")');

      if (countError) {
        console.error('Error counting active claims:', countError);
      } else if ((activeClaims || 0) >= MAX_ACTIVE_CLAIMS) {
        return NextResponse.json(
          { error: `You have reached the maximum of ${MAX_ACTIVE_CLAIMS} active claims. Submit or release existing claims before claiming more.`, code: 'CLAIM_LIMIT_REACHED' },
          { status: 429 }
        );
      }

      // Ensure the job is still unassigned (race-condition guard)
      query = query.is('assigned_to', null);
    }

    // NEW (PART 2): Add the security filter for submissions
    if (status === 'Applied' && adminUser) {
      // Allow update ONLY if assigned to self OR unassigned
      query = query.or(`assigned_to.is.null,assigned_to.eq.${adminUser.id}`);
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

    // If no data was returned but no error:
    if (!data || data.length === 0) {
      // Case 1: Claim attempt failed (race condition)
      if (assignedTo !== undefined) {
        return NextResponse.json(
          { error: 'This mission has already been claimed by another agent.' },
          { status: 409 }
        );
      }
      // Case 2: Submission attempt failed (assigned to someone else)
      if (status === 'Applied') {
        return NextResponse.json(
          { error: 'You can only submit missions assigned to you.' },
          { status: 403 }
        );
      }

      // Generic case (task not found or other filter mismatch)
      return NextResponse.json(
        { error: 'Task not found or update failed.' },
        { status: 404 }
      );
    }

    const updatedJob = data?.[0] || {};

    // Deduct credit ONLY after successful update (if status is Applied)
    if (status === 'Applied' && updatedJob.user_id) {
      const userId = updatedJob.user_id;

      // Get current credits
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profileError && profileData) {
        const currentCredits = profileData.credits || 0;
        if (currentCredits > 0) {
          // Deduct one credit
          await supabase
            .from('profiles')
            .update({
              credits: currentCredits - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
      }
    }

    return NextResponse.json(updatedJob, { status: 200 });
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

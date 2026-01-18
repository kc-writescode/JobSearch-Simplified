import { NextResponse } from 'next/server';

// DEPRECATED: Applications are now tracked directly in the jobs table.
// Job status flow: saved → tailoring → tailored → applied → interviewing → offer → closed
// Use /api/jobs instead for all job and application management.

export async function GET() {
  return NextResponse.json(
    {
      error: 'Deprecated',
      message: 'Applications are now tracked in jobs. Use /api/jobs instead.',
      redirect: '/api/jobs'
    },
    { status: 410 } // Gone
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated',
      message: 'To track an application, update job status to "applied". Use PATCH /api/jobs instead.',
      redirect: '/api/jobs'
    },
    { status: 410 }
  );
}

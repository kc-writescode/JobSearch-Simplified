import { redirect } from 'next/navigation';

// Redirect to unified dashboard - resume management is now integrated there
export default function ResumePage() {
  redirect('/dashboard');
}

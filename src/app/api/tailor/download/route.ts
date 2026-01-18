import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  tailored_bullets?: string[];
}

interface TailoredData {
  summary?: string;
  experience?: Experience[];
  highlighted_skills?: string[];
  keywords_matched?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job_id parameter' }, { status: 400 });
    }

    // Fetch tailored resume
    const { data: tailoredResume, error: tailorError } = await supabase
      .from('tailored_resumes')
      .select('*, jobs:job_id(title, company, user_id)')
      .eq('job_id', jobId)
      .single();

    if (tailorError || !tailoredResume) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    if (tailoredResume.status !== 'completed') {
      return NextResponse.json({ error: 'Resume tailoring not completed' }, { status: 400 });
    }

    // Fetch user profile for contact info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone, linkedin_url, resume_data')
      .eq('id', tailoredResume.user_id)
      .single();

    const job = tailoredResume.jobs as { title: string; company: string };
    const tailoredData = tailoredResume.full_tailored_data as TailoredData;
    const originalResume = tailoredResume.original_resume_data || profile?.resume_data;

    // Generate PDF - Compact Layout
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12; // Tightened margins
    const contentWidth = pageWidth - 2 * margin;
    let y = 12; // Start at 12mm

    // Helper for justified text (industry standard for clean margins)
    const addJustifiedText = (text: string, x: number, width: number, fontSize: number, isBold = false, color = '#2d3748', lineSpacing = 1.1) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color);

      const words = text.split(/\s+/);
      let currentLine: string[] = [];
      let currentLineWidth = 0;

      const renderLine = (lineWords: string[], isLastLine = false) => {
        if (lineWords.length === 0) return;
        const lineText = lineWords.join(' ');

        if (isLastLine || lineWords.length === 1) {
          pdf.text(lineText, x, y);
        } else {
          const totalWordsWidth = lineWords.reduce((sum, word) => sum + pdf.getTextWidth(word), 0);
          const totalSpacing = width - totalWordsWidth;
          const spaceWidth = totalSpacing / (lineWords.length - 1);

          let currentX = x;
          lineWords.forEach((word, i) => {
            pdf.text(word, currentX, y);
            currentX += pdf.getTextWidth(word) + spaceWidth;
          });
        }
        y += (fontSize * 0.35 * lineSpacing);
      };

      words.forEach((word) => {
        const wordWidth = pdf.getTextWidth(word + ' ');
        if (currentLineWidth + wordWidth > width) {
          renderLine(currentLine);
          currentLine = [word];
          currentLineWidth = wordWidth;
        } else {
          currentLine.push(word);
          currentLineWidth += wordWidth;
        }
      });
      renderLine(currentLine, true);
    };

    const addSectionHeader = (title: string) => {
      y += 1.5;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#1a365d');
      pdf.text(title.toUpperCase(), margin, y);
      y += 1.2;
      pdf.setDrawColor('#cbd5e0');
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
    };

    const name = profile?.full_name || 'Name';
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#1a365d');
    pdf.text(name, pageWidth / 2, y, { align: 'center' });
    y += 6;

    const contactParts = [];
    if (profile?.email) contactParts.push(profile.email);
    if (profile?.phone) contactParts.push(profile.phone);
    if (profile?.linkedin_url) {
      const linkedinHandle = profile.linkedin_url.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      contactParts.push(`linkedin.com/in/${linkedinHandle}`);
    }

    if (contactParts.length > 0) {
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor('#4a5568');
      pdf.text(contactParts.join('   |   '), pageWidth / 2, y, { align: 'center' });
      y += 7;
    }

    const summary = tailoredData?.summary || tailoredResume.tailored_summary;
    if (summary) {
      addSectionHeader('Professional Summary');
      addJustifiedText(summary, margin, contentWidth, 10, false, '#2d3748', 1.15);
      y += 2;
    }

    const experiences = tailoredData?.experience || tailoredResume.tailored_experience || [];
    if (experiences.length > 0) {
      addSectionHeader('Professional Experience');
      experiences.forEach((exp: Experience) => {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#1a202c');
        const title = exp.title || (exp as any).role || '';
        pdf.text(title, margin, y);

        const startDate = exp.startDate || (exp as any).start_date || '';
        const endDate = exp.endDate || (exp as any).end_date || 'Present';
        const dateText = `${startDate} - ${endDate}`;
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#4a5568');
        const dateWidth = pdf.getTextWidth(dateText);
        pdf.text(dateText, pageWidth - margin - dateWidth, y);
        y += 4.5;

        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#2b6cb0');
        pdf.text(exp.company || '', margin, y);

        if (exp.location) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor('#718096');
          const locWidth = pdf.getTextWidth(exp.location);
          pdf.text(exp.location, pageWidth - margin - locWidth, y);
        }
        y += 4.5;

        const bullets = exp.tailored_bullets || [];
        bullets.forEach((bullet: string) => {
          if (y > 285) { pdf.addPage(); y = 12; }
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor('#2d3748');
          pdf.text('•', margin, y);
          addJustifiedText(bullet, margin + 4, contentWidth - 4, 10, false, '#2d3748', 1.15);
          y += 1;
        });
        y += 2;
      });
    }

    const skills = tailoredData?.highlighted_skills || tailoredResume.tailored_skills || originalResume?.skills || [];
    if (skills.length > 0) {
      addSectionHeader('Technical Skills');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      addJustifiedText(skills.join('   •   '), margin, contentWidth, 10, false, '#2d3748', 1.2);
      y += 3;
    }

    const education = originalResume?.education || [];
    if (education.length > 0) {
      addSectionHeader('Education');
      education.forEach((edu: any) => {
        if (y > 285) { pdf.addPage(); y = 12; }
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(edu.degree || '', margin, y);
        const yearText = edu.year || edu.graduationDate || '';
        const yearWidth = pdf.getTextWidth(yearText);
        pdf.setFontSize(9.5);
        pdf.text(yearText, pageWidth - margin - yearWidth, y);
        y += 4.5;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(edu.school || edu.institution || '', margin, y);
        y += 6;
      });
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const fileName = `${name.replace(/\s+/g, '_')}_Resume_${job.company.replace(/\s+/g, '_')}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Tailored resume download error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

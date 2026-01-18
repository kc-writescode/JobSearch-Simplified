import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');
        const format = searchParams.get('format') || 'pdf'; // pdf or docx

        if (!jobId) {
            return NextResponse.json({ error: 'Missing job_id parameter' }, { status: 400 });
        }

        // Fetch job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone, linkedin_url')
            .eq('id', job.user_id)
            .single();

        const coverLetterText = job.cover_letter;
        if (!coverLetterText) {
            return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
        }

        const name = (profile as any)?.full_name || 'Applicant';
        const email = (profile as any)?.email || '';
        const phone = (profile as any)?.phone || '';
        const linkedin = (profile as any)?.linkedin_url || '';

        if (format === 'docx') {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: name, bold: true, size: 40, font: "Helvetica" }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: [email, phone, linkedin].filter(Boolean).join('   |   '),
                                    size: 20,
                                    font: "Helvetica"
                                }),
                            ],
                        }),
                        new Paragraph({ text: "" }),
                        ...coverLetterText.split('\n').map((line: string) =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: line, size: 22, font: "Helvetica" }),
                                ],
                                spacing: { after: 200 },
                                alignment: AlignmentType.JUSTIFIED
                            })
                        ),
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);
            return new NextResponse(buffer as any, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'Content-Disposition': `attachment; filename="Cover_Letter_${job.company.replace(/\s+/g, '_')}.docx"`,
                },
            });
        } else {
            // DEFAULT: PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const margin = 20;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const contentWidth = pageWidth - 2 * margin;
            let y = 20;

            // Justified helper
            const addJustifiedText = (text: string, x: number, width: number, fontSize: number, isBold = false, color = '#2d3748', lineSpacing = 1.15) => {
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

            // Header
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(22);
            pdf.setTextColor('#1a365d');
            pdf.text(name, pageWidth / 2, y, { align: 'center' });
            y += 8;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor('#4a5568');
            const contact = [email, phone, linkedin].filter(Boolean).join('   |   ');
            pdf.text(contact, pageWidth / 2, y, { align: 'center' });
            y += 15;

            // Body
            const paragraphs = coverLetterText.split('\n').filter((p: string) => p.trim() !== '');
            paragraphs.forEach((para: string) => {
                if (y > 270) { pdf.addPage(); y = 20; }
                addJustifiedText(para, margin, contentWidth, 11, false, '#2d3748', 1.25);
                y += 4; // Paragraph spacing
            });

            const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
            return new NextResponse(pdfBuffer as any, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="Cover_Letter_${job.company.replace(/\s+/g, '_')}.pdf"`,
                },
            });
        }
    } catch (error) {
        console.error('Cover letter download error:', error);
        return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
    }
}

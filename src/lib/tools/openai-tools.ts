import { getOpenAI } from '../ai/openai';

export async function processToolWithAI(resumeText: string, toolId: string) {
    const openai = getOpenAI();

    let toolPrompt = "";
    let systemPrompt = "You are a world-class career strategist and expert creative writer. Your goal is to provide deeply insightful, high-value, and polished career tools based on resume data. You output ONLY valid JSON.";

    switch (toolId) {
        case 'ats-checker':
            toolPrompt = `As a high-powered ATS (Applicant Tracking System) forensic auditor, dissect this resume.
            Return a JSON object with:
            - score (number, 0-100): Calculated based on readability, keyword density, and structural integrity.
            - report_title (string): A premium, professional title for this audit.
            - executive_summary (string): A punchy, high-impact assessment of their market positioning (3-4 sentences).
            - key_strengths (array of objects): 5 "unfair advantages", each with { category: string, detail: string }. Use aggressive, powerful category names.
            - critical_optimization_points (array of objects): 5 "leaks in the pipeline", each with { area: string, suggestion: string }. Focus on structural, keyword, and narrative fixes.
            - industry_benchmark (string): A spicy comparison to the top 1% of talent in their sector.`;
            break;

        case 'netflix-career':
            toolPrompt = `You are a high-end Hollywood creative director. Conceptually transform this person's career into a premium Netflix Original drama or blockbuster series that would win 10 Emmys.
            Return a JSON object with:
            - series_title (string): A sophisticated, high-concept, gripping title.
            - premium_tagline (string): A cinematic, hair-raising tagline.
            - show_runner_summary (string): A 4-sentence dramatic narrative of their career arc (vivid, high-stakes storytelling).
            - seasons (array of objects): 3 "seasons" of their career, each with { season_title: string, plot_arc: string }.
            - lead_character_profile (object): { name: string, description: string, key_vibe: string }. Imagine them as a iconic protagonist.
            - genre (string): e.g., "Techno-Thriller", "Corporate Drama", "Biographical Epic".
            - visual_style (string): Describe the cinematic aesthetic (e.g., "Cyber-noir with high-contrast neon accents").`;
            break;

        case 'wikipedia-page':
            toolPrompt = `Generate a high-authority Wikipedia entry for this professional, making them sound like an industry legend. Use formal, encyclopedic language.
            Return a JSON object with:
            - title (string): The standard Wikipedia page title format (Full Name).
            - lead_paragraph (string): A dense, authoritative opening summarizing their professional significance and legacy.
            - sections (array of objects): 4 sections (e.g., "Early career and education", "Technical contributions", "Major projects", "Legacy"), each with { heading: string, content: string }.
            - infobox (object): { birth_name: string, fields: string[], known_for: string[], education: string, current_status: string }.
            - references_count (number): A symbolic number of fictional citations.`;
            break;

        case 'resume-roast':
            toolPrompt = `You are a legendary tech-industry comedian and savage recruiter. Roast this resume with brutal wit, surgical precision, and hilariously accurate industry observations. Use "emotional damage" levels of humor but keep it helpful. Roast them like Gordon Ramsay roasts a bad steak.
            Return a JSON object with:
            - roast_level (string): e.g., "Medium Rare", "Charcoal", "Thermonuclear", "Vantablack".
            - opening_salvo (string): A devastating first impression of the resume.
            - savage_critiques (array of objects): 5 critiques, each with { target: string, roast: string }.
            - industry_opinion (string): What a cynical, coffee-addicted HR manager says behind their back.
            - redemption_path (string): One truly helpful (but still slightly snarky) piece of advice.`;
            break;

        case 'job-search-strategy':
            toolPrompt = `As a $1,000/hr elite career consultant, build a high-performance 30-day "Blitzscale" job search roadmap.
            Return a JSON object with:
            - strategic_objective (string): A personalized, high-stakes North Star for their search.
            - weeks (array of objects): 4 weeks, each with { week_name: string, focus_area: string, primary_actions: string[] }.
            - reach_out_scripts (array of objects): 2 personalized LinkedIn/Email outreach templates for their target role (one "Professional", one "Disruptive").
            - target_companies_types (string[]): 5 types of companies or specific names they should target.`;
            break;

        case 'interview-predictor':
            toolPrompt = `You are an expert technical recruiter and behavioral interviewer. Based on this resume, predict the exact high-stakes questions a person would face at a Tier-1 tech company.
            Return a JSON object with:
            - anticipated_questions (array of objects): 5 questions, each with { type: "Technical" | "Behavioral" | "Strategic", question: string, why_they_ask: string, ideal_answer_tip: string }.
            - confidence_score (number): A calculated percentage of how prepared they are.
            - red_flag_warning (string): One potential concern in the resume they should be ready to defend (and how to pivot).`;
            break;

        case 'buzzword-detector':
            toolPrompt = `You are a minimalist copy editor and modern HR branding expert. Identify the fluff, clichés, and "empty calories" in this resume.
            Return a JSON object with:
            - buzzword_count (number): Total cringe-worthy words found.
            - words_to_kill (array of objects): 5 words/phrases, each with { word: string, reason: string, replacement: string }.
            - readability_grade (string): e.g., "A+", "C", "Recruiter Headaches".
            - professional_tone (string): A sharp assessment of the general vibe.`;
            break;

        case 'killer-self-intro':
            toolPrompt = `You are a master pitch coach. Generate 3 distinct and powerful "self-intro" personas based on this resume that would command a room.
            Return a JSON object with:
            - intros (array of objects): 3 versions, each with { style: "The Visionary" | "The Fixer" | "The Specialist", script: string, best_used_for: string }.
            - hook_summary (string): Their "Unique Selling Proposition" in 10 words or less (sharp and memorable).`;
            break;

        default:
            toolPrompt = `Perform a high-level professional evaluation of this resume.
            Return:
            - overall_impression (string): 2-3 professional, high-impact sentences.
            - key_differentiators (string[]): 3 unique things that stand out.
            - suggested_narrative (string): How they should describe themselves in interviews.`;
    }

    const prompt = `
    RESUME DATA FOR ANALYSIS:
    """
    ${resumeText}
    """

    TASK:
    ${toolPrompt}

    EXTRACTION TASK:
    Extract the following accurately:
    - user_fullname: Full name.
    - user_email: Email address found in resume.
    - user_phone: Mobile/Phone number found in resume.
    - user_current_title: Most recent job title.
    - user_top_5_skills: Top 5 technical/soft skills found.

    Final JSON must strictly follow:
    {
        "extracted_stats": { ... extraction task fields ... },
        "tool_result": { ... tool specific result fields ... }
    }
    `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('AI failed to generate content');

    return JSON.parse(content);
}

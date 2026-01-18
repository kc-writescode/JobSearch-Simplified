import * as cheerio from 'cheerio';

export type JobSite = 'linkedin' | 'indeed' | 'glassdoor' | 'jobright' | 'generic';

// Site-specific CSS selectors for job content
const SITE_SELECTORS: Record<JobSite, string[]> = {
  linkedin: [
    '.jobs-description__content',
    '.job-details-jobs-unified-top-card',
    '.jobs-unified-top-card',
    '.description__text',
    '[class*="description"]',
  ],
  indeed: [
    '#jobDescriptionText',
    '.jobsearch-JobComponent',
    '.jobsearch-jobDescriptionText',
    '[class*="jobDescription"]',
  ],
  glassdoor: [
    '.jobDescriptionContent',
    '.desc',
    '[class*="JobDetails"]',
    '[class*="jobDescription"]',
  ],
  jobright: [
    '.job-description',
    '.job-details',
    '.description-container',
    '[class*="jobDescription"]',
    '[class*="job-content"]',
    '[class*="JobDescription"]',
    '[class*="JobDetails"]',
    'main',
  ],
  generic: [
    'main',
    'article',
    '[role="main"]',
    '.job-description',
    '.job-details',
    '#job-description',
    '[class*="description"]',
  ],
};

/**
 * Detect which job site the URL belongs to
 */
export function detectSite(url: string): JobSite {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('indeed.com')) return 'indeed';
  if (urlLower.includes('glassdoor.com')) return 'glassdoor';
  if (urlLower.includes('jobright.ai')) return 'jobright';

  return 'generic';
}

/**
 * Extract job-relevant text from HTML using Cheerio
 */
export function extractJobText(html: string, site: JobSite): string {
  const $ = cheerio.load(html);

  // 1. Try to extract from Next.js data (Jobright and others use this)
  const nextData = $('#__NEXT_DATA__').html();
  if (nextData) {
    try {
      const data = JSON.parse(nextData);
      const jsonText = findLargeTextInJson(data);
      if (jsonText && jsonText.length >= 200) {
        return cleanText(jsonText);
      }
    } catch (e) {
      console.error('Failed to parse __NEXT_DATA__:', e);
    }
  }

  // Remove noise elements
  $('script, style, nav, footer, header, aside, noscript, iframe').remove();
  $('[class*="sidebar"]').remove();
  $('[class*="navigation"]').remove();
  $('[class*="footer"]').remove();
  $('[class*="header"]').remove();
  $('[class*="cookie"]').remove();
  $('[class*="modal"]').remove();
  $('[class*="popup"]').remove();
  $('[class*="advertisement"]').remove();
  $('[class*="related"]').remove();

  // Try site-specific selectors first
  const selectors = SITE_SELECTORS[site] || SITE_SELECTORS.generic;

  for (const selector of selectors) {
    const element = $(selector);
    if (element.length > 0) {
      const text = element.text();
      if (text && text.length >= 100) {
        return cleanText(text);
      }
    }
  }

  // Fallback: try to get the main content area
  let text = $('main').text() || $('article').text() || $('[role="main"]').text();

  if (!text || text.length < 100) {
    // Last resort: get body text
    text = $('body').text();
  }

  return cleanText(text);
}

/**
 * Helper to find large text blocks in a JSON object (likely the job description)
 */
function findLargeTextInJson(obj: any): string | null {
  if (typeof obj === 'string' && obj.length > 300 && (obj.includes('\n') || obj.includes('</') || obj.includes('•'))) {
    return obj;
  }

  if (typeof obj !== 'object' || obj === null) return null;

  // Prioritize keys that likely contain job descriptions
  const priorityKeys = ['description', 'jobDescription', 'content', 'body', 'job_description', 'jobData'];
  for (const key of priorityKeys) {
    if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 200) {
      return obj[key];
    }
    if (obj[key] && typeof obj[key] === 'object') {
      const result = findLargeTextInJson(obj[key]);
      if (result) return result;
    }
  }

  for (const key in obj) {
    // Skip already checked priority keys and common noise
    if (priorityKeys.includes(key)) continue;
    if (['queries', 'mutations', 'assets', 'styles', 'pageProps'].includes(key)) {
      if (key === 'pageProps' && typeof obj[key] === 'object') {
        const result = findLargeTextInJson(obj[key]);
        if (result) return result;
      }
      continue;
    }

    const result = findLargeTextInJson(obj[key]);
    if (result) return result;
  }

  return null;
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim()
    // Limit to 15000 chars to control token usage
    .slice(0, 15000);
}

/**
 * Extract additional metadata from HTML (title, company from meta tags, etc.)
 */
export function extractMetadata(html: string): { title?: string; company?: string; location?: string } {
  const $ = cheerio.load(html);

  // Try to extract from meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const pageTitle = $('title').text();

  // Try to find company from structured data
  const ldJson = $('script[type="application/ld+json"]').first().html();
  let company: string | undefined;
  let location: string | undefined;

  if (ldJson) {
    try {
      const data = JSON.parse(ldJson);
      if (data.hiringOrganization?.name) {
        company = data.hiringOrganization.name;
      }
      if (data.jobLocation?.address) {
        const addr = data.jobLocation.address;
        location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
          .filter(Boolean)
          .join(', ');
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return {
    title: ogTitle || pageTitle || undefined,
    company,
    location,
  };
}

// User agents to rotate for better scraping success
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

export interface FetchResult {
  html: string;
  finalUrl: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isBlocked?: boolean
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Fetch a job page URL with appropriate headers
 * @param url - The URL to fetch
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function fetchJobPage(url: string, timeout = 10000): Promise<FetchResult> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const isBlocked = response.status === 403 || response.status === 401 || response.status === 429;
      throw new FetchError(
        `Failed to fetch page: ${response.status} ${response.statusText}`,
        response.status,
        isBlocked
      );
    }

    const html = await response.text();

    // Check for common blocking indicators
    if (
      html.includes('Please verify you are a human') ||
      html.includes('Enable JavaScript and cookies') ||
      html.includes('Access Denied') ||
      html.includes('robot') && html.includes('verification')
    ) {
      throw new FetchError('Page requires human verification', 403, true);
    }

    return {
      html,
      finalUrl: response.url,
    };
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new FetchError('Request timed out', undefined, false);
      }
      throw new FetchError(error.message);
    }

    throw new FetchError('Unknown fetch error');
  }
}

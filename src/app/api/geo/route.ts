import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        // 1. Try Vercel's built-in geo header (works on Vercel deployment)
        const vercelCountry = request.headers.get('x-vercel-ip-country');
        if (vercelCountry) {
            return NextResponse.json({
                country: vercelCountry,
                isUS: vercelCountry === 'US',
            });
        }

        // 2. Try Cloudflare header
        const cfCountry = request.headers.get('cf-ipcountry');
        if (cfCountry) {
            return NextResponse.json({
                country: cfCountry,
                isUS: cfCountry === 'US',
            });
        }

        // 3. Fallback: use free IP geolocation API
        // Get client IP from headers
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';

        // Skip geolocation for localhost/private IPs (treat as US for dev)
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return NextResponse.json({
                country: 'US',
                isUS: true,
                dev: true,
            });
        }

        // Use ipapi.co (free tier: 1000 requests/day)
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: { 'User-Agent': 'ResumeToJobs/1.0' },
            signal: AbortSignal.timeout(3000),
        });

        if (geoRes.ok) {
            const geoData = await geoRes.json();
            const country = geoData.country_code || geoData.country || 'UNKNOWN';
            return NextResponse.json({
                country,
                isUS: country === 'US',
            });
        }

        // If geolocation fails, default to allowing access (fail-open)
        return NextResponse.json({
            country: 'UNKNOWN',
            isUS: true,
            fallback: true,
        });

    } catch (error) {
        console.error('Geo detection error:', error);
        // Fail-open: allow access if detection fails
        return NextResponse.json({
            country: 'UNKNOWN',
            isUS: true,
            error: true,
        });
    }
}

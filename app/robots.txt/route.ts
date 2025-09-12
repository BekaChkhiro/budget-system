import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // static by default, unless reading the request

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /_next/
Disallow: /*/edit
Disallow: /*/delete
Disallow: /*/settings
Disallow: /*/new

# Sitemap
Sitemap: ${new URL('/sitemap.xml', baseUrl).href}
`
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  })
}

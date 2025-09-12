'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: Record<string, any>[]
    posthog?: any
  }
}

/**
 * Analytics component that handles page views and events
 * Supports Google Analytics and PostHog out of the box
 */
export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  const isDev = process.env.NODE_ENV === 'development'

  // Track page views
  useEffect(() => {
    if (isDev) return
    
    const handleRouteChange = (url: string) => {
      // Google Analytics
      if (window.gtag) {
        window.gtag('config', gaId!, {
          page_path: url,
        })
      }

      // PostHog
      if (window.posthog) {
        window.posthog.capture('$pageview')
      }
    }

    const url = pathname + searchParams.toString()
    handleRouteChange(url)
  }, [pathname, searchParams, gaId, posthogKey, isDev])

  if (isDev) {
    return null
  }

  return (
    <>
      {/* Google Analytics */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* PostHog */}
      {posthogKey && posthogHost && (
        <Script id="posthog-analytics" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},"consent"!==i[0]?u._i.push(i):u._i.push([i[1],s,a])})}}(document,window.posthog||[]);
            posthog.init('${posthogKey}',{api_host:'${posthogHost}'});
          `}
        </Script>
      )}
    </>
  )
}

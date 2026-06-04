# SEO Strategy

## In scope
- Public marketing pages
- Property listings index and property detail pages
- Programme detail pages
- Public AI analysis page (`/outils/analyse-ia`)

## Out of scope
- Authenticated dashboard routes (`/dashboard/**`)
- Buyer-only pages such as favorites and leads
- Admin routes (`/admin/**`)
- Authentication and registration flows unless they create a sitewide crawlability or metadata problem

## Target audience
- Buyers and investors looking for Israeli real estate opportunities
- Real-estate agents and developers using the platform to market programmes and listings

## Primary keywords
- Israeli real estate platform
- Israel property listings
- New development programmes in Israel
- AI real-estate analysis Israel

## Dismissed categories
- (None yet)

## Notes
- Frontend is a Vite + React + wouter SPA deployed as a static app with a catch-all rewrite to `/index.html`.
- Public SEO depends on what is present in the static HTML shell because social bots and AI crawlers do not execute JavaScript.

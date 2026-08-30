import { track } from '@vercel/analytics'

export const trackPromotionEvent = (event: string, properties: Record<string, string>) => {
  track(event, properties)

  const gtag = (window as any).gtag
  if (typeof window !== 'undefined' && gtag) {
    try {
      gtag('event', event, { ...properties })
      if (properties.action_detail) {
        gtag('event', properties.action_detail)
      }
    } catch (error) {
      console.error(error)
    }
  }
}

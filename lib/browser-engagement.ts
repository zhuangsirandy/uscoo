export type AssessmentEventType =
  | 'assessment_started'
  | 'assessment_completed'
  | 'result_viewed'
  | 'save_opened';

const VISITOR_KEY = 'uscoo.visitor.v1';

export function createBrowserId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export function getVisitorId() {
  let visitorId = '';
  try {
    visitorId = window.localStorage.getItem(VISITOR_KEY) || '';
  } catch {
    // A private-browser restriction should not block the public assessment.
  }
  if (!visitorId) {
    visitorId = createBrowserId();
    try {
      window.localStorage.setItem(VISITOR_KEY, visitorId);
    } catch {
      // Keep the in-memory identifier for this page view.
    }
  }
  return visitorId;
}

export async function trackAssessmentEvent(
  eventType: AssessmentEventType,
  language: 'zh' | 'en',
) {
  const params = new URLSearchParams(window.location.search);
  try {
    await fetch('/api/uscoo/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        visitorId: getVisitorId(),
        eventType,
        language,
        referrer: document.referrer.slice(0, 500),
        utmSource: (params.get('utm_source') || '').slice(0, 120),
        utmMedium: (params.get('utm_medium') || '').slice(0, 120),
        utmCampaign: (params.get('utm_campaign') || '').slice(0, 160),
      }),
    });
  } catch {
    // Product analytics must never interrupt the assessment.
  }
}

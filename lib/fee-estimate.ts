export const FEE_SOURCES = {
  base: 'https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-106/section-106.2',
  premium:
    'https://www.federalregister.gov/documents/2026/01/12/2026-00321/adjustment-to-premium-processing-fees',
  consular:
    'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html',
};
export type FeeInput = {
  employer: 'unknown' | 'small' | 'regular' | 'nonprofit';
  premium: boolean;
  route: 'unknown' | 'us' | 'consular';
  services: number;
};
export function estimateFees(input: FeeInput) {
  const small = input.employer === 'small',
    nonprofit = input.employer === 'nonprofit',
    unknown = input.employer === 'unknown';
  const base: [number, number] = unknown
    ? [530, 1055]
    : small || nonprofit
      ? [530, 530]
      : [1055, 1055];
  const asylum: [number, number] = unknown
    ? [0, 600]
    : nonprofit
      ? [0, 0]
      : small
        ? [300, 300]
        : [600, 600];
  const premium: [number, number] = input.premium ? [2965, 2965] : [0, 0];
  const visa: [number, number] =
    input.route === 'unknown'
      ? [0, 205]
      : input.route === 'consular'
        ? [205, 205]
        : [0, 0];
  const government = [0, 1].map(
    (i) => base[i] + asylum[i] + premium[i] + visa[i],
  ) as [number, number];
  const services =
    Number.isFinite(input.services) && input.services >= 0
      ? Math.round(input.services * 100) / 100
      : 0;
  return {
    base,
    asylum,
    premium,
    visa,
    government,
    total: government.map((x) => x + services) as [number, number],
  };
}

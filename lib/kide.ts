import type { KideOrganization } from './kide-organizations';

const KIDE_API_BASE = 'https://api.kide.app/api';

type KideMoney = {
  eur?: number;
};

type KideCompanyEvent = {
  id: string;
  name?: string;
  mediaFilename?: string;
  place?: string;
  dateActualFrom?: string;
  dateActualUntil?: string;
  datePublishFrom?: string;
  datePublishUntil?: string;
  dateSalesFrom?: string;
  dateSalesUntil?: string;
  timeZone?: string;
  minPrice?: KideMoney;
  maxPrice?: KideMoney;
  availability?: number;
  salesStarted?: boolean;
  salesEnded?: boolean;
  salesOngoing?: boolean;
  salesPaused?: boolean;
  favoritedTimes?: number;
};

type KideCompanyResponse = {
  model?: {
    company?: {
      id: string;
      name?: string;
      mediaFilename?: string;
    };
    events?: KideCompanyEvent[];
  };
};

export interface KideEventCard {
  id: string;
  title: string;
  url: string;
  organizationId: string;
  organizationName: string;
  place: string;
  windowLabel: string;
  salesLabel: string;
  priceLabel: string;
  availabilityLabel: string;
  favoritedLabel: string;
  salesState: 'live' | 'upcoming' | 'paused' | 'ended';
  startAt: string | null;
  endAt: string | null;
}

export interface KideOrganizationFeed {
  organization: KideOrganization;
  companyName: string;
  logoUrl: string | null;
  events: KideEventCard[];
  error?: string;
}

function buildLogoUrl(mediaFilename?: string) {
  return mediaFilename
    ? `https://portalvhdsp62n0yt356llm.blob.core.windows.net/bailataan-mediaitems/${mediaFilename}`
    : null;
}

function formatMoney(valueInCents?: number) {
  if (typeof valueInCents !== 'number') {
    return null;
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInCents / 100);
}

function formatDateTime(value: string | undefined, timeZone?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    hour12: false,
  }).format(date);
}

function getSalesState(event: KideCompanyEvent): KideEventCard['salesState'] {
  if (event.salesPaused) {
    return 'paused';
  }

  if (event.salesEnded) {
    return 'ended';
  }

  if (event.salesStarted || event.salesOngoing) {
    return 'live';
  }

  return 'upcoming';
}

function buildPriceLabel(event: KideCompanyEvent) {
  const minimum = formatMoney(event.minPrice?.eur);
  const maximum = formatMoney(event.maxPrice?.eur);

  if (!minimum && !maximum) {
    return 'Free entry';
  }

  if (minimum && maximum && minimum !== maximum) {
    return `${minimum} - ${maximum}`;
  }

  return minimum ?? maximum ?? 'Pricing unavailable';
}

function buildSalesLabel(event: KideCompanyEvent) {
  if (event.salesPaused) {
    return 'Sales paused';
  }

  if (event.salesEnded) {
    return 'Sales ended';
  }

  if (event.salesStarted || event.salesOngoing) {
    return 'Sales live';
  }

  const salesStart = formatDateTime(event.dateSalesFrom, event.timeZone);
  return salesStart ? `Sales open ${salesStart}` : 'Upcoming';
}

function buildWindowLabel(event: KideCompanyEvent) {
  const start = formatDateTime(event.dateActualFrom, event.timeZone);
  const end = formatDateTime(event.dateActualUntil, event.timeZone);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start ?? end ?? 'Date not published';
}

function mapEvent(
  event: KideCompanyEvent,
  organization: KideOrganization,
): KideEventCard {
  return {
    id: event.id,
    title: event.name ?? 'Untitled event',
    url: `https://kide.app/events/${event.id}/details`,
    organizationId: organization.id,
    organizationName: organization.name,
    place: event.place ?? 'Location unavailable',
    windowLabel: buildWindowLabel(event),
    salesLabel: buildSalesLabel(event),
    priceLabel: buildPriceLabel(event),
    availabilityLabel:
      typeof event.availability === 'number'
        ? `${event.availability} available`
        : 'Availability unavailable',
    favoritedLabel:
      typeof event.favoritedTimes === 'number'
        ? `${event.favoritedTimes} saved`
        : 'Not tracked',
    salesState: getSalesState(event),
    startAt: event.dateActualFrom ?? null,
    endAt: event.dateActualUntil ?? null,
  };
}

export async function fetchKideOrganizationFeeds(
  organizations: readonly KideOrganization[],
): Promise<KideOrganizationFeed[]> {
  const responses = await Promise.allSettled(
    organizations.map(async (organization) => {
      const response = await fetch(
        `${KIDE_API_BASE}/companies/${organization.id}`,
        {
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error(
          `Kide responded with ${response.status} for ${organization.name}`,
        );
      }

      const payload = (await response.json()) as KideCompanyResponse;
      const companyName = payload.model?.company?.name ?? organization.name;
      const logoUrl = buildLogoUrl(payload.model?.company?.mediaFilename);
      const events = (payload.model?.events ?? [])
        .map((event) => mapEvent(event, organization))
        .sort((first, second) => {
          const firstTime = first.startAt
            ? new Date(first.startAt).getTime()
            : Number.POSITIVE_INFINITY;
          const secondTime = second.startAt
            ? new Date(second.startAt).getTime()
            : Number.POSITIVE_INFINITY;

          return firstTime - secondTime;
        });

      return {
        organization,
        companyName,
        logoUrl,
        events,
      } satisfies KideOrganizationFeed;
    }),
  );

  return responses.map((response, index) => {
    const organization = organizations[index];

    if (response.status === 'fulfilled') {
      return response.value;
    }

    return {
      organization,
      companyName: organization.name,
      logoUrl: null,
      events: [],
      error:
        response.reason instanceof Error
          ? response.reason.message
          : `Failed to load ${organization.name}`,
    } satisfies KideOrganizationFeed;
  });
}

export function flattenFeeds(feeds: readonly KideOrganizationFeed[]) {
  return feeds.flatMap((feed) => feed.events);
}

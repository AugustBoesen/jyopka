import type { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  sortedKideOrganizationCategories,
  sortedKideOrganizations,
} from '@/lib/kide-organizations';
import { fetchKideOrganizationFeeds, flattenFeeds } from '@/lib/kide';

type EventStatusFilter = 'live' | 'upcoming';

type QueryParams = Record<string, string | string[] | undefined>;

function firstQueryValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

function parseSelectedCategory(searchParams: QueryParams) {
  return firstQueryValue(searchParams.category);
}

function parseSelectedOrganization(searchParams: QueryParams) {
  return firstQueryValue(searchParams.organization);
}

function parseSelectedStatuses(searchParams: QueryParams) {
  const rawValue = searchParams.status;
  const values = Array.isArray(rawValue) ? rawValue : [rawValue];

  return values
    .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
    .map((value) => value.trim())
    .filter(
      (value): value is EventStatusFilter =>
        value === 'live' || value === 'upcoming',
    );
}

function findCategoryForOrganization(organizationId: string) {
  return sortedKideOrganizationCategories.find((category) =>
    category.organizations.some(
      (organization) => organization.id === organizationId,
    ),
  );
}

function buildQueryHref({
  categoryId,
  organizationId,
  statusIds,
}: {
  categoryId?: string | null;
  organizationId?: string | null;
  statusIds?: readonly EventStatusFilter[];
}) {
  const query = new URLSearchParams();

  if (categoryId) {
    query.set('category', categoryId);
  }

  if (organizationId) {
    query.set('organization', organizationId);
  }

  if (statusIds && statusIds.length > 0) {
    query.set('status', statusIds.join(','));
  }

  const queryString = query.toString();
  return queryString ? `/?${queryString}` : '/';
}

function toggleStatusFilter(
  selectedStatuses: readonly EventStatusFilter[],
  status: EventStatusFilter,
) {
  return selectedStatuses.includes(status)
    ? selectedStatuses.filter((value) => value !== status)
    : [...selectedStatuses, status];
}

function getVisibleStatus(state: string): EventStatusFilter | null {
  if (state === 'live') {
    return 'live';
  }

  if (state === 'upcoming') {
    return 'upcoming';
  }

  return null;
}

function getSalesTone(state: string) {
  switch (state) {
    case 'live':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    case 'paused':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    case 'ended':
      return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
    default:
      return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
  }
}

function getSalesStatusLabel(state: string) {
  switch (state) {
    case 'live':
      return 'Open';
    case 'upcoming':
      return 'Upcoming';
    case 'paused':
      return 'Paused';
    case 'ended':
      return 'Ended';
    default:
      return 'Unknown';
  }
}

function getOrganizationLogo(
  feedByOrganizationId: Map<
    string,
    Awaited<ReturnType<typeof fetchKideOrganizationFeeds>>[number]
  >,
  organizationId: string,
) {
  return feedByOrganizationId.get(organizationId)?.logoUrl ?? null;
}

function getOrganizationDisplayName({
  configuredName,
  fetchedName,
}: {
  configuredName: string;
  fetchedName?: string | null;
}) {
  const normalizedFetchedName = fetchedName?.trim();
  return normalizedFetchedName && normalizedFetchedName.length > 0
    ? normalizedFetchedName
    : configuredName;
}

export default async function Home({ searchParams }: PageProps<'/'>) {
  const resolvedSearchParams = await searchParams;
  const selectedCategoryId = parseSelectedCategory(resolvedSearchParams);
  const selectedOrganizationId =
    parseSelectedOrganization(resolvedSearchParams);
  const selectedStatuses = parseSelectedStatuses(resolvedSearchParams);
  const categoryFromOrganization = selectedOrganizationId
    ? findCategoryForOrganization(selectedOrganizationId)?.id ?? null
    : null;
  const activeCategoryId = selectedCategoryId ?? categoryFromOrganization;

  const feeds = await fetchKideOrganizationFeeds(sortedKideOrganizations);
  const feedByOrganizationId = new Map(
    feeds.map((feed) => [feed.organization.id, feed] as const),
  );

  const organizationsInScope = activeCategoryId
    ? sortedKideOrganizationCategories.find(
        (category) => category.id === activeCategoryId,
      )?.organizations ?? []
    : sortedKideOrganizations;

  const sortedOrganizationsInScope = [...organizationsInScope].sort(
    (first, second) => {
      const firstFeed = feedByOrganizationId.get(first.id);
      const secondFeed = feedByOrganizationId.get(second.id);

      const firstName = getOrganizationDisplayName({
        configuredName: first.name,
        fetchedName: firstFeed?.companyName,
      });
      const secondName = getOrganizationDisplayName({
        configuredName: second.name,
        fetchedName: secondFeed?.companyName,
      });

      return firstName.localeCompare(secondName, 'fi', {
        sensitivity: 'base',
      });
    },
  );

  const scopedFeeds = selectedOrganizationId
    ? feeds.filter((feed) => feed.organization.id === selectedOrganizationId)
    : feeds.filter((feed) =>
        organizationsInScope.some(
          (organization) => organization.id === feed.organization.id,
        ),
      );

  const visibleFeeds =
    selectedStatuses.length > 0
      ? scopedFeeds
          .map((feed) => ({
            ...feed,
            events: feed.events.filter((event) => {
              const visibleStatus = getVisibleStatus(event.salesState);
              return visibleStatus
                ? selectedStatuses.includes(visibleStatus)
                : false;
            }),
          }))
          .filter((feed) => feed.events.length > 0)
      : scopedFeeds;

  const visibleEvents = flattenFeeds(visibleFeeds);
  const selectedFeed = selectedOrganizationId
    ? visibleFeeds.find(
        (feed) => feed.organization.id === selectedOrganizationId,
      ) ?? null
    : null;
  const liveCount = visibleEvents.filter(
    (event) => event.salesState === 'live',
  ).length;
  const upcomingCount = visibleEvents.filter(
    (event) => event.salesState === 'upcoming',
  ).length;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-slate-100 sm:px-6 lg:px-8 lg:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.78)_0%,_rgba(2,6,23,0.96)_100%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-green-100">
                Kide.app: online
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Stunite :Ddd
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Tälle sivulle suodattuvat Jyväskylän alueen korkeakoulujen
                  alaisten opiskelijajärjestöjen kide app-tapahtumat. Voit hakea
                  tapahtumia korkeakoulun, järjestön sekä saatavuuden mukaan.
                  Sivu on epävirallinen eikä ole osa Treanglo Oy:n tai
                  Kide.appin virallista palvelua.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
              <StatCard
                label="Tapahtumia näkyvillä"
                value={visibleEvents.length.toString()}
              />
              <StatCard label="Myynnissä nyt" value={liveCount.toString()} />
              <StatCard label="Tulossa" value={upcomingCount.toString()} />
            </div>
          </div>
        </section>

        <CollapsibleFilterSection
          title="Korkeakoulut"
          description="Voit suodattaa tapahtumia ja järjestöjä korkeakoulun mukaan."
        >
          <FilterChip
            href={buildQueryHref({ statusIds: selectedStatuses })}
            active={!activeCategoryId}
          >
            Kaikki
          </FilterChip>

          {sortedKideOrganizationCategories.map((category) => (
            <FilterChip
              key={category.id}
              href={buildQueryHref({
                categoryId: category.id,
                statusIds: selectedStatuses,
              })}
              active={activeCategoryId === category.id}
            >
              {category.name}
            </FilterChip>
          ))}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection
          title="Aine- ja koulutusalajärjestöt"
          description="Valitse järjestö tarkastellaksesi vain sen tapahtumia."
        >
          <FilterChip
            href={buildQueryHref({
              categoryId: activeCategoryId,
              statusIds: selectedStatuses,
            })}
            active={!selectedOrganizationId}
          >
            All organizations
          </FilterChip>

          {sortedOrganizationsInScope.map((organization) => {
            const feed = feedByOrganizationId.get(organization.id);
            const logoUrl = getOrganizationLogo(
              feedByOrganizationId,
              organization.id,
            );
            const displayName = getOrganizationDisplayName({
              configuredName: organization.name,
              fetchedName: feed?.companyName,
            });

            return (
              <FilterChip
                key={organization.id}
                href={buildQueryHref({
                  categoryId:
                    findCategoryForOrganization(organization.id)?.id ??
                    activeCategoryId,
                  organizationId: organization.id,
                  statusIds: selectedStatuses,
                })}
                active={selectedOrganizationId === organization.id}
              >
                <OrganizationMark
                  name={displayName}
                  logoUrl={logoUrl}
                  compact
                />
              </FilterChip>
            );
          })}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection
          title="Status"
          description="Voit erikseen valita tapahtumat, jotka ovat myynnissä tai tulevat myyntiin."
        >
          <FilterChip
            href={buildQueryHref({
              categoryId: activeCategoryId,
              organizationId: selectedOrganizationId,
            })}
            active={selectedStatuses.length === 0}
          >
            Kaikki tapahtumat
          </FilterChip>

          {(['live', 'upcoming'] as const).map((status) => {
            const nextStatuses = toggleStatusFilter(selectedStatuses, status);

            return (
              <FilterChip
                key={status}
                href={buildQueryHref({
                  categoryId: activeCategoryId,
                  organizationId: selectedOrganizationId,
                  statusIds: nextStatuses,
                })}
                active={selectedStatuses.includes(status)}
              >
                {status === 'live' ? 'Myynnissä nyt' : 'Tulossa'}
              </FilterChip>
            );
          })}
        </CollapsibleFilterSection>

        <div className="space-y-6">
          {selectedFeed ? (
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/30 backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <OrganizationMark
                    name={selectedFeed.companyName}
                    logoUrl={selectedFeed.logoUrl}
                  />
                  {selectedFeed.organization.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      {selectedFeed.organization.description}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm text-slate-400">
                  {selectedFeed.events.length} event
                  {selectedFeed.events.length === 1 ? '' : 's'}
                </div>
              </div>

              {selectedFeed.error ? (
                <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                  {selectedFeed.error}
                </div>
              ) : selectedFeed.events.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-slate-300">
                  No public events found for this organization.
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-4">
                  {selectedFeed.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          ) : visibleFeeds.length > 0 ? (
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/30 backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Kaikki tapahtumat
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Järjestö näkyy jokaisessa tapahtumakortissa, joten usean
                    järjestön näkymä on koottu yhdeksi listaksi.
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  {visibleEvents.length} event
                  {visibleEvents.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {visibleEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}

          {visibleFeeds.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-10 text-center text-slate-300 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
              No organizations or events match the current filters.
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function EventCard({
  event,
}: {
  event: Awaited<
    ReturnType<typeof fetchKideOrganizationFeeds>
  >[number]['events'][number];
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition duration-300 hover:border-white/20 hover:bg-slate-900/90">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
            {event.organizationName}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-tight text-white">
            {event.title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getSalesTone(
            event.salesState,
          )}`}
        >
          {getSalesStatusLabel(event.salesState)}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="text-slate-400">{event.salesLabel}</span>
        <a
          href={event.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 font-medium text-amber-100 transition hover:border-amber-300/40 hover:bg-amber-400/20"
        >
          Open on Kide
        </a>
      </div>

      <details className="group/details rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-slate-200 marker:hidden">
          <span className="group-open/details:hidden">Show details</span>
          <span className="hidden group-open/details:inline">Hide details</span>
        </summary>

        <dl className="mt-4 space-y-3 text-sm text-slate-300">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-400">Date</dt>
            <dd className="text-right font-medium text-slate-100">
              {event.windowLabel}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-400">Location</dt>
            <dd className="text-right font-medium text-slate-100">
              {event.place}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-400">Price</dt>
            <dd className="text-right font-medium text-slate-100">
              {event.priceLabel}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-400">Availability</dt>
            <dd className="text-right font-medium text-slate-100">
              {event.availabilityLabel}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-400">Interest</dt>
            <dd className="text-right font-medium text-slate-100">
              {event.favoritedLabel}
            </dd>
          </div>
        </dl>
      </details>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-left shadow-lg shadow-slate-950/20">
      <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-amber-300/40 bg-amber-400/15 text-amber-50 shadow-lg shadow-amber-950/20'
          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </Link>
  );
}

function CollapsibleFilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details
      open
      className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 shadow-xl shadow-slate-950/30 backdrop-blur-xl sm:p-6"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 marker:hidden">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-sm text-slate-300">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
          Toggle
        </span>
      </summary>

      <div className="mt-4 flex flex-wrap gap-3">{children}</div>
    </details>
  );
}

function OrganizationMark({
  name,
  logoUrl,
  compact = false,
}: {
  name: string;
  logoUrl: string | null;
  compact?: boolean;
}) {
  const sizeClass = compact ? 'h-8 w-8' : 'h-11 w-11';
  const fallbackLetters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`flex min-w-0 items-center gap-3 ${compact ? '' : 'mb-1'}`}>
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${sizeClass}`}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/10 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-200">
            {fallbackLetters || '??'}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`truncate font-semibold text-white ${
            compact ? 'text-sm' : 'text-2xl'
          }`}
        >
          {name}
        </p>
      </div>
    </div>
  );
}

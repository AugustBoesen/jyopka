import type { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { EventCalendar } from '@/app/components/EventCalendar';
import {
  sortedKideOrganizationCategories,
  sortedKideOrganizations,
} from '@/lib/kide-organizations';
import {
  fetchKideOrganizationFeeds,
  flattenFeeds,
  type KideEventCard,
} from '@/lib/kide';

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

function parseSearchQuery(searchParams: QueryParams) {
  return firstQueryValue(searchParams.q);
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
  searchQuery,
}: {
  categoryId?: string | null;
  organizationId?: string | null;
  statusIds?: readonly EventStatusFilter[];
  searchQuery?: string | null;
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

  if (searchQuery) {
    query.set('q', searchQuery);
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

function matchesSearchQuery(event: KideEventCard, normalizedQuery: string) {
  const haystack = `${event.title} ${event.organizationName} ${event.place}`
    .trim()
    .toLowerCase();

  return haystack.includes(normalizedQuery);
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
  const selectedSearchQuery = parseSearchQuery(resolvedSearchParams);
  const normalizedSearchQuery = selectedSearchQuery?.toLowerCase() ?? null;
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

  const sortedAllOrganizations = [...sortedKideOrganizations].sort(
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
    selectedStatuses.length > 0 || normalizedSearchQuery
      ? scopedFeeds
          .map((feed) => ({
            ...feed,
            events: feed.events.filter((event) => {
              const visibleStatus = getVisibleStatus(event.salesState);
              const matchesStatus =
                selectedStatuses.length > 0
                  ? visibleStatus
                    ? selectedStatuses.includes(visibleStatus)
                    : false
                  : true;
              const matchesSearch = normalizedSearchQuery
                ? matchesSearchQuery(event, normalizedSearchQuery)
                : true;

              return matchesStatus && matchesSearch;
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

  const activeFilterCount =
    (activeCategoryId ? 1 : 0) +
    (selectedOrganizationId ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-3 text-slate-100 sm:px-6 lg:px-8 lg:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.78)_0%,_rgba(2,6,23,0.96)_100%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap justify-evenly w-full items-center gap-2 -mb-2.5 z-40">
            <NavMenu
              label={
                <>
                  <FilterIcon />
                  <span className="sr-only">Suodattimet</span>
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400/30 px-1 text-[0.65rem] font-semibold text-amber-50">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </>
              }
            >
              <FilterGroup label="Korkeakoulut">
                <FilterChip
                  href={buildQueryHref({
                    statusIds: selectedStatuses,
                    searchQuery: selectedSearchQuery,
                  })}
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
                      searchQuery: selectedSearchQuery,
                    })}
                    active={activeCategoryId === category.id}
                  >
                    {category.name}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Aine- ja koulutusalajärjestöt">
                <FilterChip
                  href={buildQueryHref({
                    categoryId: activeCategoryId,
                    statusIds: selectedStatuses,
                    searchQuery: selectedSearchQuery,
                  })}
                  active={!selectedOrganizationId}
                >
                  Kaikki järjestöt
                </FilterChip>

                {sortedAllOrganizations.map((organization) => {
                  const feed = feedByOrganizationId.get(organization.id);
                  const logoUrl = getOrganizationLogo(
                    feedByOrganizationId,
                    organization.id,
                  );
                  const displayName = getOrganizationDisplayName({
                    configuredName: organization.name,
                    fetchedName: feed?.companyName,
                  });
                  const belongsToActiveCategory =
                    !activeCategoryId ||
                    organizationsInScope.some(
                      (scoped) => scoped.id === organization.id,
                    );
                  const isSelected = selectedOrganizationId === organization.id;

                  return (
                    <FilterChip
                      key={organization.id}
                      href={buildQueryHref({
                        categoryId:
                          findCategoryForOrganization(organization.id)?.id ??
                          activeCategoryId,
                        organizationId: organization.id,
                        statusIds: selectedStatuses,
                        searchQuery: selectedSearchQuery,
                      })}
                      active={isSelected}
                      muted={!belongsToActiveCategory}
                      highlighted={
                        Boolean(activeCategoryId) &&
                        belongsToActiveCategory &&
                        !isSelected
                      }
                    >
                      <OrganizationMark
                        name={displayName}
                        logoUrl={logoUrl}
                        compact
                      />
                    </FilterChip>
                  );
                })}
              </FilterGroup>

              <FilterGroup label="Tila">
                <FilterChip
                  href={buildQueryHref({
                    categoryId: activeCategoryId,
                    organizationId: selectedOrganizationId,
                    searchQuery: selectedSearchQuery,
                  })}
                  active={selectedStatuses.length === 0}
                >
                  Kaikki tapahtumat
                </FilterChip>

                {(['live', 'upcoming'] as const).map((status) => {
                  const nextStatuses = toggleStatusFilter(
                    selectedStatuses,
                    status,
                  );

                  return (
                    <FilterChip
                      key={status}
                      href={buildQueryHref({
                        categoryId: activeCategoryId,
                        organizationId: selectedOrganizationId,
                        statusIds: nextStatuses,
                        searchQuery: selectedSearchQuery,
                      })}
                      active={selectedStatuses.includes(status)}
                    >
                      {status === 'live' ? 'Myynnissä nyt' : 'Tulossa'}
                    </FilterChip>
                  );
                })}
              </FilterGroup>
            </NavMenu>

            <NavMenu
              label={
                <>
                  <SearchIcon />
                  <span className="sr-only">Haku</span>
                  {selectedSearchQuery ? (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-amber-300"
                    />
                  ) : null}
                </>
              }
            >
              <form
                action="/"
                method="get"
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                {activeCategoryId ? (
                  <input
                    type="hidden"
                    name="category"
                    value={activeCategoryId}
                  />
                ) : null}
                {selectedOrganizationId ? (
                  <input
                    type="hidden"
                    name="organization"
                    value={selectedOrganizationId}
                  />
                ) : null}
                {selectedStatuses.length > 0 ? (
                  <input
                    type="hidden"
                    name="status"
                    value={selectedStatuses.join(',')}
                  />
                ) : null}

                <label htmlFor="event-search" className="sr-only">
                  Hae tapahtumia
                </label>
                <input
                  id="event-search"
                  type="search"
                  name="q"
                  defaultValue={selectedSearchQuery ?? ''}
                  placeholder="Etsitkö jotain tiettyä?"
                  className="w-full rounded-full border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-300/30"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:border-amber-300/60 hover:bg-amber-400/25"
                  >
                    Hae
                  </button>
                  {selectedSearchQuery ? (
                    <Link
                      href={buildQueryHref({
                        categoryId: activeCategoryId,
                        organizationId: selectedOrganizationId,
                        statusIds: selectedStatuses,
                      })}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      Tyhjennä
                    </Link>
                  ) : null}
                </div>
              </form>
            </NavMenu>

            <NavMenu
              label={
                <>
                  <span aria-hidden="true" className="text-sm font-bold">
                    ?
                  </span>
                  <span className="sr-only">Tietoa sivustosta</span>
                </>
              }
            >
              <div className="space-y-3 text-sm leading-6 text-slate-300">
                <b>Mikä tämä on?</b>
                <p>
                  Tälle sivulle suodattuvat Jyväskylän alueen korkeakoulujen
                  alaisten opiskelijajärjestöjen kide app-tapahtumat, jotta
                  niiden tarkastelu olisi helpompaa. Voit hakea tapahtumia
                  korkeakoulun, järjestön sekä saatavuuden mukaan.
                </p>
                <b>Miksi tapahtuma ei näy täällä?</b>
                <p>
                  Haku tapahtuu automaattisesti kide appin kautta. Jos tapahtuma
                  ei näy täällä, se todennäköisesti ei ole kide appissa
                  saatavilla.
                </p>
                <b>Tekninen huomio</b>
                <p>
                  Sivu on epävirallinen yksittäisen henkilön vapaa-ajan projekti
                  eikä ole osa Treanglo Oy:n / Kide.appin virallista palvelua.
                </p>
                <p>
                  Jos tästä oli sinulle hyötyä, suosittele sivustoa myös muille.
                </p>
                <b>Tukekaa järjestötoimintaa osallistumalla tapahtumiin!</b>
              </div>
            </NavMenu>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-xl shadow-slate-950/30 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            {selectedFeed ? (
              <OrganizationMark
                name={selectedFeed.companyName}
                logoUrl={selectedFeed.logoUrl}
                compact
              />
            ) : (
              <h2 className="text-lg font-semibold text-white">
                JKL korkeakoulujärjestöjen tapahtumat
              </h2>
            )}
            <div className="text-sm text-slate-400">
              {visibleEvents.length}{' '}
              {visibleEvents.length === 1 ? 'tapahtuma' : 'tapahtumaa'}
            </div>
          </div>

          {selectedFeed?.error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {selectedFeed.error}
            </div>
          ) : visibleEvents.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-300">
              Nykyisillä suodattimilla ei löytynyt järjestöjä tai tapahtumia.
            </div>
          ) : (
            <div className="mt-5">
              <EventCalendar events={visibleEvents} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  muted = false,
  highlighted = false,
  children,
}: {
  href: string;
  active: boolean;
  muted?: boolean;
  highlighted?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-amber-300/40 bg-amber-400/15 text-amber-50 shadow-lg shadow-amber-950/20'
          : muted
          ? 'border-white/5 bg-white/[0.015] text-slate-500 hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-300'
          : highlighted
          ? 'border-sky-400/30 bg-sky-400/10 text-sky-100 hover:border-sky-300/50 hover:bg-sky-400/20'
          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </Link>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function NavMenu({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <details name="toolbar-menu" className="group relative">
      <summary className="relative z-30 flex h-[34px] w-[50px] shrink-0 cursor-pointer list-none items-center justify-center rounded-t-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-200 transition marker:hidden hover:border-white/20 hover:bg-white/[0.08] group-open:border-amber-300/40 group-open:bg-amber-400/15 group-open:text-amber-50">
        <span className="group-open:hidden">{label}</span>
        <span
          className="hidden group-open:inline-flex"
          aria-label="Sulje valikko"
        >
          <CloseIcon />
        </span>
      </summary>

      <div
        aria-hidden="true"
        className="nav-backdrop pointer-events-none fixed inset-0 z-20 bg-slate-950/35 backdrop-blur-md"
      />
      <div className="nav-popup fixed inset-x-4 top-12 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-xl lg:absolute lg:left-1/2 lg:right-auto lg:top-full lg:mt-3 lg:w-[min(92vw,26rem)]">
        {children}
      </div>
    </details>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 4h14M6 10h8M9 16h2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M17 17l-4.35-4.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
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

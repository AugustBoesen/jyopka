import type { KideEventCard } from '@/lib/kide';

export function getSalesTone(state: string) {
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

export function getSalesStatusLabel(state: string) {
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

export function EventCard({ event }: { event: KideEventCard }) {
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
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

      <dl className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
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
      </dl>
    </article>
  );
}

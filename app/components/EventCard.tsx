import type { KideEventCard } from '@/lib/kide';

export function getSalesTone(state: string) {
  switch (state) {
    case 'live':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    case 'sold-out':
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
      return 'Avoinna';
    case 'sold-out':
      return 'Loppuunmyyty';
    case 'upcoming':
      return 'Tulossa';
    case 'paused':
      return 'Keskeytetty';
    case 'ended':
      return 'Päättynyt';
    default:
      return 'Tuntematon';
  }
}

function formatPlace(place: string) {
  return place.length > 18 ? `${place.slice(0, 18)}...` : place;
}

export function EventCard({ event }: { event: KideEventCard }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition duration-300 hover:border-white/20 hover:bg-slate-900/90">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
            {event.organizationName}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold leading-tight text-white">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getSalesTone(
              event.salesState,
            )}`}
          >
            {getSalesStatusLabel(event.salesState)}
          </span>
          {event.salesLabel ? (
            <span className="text-xs text-slate-400">{event.salesLabel}</span>
          ) : null}
        </div>
        <a
          href={event.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-300/40 hover:bg-amber-400/20"
        >
          Avaa Kidessä
        </a>
      </div>

      <dl className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-slate-400">Päivämäärä</dt>
          <dd className="text-right font-medium text-slate-100">
            {event.windowLabel}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-slate-400">Sijainti</dt>
          <dd
            className="text-right font-medium text-slate-100"
            title={event.place}
          >
            {formatPlace(event.place)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-slate-400">Hinta</dt>
          <dd className="text-right font-medium text-slate-100">
            {event.priceLabel}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-slate-400">Saatavuus</dt>
          <dd className="text-right font-medium text-slate-100">
            {event.availabilityLabel}
          </dd>
        </div>
      </dl>
    </article>
  );
}

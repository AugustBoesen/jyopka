'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Image from 'next/image';

import type { KideEventCard } from '@/lib/kide';

import { EventCard, getSalesTone } from './EventCard';

const WEEKDAY_LABELS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

function getOrganizationInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '??'
  );
}

// Pinned so the "today" boundary is identical on the server and every
// visitor's device, regardless of each one's own system time zone.
const CALENDAR_TIME_ZONE = 'Europe/Helsinki';

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: CALENDAR_TIME_ZONE,
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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

/** Builds a 6-week (42 day) Monday-first grid covering the given month. */
function buildMonthGrid(monthStart: Date) {
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

/** Splits the flat 42-day grid into 6 week-long (7-day) rows. */
function buildMonthWeeks(monthStart: Date) {
  const days = buildMonthGrid(monthStart);
  const weeks: Date[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

export function EventCalendar({ events }: { events: KideEventCard[] }) {
  const eventsByDay = useMemo(() => {
    const map = new Map<string, KideEventCard[]>();

    for (const event of events) {
      if (!event.dateKey) {
        continue;
      }

      const list = map.get(event.dateKey) ?? [];
      list.push(event);
      map.set(event.dateKey, list);
    }

    return map;
  }, [events]);

  const unscheduledEvents = useMemo(
    () => events.filter((event) => !event.dateKey),
    [events],
  );

  const initialMonth = useMemo(() => {
    const today = new Date();
    const todayKey = toDateKey(today);

    if (eventsByDay.size === 0 || eventsByDay.has(todayKey)) {
      return startOfMonth(today);
    }

    const sortedKeys = [...eventsByDay.keys()].sort();
    const nextKey = sortedKeys.find((key) => key >= todayKey) ?? sortedKeys[0];
    const [year, month] = nextKey.split('-').map(Number);

    return new Date(year, month - 1, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);
  const [modalDayKey, setModalDayKey] = useState<string | null>(null);

  const weeks = useMemo(() => buildMonthWeeks(visibleMonth), [visibleMonth]);
  const todayKey = toDateKey(new Date());
  const monthLabel = new Intl.DateTimeFormat('fi-FI', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const selectedEvents = modalDayKey ? eventsByDay.get(modalDayKey) ?? [] : [];
  const isModalOpen = openDayKey !== null;

  function openDay(dateKey: string) {
    setModalDayKey(dateKey);
    setOpenDayKey(dateKey);
  }

  function closeModal() {
    setOpenDayKey(null);
  }

  function goToMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
    closeModal();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold capitalize text-white">
          {monthLabel}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Edellinen kuukausi"
            className="touch-manipulation rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth(startOfMonth(new Date()))}
            className="touch-manipulation rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            Tänään
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Seuraava kuukausi"
            className="touch-manipulation rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week) => (
          <div
            key={week[0].toISOString()}
            className="grid h-[4.25rem] grid-cols-7 gap-1 sm:h-[5.5rem] lg:h-[7rem]"
          >
            {week.map((date) => {
              const dateKey = toDateKey(date);
              const dayEvents = eventsByDay.get(dateKey) ?? [];
              const isCurrentMonth =
                date.getMonth() === visibleMonth.getMonth();
              const isToday = dateKey === todayKey;
              const isPast = dateKey < todayKey;
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => hasEvents && openDay(dateKey)}
                  disabled={!hasEvents}
                  className={`flex h-full touch-manipulation flex-col items-start gap-1 overflow-hidden rounded-xl border p-2 text-left transition ${
                    isToday
                      ? 'border-amber-300/50 bg-amber-400/10 ring-1 ring-amber-300/40'
                      : isCurrentMonth
                      ? isPast
                        ? 'border-white/5 bg-slate-950/40'
                        : 'border-white/10 bg-white/[0.03]'
                      : 'border-white/5 bg-transparent text-slate-500'
                  } ${
                    hasEvents
                      ? 'cursor-pointer hover:border-amber-300/40 hover:bg-amber-400/10'
                      : 'cursor-default'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? 'rounded-full bg-amber-400/20 px-1.5 py-0.5 text-amber-100'
                        : isCurrentMonth
                        ? isPast
                          ? 'text-slate-500'
                          : 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  <div className="flex w-full flex-1 flex-col items-center justify-center gap-0.5 sm:flex-row sm:items-center sm:justify-start sm:gap-1">
                    {dayEvents.slice(0, 1).map((event) => (
                      <span
                        key={event.id}
                        className="flex min-w-5 items-center gap-1 overflow-hidden text-left text-[0.65rem] sm:min-w-0 sm:flex-1"
                      >
                        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 sm:hidden">
                          {event.organizationLogoUrl ? (
                            <Image
                              src={event.organizationLogoUrl}
                              alt={event.organizationName}
                              fill
                              className="object-cover"
                              sizes="20px"
                            />
                          ) : (
                            <span className="text-[0.5rem] font-semibold text-slate-200">
                              {getOrganizationInitials(event.organizationName)}
                            </span>
                          )}
                        </span>
                        <span
                          className={`hidden truncate rounded-md border px-1.5 py-0.5 sm:inline ${getSalesTone(
                            event.salesState,
                          )}`}
                        >
                          {event.title}
                        </span>
                      </span>
                    ))}
                    {dayEvents.length > 1 ? (
                      <span className="shrink-0 text-[0.65rem] text-slate-400">
                        +{dayEvents.length - 1}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {unscheduledEvents.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
          {unscheduledEvents.length} tapahtuma
          {unscheduledEvents.length === 1 ? '' : 'a'} ilman julkaistua
          päivämäärää.
        </div>
      ) : null}

      {modalDayKey
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              className={`day-modal fixed inset-0 z-50 flex items-start justify-center pt-12 lg:pt-[5.25rem] ${
                isModalOpen ? 'is-open' : ''
              }`}
              onClick={closeModal}
            >
              <div
                aria-hidden="true"
                className="day-modal-backdrop absolute inset-0 bg-slate-950/30 backdrop-blur-xl"
              />
              <div
                className={`day-modal-panel relative z-10 max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 mx-2 shadow-2xl lg:max-h-[calc(100vh-5.25rem)] ${
                  isModalOpen ? 'is-open' : ''
                }`}
                onClick={(event) => event.stopPropagation()}
                onTransitionEnd={(event) => {
                  if (event.target !== event.currentTarget) {
                    return;
                  }

                  if (!isModalOpen) {
                    setModalDayKey(null);
                  }
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="text-xl font-semibold capitalize text-white">
                    {new Intl.DateTimeFormat('fi-FI', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(`${modalDayKey}T00:00:00`))}
                  </h4>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Sulje"
                    title="Sulje"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="flex flex-col gap-4 z-50">
                  {selectedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

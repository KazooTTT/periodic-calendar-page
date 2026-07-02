export const VIEW_TYPE_PERIODIC_CALENDAR = 'periodic-calendar-page';

/** Lucide icon — distinct from Periodic Notes' calendar-day/week/month ribbons */
export const PERIODIC_CALENDAR_ICON = 'calendar-range';

export const DEFAULT_FORMATS = {
	daily: 'YYYY-MM-DD',
	weekly: 'gggg-[W]ww',
	monthly: 'YYYY-MM',
	quarterly: 'YYYY-[Q]Q',
	yearly: 'YYYY',
} as const;

export const PERIODICITY_LABELS = {
	daily: '日记',
	weekly: '周报',
	monthly: '月报',
	quarterly: '季报',
	yearly: '年报',
} as const;
import type { Moment } from 'moment';
import type { IndexedNotes, Periodicity } from '../types';

const GRANULARITY_UNIT: Record<Periodicity, 'day' | 'week' | 'month' | 'quarter' | 'year'> = {
	daily: 'day',
	weekly: 'week',
	monthly: 'month',
	quarterly: 'quarter',
	yearly: 'year',
};

const UID_PREFIX: Record<Periodicity, string> = {
	daily: 'day',
	weekly: 'week',
	monthly: 'month',
	quarterly: 'quarter',
	yearly: 'year',
};

export function getMoment(): Moment {
	return window.moment();
}

/** 与 Periodic Notes / Calendar 插件一致的 dateUID */
export function getDateUid(date: Moment, periodicity: Periodicity): string {
	const unit = GRANULARITY_UNIT[periodicity];
	const prefix = UID_PREFIX[periodicity];
	const ts = date.clone().startOf(unit).format();
	return `${prefix}-${ts}`;
}

export function parseMomentFromUid(
	uid: string,
	periodicity: Periodicity,
): Moment | null {
	const prefix = `${UID_PREFIX[periodicity]}-`;
	if (!uid.startsWith(prefix)) {
		return null;
	}
	const parsed = window.moment(uid.slice(prefix.length));
	return parsed.isValid() ? parsed : null;
}

export function isLastDayOfMonth(date: Moment): boolean {
	return date.date() === date.clone().endOf('month').date();
}

export function isLastDayOfQuarter(date: Moment): boolean {
	return date.isSame(date.clone().endOf('quarter'), 'day');
}

export function isLastDayOfYear(date: Moment): boolean {
	return date.month() === 11 && date.date() === 31;
}

export function formatDailyRange(date: Moment): string {
	return date.format('YYYY-MM-DD');
}

export function formatWeeklyRange(date: Moment): string {
	const start = date.clone().startOf('isoWeek');
	const end = date.clone().endOf('isoWeek');
	return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`;
}

export function formatMonthlyRange(date: Moment): string {
	const start = date.clone().startOf('month');
	const end = date.clone().endOf('month');
	return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`;
}

export function formatQuarterlyRange(date: Moment): string {
	const start = date.clone().startOf('quarter');
	const end = date.clone().endOf('quarter');
	return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`;
}

export function formatYearlyRange(date: Moment): string {
	const start = date.clone().startOf('year');
	const end = date.clone().endOf('year');
	return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`;
}

export function formatPeriodRange(
	date: Moment,
	periodicity: 'monthly' | 'quarterly',
): string {
	return periodicity === 'monthly'
		? formatMonthlyRange(date)
		: formatQuarterlyRange(date);
}

export function formatDetailRange(date: Moment, periodicity: Periodicity): string {
	switch (periodicity) {
		case 'daily':
			return formatDailyRange(date);
		case 'weekly':
			return formatWeeklyRange(date);
		case 'monthly':
			return formatMonthlyRange(date);
		case 'quarterly':
			return formatQuarterlyRange(date);
		case 'yearly':
			return formatYearlyRange(date);
	}
}

export const YEARS_PER_PAGE = 12;

export function getYearsPageStart(year: number): number {
	return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

export function formatYearsPageTitle(startYear: number): string {
	const endYear = startYear + YEARS_PER_PAGE - 1;
	return `${startYear}-${endYear}年`;
}

export function getQuarterEndForYear(
	year: number,
	quarterIndex: number,
): Moment {
	return window.moment().year(year).quarter(quarterIndex + 1).endOf('quarter');
}

export function countDailyNotesInMonth(
	notes: IndexedNotes,
	month: Moment,
): number {
	const start = month.clone().startOf('month');
	const end = month.clone().endOf('month');
	let count = 0;
	const cursor = start.clone();
	while (cursor.isSameOrBefore(end, 'day')) {
		if (notes.daily[getDateUid(cursor, 'daily')]) {
			count++;
		}
		cursor.add(1, 'day');
	}
	return count;
}

export function buildMonthGrid(displayMonth: Moment): Moment[][] {
	const start = displayMonth.clone().startOf('month').startOf('isoWeek');
	const end = displayMonth.clone().endOf('month').endOf('isoWeek');
	const weeks: Moment[][] = [];
	let cursor = start.clone();

	while (cursor.isSameOrBefore(end, 'day')) {
		const week: Moment[] = [];
		for (let i = 0; i < 7; i++) {
			week.push(cursor.clone());
			cursor.add(1, 'day');
		}
		weeks.push(week);
	}

	return weeks;
}
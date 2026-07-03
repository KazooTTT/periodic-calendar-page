import type { Moment } from 'moment';
import type { MetadataCache } from 'obsidian';
import type { TFile } from 'obsidian';
import type { Periodicity } from '../types';

const CHINESE_WEEKLY_RE =
	/^(\d{4})年(\d{1,2})月第\d+周（(\d{2})\.(\d{2})[–-](\d{2})\.(\d{2})）$/;

const CHINESE_MONTHLY_RE = /^(\d{4})年(\d{1,2})月月报$/;

const CHINESE_QUARTERLY_RE =
	/^(\d{4})年(?:(?:第)?([1-4])季度|Q([1-4]))(?:季报)?$/i;

const CHINESE_YEARLY_RE = /^(\d{4})年度总结$/;

const ALT_FILENAME_RES: Record<Periodicity, RegExp | null> = {
	daily: /^(\d{4})-(\d{2})-(\d{2})$/,
	weekly: /^(\d{4})-W(\d{1,2})$/i,
	monthly: /^(\d{4})-(\d{2})$/,
	quarterly: /^(\d{4})-Q([1-4])$/i,
	yearly: /^(\d{4})年度总结$/,
};

type StartOfUnit = 'day' | 'isoWeek' | 'month' | 'quarter' | 'year';

const PERIOD_START: Record<Periodicity, StartOfUnit> = {
	daily: 'day',
	weekly: 'isoWeek',
	monthly: 'month',
	quarterly: 'quarter',
	yearly: 'year',
};

function removeEscapedCharacters(format: string): string {
	return format.replace(/\\./g, '');
}

function isFormatAmbiguous(format: string, granularity: Periodicity): boolean {
	if (granularity === 'weekly') {
		const clean = removeEscapedCharacters(format);
		return (
			/w{1,2}/i.test(clean) &&
			(/M{1,4}/.test(clean) || /D{1,4}/.test(clean))
		);
	}
	return false;
}

function normalizePeriodStart(date: Moment, periodicity: Periodicity): Moment {
	return date.clone().startOf(PERIOD_START[periodicity]);
}

export function parseDateFromFilename(
	filename: string,
	format: string,
	granularity: Periodicity,
): Moment | null {
	const basename = filename.replace(/\.md$/i, '');
	const segment = format.split('/').pop() ?? format;
	const moment = window.moment;
	let noteDate = moment(basename, segment, true);

	if (!noteDate.isValid()) {
		return null;
	}

	if (granularity === 'weekly' && isFormatAmbiguous(segment, granularity)) {
		const clean = removeEscapedCharacters(segment);
		if (/w{1,2}/i.test(clean)) {
			noteDate = moment(
				basename,
				segment.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
				false,
			);
		}
	}

	return noteDate.isValid() ? noteDate : null;
}

export function parseChineseWeeklyTitle(basename: string): Moment | null {
	const match = CHINESE_WEEKLY_RE.exec(basename);
	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const endMonth = Number(match[2]);
	const endDay = Number(match[6]);
	const sunday = window.moment(
		`${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
		'YYYY-MM-DD',
		true,
	);

	if (!sunday.isValid()) {
		return null;
	}

	return normalizePeriodStart(sunday, 'weekly');
}

function parseChineseTitle(
	basename: string,
	periodicity: Periodicity,
): Moment | null {
	const moment = window.moment;

	switch (periodicity) {
		case 'weekly':
			return parseChineseWeeklyTitle(basename);
		case 'monthly': {
			const match = CHINESE_MONTHLY_RE.exec(basename);
			if (!match) {
				return null;
			}
			const parsed = moment(
				`${match[1]}-${String(match[2]).padStart(2, '0')}`,
				'YYYY-MM',
				true,
			);
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'quarterly': {
			const match = CHINESE_QUARTERLY_RE.exec(basename);
			if (!match) {
				return null;
			}
			const year = Number(match[1]);
			const quarter = Number(match[2] ?? match[3]);
			const parsed = moment().year(year).quarter(quarter);
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'yearly': {
			const match = CHINESE_YEARLY_RE.exec(basename);
			if (!match) {
				return null;
			}
			const parsed = moment().year(Number(match[1]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		default:
			return null;
	}
}

function parseAlternateFilename(
	basename: string,
	periodicity: Periodicity,
): Moment | null {
	const re = ALT_FILENAME_RES[periodicity];
	if (!re) {
		return null;
	}

	const match = re.exec(basename);
	if (!match) {
		return null;
	}

	const moment = window.moment;

	switch (periodicity) {
		case 'daily': {
			const parsed = moment(
				`${match[1]}-${match[2]}-${match[3]}`,
				'YYYY-MM-DD',
				true,
			);
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'weekly': {
			const parsed = moment()
				.year(Number(match[1]))
				.isoWeek(Number(match[2]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'monthly': {
			const parsed = moment(`${match[1]}-${match[2]}`, 'YYYY-MM', true);
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'quarterly': {
			const parsed = moment()
				.year(Number(match[1]))
				.quarter(Number(match[2]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'yearly': {
			const parsed = moment().year(Number(match[1]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
	}
}

function parseSlug(slug: string, periodicity: Periodicity): Moment | null {
	const moment = window.moment;

	switch (periodicity) {
		case 'daily': {
			const match = /(\d{4}-\d{2}-\d{2})$/.exec(slug);
			if (!match) {
				return null;
			}
			const parsed = moment(match[1], 'YYYY-MM-DD', true);
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'weekly': {
			const slugMatch = /W(\d{1,2})$/i.exec(slug);
			const yearMatch = /^(\d{4})/.exec(slug);
			if (!slugMatch || !yearMatch) {
				return null;
			}
			const parsed = moment()
				.year(Number(yearMatch[1]))
				.isoWeek(Number(slugMatch[1]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'monthly': {
			const match = /^(\d{4})-(\d{1,2})(?:-monthly-report)?$/i.exec(slug);
			if (!match) {
				return null;
			}
			const parsed = moment(
				`${match[1]}-${String(match[2]).padStart(2, '0')}`,
				'YYYY-MM',
				true,
			);
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'quarterly': {
			const match =
				/^(\d{4})-Q([1-4])(?:-quarterly-report)?$/i.exec(slug);
			if (!match) {
				return null;
			}
			const parsed = moment()
				.year(Number(match[1]))
				.quarter(Number(match[2]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
		case 'yearly': {
			const match = /^(\d{4})(?:-annual-summary)?$/i.exec(slug);
			if (!match) {
				return null;
			}
			const parsed = moment().year(Number(match[1]));
			return parsed.isValid()
				? normalizePeriodStart(parsed, periodicity)
				: null;
		}
	}
}

export function parseFromFrontmatter(
	file: TFile,
	metadataCache: MetadataCache,
	periodicity: Periodicity,
): Moment | null {
	const cache = metadataCache.getFileCache(file);
	const fm = cache?.frontmatter;
	if (!fm) {
		return null;
	}

	if (typeof fm.date === 'string') {
		const fromDate = window.moment(fm.date, 'YYYY-MM-DD', true);
		if (fromDate.isValid()) {
			return normalizePeriodStart(fromDate, periodicity);
		}
	}

	if (typeof fm.slug === 'string') {
		const fromSlug = parseSlug(fm.slug, periodicity);
		if (fromSlug) {
			return fromSlug;
		}
	}

	return null;
}

/** @deprecated Use parseFromFrontmatter with periodicity instead */
export function parseWeeklyFromFrontmatter(
	file: TFile,
	metadataCache: MetadataCache,
): Moment | null {
	return parseFromFrontmatter(file, metadataCache, 'weekly');
}

export function parsePeriodNoteDate(
	file: TFile,
	format: string,
	periodicity: Periodicity,
	metadataCache: MetadataCache,
): Moment | null {
	const basename = file.basename;

	if (format) {
		const fromFormat = parseDateFromFilename(basename, format, periodicity);
		if (fromFormat) {
			return normalizePeriodStart(fromFormat, periodicity);
		}
	}

	const fromAlt = parseAlternateFilename(basename, periodicity);
	if (fromAlt) {
		return fromAlt;
	}

	const fromChinese = parseChineseTitle(basename, periodicity);
	if (fromChinese) {
		return fromChinese;
	}

	return parseFromFrontmatter(file, metadataCache, periodicity);
}

/** @deprecated Use parsePeriodNoteDate instead */
export function parseWeeklyNoteDate(
	file: TFile,
	format: string,
	metadataCache: MetadataCache,
): Moment | null {
	return parsePeriodNoteDate(file, format, 'weekly', metadataCache);
}

export function parseNoteDate(
	file: TFile,
	format: string,
	granularity: Periodicity,
	metadataCache: MetadataCache,
): Moment | null {
	return parsePeriodNoteDate(file, format, granularity, metadataCache);
}
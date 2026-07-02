import type { Moment } from 'moment';
import type { MetadataCache } from 'obsidian';
import type { TFile } from 'obsidian';
import type { Periodicity } from '../types';

const CHINESE_WEEKLY_RE =
	/^(\d{4})年(\d{1,2})月第\d+周（(\d{2})\.(\d{2})[–-](\d{2})\.(\d{2})）$/;

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

	return sunday.clone().startOf('week');
}

export function parseWeeklyFromFrontmatter(
	file: TFile,
	metadataCache: MetadataCache,
): Moment | null {
	const cache = metadataCache.getFileCache(file);
	const fm = cache?.frontmatter;
	if (!fm) {
		return null;
	}

	if (typeof fm.date === 'string') {
		const fromDate = window.moment(fm.date, 'YYYY-MM-DD', true);
		if (fromDate.isValid()) {
			return fromDate.clone().startOf('week');
		}
	}

	if (typeof fm.slug === 'string') {
		const slugMatch = /W(\d{1,2})$/i.exec(fm.slug);
		const yearMatch = /^(\d{4})/.exec(fm.slug);
		if (slugMatch && yearMatch) {
			const week = Number(slugMatch[1]);
			const year = Number(yearMatch[1]);
			const parsed = window.moment().year(year).isoWeek(week).startOf('isoWeek');
			if (parsed.isValid()) {
				return parsed;
			}
		}
	}

	const dateRangeMatch =
		/日期范围：\s*(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/.exec(
			cache?.frontmatter?.date ? '' : '',
		);

	void dateRangeMatch;
	return null;
}

export function parseWeeklyNoteDate(
	file: TFile,
	format: string,
	metadataCache: MetadataCache,
): Moment | null {
	const basename = file.basename;

	const fromFormat = parseDateFromFilename(basename, format, 'weekly');
	if (fromFormat) {
		return fromFormat;
	}

	const fromChinese = parseChineseWeeklyTitle(basename);
	if (fromChinese) {
		return fromChinese;
	}

	return parseWeeklyFromFrontmatter(file, metadataCache);
}

export function parseNoteDate(
	file: TFile,
	format: string,
	granularity: Periodicity,
	metadataCache: MetadataCache,
): Moment | null {
	if (granularity === 'weekly') {
		return parseWeeklyNoteDate(file, format, metadataCache);
	}

	return parseDateFromFilename(file.basename, format, granularity);
}
import type { NoteMap, YearStats } from '../types';
import { parseMomentFromUid } from '../utils/dates';

function createEmptyYearStats(year: number): YearStats {
	return {
		year,
		noteCount: 0,
		wordCount: 0,
		activeDays: 0,
		months: Array.from({ length: 12 }, (_, index) => ({
			month: index + 1,
			noteCount: 0,
			wordCount: 0,
			activeDays: 0,
		})),
	};
}

export function buildDailyYearStats(
	dailyNotes: NoteMap,
	wordCounts: Map<string, number>,
): Map<number, YearStats> {
	const byYear = new Map<number, YearStats>();

	for (const [uid, file] of Object.entries(dailyNotes)) {
		const date = parseMomentFromUid(uid, 'daily');
		if (!date) {
			continue;
		}

		const year = date.year();
		const monthIndex = date.month();
		const words = wordCounts.get(file.path) ?? 0;

		let yearStats = byYear.get(year);
		if (!yearStats) {
			yearStats = createEmptyYearStats(year);
			byYear.set(year, yearStats);
		}

		const monthStats = yearStats.months[monthIndex]!;
		monthStats.noteCount += 1;
		monthStats.wordCount += words;
		monthStats.activeDays += 1;
		yearStats.noteCount += 1;
		yearStats.wordCount += words;
		yearStats.activeDays += 1;
	}

	return byYear;
}

export function getYearsWithDailyStats(
	statsByYear: Map<number, YearStats>,
): number[] {
	return [...statsByYear.values()]
		.filter((stats) => stats.noteCount > 0)
		.map((stats) => stats.year)
		.sort((a, b) => b - a);
}
import {
	Notice,
	TFolder,
	TFile,
	normalizePath,
	type App,
} from 'obsidian';
import type { Moment } from 'moment';
import type { PeriodicNotesSettings, Periodicity } from '../types';
import { getDateUid } from '../utils/dates';

async function readTemplate(app: App, templatePath: string): Promise<string> {
	if (!templatePath) {
		return '';
	}
	const templateFile = app.metadataCache.getFirstLinkpathDest(templatePath, '');
	if (templateFile instanceof TFile) {
		return app.vault.read(templateFile);
	}
	return '';
}

function applyTemplatePlaceholders(
	content: string,
	date: Moment,
	filename: string,
	format: string,
): string {
	const moment = window.moment;
	return content
		.replace(
			/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
			(_match, _kind, calc, timeDelta, unit, momentFormat) => {
				const now = moment();
				const currentDate = date.clone().set({
					hour: now.get('hour'),
					minute: now.get('minute'),
					second: now.get('second'),
				});
				if (calc) {
					currentDate.add(parseInt(timeDelta, 10), unit);
				}
				if (momentFormat) {
					return currentDate.format(momentFormat.substring(1).trim());
				}
				return currentDate.format(format);
			},
		)
		.replace(/{{\s*date\s*}}/gi, filename)
		.replace(/{{\s*time\s*}}/gi, moment().format('HH:mm'))
		.replace(/{{\s*title\s*}}/gi, filename);
}

async function resolveNotePath(
	app: App,
	folder: string,
	filename: string,
): Promise<string> {
	const normalizedFolder = normalizePath(folder);
	const normalizedPath = normalizePath(`${normalizedFolder}/${filename}.md`);

	const existingFolder = app.vault.getAbstractFileByPath(normalizedFolder);
	if (!existingFolder) {
		await app.vault.createFolder(normalizedFolder);
	} else if (!(existingFolder instanceof TFolder)) {
		throw new Error(`路径不是文件夹：${normalizedFolder}`);
	}

	const existing = app.vault.getAbstractFileByPath(normalizedPath);
	if (existing instanceof TFile) {
		return normalizedPath;
	}

	return normalizedPath;
}

const ISO_WEEKLY_BASENAME = /^\d{4}-W\d{1,2}$/i;

function findRenamedWeeklyInIndex(
	app: App,
	indexedNotes: Record<string, TFile>,
	anchorDate: Moment,
): TFile | null {
	const weekYear = anchorDate.isoWeekYear();
	const weekNum = anchorDate.isoWeek();

	for (const file of Object.values(indexedNotes)) {
		if (ISO_WEEKLY_BASENAME.test(file.basename)) {
			continue;
		}

		const cache = app.metadataCache.getFileCache(file);
		const slug = cache?.frontmatter?.slug;
		if (typeof slug === 'string') {
			const weekMatch = /W(\d{1,2})$/i.exec(slug);
			const yearMatch = /^(\d{4})/.exec(slug);
			if (
				weekMatch &&
				yearMatch &&
				Number(yearMatch[1]) === weekYear &&
				Number(weekMatch[1]) === weekNum
			) {
				return file;
			}
		}
	}

	return null;
}

export function getPeriodicAnchorDate(
	periodicity: Periodicity,
	date: Moment,
): Moment {
	if (periodicity === 'monthly') {
		return date.clone().endOf('month');
	}
	if (periodicity === 'quarterly') {
		return date.clone().endOf('quarter');
	}
	if (periodicity === 'yearly') {
		return date.clone().endOf('year');
	}
	if (periodicity === 'weekly') {
		return date.clone().startOf('isoWeek');
	}
	return date.clone().startOf('day');
}

export async function openOrCreatePeriodicNote(
	app: App,
	periodicity: Periodicity,
	date: Moment,
	settings: PeriodicNotesSettings,
	indexedNotes?: Record<string, TFile>,
): Promise<TFile | null> {
	const config = settings[periodicity];
	if (!config.enabled) {
		new Notice(`${periodicity} 笔记未在 Periodic Notes 中启用`);
		return null;
	}
	if (!config.folder) {
		new Notice(`${periodicity} 笔记文件夹未配置`);
		return null;
	}

	const anchorDate = getPeriodicAnchorDate(periodicity, date);

	if (indexedNotes) {
		const uid = getDateUid(anchorDate, periodicity);
		const indexed = indexedNotes[uid];
		if (indexed) {
			await app.workspace.getLeaf(false).openFile(indexed);
			return indexed;
		}

		if (periodicity === 'weekly') {
			const renamedWeekly = findRenamedWeeklyInIndex(
				app,
				indexedNotes,
				anchorDate,
			);
			if (renamedWeekly) {
				await app.workspace.getLeaf(false).openFile(renamedWeekly);
				return renamedWeekly;
			}
		}
	}

	const filename = anchorDate.format(config.format);
	const path = await resolveNotePath(app, config.folder, filename);
	const existing = app.vault.getAbstractFileByPath(path);

	if (existing instanceof TFile && periodicity === 'weekly' && indexedNotes) {
		const renamedWeekly = findRenamedWeeklyInIndex(
			app,
			indexedNotes,
			anchorDate,
		);
		if (renamedWeekly) {
			await app.workspace.getLeaf(false).openFile(renamedWeekly);
			return renamedWeekly;
		}
	}

	if (existing instanceof TFile) {
		await app.workspace.getLeaf(false).openFile(existing);
		return existing;
	}

	try {
		const template = await readTemplate(app, config.template);
		const body = applyTemplatePlaceholders(
			template,
			anchorDate,
			filename,
			config.format,
		);
		const created = await app.vault.create(path, body);
		await app.workspace.getLeaf(false).openFile(created);
		return created;
	} catch (error) {
		console.error('[periodic-calendar-page] create note failed', error);
		new Notice(`创建笔记失败：${filename}`);
		return null;
	}
}

export function getMonthlyNoteForMonth(
	notes: Record<string, TFile>,
	displayMonth: Moment,
): TFile | null {
	const monthEnd = displayMonth.clone().endOf('month');
	const uid = getDateUid(monthEnd, 'monthly');
	return notes[uid] ?? null;
}

export function getYearlyNoteForYear(
	notes: Record<string, TFile>,
	displayMonth: Moment,
): TFile | null {
	const yearEnd = displayMonth.clone().endOf('year');
	const uid = getDateUid(yearEnd, 'yearly');
	return notes[uid] ?? null;
}

export function getQuarterlyNoteForQuarter(
	notes: Record<string, TFile>,
	quarterEnd: Moment,
): TFile | null {
	const uid = getDateUid(quarterEnd, 'quarterly');
	return notes[uid] ?? null;
}
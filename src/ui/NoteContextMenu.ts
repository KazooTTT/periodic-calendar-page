import { Menu, TFile, type App } from 'obsidian';
import type { Moment } from 'moment';
import { PERIODICITY_LABELS } from '../constants';
import type { DetailEntry, Periodicity } from '../types';

export interface NoteContextMenuActions {
	onOpen: (path: string) => void;
	onCreate: (kind: Periodicity, date: Moment) => void;
	onDelete: (file: TFile) => void;
}

export function showNoteContextMenu(
	app: App,
	event: MouseEvent,
	date: Moment,
	entries: DetailEntry[],
	actions: NoteContextMenuActions,
): void {
	const menu = new Menu();
	let hasItems = false;

	for (const entry of entries) {
		const label = entry.label;
		if (entry.exists && entry.path) {
			const file = app.vault.getAbstractFileByPath(entry.path);
			if (!(file instanceof TFile)) {
				continue;
			}
			menu.addItem((item) =>
				item
					.setTitle(`打开${label}`)
					.setIcon('document')
					.onClick(() => actions.onOpen(entry.path!)),
			);
			hasItems = true;
			menu.addItem((item) =>
				item
					.setTitle(`删除${label}`)
					.setIcon('trash')
					.onClick(() => actions.onDelete(file)),
			);
		} else {
			menu.addItem((item) =>
				item
					.setTitle(`创建${label}`)
					.setIcon('plus')
					.onClick(() => actions.onCreate(entry.kind, date)),
			);
			hasItems = true;
		}
	}

	if (!hasItems) {
		return;
	}

	const existing = entries.find((e) => e.exists && e.path);
	if (existing?.path) {
		menu.addSeparator();
		menu.addItem((item) =>
			item.setTitle('在文件列表中显示').setIcon('folder').onClick(() => {
				const file = app.vault.getAbstractFileByPath(existing.path!);
				if (file instanceof TFile) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(app as any).showInFolder?.(file.path);
				}
			}),
		);
	}

	menu.showAtMouseEvent(event);
}

export function showWeeklyContextMenu(
	app: App,
	event: MouseEvent,
	weekStart: Moment,
	entry: DetailEntry,
	actions: NoteContextMenuActions,
): void {
	showNoteContextMenu(app, event, weekStart, [entry], actions);
}
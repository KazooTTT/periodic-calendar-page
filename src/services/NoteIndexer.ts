import { TFile, TFolder, Vault, normalizePath, type App } from 'obsidian';
import { getDateUid } from '../utils/dates';
import type { IndexedNotes, NoteMap, PeriodicNotesSettings, Periodicity } from '../types';
import { parseNoteDate } from './FilenameParser';

export class NoteIndexer {
	constructor(
		private app: App,
		private settings: PeriodicNotesSettings,
	) {}

	indexAll(): IndexedNotes {
		return {
			daily: this.indexPeriod('daily'),
			weekly: this.indexPeriod('weekly'),
			monthly: this.indexPeriod('monthly'),
			quarterly: this.indexPeriod('quarterly'),
			yearly: this.indexPeriod('yearly'),
		};
	}

	private indexPeriod(periodicity: Periodicity): NoteMap {
		const config = this.settings[periodicity];
		if (!config.enabled || !config.folder) {
			return {};
		}

		const folder = this.app.vault.getAbstractFileByPath(
			normalizePath(config.folder),
		);
		if (!(folder instanceof TFolder)) {
			return {};
		}

		const notes: NoteMap = {};
		const { metadataCache } = this.app;

		Vault.recurseChildren(folder, (node) => {
			if (!(node instanceof TFile) || node.extension !== 'md') {
				return;
			}

			const date = parseNoteDate(
				node,
				config.format,
				periodicity,
				metadataCache,
			);
			if (!date) {
				return;
			}

			const uid = getDateUid(date, periodicity);
			notes[uid] = node;
		});

		return notes;
	}

	getFile(
		notes: IndexedNotes,
		periodicity: Periodicity,
		uid: string,
	): TFile | null {
		return notes[periodicity][uid] ?? null;
	}
}
import type { TFile } from 'obsidian';

export type Periodicity =
	| 'daily'
	| 'weekly'
	| 'monthly'
	| 'quarterly'
	| 'yearly';

export interface PeriodSettings {
	format: string;
	folder: string;
	template: string;
	enabled: boolean;
}

export type PeriodicNotesSettings = Record<Periodicity, PeriodSettings>;

export type NoteMap = Record<string, TFile>;

export interface IndexedNotes {
	daily: NoteMap;
	weekly: NoteMap;
	monthly: NoteMap;
	quarterly: NoteMap;
	yearly: NoteMap;
}

export type CalendarZoom = 'day' | 'year' | 'years';

export type PageMode = 'calendar' | 'stats';

export interface MonthStats {
	month: number;
	noteCount: number;
	wordCount: number;
	activeDays: number;
}

export interface YearStats {
	year: number;
	noteCount: number;
	wordCount: number;
	activeDays: number;
	months: MonthStats[];
}

export type MarkerKind = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DayMarkers {
	daily: boolean;
	monthly: boolean;
	quarterly: boolean;
	yearly: boolean;
}

export interface DetailEntry {
	kind: Periodicity;
	label: string;
	title: string | null;
	dateRange: string | null;
	exists: boolean;
	path: string | null;
}
import type { App } from 'obsidian';
import { DEFAULT_FORMATS } from '../constants';
import type { PeriodicNotesSettings, PeriodSettings, Periodicity } from '../types';

interface PeriodicNotesPluginSettings {
	daily?: Partial<PeriodSettings>;
	weekly?: Partial<PeriodSettings>;
	monthly?: Partial<PeriodSettings>;
	quarterly?: Partial<PeriodSettings>;
	yearly?: Partial<PeriodSettings>;
}

const PERIODICITIES: Periodicity[] = [
	'daily',
	'weekly',
	'monthly',
	'quarterly',
	'yearly',
];

function normalizePeriodSettings(
	periodicity: Periodicity,
	raw?: Partial<PeriodSettings>,
): PeriodSettings {
	return {
		format: raw?.format?.trim() || DEFAULT_FORMATS[periodicity],
		folder: raw?.folder?.trim() || '',
		template: raw?.template?.trim() || '',
		enabled: raw?.enabled ?? false,
	};
}

export function readPeriodicNotesSettings(app: App): PeriodicNotesSettings {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const plugin = (app as any).plugins?.plugins?.['periodic-notes'] as any;
	const raw = (plugin?.settings ?? {}) as PeriodicNotesPluginSettings;

	const settings = {} as PeriodicNotesSettings;
	for (const periodicity of PERIODICITIES) {
		settings[periodicity] = normalizePeriodSettings(
			periodicity,
			raw[periodicity],
		);
	}
	return settings;
}

export function isPeriodicNotesAvailable(app: App): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return !!(app as any).plugins?.plugins?.['periodic-notes'];
}
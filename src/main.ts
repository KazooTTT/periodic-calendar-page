import { Plugin } from 'obsidian';
import {
	PERIODIC_CALENDAR_ICON,
	VIEW_TYPE_PERIODIC_CALENDAR,
} from './constants';
import {
	DEFAULT_SETTINGS,
	PeriodicCalendarSettingTab,
	type PeriodicCalendarSettings,
} from './settings';
import {
	openPeriodicCalendarPage,
	PeriodicCalendarView,
} from './view/PeriodicCalendarView';

export default class PeriodicCalendarPagePlugin extends Plugin {
	settings: PeriodicCalendarSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_PERIODIC_CALENDAR,
			(leaf) => new PeriodicCalendarView(leaf, this),
		);

		this.addCommand({
			id: 'open-periodic-calendar',
			name: '打开日记日历',
			callback: () => {
				void openPeriodicCalendarPage(this.app);
			},
		});

		this.addCommand({
			id: 'open-periodic-calendar-stats',
			name: '打开记录统计',
			callback: () => {
				void openPeriodicCalendarPage(this.app, { pageMode: 'stats' });
			},
		});

		this.addRibbonIcon(PERIODIC_CALENDAR_ICON, '打开日记日历', () => {
			void openPeriodicCalendarPage(this.app);
		});

		this.addSettingTab(new PeriodicCalendarSettingTab(this.app, this));
	}

	onunload(): void {
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_PERIODIC_CALENDAR)
			.forEach((leaf) => leaf.detach());
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PeriodicCalendarSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	refreshOpenViews(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIODIC_CALENDAR).forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof PeriodicCalendarView) {
				view.refreshView();
			}
		});
	}
}
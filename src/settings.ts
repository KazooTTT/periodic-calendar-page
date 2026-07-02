import { App, PluginSettingTab, Setting } from 'obsidian';
import type PeriodicCalendarPagePlugin from './main';

export interface PeriodicCalendarSettings {
	wordsPerDot: number;
}

export const DEFAULT_SETTINGS: PeriodicCalendarSettings = {
	wordsPerDot: 250,
};

export class PeriodicCalendarSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PeriodicCalendarPagePlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('每个圆点代表字数')
			.setDesc(
				'日记字数达到该值后多显示一个圆点，最多 5 个。设为 0 则只显示一个存在标记。',
			)
			.addText((text) =>
				text
					.setPlaceholder('250')
					.setValue(String(this.plugin.settings.wordsPerDot))
					.onChange(async (value) => {
						const parsed = Number(value);
						this.plugin.settings.wordsPerDot =
							Number.isFinite(parsed) && parsed >= 0 ? parsed : 250;
						await this.plugin.saveSettings();
						this.plugin.refreshOpenViews();
					}),
			);
	}
}
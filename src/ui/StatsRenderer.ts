import type { YearStats } from '../types';
import { formatCompactCount } from '../services/WordCounter';
import { renderBarChart } from './BarChart';

export interface StatsRendererOptions {
	onSelectMonth: (year: number, month: number) => void;
}

const METRIC_CARDS = [
	{
		key: 'noteCount' as const,
		label: '条笔记',
		unit: '条笔记',
		color: '#5b9bd5',
		modifier: 'notes',
	},
	{
		key: 'wordCount' as const,
		label: '字数',
		unit: '字',
		color: '#70ad47',
		modifier: 'words',
	},
	{
		key: 'activeDays' as const,
		label: '记录天数',
		unit: '天',
		color: '#e06666',
		modifier: 'days',
	},
];

export class StatsRenderer {
	constructor(
		private host: HTMLElement,
		private options: StatsRendererOptions,
	) {}

	render(years: number[], statsByYear: Map<number, YearStats>): void {
		this.host.empty();

		const layout = this.host.createDiv('periodic-calendar-page__stats-layout');

		for (const year of years) {
			const yearStats = statsByYear.get(year) ?? this.emptyYear(year);
			this.renderYearSection(layout, yearStats);
		}

		if (years.length === 0) {
			layout.createDiv({
				cls: 'periodic-calendar-page__stats-empty',
				text: '暂无日记数据',
			});
		}

		const legend = layout.createDiv('periodic-calendar-page__stats-legend');
		legend.createSpan({
			cls: 'periodic-calendar-page__legend-hint',
			text: '展示全部有日记的年份 · 点击柱图月份进入日历',
		});
	}

	private emptyYear(year: number): YearStats {
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

	private formatBarTooltip(
		year: number,
		month: number,
		value: number,
		key: (typeof METRIC_CARDS)[number]['key'],
		unit: string,
	): string {
		const monthLabel = `${year}年${month}月`;
		if (value <= 0) {
			return `${monthLabel} · 暂无数据`;
		}
		if (key === 'wordCount') {
			return `${monthLabel} · ${value.toLocaleString()} ${unit}`;
		}
		return `${monthLabel} · ${value} ${unit}`;
	}

	private renderYearSection(parent: HTMLElement, yearStats: YearStats): void {
		const section = parent.createDiv('periodic-calendar-page__stats-year');
		section.createDiv({
			cls: 'periodic-calendar-page__stats-year-title',
			text: String(yearStats.year),
		});

		const cards = section.createDiv('periodic-calendar-page__stats-cards');

		for (const metric of METRIC_CARDS) {
			const card = cards.createDiv('periodic-calendar-page__stats-card');
			card.addClass(`periodic-calendar-page__stats-card--${metric.modifier}`);

			const total = yearStats[metric.key];
			const values = yearStats.months.map((month) => month[metric.key]);
			const labels = yearStats.months.map((month) =>
				String(month.month).padStart(2, '0'),
			);

			renderBarChart(card, {
				values,
				labels,
				color: metric.color,
				tooltip: {
					year: yearStats.year,
					formatTooltip: (monthIndex, value) =>
						this.formatBarTooltip(
							yearStats.year,
							monthIndex + 1,
							value,
							metric.key,
							metric.unit,
						),
				},
				onSelect: (index) => {
					this.options.onSelectMonth(yearStats.year, index + 1);
				},
			});

			card.createDiv({
				cls: 'periodic-calendar-page__stats-card-value',
				text: formatCompactCount(total, metric.unit),
			});
		}
	}
}
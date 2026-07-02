export interface BarChartTooltipContext {
	year: number;
	formatTooltip: (monthIndex: number, value: number) => string;
}

export interface BarChartOptions {
	values: number[];
	labels: string[];
	color: string;
	tooltip?: BarChartTooltipContext;
	onSelect?: (index: number) => void;
}

export function renderBarChart(parent: HTMLElement, options: BarChartOptions): void {
	const max = Math.max(...options.values, 1);
	const chart = parent.createDiv('periodic-calendar-page__stats-chart');
	const bars = chart.createDiv('periodic-calendar-page__stats-chart-bars');
	let tooltipEl: HTMLElement | null = null;

	const hideTooltip = () => {
		tooltipEl?.removeClass('is-visible');
	};

	const showTooltip = (bar: HTMLElement, text: string) => {
		if (!tooltipEl) {
			return;
		}
		const barRect = bar.getBoundingClientRect();
		const barsRect = bars.getBoundingClientRect();
		tooltipEl.setText(text);
		tooltipEl.style.left = `${barRect.left + barRect.width / 2 - barsRect.left}px`;
		tooltipEl.style.top = `${barRect.top - barsRect.top}px`;
		tooltipEl.addClass('is-visible');
	};

	for (let index = 0; index < options.values.length; index++) {
		const value = options.values[index]!;
		const column = bars.createDiv('periodic-calendar-page__stats-chart-column');
		const bar = column.createDiv('periodic-calendar-page__stats-chart-bar');
		bar.style.height = `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`;
		bar.style.backgroundColor = options.color;

		if (options.tooltip) {
			const text = options.tooltip.formatTooltip(index, value);
			column.addEventListener('mouseenter', () => {
				showTooltip(bar, text);
			});
			column.addEventListener('mouseleave', hideTooltip);
		}

		if (options.onSelect) {
			column.addClass('is-clickable');
			column.addEventListener('click', () => {
				options.onSelect?.(index);
			});
		}
	}

	if (options.tooltip) {
		tooltipEl = bars.createDiv('periodic-calendar-page__stats-chart-tooltip');
	}

	const axis = chart.createDiv('periodic-calendar-page__stats-chart-axis');
	for (const label of options.labels) {
		axis.createSpan({
			cls: 'periodic-calendar-page__stats-chart-label',
			text: label,
		});
	}
}
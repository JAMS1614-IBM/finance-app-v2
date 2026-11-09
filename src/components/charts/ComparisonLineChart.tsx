import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Company, Series, TimeWindow } from '../../domain/types';
import { rebaseToPercent, toChartRows } from '../../domain/normalize';

interface ComparisonLineChartProps {
  series: Series[];
  companies: Company[];
  window: TimeWindow;
}

export function formatTick(t: number, window: TimeWindow): string {
  const d = new Date(t);
  return window === 'quarter'
    ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : window === '7d'
      ? d.toLocaleDateString(undefined, { weekday: 'short' })
      : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** Percent-change comparison of several companies on one axis. */
export function ComparisonLineChart({ series, companies, window }: ComparisonLineChartProps) {
  const rows = toChartRows(rebaseToPercent(series));

  return (
    <div className="chart" data-testid="comparison-chart" data-series={series.length}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
            tickFormatter={(t: number) => formatTick(t, window)} />
          <YAxis unit="%" tickFormatter={(v: number) => v.toFixed(1)} />
          <Tooltip labelFormatter={(t) => formatTick(Number(t), window)}
            formatter={(v) => `${Number(v).toFixed(2)}%`} />
          <Legend />
          {companies.map((c) => (
            <Line key={c.symbol} type="monotone" dataKey={c.symbol} name={c.name} stroke={c.color}
              strokeWidth={c.primary ? 3 : 1.5} dot={false} connectNulls={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

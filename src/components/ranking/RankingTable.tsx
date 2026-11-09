import { COMPANIES } from '../../config/companies';
import { rankByPerformance } from '../../domain/metrics';
import type { Company, Series } from '../../domain/types';

export function RankingTable({ series, companies = COMPANIES }: { series: Series[]; companies?: Company[] }) {
  const ranked = rankByPerformance(series);
  const nameOf = (symbol: string) => companies.find((c) => c.symbol === symbol)?.name ?? symbol;

  return (
    <table className="ranking" aria-label="Performance ranking">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Company</th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        {ranked.map((r, i) => (
          <tr key={r.symbol}>
            <td>{i + 1}</td>
            <td>
              {r.symbol} <span className="muted">{nameOf(r.symbol)}</span>
            </td>
            <td className={r.changePercent === null ? 'muted' : r.changePercent >= 0 ? 'change up' : 'change down'}>
              {r.changePercent === null ? 'No data' : `${r.changePercent >= 0 ? '+' : ''}${r.changePercent.toFixed(2)}%`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

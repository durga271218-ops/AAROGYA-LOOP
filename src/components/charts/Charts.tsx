import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdherenceDay } from '../../utils/doses.ts';
import { EmptyState } from '../ui/Surface.tsx';

const tooltipStyle = { borderRadius: 8, borderColor: '#d5e1de', fontSize: 14 };

export function AdherenceChart({ days }: { days: AdherenceDay[] }) {
  const hasData = days.some((day) => day.taken + day.skipped + day.missed + day.unrecorded > 0);
  if (!hasData) {
    return (
      <EmptyState
        title="No reminder history in this range"
        body="When reminders have a recorded status, the daily counts will appear here."
      />
    );
  }
  const data = days.map((day) => ({ ...day, label: day.date.slice(8) }));
  return (
    <div className="h-64 min-w-0" role="img" aria-label="Stacked bar chart of reminder statuses for each recent day">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#d5e1de" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#3e5566', fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#3e5566', fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="taken" name="Recorded as taken" stackId="status" fill="#0e5c59" />
          <Bar dataKey="skipped" name="Skipped" stackId="status" fill="#8aa8a4" />
          <Bar dataKey="missed" name="Missed" stackId="status" fill="#8a5a00" />
          <Bar dataKey="unrecorded" name="Not recorded" stackId="status" fill="#e3d3b4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountChart({
  data,
  label,
  empty,
}: {
  data: Array<{ label: string; count: number }>;
  label: string;
  empty: string;
}) {
  if (data.every((item) => item.count === 0)) return <EmptyState title="Nothing to chart" body={empty} />;
  return (
    <div className="h-56 min-w-0" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#d5e1de" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#3e5566', fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#3e5566', fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Count" fill="#0e5c59" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

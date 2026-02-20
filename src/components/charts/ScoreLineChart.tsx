'use client';

import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TreatmentEvent } from '@/data/events';

type ScoreDataPoint = {
  date: string;
  total: number;
};

type Props = {
  data: ScoreDataPoint[];
  events: TreatmentEvent[];
  color: string;
  maxScore: number;
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

type CustomTooltipProps = TooltipProps<number, string> & {
  events: TreatmentEvent[];
};

function CustomTooltip({ active, payload, label, events }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const score = payload[0]?.value;
  const matchedEvent = events.find((e) => e.date === label);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs text-gray-500 mb-1">{formatDateFull(label ?? '')}</p>
      {score !== undefined && (
        <p className="text-sm font-semibold text-gray-800">
          スコア: <span className="text-lg">{score}</span>
        </p>
      )}
      {matchedEvent && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p
            className="text-xs font-medium"
            style={{ color: matchedEvent.color }}
          >
            {matchedEvent.label}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{matchedEvent.detail}</p>
        </div>
      )}
    </div>
  );
}

type ReferenceLineLabel = {
  value: string;
  position: 'top';
  fill: string;
  fontSize: number;
  fontWeight: number;
};

export default function ScoreLineChart({ data, events, color, maxScore }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart
        data={data}
        margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          domain={[0, maxScore]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              {...(props as TooltipProps<number, string>)}
              events={events}
            />
          )}
        />
        {events.map((event) => {
          const labelProps: ReferenceLineLabel = {
            value: event.label,
            position: 'top',
            fill: event.color,
            fontSize: 10,
            fontWeight: 600,
          };
          return (
            <ReferenceLine
              key={event.date}
              x={event.date}
              stroke={event.color}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={labelProps}
            />
          );
        })}
        <Line
          type="monotone"
          dataKey="total"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 4, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

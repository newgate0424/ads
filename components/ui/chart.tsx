'use client';

import { ComposedChart, CartesianGrid, Line, Bar, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

// ... ฟังก์ชัน formatNumber เหมือนเดิม ...
const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}): string => { const num = Number(value); if (isNaN(num)) return typeof value === 'string' ? value : '0'; return num.toLocaleString('en-US', options); };

export interface SeriesConfig {
  dataKey: string;
  name: string;
  color: string;
  type?: 'line' | 'bar';
  threshold?: number;
  yAxisId?: 'left' | 'right';
  yAxisMax?: number;
}

interface ChartProps {
  data: any[];
  lines: SeriesConfig[];
}

export function Chart({ data, lines }: ChartProps) {
  const leftAxisMax = lines.find(l => l.yAxisId === 'left')?.yAxisMax;
  const rightAxisMax = lines.find(l => l.yAxisId === 'right')?.yAxisMax;

  const leftDomain: [number, number | 'auto'] = [0, leftAxisMax ?? 'auto'];
  const rightDomain: [number, number | 'auto'] = [0, rightAxisMax ?? 'auto'];

  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
            data={data}
            margin={{ top: 5, right: 0, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          
          <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={true} tickFormatter={(value) => new Date(value).getDate().toString()} />
          
          <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={true} tickFormatter={(value) => `${formatNumber(value)}`} domain={leftDomain} />
          <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatNumber(value)}`} domain={rightDomain} />

          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', boxShadow: 'hsl(var(--shadow))' }}
            formatter={(value: number, name: string) => [formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), name]}
            labelFormatter={(label) => new Date(label).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          />

          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
          
          {/* ✅ 1. วาดกราฟแท่งก่อนเสมอ */}
          {lines.filter(s => s.type === 'bar').map((series) => (
            <Bar
              key={series.dataKey}
              yAxisId={series.yAxisId || 'left'}
              dataKey={series.dataKey}
              name={series.name}
              fill={series.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={10} // ✅ 2. ทำให้แท่งบางลง
            />
          ))}

          {/* ✅ 1. วาดกราฟเส้นทีหลังเพื่อให้ทับแท่ง */}
          {lines.filter(s => s.type !== 'bar').map((series) => (
            <Line
              key={series.dataKey}
              yAxisId={series.yAxisId || 'left'}
              type="monotone"
              dataKey={series.dataKey}
              name={series.name}
              stroke={series.color}
              strokeWidth={1}
              dot={{ r: 2, strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}

          {/* เส้นเป้าหมาย (ReferenceLine) จะอยู่บนสุดเสมอ */}
          {lines.map((line) =>
            line.threshold && line.threshold > 0 ? (
              <ReferenceLine
                key={`threshold-${line.dataKey}`}
                y={line.threshold}
                yAxisId={line.yAxisId || 'left'}
                stroke={line.color} 
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ 
                  value: formatNumber(line.threshold),
                  position: line.yAxisId === 'right' ? 'right' : 'left',
                  fill: line.color,
                  fontSize: 12,
                  fontWeight: 'bold',
                  dx: line.yAxisId === 'right' ? 20 : -20,
                  dy: -5
                }}
              />
            ) : null
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
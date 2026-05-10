'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { MINERVA_CHART_THEME as theme } from './MinervaChartTheme'

interface Props {
  data: Array<{ month: string; revenue: number; ebitda?: number }>
  height?: number
}

export function RevenueChart({ data, height = 280 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.colors.gold} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.colors.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.grid} />
          <XAxis
            dataKey="month"
            stroke={theme.colors.text}
            fontSize={theme.font.size}
            fontFamily={theme.font.family}
          />
          <YAxis
            stroke={theme.colors.text}
            fontSize={theme.font.size}
            fontFamily={theme.font.family}
            tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.tooltip.bg,
              border: `1px solid ${theme.colors.tooltip.border}`,
              borderRadius: '4px',
              fontFamily: theme.font.family,
            }}
            labelStyle={{ color: theme.colors.tooltip.text }}
            itemStyle={{ color: theme.colors.tooltip.text }}
            formatter={(value) => [`€${Number(value).toLocaleString('it-IT')}`, '']}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={theme.colors.gold}
            strokeWidth={2.5}
            dot={{ fill: theme.colors.gold, r: 4 }}
            activeDot={{ r: 6, fill: theme.colors.goldLight }}
            animationDuration={800}
            animationEasing="ease-out"
          />
          {data[0]?.ebitda !== undefined && (
            <Line
              type="monotone"
              dataKey="ebitda"
              stroke={theme.colors.goldLight}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ fill: theme.colors.goldLight, r: 3 }}
              animationDuration={1000}
              animationBegin={300}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

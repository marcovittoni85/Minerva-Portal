'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { MINERVA_CHART_THEME as theme } from './MinervaChartTheme'

interface Props {
  data: Array<{ stage: string; count: number; value_eur?: number }>
  height?: number
}

export function PipelineBarChart({ data, height = 280 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.grid} vertical={false} />
          <XAxis dataKey="stage" stroke={theme.colors.text} fontSize={theme.font.size} />
          <YAxis stroke={theme.colors.text} fontSize={theme.font.size} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.tooltip.bg,
              border: `1px solid ${theme.colors.tooltip.border}`,
              borderRadius: '4px',
            }}
            cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={800}>
            {data.map((_, i) => (
              <Cell key={i} fill={theme.colors.gold} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

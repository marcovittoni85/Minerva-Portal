'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { MINERVA_CHART_THEME as theme } from './MinervaChartTheme'

interface Props {
  data: Array<{ name: string; value: number }>
  height?: number
}

const PIE_COLORS = ['#D4AF37', '#E8C870', '#B8911E', '#8B6914', '#5C4609']

export function DonutChart({ data, height = 220 }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
            animationBegin={100}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.tooltip.bg,
              border: `1px solid ${theme.colors.tooltip.border}`,
              borderRadius: '4px',
            }}
            formatter={(value, name) => [
              `€${Number(value).toLocaleString('it-IT')} (${((Number(value) / total) * 100).toFixed(1)}%)`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

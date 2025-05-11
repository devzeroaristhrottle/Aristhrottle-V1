import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface IChartProps {
  data: { votes: number }[]
}

const Chart = ({ data }: IChartProps) => {
  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart
        width={1100}
        height={200}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 40,
          bottom: 40,
        }}
      >
        <CartesianGrid />
        <XAxis
          label={{
            value: 'Time',
            position: 'insideBottom',
            offset: -18,
            style: { fill: '#ff0000', fontSize: 24, fontWeight: 'light' },
          }}
          tick={{ fill: '#ff0000', fontSize: 12 }}
        />
        <YAxis
          label={{
            value: 'Votes',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            style: { fill: '#00FF00', fontSize: 24, fontWeight: 'light' },
          }}
          tick={{ fill: '#00FF00', fontSize: 12 }}
        />
        <Tooltip />
        <Legend
          align='right' // Align legend to the right
          verticalAlign='top' // Position legend at the top
          iconType='circle' // Change the icon type
        />
        <Line
          type='monotone'
          dataKey='votes'
          stroke='#ff0000'
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default Chart

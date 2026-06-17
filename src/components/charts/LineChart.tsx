import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartConfig, DataSource } from '@shared/types';

interface LineChartProps {
  config: ChartConfig;
  dataSources: DataSource[];
}

export const LineChart: React.FC<LineChartProps> = ({ config, dataSources }) => {
  const dataSource = dataSources.find((ds) => ds.id === config.dataSourceId);
  const data = dataSource?.rows || [];

  const animationEnabled = config.styleConfig.animationEnabled;

  const yFields = config.yFields || [];
  const palette = config.styleConfig.colorPalette;
  const { showGrid, showLegend, showLabels, strokeWidth, fontFamily } = config.styleConfig;

  const fieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    if (dataSource) {
      dataSource.fields.forEach((f) => {
        labels[f.key] = f.label;
      });
    }
    return labels;
  }, [dataSource]);

  const renderLabel = (props: any) => {
    if (!showLabels) return null;
    const { x, y, value } = props;
    return (
      <text
        x={x}
        y={y - 10}
        fill="#64748b"
        fontSize={11}
        fontFamily={fontFamily}
        textAnchor="middle"
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {config.title && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h3
            className="text-lg font-semibold"
            style={{
              color: '#1e3a5f',
              fontFamily: fontFamily,
            }}
          >
            {config.title}
          </h3>
          {config.subtitle && (
            <p
              className="text-sm mt-1"
              style={{ color: '#64748b', fontFamily: fontFamily }}
            >
              {config.subtitle}
            </p>
          )}
        </motion.div>
      )}

      <div className="w-full" style={{ height: 'calc(100% - 60px)', minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                strokeWidth={1}
                vertical={!showGrid ? false : true}
                horizontal={showGrid}
              />
            )}
            <XAxis
              dataKey={config.xField}
              tick={{ fill: '#64748b', fontSize: 12, fontFamily: fontFamily }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12, fontFamily: fontFamily }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: `1px solid #c9a962`,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
                fontFamily: fontFamily,
              }}
              labelStyle={{
                color: '#1e3a5f',
                fontWeight: 600,
                marginBottom: 4,
              }}
              itemStyle={{
                color: '#475569',
                fontSize: 13,
              }}
              cursor={{ stroke: '#c9a962', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: 16,
                  fontFamily: fontFamily,
                }}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: '#475569', fontSize: 12 }}>
                    {fieldLabels[value] || value}
                  </span>
                )}
              />
            )}
            {yFields.map((field, index) => (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                name={fieldLabels[field] || field}
                stroke={palette[index % palette.length]}
                strokeWidth={strokeWidth}
                isAnimationActive={animationEnabled}
                animationDuration={1200}
                animationEasing="ease-out"
                label={showLabels ? renderLabel : undefined}
                dot={{
                  fill: palette[index % palette.length],
                  r: 4,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                }}
                activeDot={{
                  r: 6,
                  fill: palette[index % palette.length],
                  stroke: '#c9a962',
                  strokeWidth: 2,
                }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

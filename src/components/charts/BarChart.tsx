import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartConfig, DataSource } from '@shared/types';

interface BarChartProps {
  config: ChartConfig;
  dataSources: DataSource[];
}

export const BarChart: React.FC<BarChartProps> = ({ config, dataSources }) => {
  const dataSource = dataSources.find((ds) => ds.id === config.dataSourceId);
  const data = dataSource?.rows || [];

  const animationDuration = config.styleConfig.animationEnabled ? 1000 : 0;

  const yFields = config.yFields || [];
  const palette = config.styleConfig.colorPalette;
  const barRadius = config.styleConfig.barRadius;

  const fieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    if (dataSource) {
      dataSource.fields.forEach((f) => {
        labels[f.key] = f.label;
      });
    }
    return labels;
  }, [dataSource]);

  const isSingleBar = yFields.length === 1;

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
              fontFamily: config.styleConfig.fontFamily,
            }}
          >
            {config.title}
          </h3>
          {config.subtitle && (
            <p
              className="text-sm mt-1"
              style={{ color: '#64748b', fontFamily: config.styleConfig.fontFamily }}
            >
              {config.subtitle}
            </p>
          )}
        </motion.div>
      )}

      <div className="w-full" style={{ height: 'calc(100% - 60px)', minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            {config.styleConfig.showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                strokeWidth={1}
                vertical={false}
              />
            )}
            <XAxis
              dataKey={config.xField}
              tick={{ fill: '#64748b', fontSize: 12, fontFamily: config.styleConfig.fontFamily }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12, fontFamily: config.styleConfig.fontFamily }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: `1px solid #c9a962`,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
                fontFamily: config.styleConfig.fontFamily,
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
              cursor={{ fill: 'rgba(201, 169, 98, 0.08)' }}
            />
            {config.styleConfig.showLegend && yFields.length > 1 && (
              <Legend
                wrapperStyle={{
                  paddingTop: 16,
                  fontFamily: config.styleConfig.fontFamily,
                }}
                iconType="square"
                iconSize={10}
                formatter={(value) => (
                  <span style={{ color: '#475569', fontSize: 12 }}>
                    {fieldLabels[value] || value}
                  </span>
                )}
              />
            )}
            {yFields.map((field, index) => (
              <Bar
                key={field}
                dataKey={field}
                name={fieldLabels[field] || field}
                fill={palette[index % palette.length]}
                radius={isSingleBar ? [barRadius, barRadius, 0, 0] : barRadius}
                animationDuration={animationDuration}
                animationEasing="ease-out"
              >
                {isSingleBar &&
                  data.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={palette[i % palette.length]}
                    />
                  ))}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

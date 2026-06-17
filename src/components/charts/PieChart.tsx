import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartConfig, DataSource } from '@shared/types';

interface PieChartProps {
  config: ChartConfig;
  dataSources: DataSource[];
}

const DEFAULT_PIE_DATA = [
  { name: '企业客户', value: 45 },
  { name: '中小商家', value: 28 },
  { name: '个人用户', value: 18 },
  { name: '合作伙伴', value: 9 },
];

export const PieChart: React.FC<PieChartProps> = ({ config, dataSources }) => {
  const dataSource = dataSources.find((ds) => ds.id === config.dataSourceId);

  const pieData = useMemo(() => {
    if (dataSource && dataSource.rows.length > 0 && config.labelField && config.valueField) {
      return dataSource.rows.map((row) => ({
        name: row[config.labelField!],
        value: Number(row[config.valueField!]) || 0,
      }));
    }
    return DEFAULT_PIE_DATA;
  }, [dataSource, config.labelField, config.valueField]);

  const animationDuration = config.styleConfig.animationEnabled ? 1000 : 0;
  const palette = config.styleConfig.colorPalette;

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (!config.styleConfig.showLabels) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fontFamily={config.styleConfig.fontFamily}
      >
        {`${(percent * 100).toFixed(0)}%`}
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
          <RechartsPieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={95}
              innerRadius={50}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={palette[index % palette.length]}
                />
              ))}
            </Pie>
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
              formatter={(value: number, name: string) => [
                `${value} (${((value / pieData.reduce((s, i) => s + i.value, 0)) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            {config.styleConfig.showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: 16,
                  fontFamily: config.styleConfig.fontFamily,
                }}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: '#475569', fontSize: 12 }}>
                    {value}
                  </span>
                )}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

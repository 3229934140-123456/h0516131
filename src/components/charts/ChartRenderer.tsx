import React from 'react';
import { motion } from 'framer-motion';
import type { ChartConfig, DataSource } from '@shared/types';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { NumberCard } from './NumberCard';
import { ProgressBar } from './ProgressBar';

interface ChartRendererProps {
  config: ChartConfig;
  dataSources: DataSource[];
  isSelected?: boolean;
  onClick?: () => void;
  sectionId?: string;
}

const widthMap: Record<string, string> = {
  full: 'w-full',
  half: 'w-full md:w-1/2',
  third: 'w-full md:w-1/3',
  quarter: 'w-full md:w-1/2 lg:w-1/4',
};

const minHeightMap: Record<string, string> = {
  number: 'min-h-[180px]',
  progress: 'min-h-[220px]',
  line: 'min-h-[360px]',
  bar: 'min-h-[360px]',
  pie: 'min-h-[360px]',
  table: 'min-h-[320px]',
  map: 'min-h-[400px]',
};

const UnsupportedChart: React.FC<{ type: string }> = ({ type }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="w-full h-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed"
    style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}
  >
    <svg
      className="w-12 h-12 mb-3"
      style={{ color: '#94a3b8' }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
    <p className="text-sm font-medium" style={{ color: '#64748b' }}>
      暂不支持的图表类型
    </p>
    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
      Type: {type}
    </p>
  </motion.div>
);

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  config,
  dataSources,
  isSelected = false,
  onClick,
  sectionId,
}) => {
  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return <LineChart config={config} dataSources={dataSources} />;
      case 'bar':
        return <BarChart config={config} dataSources={dataSources} />;
      case 'pie':
        return <PieChart config={config} dataSources={dataSources} />;
      case 'number':
        return <NumberCard config={config} />;
      case 'progress':
        return <ProgressBar config={config} />;
      default:
        return <UnsupportedChart type={config.type} />;
    }
  };

  const widthClass = widthMap[config.width] || widthMap.full;
  const minHeightClass = minHeightMap[config.type] || 'min-h-[280px]';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${widthClass} p-2`}
      data-section-id={sectionId}
      data-chart-id={config.id}
    >
      <motion.div
        whileHover={onClick ? { scale: 1.01, y: -2 } : undefined}
        whileTap={onClick ? { scale: 0.99 } : undefined}
        onClick={onClick}
        className={`relative w-full h-full p-4 rounded-2xl transition-all duration-300 ${minHeightClass} ${
          onClick ? 'cursor-pointer' : ''
        }`}
        style={{
          backgroundColor: '#ffffff',
          border: isSelected
            ? `2px solid #c9a962`
            : '1px solid #e2e8f0',
          boxShadow: isSelected
            ? '0 8px 24px rgba(201, 169, 98, 0.2)'
            : '0 2px 8px rgba(30, 58, 95, 0.06)',
        }}
      >
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 -right-2 z-20"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#c9a962' }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </motion.div>
        )}

        <div className="w-full h-full">{renderChart()}</div>

        {onClick && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{
              opacity: 0,
              background:
                'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(201, 169, 98, 0.03) 100%)',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

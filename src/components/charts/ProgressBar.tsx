import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ChartConfig } from '@shared/types';

interface ProgressBarProps {
  config: ChartConfig;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const ProgressBar: React.FC<ProgressBarProps> = ({ config }) => {
  const value = config.progressValue ?? 0;
  const max = config.progressMax ?? 100;
  const percentage = Math.min((value / max) * 100, 100);

  const palette = config.styleConfig.colorPalette;
  const primaryColor = palette[0] || '#1e3a5f';
  const accentColor = palette[1] || '#c9a962';
  const barRadius = config.styleConfig.barRadius;

  const [displayPercentage, setDisplayPercentage] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!config.styleConfig.animationEnabled) {
      setDisplayPercentage(percentage);
      return;
    }

    const duration = 1500;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValue + (percentage - startValue) * easedProgress;
      setDisplayPercentage(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;
    };
  }, [percentage, config.styleConfig.animationEnabled]);

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return palette[0] || primaryColor;
    if (pct >= 70) return palette[1] || accentColor;
    if (pct >= 50) return palette[2] || '#4a90a4';
    return palette[3] || '#7cb342';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full p-6 rounded-2xl"
      style={{
        background: `linear-gradient(180deg, ${primaryColor}08 0%, #ffffff 100%)`,
        border: `1px solid ${primaryColor}15`,
      }}
    >
      {config.title && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <h3
            className="text-lg font-semibold"
            style={{
              color: primaryColor,
              fontFamily: config.styleConfig.fontFamily,
            }}
          >
            {config.title}
          </h3>
          {config.subtitle && (
            <p
              className="text-sm mt-1"
              style={{
                color: '#64748b',
                fontFamily: config.styleConfig.fontFamily,
              }}
            >
              {config.subtitle}
            </p>
          )}
        </motion.div>
      )}

      <div className="mb-4 flex items-end justify-between">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{
              color: '#94a3b8',
              fontFamily: config.styleConfig.fontFamily,
            }}
          >
            当前进度
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="flex items-baseline gap-1"
        >
          <span
            className="text-4xl font-bold tabular-nums"
            style={{
              color: getProgressColor(displayPercentage),
              fontFamily: config.styleConfig.fontFamily,
              textShadow: `0 2px 8px ${getProgressColor(displayPercentage)}22`,
            }}
          >
            {displayPercentage.toFixed(2)}
          </span>
          <span
            className="text-xl font-semibold"
            style={{
              color: getProgressColor(displayPercentage),
              fontFamily: config.styleConfig.fontFamily,
            }}
          >
            %
          </span>
        </motion.div>
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{
          height: '24px',
          backgroundColor: `${primaryColor}10`,
          borderRadius: barRadius,
        }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            borderRadius: barRadius,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${displayPercentage}%` }}
          transition={{
            duration: config.styleConfig.animationEnabled ? 1.5 : 0,
            ease: 'easeOut',
          }}
        >
          <div
            className="w-full h-full relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${getProgressColor(displayPercentage)}, ${accentColor})`,
              borderRadius: barRadius,
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        </motion.div>
      </div>

      {config.styleConfig.showLabels && (
        <motion.div
          className="mt-4 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="text-xs"
              style={{
                color: '#64748b',
                fontFamily: config.styleConfig.fontFamily,
              }}
            >
              目标值: {max}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getProgressColor(displayPercentage) }}
            />
            <span
              className="text-xs"
              style={{
                color: '#64748b',
                fontFamily: config.styleConfig.fontFamily,
              }}
            >
              已完成: {value}
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        className="mt-4 flex items-center justify-between h-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 25, 50, 75, 100].map((tick, i) => (
          <div key={tick} className="flex flex-col items-center">
            <span
              className="text-xs font-medium"
              style={{
                color:
                  displayPercentage >= tick
                    ? primaryColor
                    : '#cbd5e1',
                fontFamily: config.styleConfig.fontFamily,
              }}
            >
              {tick}%
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

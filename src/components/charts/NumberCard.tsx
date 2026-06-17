import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ChartConfig } from '@shared/types';

interface NumberCardProps {
  config: ChartConfig;
}

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(2).replace(/\.?0+$/, '') + '万';
  }
  return num.toLocaleString('zh-CN');
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const NumberCard: React.FC<NumberCardProps> = ({ config }) => {
  const targetValue = config.numberValue ?? 0;
  const prefix = config.numberPrefix ?? '';
  const suffix = config.numberSuffix ?? '';
  const palette = config.styleConfig.colorPalette;
  const primaryColor = palette[0] || '#1e3a5f';
  const accentColor = palette[1] || '#c9a962';

  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!config.styleConfig.animationEnabled) {
      setDisplayValue(targetValue);
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

      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;
    };
  }, [targetValue, config.styleConfig.animationEnabled]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor}22 100%)`,
        boxShadow: `0 8px 32px ${primaryColor}33`,
      }}
    >
      <motion.div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        {config.title && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h4
              className="text-sm font-medium leading-relaxed"
              style={{
                color: '#ffffffcc',
                fontFamily: config.styleConfig.fontFamily,
              }}
            >
              {config.title}
            </h4>
            {config.subtitle && (
              <p
                className="text-xs mt-1"
                style={{
                  color: '#ffffff88',
                  fontFamily: config.styleConfig.fontFamily,
                }}
              >
                {config.subtitle}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-4"
        >
          <div
            className="flex items-baseline flex-wrap"
            style={{ fontFamily: config.styleConfig.fontFamily }}
          >
            {prefix && (
              <span
                className="text-lg font-semibold mr-1"
                style={{ color: accentColor }}
              >
                {prefix}
              </span>
            )}
            <span
              className="text-4xl font-bold tracking-tight"
              style={{
                color: '#ffffff',
                textShadow: `0 2px 8px ${primaryColor}44`,
              }}
            >
              {formatNumber(Math.round(displayValue))}
            </span>
            {suffix && (
              <span
                className="text-base font-medium ml-1"
                style={{ color: '#ffffffcc' }}
              >
                {suffix}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          className="mt-4 h-1 rounded-full overflow-hidden bg-white/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, #ffffffaa)`,
            }}
            initial={{ width: '0%' }}
            animate={{
              width: `${Math.min((displayValue / Math.max(targetValue * 1.2, 1)) * 100, 100)}%`,
            }}
            transition={{
              duration: config.styleConfig.animationEnabled ? 1.5 : 0,
              ease: 'easeOut',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

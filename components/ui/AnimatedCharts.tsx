'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedBarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  animate?: boolean;
}

export function AnimatedBarChart({ 
  data, 
  height = 200, 
  showLabels = true, 
  showValues = true,
  animate = true 
}: AnimatedBarChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  useEffect(() => {
    if (!animate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animate]);

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      <div className="flex items-end justify-between gap-2 h-full">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full">
              {/* Value Label */}
              {showValues && (
                <span 
                  className={`text-xs font-semibold text-slate-600 dark:text-slate-400 transition-opacity duration-500 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 100 + 300}ms` }}
                >
                  {item.value}
                </span>
              )}
              
              {/* Bar Container */}
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                    item.color || 'bg-gradient-to-t from-primary-600 to-primary-400'
                  }`}
                  style={{ 
                    height: isVisible ? `${barHeight}%` : '0%',
                    transitionDelay: `${index * 100}ms`,
                  }}
                />
              </div>
              
              {/* Label */}
              {showLabels && (
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate w-full text-center">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AnimatedLineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
  animate?: boolean;
}

export function AnimatedLineChart({
  data,
  height = 200,
  color = '#6366f1',
  showDots = true,
  showArea = true,
  animate = true,
}: AnimatedLineChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  useEffect(() => {
    if (!animate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animate]);

  // Calculate points
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 100; // percentage based
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right),
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    value: d.value,
    label: d.label,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      <svg 
        ref={svgRef}
        viewBox={`0 0 100 ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = padding.top + (chartHeight * (100 - pct) / 100);
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={100 - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="0.5"
              />
              <text
                x={padding.left - 5}
                y={y}
                className="fill-slate-400 text-[4px]"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {Math.round(minValue + (range * pct / 100))}
              </text>
            </g>
          );
        })}

        {/* Area */}
        {showArea && (
          <path
            d={areaPath}
            fill={`url(#gradient-${color.replace('#', '')})`}
            className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isVisible ? 'animate-draw-line' : ''}
          style={{ strokeDasharray: 1000, strokeDashoffset: isVisible ? 0 : 1000 }}
        />

        {/* Dots */}
        {showDots && points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill={color}
              className={`transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ 
                transitionDelay: `${i * 100 + 500}ms`,
                transformOrigin: `${point.x}px ${point.y}px`
              }}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="transparent"
              stroke={color}
              strokeWidth="1"
              className={`transition-all duration-300 ${isVisible ? 'opacity-30' : 'opacity-0'}`}
              style={{ transitionDelay: `${i * 100 + 600}ms` }}
            />
          </g>
        ))}

        {/* X-axis Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={height - 5}
            className="fill-slate-500 text-[4px]"
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}

        {/* Gradient Definition */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface AnimatedDonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  showCenter?: boolean;
  centerLabel?: string;
  animate?: boolean;
}

export function AnimatedDonutChart({
  data,
  size = 200,
  thickness = 30,
  showLegend = true,
  showCenter = true,
  centerLabel,
  animate = true,
}: AnimatedDonutChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!animate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animate]);

  let cumulativePercent = 0;

  return (
    <div ref={containerRef} className="flex items-center gap-6">
      {/* Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-slate-100 dark:text-slate-800"
          />
          
          {/* Data Segments */}
          {data.map((segment, i) => {
            const percent = segment.value / total;
            const strokeDasharray = circumference;
            const strokeDashoffset = isVisible 
              ? circumference * (1 - percent)
              : circumference;
            const rotation = cumulativePercent * 360;
            
            cumulativePercent += percent;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: `${size / 2}px ${size / 2}px`,
                  transitionDelay: `${i * 150}ms`
                }}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        {showCenter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold text-slate-800 dark:text-slate-100 transition-all duration-500 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}>
              {total}
            </span>
            {centerLabel && (
              <span className="text-sm text-slate-500 dark:text-slate-400">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2">
          {data.map((segment, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-2 transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
              style={{ transitionDelay: `${i * 100 + 500}ms` }}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {segment.label}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function AnimatedProgressBar({
  value,
  max,
  label,
  showValue = true,
  color = 'bg-primary-500',
  size = 'md',
  animate = true,
}: AnimatedProgressBarProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const containerRef = useRef<HTMLDivElement>(null);
  const percent = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  useEffect(() => {
    if (!animate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animate]);

  return (
    <div ref={containerRef} className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`${color} ${sizeClasses[size]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: isVisible ? `${percent}%` : '0%' }}
        />
      </div>
    </div>
  );
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [isVisible, value, duration]);

  return (
    <div ref={containerRef} className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </div>
  );
}

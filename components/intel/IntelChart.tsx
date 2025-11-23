'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface IntelChartProps {
  title: string;
}

export const IntelChart = ({ title }: IntelChartProps) => {
  // Generate mock time-series data
  const labels = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (24 - i));
    return hour.toLocaleTimeString('en-US', { hour: 'numeric' });
  });

  const basePrice = 450;
  const priceData = labels.map((_, i) => {
    const volatility = Math.sin(i / 3) * 20 + Math.random() * 15;
    return basePrice + volatility + (i * 2);
  });

  const volumeData = labels.map(() => Math.random() * 100 + 50);

  const data = {
    labels,
    datasets: [
      {
        label: 'Price ($)',
        data: priceData,
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Volume',
        data: volumeData,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(203, 213, 225)',
          font: {
            size: 11,
          },
          usePointStyle: true,
          padding: 15,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(6, 182, 212)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(30, 41, 59)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.datasetIndex === 0
                ? `$${context.parsed.y.toFixed(2)}`
                : context.parsed.y.toFixed(0);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: {
            size: 10,
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(6, 182, 212)',
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return '$' + value;
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(168, 85, 247)',
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className="h-full w-full bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-400 font-mono">+12.4%</span>
          <span className="text-slate-500">24h</span>
        </div>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

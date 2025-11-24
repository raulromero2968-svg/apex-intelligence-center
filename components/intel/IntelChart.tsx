// FILE: components/intel/IntelChart.tsx
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
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
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

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

interface IntelChartProps {
  type: 'line' | 'bar'; // Currently supporting line, extensible to bar
  data: ChartData;
}

const IntelChart: React.FC<IntelChartProps> = ({ type, data }) => {
  // Transform props to ChartJS format
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: `${ds.color}33`, // Add transparency for fill
      borderWidth: 2,
      pointBackgroundColor: '#030712', // Match bg color
      pointBorderColor: ds.color,
      pointHoverBackgroundColor: ds.color,
      pointHoverBorderColor: '#fff',
      tension: 0.4, // Smooth curves
      fill: true,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af', // gray-400
          font: {
            family: 'monospace',
          },
          boxWidth: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(3, 7, 18, 0.9)',
        titleColor: '#22d3ee', // cyan
        bodyColor: '#fff',
        borderColor: '#1f2937',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return ` ${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(31, 41, 55, 0.5)', // gray-800
        },
        ticks: {
          color: '#6b7280', // gray-500
          font: {
            family: 'monospace',
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(31, 41, 55, 0.5)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'monospace',
            size: 10,
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      {type === 'line' && <Line data={chartData} options={options} />}
      {/* Fallback for other types or extend logic here */}
    </div>
  );
};

// CRITICAL FIX: Ensure Default Export
export default IntelChart;

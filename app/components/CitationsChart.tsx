import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Entry {
  title: string;
  authors: string;
  journal: string;
  citations: number;
  year: string;
  abstract: string;
  domain?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

interface CitationsChartProps {
  entries: Entry[];
}

export default function CitationsChart({ entries }: CitationsChartProps) {
  const citationRanges = useMemo(() => {
    const ranges = [
      { range: '0-10k', count: 0 },
      { range: '10k-20k', count: 0 },
      { range: '20k-30k', count: 0 },
      { range: '30k-40k', count: 0 },
      { range: '40k-50k', count: 0 },
      { range: '50k+', count: 0 }
    ];

    entries.forEach(entry => {
      const citations = entry.citations;
      if (citations <= 10000) ranges[0].count++;
      else if (citations <= 20000) ranges[1].count++;
      else if (citations <= 30000) ranges[2].count++;
      else if (citations <= 40000) ranges[3].count++;
      else if (citations <= 50000) ranges[4].count++;
      else ranges[5].count++;
    });

    return ranges;
  }, [entries]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Citations Distribution</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={citationRanges}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
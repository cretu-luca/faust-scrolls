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

interface YearChartProps {
  entries: Entry[];
}

export default function YearChart({ entries }: YearChartProps) {
  const yearDistribution = useMemo(() => {
    const ranges = [
      { range: 'Before 2008', count: 0 },
      { range: '2008-2011', count: 0 },
      { range: '2012-2015', count: 0 },
      { range: '2016-2020', count: 0 },
      { range: 'After 2020', count: 0 }
    ];

    entries.forEach(entry => {
      const year = parseInt(entry.year);
      if (year < 2008) ranges[0].count++;
      else if (year <= 2011) ranges[1].count++;
      else if (year <= 2015) ranges[2].count++;
      else if (year <= 2020) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  }, [entries]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Publications by Year Range</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
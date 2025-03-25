import React, { useState, useEffect } from 'react';
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
  const [yearDistribution, setYearDistribution] = useState<Array<{ range: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateYearDistribution = async () => {
      setIsLoading(true);

      await new Promise(resolve => setTimeout(resolve, 0));
      
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

      setYearDistribution(ranges);
      setIsLoading(false);
    };

    calculateYearDistribution();
  }, [entries]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Publications by Year Range</h2>
      <div className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 
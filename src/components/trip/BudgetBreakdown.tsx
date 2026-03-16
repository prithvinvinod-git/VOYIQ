"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BudgetBreakdownProps {
  data: {
    category: string;
    planned: number;
    actual: number;
  }[];
  currency: string;
}

export function BudgetBreakdown({ data, currency }: BudgetBreakdownProps) {
  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Planned vs. Actual Spending
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis 
                dataKey="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 10 }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333', 
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="planned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Planned" />
              <Bar dataKey="actual" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 bg-white/5 flex justify-around text-center">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Planned</span>
            <span className="text-sm font-bold text-primary">
              {currency} {data.reduce((acc, curr) => acc + curr.planned, 0).toFixed(0)}
            </span>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Spent</span>
            <span className="text-sm font-bold text-accent">
              {currency} {data.reduce((acc, curr) => acc + curr.actual, 0).toFixed(0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const totalPlanned = data.reduce((acc, curr) => acc + curr.planned, 0);
  const totalActual = data.reduce((acc, curr) => acc + curr.actual, 0);

  return (
    <Card className="bg-card border border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Trip Budget Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[250px] w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="planned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Planned" />
              <Bar dataKey="actual" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 bg-muted/50 flex justify-around text-center">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Total Planned</span>
            <span className="text-sm font-bold text-primary">
              {currency} {totalPlanned.toFixed(0)}
            </span>
          </div>
          <div className="w-px bg-border" />
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Total Spent</span>
            <span className="text-sm font-bold text-accent">
              {currency} {totalActual.toFixed(0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

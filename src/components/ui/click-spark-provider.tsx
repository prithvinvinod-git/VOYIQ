"use client";

import ClickSpark from "@/components/ui/click-spark";

export function ClickSparkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClickSpark
      sparkColor="#8B5CF6"
      sparkSize={12}
      sparkRadius={22}
      sparkCount={10}
      duration={500}
      easing="ease-out"
      extraScale={1.2}
    >
      {children}
    </ClickSpark>
  );
}

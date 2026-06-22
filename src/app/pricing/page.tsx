"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PricingOverlay } from "@/components/shared/PricingOverlay";

export default function PricingPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" />
      <PricingOverlay
        open={open}
        onClose={() => {
          setOpen(false);
          router.back();
        }}
      />
    </div>
  );
}

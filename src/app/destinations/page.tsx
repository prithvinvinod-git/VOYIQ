"use client";

import React, { useState, useEffect } from "react";
import FlowingMenu from "@/components/ui/FlowingMenu";
import { AppNavbar } from "@/components/layout/AppNavbar";

const presetDestinations = [
  {
    name: "Switzerland",
    country: "Europe",
    tag: "Alpine Luxury",
    description: "Crown jewel of the Alps. From the Jungfrau's eternal snows to Lake Geneva's crystalline depths — a realm where nature paints in impossible shades.",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1600&q=80",
    price: "$3,200",
    rating: 4.9,
    bestTime: "Jun–Aug / Dec–Mar",
    style: "luxury",
    budget: 5000,
  },
  {
    name: "Dubai",
    country: "UAE",
    tag: "Future Opulence",
    description: "A city sculpted from ambition. Where desert horizons meet architectural marvels and ancient souks trade stories beneath glass towers.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80",
    price: "$2,800",
    rating: 4.7,
    bestTime: "Nov–Mar",
    style: "luxury",
    budget: 4000,
  },
  {
    name: "Kerala",
    country: "India",
    tag: "God's Own Country",
    description: "Where emerald backwaters weave through palm-fringed shores and ancient Ayurveda traditions flow as gently as the houseboats on Vembanad Lake.",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1600&q=80",
    price: "$1,200",
    rating: 4.8,
    bestTime: "Oct–Mar",
    style: "balanced",
    budget: 2000,
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    tag: "Overwater Paradise",
    description: "26 atolls strung like pearls across the equator. Where villas float on turquoise lagoons and the ocean floor becomes your ceiling.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80",
    price: "$3,500",
    rating: 4.9,
    bestTime: "Nov–Apr",
    style: "luxury",
    budget: 5000,
  },
  {
    name: "Iceland",
    country: "Nordic",
    tag: "Elemental Wild",
    description: "A land where fire and ice compose a symphony of extremes. Waterfalls thunder over ancient lava, geysers breathe skyward, and the aurora dances across Arctic nights.",
    image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1600&q=80",
    price: "$2,600",
    rating: 4.8,
    bestTime: "Jun–Aug / Sep–Mar",
    style: "adventure",
    budget: 3500,
  },
  {
    name: "Tokyo",
    country: "Japan",
    tag: "Trending",
    description: "Where neon-lit futurism meets ancient tranquility. From the serene Meiji Shrine to the electric streets of Shibuya — a city of perpetual discovery.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqvbe4a3pKRqZ5UoVUSvnEhC7xxNZoMbp-zCMo-a8N-x5s3aTk0BLSEYgmmOH_HO-Upz4zCDSY5Bw3hh7-1hvLAOsge-S3_lNaoYJRxpYnKUt1KYmgxLzhRH0LUhWAM4X2OLWG9xEe_ey0Zp98Btq3oU4T1YiAwuukTLN9ZxHarhRv1r19vyqkHHSRRTtnLCCbKdFYeTT-RdqDMVq-HfciYHjm6FScMv2-2R5rxmy7lcfvDayUGae2q-rDcrhLCh2POjFNqaBewj8",
    bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqvbe4a3pKRqZ5UoVUSvnEhC7xxNZoMbp-zCMo-a8N-x5s3aTk0BLSEYgmmOH_HO-Upz4zCDSY5Bw3hh7-1hvLAOsge-S3_lNaoYJRxpYnKUt1KYmgxLzhRH0LUhWAM4X2OLWG9xEe_ey0Zp98Btq3oU4T1YiAwuukTLN9ZxHarhRv1r19vyqkHHSRRTtnLCCbKdFYeTT-RdqDMVq-HfciYHjm6FScMv2-2R5rxmy7lcfvDayUGae2q-rDcrhLCh2POjFNqaBewj8",
    price: "$2,400",
    rating: 4.8,
    bestTime: "Mar–May / Sep–Nov",
    style: "balanced",
    budget: 3000,
  },
  {
    name: "Amalfi Coast",
    country: "Italy",
    tag: "Luxury",
    description: "A sun-drenched ribbon of pastel villages clinging to dramatic cliffs. Where limoncello flows and every curve reveals a view that steals your breath.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmall5gqWl3Llhpck8ISqwvE7A1JXLg_J4KRe8InMB87PlBhaCPR-r-EUjVRi7PXwukWGQgAT9dLFqo_IABn06lqu-gNHAKAzA2aEQgutS6v13cuP67rwMqDW7SdnnX_FLDdmN6JPvPyzQpLHxEiEzUO-U9eoObGD77zswLGOcmU0iyTFWjbNDKq27AeA0dVT7zXlR4NZLCkSnh0YvP2yS16P6vPLhtfYA6EO2KuKAjpHHcnUv_38odrWYichJSICHN2qJKTeEc5w",
    bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmall5gqWl3Llhpck8ISqwvE7A1JXLg_J4KRe8InMB87PlBhaCPR-r-EUjVRi7PXwukWGQgAT9dLFqo_IABn06lqu-gNHAKAzA2aEQgutS6v13cuP67rwMqDW7SdnnX_FLDdmN6JPvPyzQpLHxEiEzUO-U9eoObGD77zswLGOcmU0iyTFWjbNDKq27AeA0dVT7zXlR4NZLCkSnh0YvP2yS16P6vPLhtfYA6EO2KuKAjpHHcnUv_38odrWYichJSICHN2qJKTeEc5w",
    price: "$3,800",
    rating: 4.9,
    bestTime: "Apr–Oct",
    style: "luxury",
    budget: 5000,
  },
  {
    name: "Monteverde",
    country: "Costa Rica",
    tag: "Eco-friendly",
    description: "A misty cloudforest teeming with life. Where canopy bridges thread through emerald jungles and the call of the howler monkey is your morning alarm.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDszI0fASx7OWztcneFl4U_yfXZMA-txSMo9HxZaf52NphJ2cpUbBbVyBPyN1_55f9h5CdjoeA5sc6SHErLHZ6g2FYnoB0zrYVHZ6D3ZKx1FLV6qrY_u3t6j-y8UtiEdf8CXvsowoMj-_p9zwpMEs-2a0WIkR5mWFx_NEswfHGOqQ292XAnfOieFsDh2ajQjGF1b_HX1avGiAzbnZ049kTe6uEbkgFicD3-rOy0xgs2RCKKeSnzlNSvqz_BjTmQeG0xEhJrLxhdUs4",
    bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDszI0fASx7OWztcneFl4U_yfXZMA-txSMo9HxZaf52NphJ2cpUbBbVyBPyN1_55f9h5CdjoeA5sc6SHErLHZ6g2FYnoB0zrYVHZ6D3ZKx1FLV6qrY_u3t6j-y8UtiEdf8CXvsowoMj-_p9zwpMEs-2a0WIkR5mWFx_NEswfHGOqQ292XAnfOieFsDh2ajQjGF1b_HX1avGiAzbnZ049kTe6uEbkgFicD3-rOy0xgs2RCKKeSnzlNSvqz_BjTmQeG0xEhJrLxhdUs4",
    price: "$1,500",
    rating: 4.7,
    bestTime: "Dec–Apr",
    style: "adventure",
    budget: 2000,
  },
];

const flowingMenuItems = presetDestinations.map((d) => ({
  link: `/plan/new?destination=${encodeURIComponent(d.name)}&totalBudget=${d.budget}&travelStyle=${d.style}`,
  text: d.name,
  image: d.bgImage,
}));

export default function DestinationsPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative flex flex-col min-h-screen bg-[#111415] text-white antialiased selection:bg-white selection:text-[#111415] font-inter">
      <AppNavbar />

      <section className="relative h-screen w-full pt-16 md:pt-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50">
            <source src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(17,20,21,0.5) 55%, rgba(17,20,21,0.8) 75%, #111415 88%, #111415 100%)` }} />
        </div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-5 pt-16 md:pt-8">
            <div className={`transition-all duration-1000 mt-4 md:mt-24 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

              <h1 className="font-amoria text-[32px] md:text-[60px] lg:text-[80px] leading-[1.05] tracking-[0.02em] font-bold text-white mb-3 md:mb-4 text-center drop-shadow-md">
                Explore the{" "}
                <span className="font-instrument-serif italic text-[#dbe1ff] hover:bg-gradient-to-r hover:from-amber-300 hover:via-yellow-200 hover:to-amber-400 hover:bg-clip-text hover:text-transparent transition-all duration-500">Extraordinary</span>
              </h1>
              <p className="text-[15px] md:text-[18px] leading-[1.6] text-[#c4c7c8] max-w-xl mx-auto text-center mb-6 md:mb-8">
                Five handpicked paradises, one AI-powered journey. Select a destination and let Voyiq craft your perfect itinerary.
              </p>
            </div>
          </div>
          <div className={`h-[65vh] md:h-[85vh] w-full max-w-5xl mx-auto px-4 md:px-8 pb-4 md:pb-8 transition-all duration-1000 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
              <FlowingMenu
                items={flowingMenuItems}
                speed={20}
                textColor="#ffffff"
                bgColor="rgba(17,20,21,0.6)"
                marqueeBgColor="rgba(255,255,255,0.95)"
                marqueeTextColor="#111415"
                borderColor="rgba(255,255,255,0.12)"
                autoPlay={true}
                autoPlayInterval={2000}
              />
            </div>
          </div>
        </div>
      </section>





      <footer className="bg-[#0c0f10] border-t border-white/10 py-10 md:py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-16 gap-6 max-w-[1280px] mx-auto">
          <div className="text-[22px] md:text-[24px] leading-[1.2] font-semibold text-white font-amoria">Voyiq.</div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Support", "Press Kit"].map((label) => (
              <a key={label} className="text-[14px] md:text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors" href="#">{label}</a>
            ))}
          </div>
          <div className="text-[14px] md:text-[16px] leading-[1.5] text-[#c4c7c8]">&copy; 2024 Voyiq AI Travel. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

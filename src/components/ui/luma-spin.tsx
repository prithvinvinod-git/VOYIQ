"use client";

export const LumaSpin = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-[65px] aspect-square ${className}`}>
      <span
        className="absolute rounded-[50px]"
        style={{
          boxShadow: "inset 0 0 0 3px rgba(80,84,200,0.7)",
          animation: "lumaSpin 2.5s infinite",
        }}
      />
      <span
        className="absolute rounded-[50px]"
        style={{
          boxShadow: "inset 0 0 0 3px rgba(14,155,100,0.7)",
          animation: "lumaSpin 2.5s infinite",
          animationDelay: "-1.25s",
        }}
      />
      <style>{`
        @keyframes lumaSpin {
          0%   { inset: 0 35px 35px 0; }
          12.5%{ inset: 0 35px 0 0; }
          25%  { inset: 35px 35px 0 0; }
          37.5%{ inset: 35px 0 0 0; }
          50%  { inset: 35px 0 0 35px; }
          62.5%{ inset: 0 0 0 35px; }
          75%  { inset: 0 0 35px 35px; }
          87.5%{ inset: 0 0 35px 0; }
          100% { inset: 0 35px 35px 0; }
        }
      `}</style>
    </div>
  );
};

export default LumaSpin;

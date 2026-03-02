import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function EventSignupCard() {
  const [phase, setPhase] = useState<"idle" | "trigger" | "absorb" | "strike" | "persist" | "locked">("idle");

  const handleLockIn = () => {
    if (phase !== "idle") return;

    // Scene 1: The Trigger
    setPhase("trigger");
    
    // Scene 2: The Absorption
    setTimeout(() => setPhase("absorb"), 100);
    
    // Scene 3: The Strike
    setTimeout(() => setPhase("strike"), 350);
    
    // Scene 4: The Persistence
    setTimeout(() => setPhase("persist"), 650);
    
    // Final: Locked
    setTimeout(() => setPhase("locked"), 1200);
  };

  return (
    <>
      {/* Self-contained animations using an inline style block to keep everything in one file */}
      <style>
        {`
          @keyframes card-shake {
            0% { transform: translateY(0) translateX(0); }
            20% { transform: translateY(2px) translateX(-1px); }
            40% { transform: translateY(-1px) translateX(1px); }
            60% { transform: translateY(1px) translateX(-1px); }
            80% { transform: translateY(-1px) translateX(1px); }
            100% { transform: translateY(0) translateX(0); }
          }
          @keyframes stamp-slam {
            0% { transform: scale(1.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes text-flicker {
            0%, 100% { opacity: 1; text-shadow: 0 0 0px rgba(138, 28, 28, 0); }
            30% { opacity: 0.8; text-shadow: 0 0 10px rgba(138, 28, 28, 0.5); }
            50% { opacity: 1; text-shadow: 0 0 0px rgba(138, 28, 28, 0); }
            70% { opacity: 0.8; text-shadow: 0 0 10px rgba(138, 28, 28, 0.5); }
          }
          .animate-shake {
            animation: card-shake 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          }
          .animate-stamp {
            animation: stamp-slam 0.15s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          }
          .animate-flicker {
            animation: text-flicker 0.55s ease-in-out forwards;
          }
        `}
      </style>
      
      <div className="flex justify-center items-center p-8 bg-[#0f0f0f] min-h-[400px]">
        <Card 
          className={cn(
            "w-full max-w-sm relative overflow-hidden transition-all duration-300 bg-[#141414] rounded-none border",
            (phase === "idle" || phase === "trigger") && "border-[#e3e1d9]/10",
            (phase === "absorb" || phase === "strike" || phase === "persist" || phase === "locked") && "border-[#8a1c1c]",
            phase === "strike" && "animate-shake"
          )}
          style={{
            // Fast, sharp ease-out for the border trace / absorb phase
            transitionTimingFunction: phase === "absorb" ? "cubic-bezier(0.19, 1, 0.22, 1)" : "ease",
            transitionDuration: phase === "absorb" ? "250ms" : "300ms",
          }}
        >
          {/* Gritty Texture Overlay (Intensifies during Persistence) */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300",
              (phase === "idle" || phase === "trigger" || phase === "absorb" || phase === "strike") && "opacity-30",
              phase === "persist" && "opacity-70",
              phase === "locked" && "opacity-40"
            )}
            style={{
              backgroundImage: "url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")"
            }}
          />

          <CardHeader className="text-center pb-8 pt-10 relative z-10">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#8a1c1c] font-bold mb-2">Next Evolution</p>
            <CardTitle className="text-3xl font-heading font-black uppercase text-[#e3e1d9] tracking-tight">
              Midnight Forge
            </CardTitle>
            <CardDescription className="text-[#e3e1d9]/50 font-light mt-2">
              Friday, Oct 13 • 23:00 HRS
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-10 px-8 flex flex-col items-center relative z-10">
            {/* The Button Container - Fixed height to avoid layout shift */}
            <div className="relative w-full h-14 flex items-center justify-center">
              
              {/* Action Button / The Void */}
              <button
                onClick={handleLockIn}
                className={cn(
                  "absolute w-full h-full flex items-center justify-center text-sm font-bold tracking-[0.2em] uppercase rounded-none border-none transition-all outline-none",
                  phase === "idle" && "bg-[#8a1c1c] hover:bg-[#6b1515] text-[#e3e1d9] scale-100",
                  // Trigger: Compression
                  phase === "trigger" && "bg-[#8a1c1c] scale-96 duration-100 ease-out",
                  // Absorb & beyond: Expands, background bleeds out (transparent), revealing the dark void
                  (phase === "absorb" || phase === "strike" || phase === "persist" || phase === "locked") && "bg-transparent scale-[1.02] border border-[#8a1c1c]/0 duration-200"
                )}
                disabled={phase !== "idle"}
                style={{
                  transitionTimingFunction: phase === "trigger" ? "linear" : "cubic-bezier(0.19, 1, 0.22, 1)"
                }}
              >
                <span className={cn(
                  "transition-opacity duration-0",
                  phase === "idle" ? "opacity-100" : "opacity-0"
                )}>
                  Lock In Your Spot
                </span>
              </button>

              {/* The Stamp (Slams into place during strike) */}
              {(phase === "strike" || phase === "persist" || phase === "locked") && (
                <div 
                  className={cn(
                    "absolute inset-0 flex items-center justify-center font-heading font-black text-2xl tracking-[0.15em] text-[#e3e1d9] uppercase pointer-events-none",
                    phase === "strike" && "animate-stamp",
                    phase === "persist" && "animate-flicker"
                  )}
                >
                  <span className="border-y border-[#e3e1d9]/30 py-1.5 px-6 tracking-widest bg-[#0f0f0f]/80 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    Locked In
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

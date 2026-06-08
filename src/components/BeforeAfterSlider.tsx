import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
}

const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeAlt = "Before",
  afterAlt = "After",
  className,
}: BeforeAfterSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      if (e.touches[0]) setFromClientX(e.touches[0].clientX);
    };
    const stop = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stop);
    };
  }, [setFromClientX]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden select-none touch-none rounded-sm bg-black border border-white/10",
        className,
      )}
      onMouseDown={(e) => {
        draggingRef.current = true;
        setFromClientX(e.clientX);
      }}
      onTouchStart={(e) => {
        draggingRef.current = true;
        if (e.touches[0]) setFromClientX(e.touches[0].clientX);
      }}
    >
      {/* After (base layer) */}
      <img
        src={afterImage}
        alt={afterAlt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Before (clipped layer) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeAlt}
          draggable={false}
          className="absolute inset-0 h-full w-auto max-w-none object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.getBoundingClientRect().width}px` : "100%" }}
        />
      </div>

      {/* Corner labels */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <div className="h-px w-6 bg-accent" />
        <span className="text-[10px] uppercase tracking-[0.4em] text-white font-bold bg-black/60 px-2 py-1">
          Before
        </span>
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.4em] text-white font-bold bg-black/60 px-2 py-1">
          After
        </span>
        <div className="h-px w-6 bg-accent" />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-accent z-30 pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <button
          type="button"
          aria-label="Drag to compare"
          onMouseDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.6)] pointer-events-auto cursor-ew-resize ring-4 ring-black/40"
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -ml-1" />
        </button>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
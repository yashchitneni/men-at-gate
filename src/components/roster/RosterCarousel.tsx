import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import { Member } from "@/data/members";
import PolaroidCard from "./PolaroidCard";

const ITEM_HEIGHT = 280;
const VISIBLE_ITEMS = 5;
const ROTATION_ANGLE = 40;
const CENTER_OFFSET = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;

interface CarouselItemProps {
  member: Member;
  index: number;
  activeIndex: number;
  y: MotionValue<number>;
  isDragging: boolean;
  onSelect: (index: number) => void;
}

// Extracted component to properly use hooks
const CarouselItem = ({ member, index, activeIndex, y, isDragging, onSelect }: CarouselItemProps) => {
  const itemY = useTransform(y, (latestY) => {
    return index * ITEM_HEIGHT + latestY + CENTER_OFFSET;
  });

  const rotateX = useTransform(y, (latestY) => {
    const position = index * ITEM_HEIGHT + latestY + CENTER_OFFSET;
    const normalizedPosition = position / ITEM_HEIGHT;
    return Math.max(-ROTATION_ANGLE, Math.min(ROTATION_ANGLE, normalizedPosition * -ROTATION_ANGLE));
  });

  const scale = useTransform(y, (latestY) => {
    const position = index * ITEM_HEIGHT + latestY + CENTER_OFFSET;
    const normalizedPosition = Math.abs(position / ITEM_HEIGHT);
    return Math.max(0.7, 1 - normalizedPosition * 0.15);
  });

  const opacity = useTransform(y, (latestY) => {
    const position = index * ITEM_HEIGHT + latestY + CENTER_OFFSET;
    const normalizedPosition = Math.abs(position / ITEM_HEIGHT);
    return Math.max(0.4, 1 - normalizedPosition * 0.3);
  });

  const zIndex = useTransform(y, (latestY) => {
    const position = index * ITEM_HEIGHT + latestY + CENTER_OFFSET;
    const normalizedPosition = Math.abs(position / ITEM_HEIGHT);
    return Math.round(100 - normalizedPosition * 10);
  });

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        y: itemY,
        rotateX,
        scale,
        opacity,
        zIndex,
        transformOrigin: "center center",
      }}
    >
      <PolaroidCard
        member={member}
        isActive={index === activeIndex}
        onClick={() => !isDragging && onSelect(index)}
      />
    </motion.div>
  );
};

interface RosterCarouselProps {
  members: Member[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const RosterCarousel = ({ members, activeIndex, onSelect }: RosterCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Snap to nearest item
  const snapToItem = useCallback((index: number) => {
    const targetY = -index * ITEM_HEIGHT;
    animate(y, targetY, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    onSelect(index);
  }, [y, onSelect]);

  // Handle wheel scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(members.length - 1, activeIndex + direction));
      if (newIndex !== activeIndex) {
        snapToItem(newIndex);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [activeIndex, members.length, snapToItem]);

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    const currentY = y.get();
    const nearestIndex = Math.round(-currentY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(members.length - 1, nearestIndex));
    snapToItem(clampedIndex);
  };

  // Initialize position
  useEffect(() => {
    y.set(-activeIndex * ITEM_HEIGHT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex items-center justify-center overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative"
        style={{ y, transformStyle: "preserve-3d" }}
        drag="y"
        dragConstraints={{
          top: -(members.length - 1) * ITEM_HEIGHT,
          bottom: 0,
        }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {members.map((member, index) => (
          <CarouselItem
            key={member.id}
            member={member}
            index={index}
            activeIndex={activeIndex}
            y={y}
            isDragging={isDragging}
            onSelect={snapToItem}
          />
        ))}
      </motion.div>

      {/* Gradient overlays for depth effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none z-50" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-50" />
    </div>
  );
};

export default RosterCarousel;

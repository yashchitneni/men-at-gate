import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    animation?: "fade-in" | "fade-in-left" | "fade-in-right" | "slide-up";
    delay?: number;
    threshold?: number;
}

const ScrollReveal = ({
    children,
    className,
    animation = "fade-in",
    delay = 0,
    threshold = 0.1
}: ScrollRevealProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            {
                threshold,
                rootMargin: "0px 0px -50px 0px", // Trigger slightly before bottom
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [threshold]);

    const getAnimationClass = () => {
        switch (animation) {
            case "fade-in":
                return "animate-fade-in";
            case "fade-in-left":
                return "animate-fade-in-left";
            case "fade-in-right":
                return "animate-fade-in-right";
            case "slide-up":
                return "animate-accordion-up"; // Reusing existing or defining new
            default:
                return "animate-fade-in";
        }
    };

    return (
        <div
            ref={ref}
            className={cn(
                "opacity-0 transition-opacity duration-500",
                isVisible && getAnimationClass(),
                isVisible && "opacity-100",
                className
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default ScrollReveal;

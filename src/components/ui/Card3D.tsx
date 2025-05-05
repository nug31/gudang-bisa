import React, { useState, useRef } from "react";
import { cn } from "../../utils/cn";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glassEffect?: boolean;
  hoverEffect?: boolean;
  parallaxEffect?: boolean;
  elevation?: "low" | "medium" | "high";
}

const elevationClasses = {
  low: "shadow-3d-sm",
  medium: "shadow-3d-md",
  high: "shadow-3d-lg",
};

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className,
  interactive = true,
  glassEffect = true,
  hoverEffect = true,
  parallaxEffect = true,
  elevation = "medium",
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !parallaxEffect) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setRotation({ x: 0, y: 0 });
    setHovered(false);
  };

  // Depth classes are now handled by elevation

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white rounded-lg overflow-hidden transition-all duration-500 transform-gpu perspective-1200",
        elevationClasses[elevation],
        interactive && "cursor-pointer",
        hoverEffect && "hover:-translate-y-1.5",
        glassEffect &&
          "before:absolute before:inset-0 before:bg-gradient-glass before:opacity-60 before:rounded-lg before:backdrop-blur-md",
        "border border-neutral-200/60 relative",
        "hover:shadow-3d-hover",
        className
      )}
      style={{
        transform: interactive
          ? `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${
              rotation.y
            }deg) scale3d(${hovered ? 1.02 : 1}, ${hovered ? 1.02 : 1}, ${
              hovered ? 1.02 : 1
            })`
          : undefined,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export const Card3DHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-neutral-200/50 relative z-10",
        "bg-gradient-to-r from-white to-neutral-50",
        "transition-transform duration-300 hover:translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
};

export const Card3DContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 md:px-6 py-3 sm:py-4 relative z-10",
        "backdrop-blur-md bg-white/95",
        "transition-all duration-300 hover:shadow-inner-glass",
        className
      )}
    >
      {children}
    </div>
  );
};

export const Card3DFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-neutral-200/50 relative z-10",
        "bg-gradient-to-r from-neutral-50 to-white",
        "transition-all duration-300 hover:shadow-glass",
        className
      )}
    >
      {children}
    </div>
  );
};

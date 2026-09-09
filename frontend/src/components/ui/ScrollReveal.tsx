import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type ScrollRevealDirection = "up" | "down" | "left" | "right" | "scale" | "none";

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: ScrollRevealDirection;
  scaleFrom?: number;
  threshold?: number;
  rootMargin?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article" | "aside" | "header";
}

const getDirectionClass = (direction: ScrollRevealDirection): string => {
  switch (direction) {
    case "left":
      return "reveal-left";
    case "right":
      return "reveal-right";
    case "down":
      return "reveal-down";
    case "scale":
      return "reveal-scale";
    case "none":
      return "reveal-fade";
    case "up":
    default:
      return "reveal-up";
  }
};

export const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  duration = 800,
  distance = 32,
  direction = "up",
  scaleFrom = 0.95,
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
  style = {},
  as: Component = "div",
}: ScrollRevealProps) => {
  const ref = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setIsRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(node);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const inlineStyle: CSSProperties = {
    ...style,
    ...(delay > 0 ? { "--reveal-delay": `${delay}ms` } : {}),
    ...(duration ? { "--reveal-duration": `${duration}ms` } : {}),
    ...(distance ? { "--reveal-distance": `${distance}px` } : {}),
    ...(direction === "scale" ? { "--reveal-scale": `${scaleFrom}` } : {}),
  } as CSSProperties;

  const directionClass = getDirectionClass(direction);

  return (
    <Component
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      className={`scroll-reveal ${directionClass} ${
        isRevealed ? "is-revealed" : ""
      } ${className}`.trim()}
      style={inlineStyle}
    >
      {children}
    </Component>
  );
};

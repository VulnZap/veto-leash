import { ReactNode } from 'react';
import { useInView, useReducedMotion } from '../hooks';
import { getAnimationStyle } from '../lib/animations';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export function AnimatedSection({ children, className = '', delay = 0, id }: AnimatedSectionProps) {
  const [ref, isInView] = useInView<HTMLElement>({ threshold: 0.1, triggerOnce: true });
  const prefersReducedMotion = useReducedMotion();

  const style = prefersReducedMotion
    ? {}
    : getAnimationStyle(isInView, delay);

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={style}
    >
      {children}
    </section>
  );
}

// For animating individual elements within a section
interface AnimatedElementProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedElement({
  children,
  className = '',
  delay = 0,
}: AnimatedElementProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.1, triggerOnce: true });
  const prefersReducedMotion = useReducedMotion();

  const style = prefersReducedMotion
    ? {}
    : getAnimationStyle(isInView, delay);

  return (
    <div
      ref={ref}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

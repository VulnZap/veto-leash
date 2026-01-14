// Animation timing constants
export const EASING = {
  // Physics-based easing - feels natural
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // Snappy for micro-interactions
  outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  // Spring-like for mobile menu
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
  animation: 600,
} as const;

export const STAGGER_DELAY = 75;

// Animation classes for scroll reveal
export const getAnimationClass = (isInView: boolean, delay = 0) => {
  if (!isInView) return 'opacity-0 translate-y-5';
  return `animate-in ${delay > 0 ? `animation-delay-${delay}` : ''}`;
};

// Style object for inline animations
export const getAnimationStyle = (isInView: boolean, delay = 0) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? 'translateY(0)' : 'translateY(20px)',
  transition: `opacity ${DURATION.animation}ms ${EASING.outExpo}, transform ${DURATION.animation}ms ${EASING.outExpo}`,
  transitionDelay: `${delay}ms`,
});

// Stagger delay calculator
export const getStaggerDelay = (index: number) => index * STAGGER_DELAY;

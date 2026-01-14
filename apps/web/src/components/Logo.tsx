interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-8',
  xl: 'h-12 sm:h-16',
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <img
      src="/veto-darkmode.png"
      alt="veto"
      className={`w-auto ${sizeClasses[size]} ${className}`}
    />
  );
}

// Standalone symbol for favicon-like uses
export function LogoSymbol({ className = '' }: { className?: string }) {
  return (
    <img
      src="/veto-darkmode-icon.png"
      alt="veto"
      className={`w-auto h-6 ${className}`}
    />
  );
}

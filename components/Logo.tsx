
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <img
      src="/icon-logo-removebg-preview (1).png"
      alt="LMS Logo"
      className={`relative object-contain rounded-2xl glow-emerald neon-border bg-emerald-500/10 p-1 ${className}`}
    />
  );
};

export default Logo;

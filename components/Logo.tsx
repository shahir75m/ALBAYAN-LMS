
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <img
      src="/icon-logo.png"
      alt="Logo"
      className={`object-contain ${className}`}
    />
  );
};

export default Logo;

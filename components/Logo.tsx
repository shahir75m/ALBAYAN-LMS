
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <img
      src="/logo.png"
      alt="LMS Logo"
      className={`relative object-contain rounded-xl ${className}`}
    />
  );
};

export default Logo;

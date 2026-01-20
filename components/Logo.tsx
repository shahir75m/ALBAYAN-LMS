
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Top Grey Dome Shape */}
      <path 
        d="M25 40C25 25 35 15 50 15C65 15 75 25 75 40C75 45 72 50 68 53C62 45 57 42 50 42C43 42 38 45 32 53C28 50 25 45 25 40Z" 
        fill="#555555" 
      />
      {/* Bottom Emerald Book Shape */}
      <path 
        d="M20 65C35 55 45 58 50 62C55 58 65 55 80 65V70C65 60 55 63 50 67C45 63 35 60 20 70V65Z" 
        fill="#10B981" 
      />
      <path 
        d="M20 55C35 45 45 48 50 52C55 48 65 45 80 55L75 58C65 50 55 53 50 57C45 53 35 50 25 58L20 55Z" 
        fill="#10B981" 
      />
    </svg>
  );
};

export default Logo;

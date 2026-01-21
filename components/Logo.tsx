
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 21V7C12 7 10 5 4 5V17C8 17 12 19 12 19C12 19 16 17 20 17V5C14 5 12 7 12 7V21Z"
        opacity="0.95"
      />
      <path d="M6 8H9" fill="white" fillOpacity="0.2" />
      <path d="M6 11H9" fill="white" fillOpacity="0.2" />
      <path d="M15 8H18" fill="white" fillOpacity="0.2" />
      <path d="M15 11H18" fill="white" fillOpacity="0.2" />
    </svg>
  );
};

export default Logo;

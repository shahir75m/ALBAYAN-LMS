
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
      <path d="M11 4L5 6V20L11 18V4Z" opacity="0.8" />
      <path d="M13 4L19 6V20L13 18V4Z" />
      <path d="M11 4H13V18H11V4Z" opacity="0.4" />
    </svg>
  );
};

export default Logo;

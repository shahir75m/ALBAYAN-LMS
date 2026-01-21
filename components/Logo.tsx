
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Refined Book Design */}
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H10C11.1046 4 12 4.89543 12 6V18C12 19.1046 11.1046 20 10 20H6C4.89543 20 4 19.1046 4 18V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 6C12 4.89543 12.8954 4 14 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H14C12.8954 20 12 19.1046 12 18V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 8H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default Logo;

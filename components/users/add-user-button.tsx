"use client";

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

interface AddUserButtonProps {
  onClick?: () => void;
  className?: string;
}

export function AddUserButton({ onClick, className = "" }: AddUserButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-[#6E72FF] 
        hover:bg-[#5b4cf2] 
        text-white 
        rounded-[5px] 
        relative
        transition-all 
        duration-200 
        font-semibold
        shadow-sm
        ${isHovered ? 'shadow-md transform scale-[1.02]' : ''}
        ${className}
      `}
      style={{ 
        width: '96px', 
        height: '36px', 
        fontFamily: 'Inter', 
        fontWeight: '600', 
        fontSize: '12px', 
        lineHeight: '1.2102272510528564em',
        border: 'none',
        outline: 'none'
      }}
    >
      {/* Icon positioned exactly like Figma: x: 12, y: 12 */}
      <UserPlus 
        style={{ 
          position: 'absolute',
          left: '12px',
          top: '12px',
          width: '14px', 
          height: '14px' 
        }} 
      />
      {/* Text positioned exactly like Figma: x: 30, y: 11 */}
      <span style={{
        position: 'absolute',
        left: '30px',
        top: '11px',
        width: '54px',
        height: '15px',
        textAlign: 'left'
      }}>Add User</span>
    </button>
  );
}
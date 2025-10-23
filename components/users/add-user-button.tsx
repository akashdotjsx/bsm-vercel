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
        flex 
        items-center 
        justify-center 
        gap-2 
        transition-all 
        duration-200 
        font-semibold
        ${isHovered ? 'shadow-lg transform scale-105' : 'shadow-md'}
        ${className}
      `}
      style={{ 
        width: '96px', 
        height: '36px', 
        fontFamily: 'Inter', 
        fontWeight: '600', 
        fontSize: '12px', 
        lineHeight: '1.2102272510528564em',
        padding: '0 12px'
      }}
    >
      <UserPlus 
        className="w-4 h-4" 
        style={{ width: '14px', height: '14px' }} 
      />
      <span>Add User</span>
    </button>
  );
}
import React from 'react';

const Triceracoin = ({ amount, size = 'md', showLabel = true, textColor = 'text-white' }) => {
  const sizes = {
    sm: { img: 'w-4 h-4', text: 'text-sm' },
    md: { img: 'w-6 h-6', text: 'text-base' },
    lg: { img: 'w-8 h-8', text: 'text-lg' },
    xl: { img: 'w-10 h-10', text: 'text-2xl' },
  };

  const sizeClasses = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-2">
      <img 
        src="/assets/triceracoin.png" 
        alt="Triceracoin" 
        className={`${sizeClasses.img} object-contain`}
      />
      {showLabel && (
        <span className={`font-bold ${textColor} ${sizeClasses.text}`}>
          {amount?.toLocaleString() || 0}
        </span>
      )}
    </div>
  );
};

export default Triceracoin;

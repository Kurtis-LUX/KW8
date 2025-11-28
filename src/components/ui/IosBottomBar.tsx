import React from 'react';

interface IosBottomBarProps {
  children: React.ReactNode;
  className?: string;
}

// Contenitore riutilizzabile per bottom bar stile iOS (pill traslucida con blur)
const IosBottomBar: React.FC<IosBottomBarProps> = ({ children, className }) => {
  return (
    <div
      className={`w-full bg-white/80 backdrop-blur-xl rounded-[28px] ring-1 ring-black/10 border border-black/10 shadow-[0_12px_30px_rgba(0,0,0,0.18)] px-3 py-2 ${className || ''}`}
      style={{
        // Leggera sfumatura interna sui bordi per effetto pill iOS
        WebkitMaskImage:
          'radial-gradient( farthest-side, rgba(0,0,0,1), rgba(0,0,0,1) )',
      }}
    >
      {children}
    </div>
  );
};

export default IosBottomBar;

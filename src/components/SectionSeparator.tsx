import React from 'react';

interface SectionSeparatorProps {
  variant?: 'default' | 'red' | 'navy' | 'black';
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({ variant = 'default' }) => {
  const bg = (() => {
    switch (variant) {
      case 'red':
        return 'bg-red-200';
      case 'navy':
        return 'bg-gray-300';
      case 'black':
        return 'bg-gray-300';
      default:
        return 'bg-gray-200';
    }
  })();

  return (
    <div className="my-2">
      <div className={`mx-2 h-px ${bg}`} />
    </div>
  );
};

export default SectionSeparator;

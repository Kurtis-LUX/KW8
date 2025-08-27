import React from 'react';

interface SectionSeparatorProps {
  variant?: 'default' | 'red' | 'navy' | 'black';
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({ variant = 'default' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'red':
        return 'border-red-600';
      case 'navy':
        return 'border-navy-900';
      case 'black':
        return 'border-black';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        <div className={`w-full h-px ${getVariantClasses()} border-t`}></div>
      </div>
    </div>
  );
};

export default SectionSeparator;
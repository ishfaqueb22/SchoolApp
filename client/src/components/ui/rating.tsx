import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RatingProps {
  value: number | null;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  onChange?: (value: number) => void;
}

export function Rating({
  value = 0,
  max = 5,
  size = 'md',
  readOnly = true,
  onChange,
}: RatingProps) {
  const stars = React.useMemo(() => {
    const fullStars = Math.floor(value || 0);
    const hasHalfStar = (value || 0) % 1 >= 0.5;
    const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);
    
    return {
      full: Array(fullStars).fill(0),
      half: hasHalfStar ? [0] : [],
      empty: Array(emptyStars).fill(0),
    };
  }, [value, max]);
  
  const sizeClass = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];
  
  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index + 1);
    }
  };
  
  return (
    <div className="flex items-center">
      {stars.full.map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClass} text-yellow-400 fill-yellow-400 ${!readOnly ? 'cursor-pointer' : ''}`}
          onClick={() => handleClick(i)}
        />
      ))}
      {stars.half.map((_, i) => (
        <StarHalf
          key={`half-${i}`}
          className={`${sizeClass} text-yellow-400 fill-yellow-400 ${!readOnly ? 'cursor-pointer' : ''}`}
          onClick={() => handleClick(stars.full.length)}
        />
      ))}
      {stars.empty.map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${sizeClass} text-gray-300 ${!readOnly ? 'cursor-pointer' : ''}`}
          onClick={() => handleClick(stars.full.length + stars.half.length + i)}
        />
      ))}
    </div>
  );
}
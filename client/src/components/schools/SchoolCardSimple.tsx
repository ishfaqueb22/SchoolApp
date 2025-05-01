import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface SchoolCardSimpleProps {
  id: number;
  name: string;
  description: string;
  location: string;
  rating: number;
  imageUrl: string;
  type: string;
}

const SchoolCardSimple: React.FC<SchoolCardSimpleProps> = ({
  id,
  name,
  description,
  location,
  rating,
  imageUrl,
  type
}) => {
  const [, navigate] = useLocation();
  const [imageError, setImageError] = useState(false);
  
  const handleClick = () => {
    navigate(`/schools/${id}`);
  };
  
  // Default image if school image is not available or fails to load
  const defaultImage = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop";
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-200 border-gray-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col">
        <div className="relative h-[160px] overflow-hidden">
          <img
            src={imageError || !imageUrl ? defaultImage : imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImageError(true)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center text-white">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{location}</span>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
            </div>
            <div className="flex items-center bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium">
              <Star className="h-4 w-4 fill-current mr-1" />
              <span className="text-sm">{rating.toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2">
            {description || "No description available"}
          </p>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
              {type}
            </Badge>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default SchoolCardSimple;
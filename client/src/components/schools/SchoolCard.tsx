import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Calendar, MapPin, Star, Users, Home, ChevronRight, CheckCircle2, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { School, Campus } from "@/lib/types";
import { SimpleTooltip } from "@/components/ui/tooltip";

interface SchoolCardProps {
  school: School;
  compact?: boolean;
}

const SchoolCard = ({ school, compact = false }: SchoolCardProps) => {
  const [, navigate] = useLocation();
  const [imageError, setImageError] = useState(false);
  
  const handleClick = () => {
    navigate(`/schools/${school.id}`);
  };
  
  // Default image if school image is not available or fails to load
  const defaultImage = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop";
  
  // Find main campus if it exists
  const mainCampus = school.campuses?.find(campus => campus.isMainCampus);
  
  // Calculate total student count
  const totalStudents = school.campuses && school.campuses.length > 0
    ? school.campuses.reduce((total, campus) => total + (campus.studentCount || 0), 0)
    : 0;
  
  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-200 border-gray-200 ${compact ? '' : 'cursor-pointer'}`}
      onClick={compact ? undefined : handleClick}
    >
      <div className="flex flex-col md:flex-row">
        <div className={`relative ${compact ? 'md:w-1/3' : 'md:w-1/3'} min-h-[200px] overflow-hidden`}>
          <img
            src={imageError || !school.imageUrl ? defaultImage : school.imageUrl}
            alt={school.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImageError(true)}
          />
          {school.hasFinancialAid && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700 shadow-sm">
                Financial Aid
              </Badge>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center text-white">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{school.location}</span>
            </div>
          </div>
        </div>
        
        <CardContent className={`flex-1 p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-lg">{school.name}</h3>
              {school.verificationStatus && (
                <SimpleTooltip
                  content={<span className="font-medium">Verified School</span>}
                  side="top"
                >
                  <div className="flex items-center ml-1">
                    <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-100" />
                  </div>
                </SimpleTooltip>
              )}
            </div>
            <div className="flex items-center bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium">
              <Star className="h-4 w-4 fill-current mr-1" />
              <span className="text-sm">{Math.min((school.rating || 0), 5).toFixed(1)}</span>
            </div>
          </div>
          
          {!compact && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {school.description || "No description available"}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1.5 mb-1">
            <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
              {school.type}
            </Badge>
            
            {/* Display curriculum if available */}
            {school.curriculumType && (
              <Badge variant="outline" className="text-xs font-medium border-blue-400/40 text-blue-600">
                {school.curriculumType}
              </Badge>
            )}
            
            {school.gradeRange && (
              <Badge variant="outline" className="text-xs font-medium border-purple-400/40 text-purple-600">
                {school.gradeRange}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {/* Show established year if available */}
            {school.establishedYear && (
              <div className="flex items-center text-xs text-gray-600">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <span>Est. {school.establishedYear}</span>
              </div>
            )}
            
            {/* Total student count */}
            {totalStudents > 0 && (
              <div className="flex items-center text-xs text-gray-600">
                <Users className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <span>{totalStudents.toLocaleString()} Students</span>
              </div>
            )}
            
            {/* Tuition range */}
            {school.tuitionRange && (
              <div className="flex items-center text-xs text-gray-600">
                <Building className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <span>{school.tuitionRange}</span>
              </div>
            )}
            
            {/* Campus count */}
            {school.campuses && school.campuses.length > 0 && (
              <div className="flex items-center text-xs text-gray-600">
                <Home className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <span>{school.campuses.length} {school.campuses.length === 1 ? 'Campus' : 'Campuses'}</span>
              </div>
            )}
          </div>
          
          {/* Display campuses in a more structured way */}
          {!compact && school.campuses && school.campuses.length > 0 && (
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="font-medium text-xs text-gray-700 mb-2 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                Campus Locations
              </div>
              
              {/* Main campus section */}
              {mainCampus && (
                <div className="bg-white p-2 rounded-md border border-gray-100 mb-2 text-xs">
                  <div className="font-medium text-primary flex items-center">
                    {mainCampus.name} 
                    <Badge variant="outline" className="text-[10px] ml-1 py-0 h-4 bg-primary/10 border-primary/20 text-primary">
                      Main
                    </Badge>
                  </div>
                  <div className="text-gray-600 mt-1 flex items-start">
                    <MapPin className="h-3 w-3 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{mainCampus.location}</span>
                  </div>
                </div>
              )}
              
              {/* Secondary campuses */}
              <div className="space-y-2">
                {school.campuses
                  .filter(campus => !campus.isMainCampus)
                  .slice(0, mainCampus ? 1 : 2)
                  .map((campus) => (
                    <div key={campus.id} className="bg-white p-2 rounded-md border border-gray-100 text-xs">
                      <div className="font-medium">{campus.name}</div>
                      <div className="text-gray-600 mt-1 flex items-start">
                        <MapPin className="h-3 w-3 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{campus.location}</span>
                      </div>
                    </div>
                  ))
                }
                
                {/* Show "View All" button if there are more campuses */}
                {school.campuses.length > (mainCampus ? 2 : 2) && (
                  <div className="text-primary text-xs font-medium flex items-center justify-center p-1 hover:bg-primary/5 rounded transition-colors cursor-pointer mt-1">
                    +{school.campuses.length - (mainCampus ? 2 : 2)} more campuses
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Display features if available */}
          {!compact && school.features && school.features.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
              {school.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
              {school.features.length > 3 && (
                <span className="text-primary">+{school.features.length - 3} more</span>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default SchoolCard;
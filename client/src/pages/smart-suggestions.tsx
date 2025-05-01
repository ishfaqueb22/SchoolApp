import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SchoolCard } from '@/components/schools/SchoolCard';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for preferences
const educationPreferences = [
  { id: 'international', label: 'International Curriculum' },
  { id: 'montessori', label: 'Montessori Education' },
  { id: 'stem', label: 'STEM Focus' },
  { id: 'arts', label: 'Arts Program' },
  { id: 'sports', label: 'Strong Sports Program' },
  { id: 'language', label: 'Language Immersion' },
  { id: 'special_needs', label: 'Special Needs Support' },
  { id: 'religious', label: 'Religious Education' },
];

const locationPreferences = [
  { id: 'urban', label: 'Urban Area' },
  { id: 'suburban', label: 'Suburban Area' },
  { id: 'rural', label: 'Rural Area' },
  { id: 'near_public_transport', label: 'Near Public Transportation' },
  { id: 'near_home', label: 'Close to Home' },
];

const facilityPreferences = [
  { id: 'technology', label: 'Advanced Technology' },
  { id: 'library', label: 'Large Library' },
  { id: 'labs', label: 'Science Labs' },
  { id: 'sports_facilities', label: 'Sports Facilities' },
  { id: 'arts_studios', label: 'Arts Studios' },
  { id: 'cafeteria', label: 'Cafeteria/Meal Service' },
  { id: 'outdoor_space', label: 'Outdoor Space' },
];

// Mock school data
const mockSchools = [
  {
    id: 1,
    name: "Oakridge International School",
    description: "A premier international school with a focus on holistic education and development of 21st century skills.",
    location: "Sector 26, Gurgaon",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1599687351724-dfa3c4ff81b1?q=80&w=2070&auto=format&fit=crop",
    type: "International",
    grades: "Pre-K to Grade 12",
    fees: "$15,000 - $25,000 per year",
    match: 98
  },
  {
    id: 2,
    name: "Greenwood Montessori Academy",
    description: "A child-centered educational approach based on scientific observations of children from birth to adulthood.",
    location: "Jubilee Hills, Hyderabad",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2064&auto=format&fit=crop",
    type: "Montessori",
    grades: "Pre-K to Grade 8",
    fees: "$10,000 - $18,000 per year",
    match: 95
  },
  {
    id: 3,
    name: "Pioneer STEM Academy",
    description: "A specialized school focusing on Science, Technology, Engineering, and Mathematics education.",
    location: "Whitefield, Bangalore",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
    type: "STEM",
    grades: "Grade 6 to Grade 12",
    fees: "$12,000 - $22,000 per year",
    match: 92
  },
  {
    id: 4,
    name: "Creative Arts School",
    description: "A specialized institution focusing on performing and visual arts alongside a strong academic curriculum.",
    location: "Bandra, Mumbai",
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?q=80&w=2070&auto=format&fit=crop",
    type: "Arts",
    grades: "Grade 1 to Grade 12",
    fees: "$11,000 - $20,000 per year",
    match: 88
  },
];

const SmartSuggestions: React.FC = () => {
  const [selectedEducationPrefs, setSelectedEducationPrefs] = useState<string[]>([]);
  const [selectedLocationPrefs, setSelectedLocationPrefs] = useState<string[]>([]);
  const [selectedFacilityPrefs, setSelectedFacilityPrefs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleEducationPrefChange = (id: string) => {
    setSelectedEducationPrefs(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleLocationPrefChange = (id: string) => {
    setSelectedLocationPrefs(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleFacilityPrefChange = (id: string) => {
    setSelectedFacilityPrefs(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleGetSuggestions = async () => {
    if (
      selectedEducationPrefs.length === 0 && 
      selectedLocationPrefs.length === 0 && 
      selectedFacilityPrefs.length === 0
    ) {
      toast({
        title: "No preferences selected",
        description: "Please select at least one preference to get personalized school suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1500);
  };

  const resetPreferences = () => {
    setSelectedEducationPrefs([]);
    setSelectedLocationPrefs([]);
    setSelectedFacilityPrefs([]);
    setShowResults(false);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Smart School Suggestions</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered school recommendations based on your preferences
        </p>
      </div>

      {!showResults ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Education Preferences</CardTitle>
              <CardDescription>
                Select curriculum and teaching approaches you prefer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {educationPreferences.map((pref) => (
                  <div className="flex items-center space-x-2" key={pref.id}>
                    <Checkbox 
                      id={`education-${pref.id}`} 
                      checked={selectedEducationPrefs.includes(pref.id)}
                      onCheckedChange={() => handleEducationPrefChange(pref.id)}
                    />
                    <Label htmlFor={`education-${pref.id}`}>{pref.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Preferences</CardTitle>
              <CardDescription>
                Select your ideal school location type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationPreferences.map((pref) => (
                  <div className="flex items-center space-x-2" key={pref.id}>
                    <Checkbox 
                      id={`location-${pref.id}`} 
                      checked={selectedLocationPrefs.includes(pref.id)}
                      onCheckedChange={() => handleLocationPrefChange(pref.id)}
                    />
                    <Label htmlFor={`location-${pref.id}`}>{pref.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facility Preferences</CardTitle>
              <CardDescription>
                Select facilities important for your child
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {facilityPreferences.map((pref) => (
                  <div className="flex items-center space-x-2" key={pref.id}>
                    <Checkbox 
                      id={`facility-${pref.id}`} 
                      checked={selectedFacilityPrefs.includes(pref.id)}
                      onCheckedChange={() => handleFacilityPrefChange(pref.id)}
                    />
                    <Label htmlFor={`facility-${pref.id}`}>{pref.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Personalized School Suggestions</h2>
              <Button variant="outline" onClick={resetPreferences}>
                Change Preferences
              </Button>
            </div>
            <div className="mt-6">
              <p className="text-muted-foreground mb-2">Based on your preferences:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedEducationPrefs.map(id => {
                  const pref = educationPreferences.find(p => p.id === id);
                  return pref ? (
                    <div key={id} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pref.label}
                    </div>
                  ) : null;
                })}
                {selectedLocationPrefs.map(id => {
                  const pref = locationPreferences.find(p => p.id === id);
                  return pref ? (
                    <div key={id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pref.label}
                    </div>
                  ) : null;
                })}
                {selectedFacilityPrefs.map(id => {
                  const pref = facilityPreferences.find(p => p.id === id);
                  return pref ? (
                    <div key={id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pref.label}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <Separator />
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockSchools.map(school => (
                <div key={school.id} className="flex flex-col">
                  <SchoolCard 
                    id={school.id}
                    name={school.name}
                    description={school.description.substring(0, 100) + "..."}
                    location={school.location}
                    rating={school.rating}
                    imageUrl={school.imageUrl}
                    type={school.type}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-muted-foreground mr-2">Match:</span>
                      <div className="bg-primary px-2 py-1 rounded text-white font-medium text-sm">
                        {school.match}%
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showResults && (
        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            className="px-8"
            onClick={handleGetSuggestions}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Suggestions...
              </>
            ) : (
              'Get Personalized Suggestions'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
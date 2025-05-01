import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ArrowRight, Info, AlertCircle, Loader2 } from 'lucide-react';
import SchoolCardSimple from '@/components/schools/SchoolCardSimple';
import PageLayout from '@/components/layout/PageLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Sample data for demonstration purposes
const sampleSchoolResults = [
  {
    id: 1,
    name: "Oakridge International School",
    description: "A premier international school with a focus on holistic education and development of 21st century skills.",
    location: "Sector 26, Gurgaon",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1599687351724-dfa3c4ff81b1?q=80&w=2070&auto=format&fit=crop",
    type: "International",
    relevanceScore: 95
  },
  {
    id: 2,
    name: "Greenwood Montessori Academy",
    description: "A child-centered educational approach based on scientific observations of children from birth to adulthood.",
    location: "Jubilee Hills, Hyderabad",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2032&auto=format&fit=crop",
    type: "Montessori",
    relevanceScore: 87
  },
  {
    id: 3,
    name: "DPS International",
    description: "One of the most prestigious educational institutions with a strong focus on academics and extracurricular activities.",
    location: "Vasant Kunj, New Delhi",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071&auto=format&fit=crop",
    type: "International",
    relevanceScore: 82
  },
  {
    id: 4,
    name: "Silicon Valley Public School",
    description: "A technology-focused school with modern curriculum emphasizing STEM education and digital literacy.",
    location: "Electronic City, Bangalore",
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop",
    type: "STEM",
    relevanceScore: 78
  },
];

// Sample search history
const searchHistory = [
  "International schools with IGCSE curriculum",
  "Schools with good sports facilities",
  "Boarding schools near Delhi",
  "Best schools for special education",
  "Schools with strong music programs"
];

const SmartSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [explanationText, setExplanationText] = useState('');

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Smart School Search</h1>
          <p className="text-muted-foreground mt-2">
            Find the perfect school with our AI-powered search technology
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto mb-8">
          <div className="bg-primary-50 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-semibold mb-3">SmartMatch Quiz</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Our comprehensive quiz will help you find the perfect school based on your unique preferences and requirements. Answer a few questions and get personalized school recommendations.</p>
            <Button 
              className="px-8"
              size="lg"
              onClick={() => window.location.href = '/quiz'}
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Start SmartMatch Quiz
            </Button>
          </div>
        </div>

        {hasSearched && (
          <div className="w-full max-w-4xl mx-auto mb-8">
            {searchResults.length === 0 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Results Found</AlertTitle>
                <AlertDescription>
                  We couldn't find any schools matching your search criteria. Try adjusting your search terms or using more general keywords.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {explanationText && (
                  <Alert className="mb-4 bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle>AI Search Insights</AlertTitle>
                    <AlertDescription>
                      {explanationText}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.map(school => (
                    <div key={school.id} className="flex flex-col">
                      <SchoolCardSimple 
                        id={school.id}
                        name={school.name}
                        description={school.description}
                        location={school.location}
                        rating={school.rating}
                        imageUrl={school.imageUrl}
                        type={school.type}
                      />
                      <div className="mt-2 flex items-center">
                        <span className="text-sm font-medium text-muted-foreground mr-2">Relevance:</span>
                        <div className="bg-primary/10 px-2 py-1 rounded text-primary font-medium text-sm">
                          {school.relevanceScore}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="w-full max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Recent Searches</CardTitle>
                <CardDescription>
                  Your recent school search queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {searchHistory.map((search, index) => (
                    <li 
                      key={index} 
                      className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                    >
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{search}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SmartSearch;
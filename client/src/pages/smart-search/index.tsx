import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';

const SmartSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('semantic');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  // Sample search history
  const searchHistory = [
    "International schools with sports focus",
    "Montessori schools in central area",
    "Schools with advanced STEM programs",
    "Schools with language immersion"
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Smart School Search</h1>
        <p className="text-muted-foreground mt-2">
          Find the perfect school with our AI-powered search technology
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="semantic">
              Semantic Search
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">AI</span>
            </TabsTrigger>
            <TabsTrigger value="traditional">Traditional Search</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  placeholder={activeTab === 'semantic' ? "Describe the school you're looking for..." : "Search by keyword, name, or location"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

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
                  onClick={() => {
                    setSearchQuery(search);
                    setActiveTab('semantic');
                  }}
                >
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{search}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartSearch;
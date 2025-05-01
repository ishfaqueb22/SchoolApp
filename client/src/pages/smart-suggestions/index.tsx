import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const SmartSuggestions: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Smart School Suggestions</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered school recommendations based on your preferences
        </p>
      </div>

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
              {['International Curriculum', 'Montessori Education', 'STEM Focus'].map((pref) => (
                <div className="flex items-center space-x-2" key={pref}>
                  <Checkbox id={`pref-${pref.replace(/\s+/g, '-').toLowerCase()}`} />
                  <Label htmlFor={`pref-${pref.replace(/\s+/g, '-').toLowerCase()}`}>{pref}</Label>
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
              {['Urban Area', 'Suburban Area', 'Near Public Transportation'].map((pref) => (
                <div className="flex items-center space-x-2" key={pref}>
                  <Checkbox id={`loc-${pref.replace(/\s+/g, '-').toLowerCase()}`} />
                  <Label htmlFor={`loc-${pref.replace(/\s+/g, '-').toLowerCase()}`}>{pref}</Label>
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
              {['Advanced Technology', 'Science Labs', 'Sports Facilities'].map((pref) => (
                <div className="flex items-center space-x-2" key={pref}>
                  <Checkbox id={`fac-${pref.replace(/\s+/g, '-').toLowerCase()}`} />
                  <Label htmlFor={`fac-${pref.replace(/\s+/g, '-').toLowerCase()}`}>{pref}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" className="px-8">
          Get Personalized Suggestions
        </Button>
      </div>
    </div>
  );
};

export default SmartSuggestions;
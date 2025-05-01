import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { School } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { FEATURED_SCHOOLS } from "@/lib/mock-data";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ShieldCheck } from "lucide-react";

// Helper function for circle radius
const getRadiusInMeters = (miles: number) => {
  return miles * 1609.34; // 1 mile = 1609.34 meters
}

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// School marker icon
const SchoolIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// User marker icon (with different color)
const UserIcon = L.icon({
  iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Location finder component
const LocationMarker = ({ onLocationFound }: { onLocationFound: (position: [number, number]) => void }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();
  
  useEffect(() => {
    // Don't force setView to true, this allows user to control zoom/pan
    map.locate({ setView: false });
    
    map.on('locationfound', (e) => {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(coords);
      
      // Only set view if position is null (first load)
      if (!position) {
        map.setView(coords, 10);
      }
      
      onLocationFound(coords);
    });
    
    map.on('locationerror', (e) => {
      console.error("Error finding location:", e.message);
      // Default to a central location if geolocation fails
      const defaultLocation: [number, number] = [24.8607, 67.0011]; // Pakistan location
      setPosition(defaultLocation);
      
      // Only set view if position is null (first load)
      if (!position) {
        map.setView(defaultLocation, 10);
      }
      
      onLocationFound(defaultLocation);
    });
    
    return () => {
      map.off('locationfound');
      map.off('locationerror');
    };
  }, [map, onLocationFound]);
  
  return position ? (
    <>
      <Marker position={position} icon={UserIcon}>
        <Popup>Your current location</Popup>
      </Marker>
      <Circle center={position} radius={getRadiusInMeters(5)} />
    </>
  ) : null;
};



const MapViewSection = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  // Reference to map for programmatic control
  const mapRef = useRef<L.Map | null>(null);
  
  // Fetch schools - only once when component mounts
  useEffect(() => {
    const fetchSchoolsWithCoordinates = async () => {
      try {
        setLoading(true);
        
        // Fetch all schools without filtering
        const response = await apiRequest("GET", `/api/schools/map?type=all&radius=all`, undefined);
        const data = await response.json();
        
        setSchools(data);
        
        // Set the first school as selected if available
        if (data && data.length > 0) {
          setSelectedSchool(data[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch schools for map:", error);
        setLoading(false);
      }
    };
    
    fetchSchoolsWithCoordinates();
  }, []); // Empty dependency array - only run once on component mount


  
  const handleLocationFound = (position: [number, number]) => {
    setUserPosition(position);
  };
  
  // Filter out schools without valid coordinates
  const validSchools = useMemo(() => 
    schools.filter(school => 
      school.coordinates && 
      typeof school.coordinates.lat === 'number' && 
      typeof school.coordinates.lng === 'number'
    ), 
    [schools]
  );

  return (
    <section className="mb-12">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Schools on Map</h2>
          <div className="relative h-[500px] bg-gray-100 rounded-lg overflow-hidden">
            <MapContainer 
              center={[33.7490, -84.3880]} // Default center (will be overridden by LocationMarker)
              zoom={10} 
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Location finder */}
              <LocationMarker onLocationFound={handleLocationFound} />
              
              {/* School markers */}
              {validSchools.map((school) => (
                <Marker 
                  key={school.id} 
                  position={[school.coordinates.lat, school.coordinates.lng]} 
                  icon={SchoolIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedSchool(school);
                    }
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <h3 className="font-semibold">{school.name}</h3>
                        {school.verificationStatus && (
                          <div className="flex items-center">
                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm">{school.curriculumType}</p>
                      <div className="mt-2">
                        <Link href={`/schools/${school.id}`} className="text-primary-600 hover:underline text-sm">
                          View details
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Visualization of your current location */}
              {userPosition && (
                <Circle 
                  center={userPosition} 
                  radius={5000} 
                  pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue' }}
                />
              )}
            </MapContainer>

            {/* Info box */}
            <div className="absolute top-4 left-4 z-[1000]">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-medium text-gray-900">Schools Near You</h3>
                <p className="text-sm text-gray-600 mt-1">Click on markers to view school details</p>
              </div>
            </div>

            {/* School preview card (would appear when a school pin is clicked) */}
            {selectedSchool && (
              <div className="absolute bottom-4 right-4 z-[1000]">
                <div className="bg-white rounded-lg shadow-lg p-4 w-80">
                  <div className="flex items-start">
                    <img
                      className="h-16 w-16 rounded-md object-cover mr-3"
                      src={selectedSchool.imageUrl}
                      alt={`${selectedSchool.name} thumbnail`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-lg font-bold text-gray-900 truncate">
                          {selectedSchool.name}
                        </h4>
                        {selectedSchool.verificationStatus && (
                          <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 inline mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {selectedSchool.location}
                      </p>
                      <div className="flex items-center mt-1 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-yellow-400 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium">{selectedSchool.rating ? (selectedSchool.rating).toFixed(1) : "N/A"}</span>
                        <span className="mx-1 text-gray-400">|</span>
                        <span>{selectedSchool.curriculumType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <Link href={`/compare?schools=${selectedSchool.id}`}>
                      <Button variant="outline" size="sm">
                        Compare
                      </Button>
                    </Link>
                    <Link href={`/schools/${selectedSchool.id}`}>
                      <Button size="sm">
                        View details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapViewSection;

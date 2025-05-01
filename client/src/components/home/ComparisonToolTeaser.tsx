import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { School } from "@/lib/types";
import { COMPARISON_DATA } from "@/lib/mock-data";

// For real comparison data
interface ComparisonRow {
  criteria: string;
  schools: Record<string, string | number | boolean>;
}

// Format school data into comparison rows
const formatSchoolsForComparison = (schools: School[]): ComparisonRow[] => {
  if (!schools || schools.length < 2) return COMPARISON_DATA;
  
  // Function to create a criteria row with all schools
  const createCriteriaRow = (criteria: string, propertyName: keyof School) => {
    const row: ComparisonRow = {
      criteria,
      schools: {}
    };
    
    // Add each school's value for this criteria
    schools.forEach(school => {
      row.schools[school.name] = school[propertyName] || "N/A";
    });
    
    return row;
  };
  
  return [
    createCriteriaRow("Type", "type"),
    createCriteriaRow("Rating", "rating"),
    createCriteriaRow("Curriculum", "curriculumType"),
    createCriteriaRow("Class Size", "classSize"),
    createCriteriaRow("Tuition", "tuitionRange")
  ];
};

const ComparisonToolTeaser = () => {
  const [topSchools, setTopSchools] = useState<School[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonRow[]>(COMPARISON_DATA);
  const [loading, setLoading] = useState(true);
  const [schoolNames, setSchoolNames] = useState<string[]>(["Westside", "Northfield"]);
  
  useEffect(() => {
    const fetchTopRatedSchools = async () => {
      try {
        // Fetch top rated schools for comparison
        const response = await apiRequest("GET", "/api/schools?sort=rating&limit=2", undefined);
        const data = await response.json();
        
        setTopSchools(data);
        
        // If we have at least 2 schools, format them for comparison
        if (data && data.length >= 2) {
          setComparisonData(formatSchoolsForComparison(data));
          setSchoolNames([data[0].name, data[1].name]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch top schools for comparison:", error);
        setLoading(false);
      }
    };
    
    fetchTopRatedSchools();
  }, []);
  
  // Handle comparing the shown schools
  const handleCompareTheseSchools = () => {
    if (topSchools && topSchools.length >= 2) {
      // Extract school IDs
      const schoolIds = topSchools.map(school => school.id);
      
      // Save to localStorage for persistence
      localStorage.setItem('comparisonSchoolIds', JSON.stringify(schoolIds));
      
      // Create URL with school IDs for the comparison page
      const searchParams = new URLSearchParams();
      searchParams.set("schools", schoolIds.join(","));
      
      // Navigate to comparison page with these schools
      window.location.href = `/compare?${searchParams.toString()}`;
    }
  };
  return (
    <section className="mb-12">
      <div className="bg-gray-50 rounded-lg overflow-hidden shadow-md">
        <div className="p-6 sm:p-8">
          <div className="md:flex md:items-start">
            <div className="md:w-7/12 md:pr-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Compare Schools Side by Side
              </h2>
              <p className="text-gray-600 mb-6">
                Can't decide between schools? Our comparison tool allows you to analyze up to 4
                schools side by side across dozens of criteria, from academics to extracurriculars.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <FeatureItem text="Academic programs" />
                <FeatureItem text="Extracurricular activities" />
                <FeatureItem text="Facilities" />
                <FeatureItem text="Teacher qualifications" />
                <FeatureItem text="Parent reviews" />
                <FeatureItem text="Admission requirements" />
              </div>
              <Link href="/compare">
                <Button>
                  Open comparison tool
                </Button>
              </Link>
            </div>
            <div className="md:w-5/12 mt-6 md:mt-0">
              <div className="bg-white rounded-lg shadow-lg p-4 overflow-hidden">
                <h3 className="font-medium text-gray-900 mb-3 text-center">Sample Comparison</h3>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-6">
                      <svg 
                        className="animate-spin h-6 w-6 text-primary-600" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        ></circle>
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2 text-gray-600">Loading comparison data...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Criteria
                              </th>
                              {schoolNames.map((name, index) => (
                                <th
                                  key={index}
                                  scope="col"
                                  className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {comparisonData.map((row, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                                  {row.criteria}
                                </td>
                                {schoolNames.map((schoolName, idx) => (
                                  <td key={idx} className="px-3 py-2 whitespace-nowrap text-xs text-center">
                                    {row.criteria === "Rating" ? (
                                      <div className="flex items-center justify-center">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3 w-3 text-yellow-400"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="ml-1">
                                          {row.schools[schoolName] && 
                                          typeof row.schools[schoolName] === 'number' ? 
                                          (Number(row.schools[schoolName])).toFixed(1) : 
                                          row.schools[schoolName]}
                                        </span>
                                      </div>
                                    ) : row.criteria === "After School" ? (
                                      <span className="text-secondary-600">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mx-auto"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </span>
                                    ) : (
                                      row.schools[schoolName] || "N/A"
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={handleCompareTheseSchools}
                          disabled={topSchools.length < 2}
                        >
                          Compare These Schools
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-secondary-500 mr-2"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
    <span className="text-gray-700">{text}</span>
  </div>
);

export default ComparisonToolTeaser;

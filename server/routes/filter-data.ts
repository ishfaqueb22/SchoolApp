import { Router, Request, Response } from "express";

export const filterDataRouter = Router();

// Get curriculum types
filterDataRouter.get("/curriculum-types", async (req: Request, res: Response) => {
  try {
    const curriculumTypes = [
      { value: "Cambridge", label: "Cambridge" },
      { value: "International Baccalaureate", label: "International Baccalaureate" },
      { value: "National", label: "National" },
      { value: "Montessori", label: "Montessori" },
      { value: "STEM", label: "STEM" },
      { value: "American", label: "American" },
      { value: "British", label: "British" }
    ];
    
    res.json(curriculumTypes);
  } catch (error) {
    console.error("Failed to fetch curriculum types:", error);
    res.status(500).json({ error: "Failed to fetch curriculum types" });
  }
});

// Get school types
filterDataRouter.get("/school-types", async (req: Request, res: Response) => {
  try {
    const schoolTypes = [
      { value: "Public", label: "Public" },
      { value: "Private", label: "Private" },
      { value: "Charter", label: "Charter" },
      { value: "International", label: "International" },
      { value: "Montessori", label: "Montessori" },
      { value: "Religious", label: "Religious" },
      { value: "Boarding", label: "Boarding" },
      { value: "Special Education", label: "Special Education" }
    ];
    
    res.json(schoolTypes);
  } catch (error) {
    console.error("Failed to fetch school types:", error);
    res.status(500).json({ error: "Failed to fetch school types" });
  }
});

// Get grade levels
filterDataRouter.get("/grade-levels", async (req: Request, res: Response) => {
  try {
    const gradeLevels = [
      { value: "preschool", label: "Preschool" },
      { value: "elementary", label: "Elementary" },
      { value: "middle", label: "Middle School" },
      { value: "high", label: "High School" },
      { value: "college", label: "College" }
    ];
    
    res.json(gradeLevels);
  } catch (error) {
    console.error("Failed to fetch grade levels:", error);
    res.status(500).json({ error: "Failed to fetch grade levels" });
  }
});

// Get locations
filterDataRouter.get("/locations", async (req: Request, res: Response) => {
  try {
    const locations = [
      { value: "Lahore", label: "Lahore" },
      { value: "Karachi", label: "Karachi" },
      { value: "Islamabad", label: "Islamabad" },
      { value: "Rawalpindi", label: "Rawalpindi" },
      { value: "Faisalabad", label: "Faisalabad" },
      { value: "Multan", label: "Multan" },
      { value: "Peshawar", label: "Peshawar" },
      { value: "Quetta", label: "Quetta" }
    ];
    
    res.json(locations);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});
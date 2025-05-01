import { db } from "./db";
import { schools, users, type InsertSchool, type InsertUser } from "@shared/schema";

async function seedDatabase() {
  console.log("Starting database seeding...");
  
  // First check if we already have schools in the database
  const existingSchools = await db.select({ count: { value: schools.id } }).from(schools);
  const schoolCount = Number(existingSchools[0]?.count?.value) || 0;
  
  // Check if we already have users in the database
  const existingUsers = await db.select({ count: { value: users.id } }).from(users);
  const userCount = Number(existingUsers[0]?.count?.value) || 0;
  
  // If we have schools but no users, seed users
  if (schoolCount > 0 && userCount === 0) {
    console.log(`Seeding users...`);
    await seedUsers();
  }
  
  if (schoolCount > 0) {
    console.log(`Database already has ${schoolCount} schools. Skipping school seeding.`);
    return;
  }

  // Add initial schools from Pakistan
  const schoolsData: InsertSchool[] = [
    {
      name: "Aitchison College",
      description: "One of Pakistan's most prestigious academic institutions with a rich history and top-tier facilities",
      location: "Lahore",
      address: "Shahrah-e-Quaid-e-Azam, Mall Road, Lahore",
      type: "International",
      imageUrl: "https://images.unsplash.com/photo-1583306346437-f79b4a167d53",
      rating: 49, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Primary to College (K-12)",
      classSize: "18-25",
      tuitionRange: "PKR 120,000 - 350,000 per quarter",
      hasFinancialAid: true,
      features: ["Sports Facilities", "Science Lab", "Library", "Swimming Pool", "Cafeteria"],
      coordinates: { lat: 31.5565, lng: 74.3430 }
    },
    {
      name: "Karachi Grammar School",
      description: "One of the oldest and most prestigious schools in Pakistan offering Cambridge curriculum",
      location: "Karachi",
      address: "Clifton, Karachi",
      type: "International",
      imageUrl: "https://images.unsplash.com/photo-1623528653451-aacd9b50cc1a",
      rating: 48, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to College (A-Levels)",
      classSize: "15-25",
      tuitionRange: "PKR 90,000 - 320,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities"],
      coordinates: { lat: 24.8307, lng: 67.0339 }
    },
    {
      name: "Lahore Grammar School",
      description: "Premier educational institution known for academic excellence and extra-curricular achievements",
      location: "Lahore",
      address: "Various branches in Lahore",
      type: "International",
      imageUrl: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0",
      rating: 47, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to College (A-Levels)",
      classSize: "20-30",
      tuitionRange: "PKR 80,000 - 280,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Art Studio"],
      coordinates: { lat: 31.5204, lng: 74.3587 }
    },
    {
      name: "The City School",
      description: "Nationwide network of schools offering Cambridge curriculum with a strong focus on holistic development",
      location: "Multiple Cities",
      address: "Branches across Pakistan",
      type: "International",
      imageUrl: "https://images.unsplash.com/photo-1599687266725-44b888573afb",
      rating: 45, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to College (A-Levels)",
      classSize: "25-35",
      tuitionRange: "PKR 60,000 - 240,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Transportation"],
      coordinates: { lat: 30.1830, lng: 71.4233 }
    },
    {
      name: "Beaconhouse School System",
      description: "One of the largest private school networks in Pakistan with international standards",
      location: "Multiple Cities",
      address: "Branches across Pakistan",
      type: "International",
      imageUrl: "https://images.unsplash.com/photo-1594608661623-aa0bd3a69799",
      rating: 45, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to College (O/A Levels)",
      classSize: "25-35",
      tuitionRange: "PKR 55,000 - 230,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Transportation"],
      coordinates: { lat: 33.6844, lng: 73.0479 }
    },
    {
      name: "Roots Millennium Schools",
      description: "Forward-thinking educational institution with a focus on technology and innovation",
      location: "Islamabad",
      address: "Multiple branches in Islamabad",
      type: "STEM",
      imageUrl: "https://images.unsplash.com/photo-1610008885395-d4b47f72c264",
      rating: 44, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to College (A-Levels)",
      classSize: "20-30",
      tuitionRange: "PKR 70,000 - 260,000 per quarter",
      hasFinancialAid: true,
      features: ["Robotics", "Coding", "Science Lab", "Computer Lab", "Sports Facilities"],
      coordinates: { lat: 33.7294, lng: 73.0931 }
    },
    {
      name: "Froebel's International School",
      description: "Progressive educational institution emphasizing critical thinking and creativity",
      location: "Islamabad",
      address: "F-7 Markaz, Islamabad",
      type: "International",
      imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b",
      rating: 43, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to College (A-Levels)",
      classSize: "20-25",
      tuitionRange: "PKR 75,000 - 250,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Arts and Crafts", "Music"],
      coordinates: { lat: 33.7155, lng: 73.0538 }
    },
    {
      name: "PECHS Girls' School",
      description: "An established all-girls institution known for academic excellence and character building",
      location: "Karachi",
      address: "PECHS, Karachi",
      type: "Matric/Federal",
      imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952",
      rating: 42, // out of 50
      curriculumType: "Matric/Federal",
      gradeRange: "Nursery to Matric",
      classSize: "30-40",
      tuitionRange: "PKR 40,000 - 130,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Islamic Studies"],
      coordinates: { lat: 24.8673, lng: 67.0455 }
    },
    {
      name: "Islamabad Model College",
      description: "A federal government institution known for quality education at affordable rates",
      location: "Islamabad",
      address: "Various sectors in Islamabad",
      type: "Matric/Federal",
      imageUrl: "https://images.unsplash.com/photo-1613896527026-f195775d3dba",
      rating: 40, // out of 50
      curriculumType: "Matric/Federal",
      gradeRange: "Primary to Intermediate",
      classSize: "35-45",
      tuitionRange: "PKR 15,000 - 50,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities"],
      coordinates: { lat: 33.6938, lng: 73.0652 }
    },
    {
      name: "Dawood Public School",
      description: "An all-girls school with a blend of academic focus and extra-curricular activities",
      location: "Karachi",
      address: "Korangi Road, Karachi",
      type: "Cambridge",
      imageUrl: "https://images.unsplash.com/photo-1571491198112-24c15f19339c",
      rating: 41, // out of 50
      curriculumType: "Cambridge",
      gradeRange: "Playgroup to O-Levels",
      classSize: "25-35",
      tuitionRange: "PKR 55,000 - 200,000 per quarter",
      hasFinancialAid: true,
      features: ["Science Lab", "Computer Lab", "Library", "Sports Facilities", "Art Studio"],
      coordinates: { lat: 24.8724, lng: 67.0820 }
    }
  ];
  
  try {
    // Insert all the schools at once
    const insertedSchools = await db.insert(schools).values(schoolsData).returning();
    console.log(`Successfully seeded ${insertedSchools.length} schools`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function seedUsers() {
  const userData: InsertUser[] = [
    {
      username: "user1",
      password: "password1",
      email: "user1@example.com",
      fullName: "Regular User",
      role: "user"
    },
    {
      username: "schooladmin",
      password: "admin123",
      email: "admin@aitchison.edu.pk",
      fullName: "Aitchison College Admin",
      role: "schoolAdmin"
    },
    {
      username: "platformadmin",
      password: "admin456",
      email: "admin@smartschoolfinder.pk",
      fullName: "Platform Administrator",
      role: "platformAdmin"
    }
  ];
  
  try {
    const insertedUsers = await db.insert(users).values(userData).returning();
    console.log(`Successfully seeded ${insertedUsers.length} users`);
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

export { seedDatabase };
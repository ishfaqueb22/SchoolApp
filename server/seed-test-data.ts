import { db } from './db';
import { faculty, campuses, inquiries, schoolPosts, schoolMedia } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { seedContentData } from './seed-content';

export async function seedTestData() {
  try {
    console.log("Starting test data seeding...");
    
    // Add test faculty
    const facultyMembers = [
      {
        schoolId: 1,
        name: "Dr. Ahmed Khan",
        position: "Principal",
        department: "Administration",
        education: "PhD Education, University of Karachi",
        bio: "20+ years of experience in educational leadership",
        email: "ahmed.khan@school.com",
        imageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
        isActive: true
      },
      {
        schoolId: 1,
        name: "Ms. Fatima Ali",
        position: "Vice Principal",
        department: "Administration",
        education: "Masters in Education, Lahore University",
        bio: "Specialized in curriculum development",
        email: "fatima.ali@school.com",
        imageUrl: "https://randomuser.me/api/portraits/women/2.jpg",
        isActive: true
      },
      {
        schoolId: 1,
        name: "Mr. Hassan Ahmed",
        position: "Head of Science",
        department: "Science",
        education: "MSc Physics, University of Punjab",
        bio: "Former researcher at PAEC",
        email: "hassan.ahmed@school.com",
        imageUrl: "https://randomuser.me/api/portraits/men/3.jpg",
        isActive: true
      },
      {
        schoolId: 1,
        name: "Ms. Ayesha Khan",
        position: "Mathematics Teacher",
        department: "Mathematics",
        education: "BSc Mathematics, University of Karachi",
        bio: "Specialized in teaching A-level Mathematics",
        email: "ayesha.khan@school.com",
        imageUrl: "https://randomuser.me/api/portraits/women/4.jpg",
        isActive: true
      },
      {
        schoolId: 1,
        name: "Mr. Bilal Malik",
        position: "English Teacher",
        department: "Languages",
        education: "MA English Literature, GCU Lahore",
        bio: "Published author and experienced educator",
        email: "bilal.malik@school.com",
        imageUrl: "https://randomuser.me/api/portraits/men/5.jpg",
        isActive: true
      }
    ];

    // Add test campuses
    const campusData = [
      {
        schoolId: 1,
        name: "Main Campus",
        location: "Lahore",
        address: "Mall Road, Lahore",
        description: "The historic main campus established in 1886",
        imageUrl: "https://images.unsplash.com/photo-1583306346437-f79b4a167d53",
        establishedYear: "1886",
        contactEmail: "main@aitchison.edu.pk",
        contactPhone: "+92-42-111-222-333",
        facilities: ["Library", "Sports Complex", "Science Labs", "Swimming Pool"],
        studentCount: 1200
      },
      {
        schoolId: 1,
        name: "Junior Section",
        location: "Lahore",
        address: "Mall Road, Lahore",
        description: "Dedicated campus for junior students from KG to Grade 5",
        imageUrl: "https://images.unsplash.com/photo-1543505298-b8be9b52a21a",
        establishedYear: "1895",
        contactEmail: "junior@aitchison.edu.pk",
        contactPhone: "+92-42-111-222-444",
        facilities: ["Playground", "Computer Lab", "Art Studio", "Cafeteria"],
        studentCount: 800
      },
      {
        schoolId: 1,
        name: "Prep School",
        location: "Lahore",
        address: "Mall Road, Lahore",
        description: "Middle school campus for Grades 6-8",
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7",
        establishedYear: "1890",
        contactEmail: "prep@aitchison.edu.pk",
        contactPhone: "+92-42-111-222-555",
        facilities: ["Library", "Sports Fields", "Auditorium", "Laboratories"],
        studentCount: 650
      }
    ];

    // Add test inquiries
    const inquiryData = [
      {
        schoolId: 1,
        name: "Muhammad Ali",
        email: "mali@example.com",
        phone: "+92-300-1234567",
        message: "I would like information about admission for my son in Grade 5 for the upcoming academic year. What are the requirements and fee structure?",
        forGrade: "Grade 5",
        status: "new"
      },
      {
        schoolId: 1,
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "+92-321-2345678",
        message: "We are relocating to Lahore from Islamabad and I'm interested in A-levels program. Could you please share details on the curriculum and faculty?",
        forGrade: "A-levels",
        status: "pending"
      },
      {
        schoolId: 1,
        name: "Imran Ahmed",
        email: "iahmed@example.com",
        phone: "+92-333-3456789",
        message: "I'd like to schedule a campus tour next week. Is there a specific time and day that would be most convenient?",
        forGrade: "Grade 7",
        status: "responded"
      },
      {
        schoolId: 1,
        name: "Sadia Malik",
        email: "sadia.m@example.com",
        phone: "+92-311-4567890",
        message: "Do you offer any scholarships or financial aid? My daughter is exceptionally talented in mathematics and sciences.",
        forGrade: "Grade 9",
        status: "new"
      },
      {
        schoolId: 1,
        name: "Faisal Khan",
        email: "fkhan@example.com",
        phone: "+92-345-5678901",
        message: "We are interested in the sports programs offered at your school. Could you share details about sports facilities and coaching?",
        forGrade: "Grade 8",
        status: "new"
      }
    ];

    // Add test school posts
    const postData = [
      {
        schoolId: 1,
        title: "Annual Sports Day 2025",
        content: "We are excited to announce our Annual Sports Day will be held on April 25th, 2025. All students, parents, and alumni are invited to join us for this celebration of athletic excellence. Events will include track and field competitions, team sports finals, and special performances by our students.",
        type: "event",
        imageUrl: "https://images.unsplash.com/photo-1473976345543-9ffc928e648d",
        eventDate: new Date("2025-04-25"),
        postedBy: 4,
        isPublished: true
      },
      {
        schoolId: 1,
        title: "Science Fair 2025",
        content: "The annual Science Fair will take place on May 10th, 2025. Students from all grades are encouraged to participate by submitting their innovative science projects. This year's theme is 'Sustainable Solutions for Tomorrow.'",
        type: "event",
        imageUrl: "https://images.unsplash.com/photo-1544916739-dc2268f97c73",
        eventDate: new Date("2025-05-10"),
        postedBy: 4,
        isPublished: true
      },
      {
        schoolId: 1,
        title: "National Academic Excellence Award",
        content: "We are proud to announce that our school has been awarded the National Academic Excellence Award for the fifth consecutive year. This recognition is a testament to the hard work of our students, the dedication of our faculty, and the support of our parent community.",
        type: "news",
        imageUrl: "https://images.unsplash.com/photo-1527838832700-5059252407fa",
        postedBy: 4,
        isPublished: true
      },
      {
        schoolId: 1,
        title: "New Science Block Opening",
        content: "We are pleased to announce the opening of our state-of-the-art Science Block next month. This new facility includes modern laboratories for physics, chemistry, and biology, as well as a dedicated research space for our senior students.",
        type: "announcement",
        imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
        postedBy: 4,
        isPublished: true
      },
      {
        schoolId: 1,
        title: "Parent-Teacher Meeting",
        content: "The semester Parent-Teacher Meeting is scheduled for April 30th, 2025. Parents are requested to book their time slots through the school portal. This is an important opportunity to discuss your child's academic progress and address any concerns.",
        type: "event",
        imageUrl: "https://images.unsplash.com/photo-1577896852618-0f8fcb50e3e0",
        eventDate: new Date("2025-04-30"),
        postedBy: 4,
        isPublished: true
      }
    ];

    // Add test media for schools
    const mediaData = [
      {
        schoolId: 1,
        type: "image",
        title: "Main Building",
        description: "Historic main building of Aitchison College",
        url: "https://images.unsplash.com/photo-1544979590-37e9b47eb785",
        thumbnail: "https://images.unsplash.com/photo-1544979590-37e9b47eb785?w=200",
        order: 1,
        isPublic: true,
        createdBy: 4
      },
      {
        schoolId: 1,
        type: "image",
        title: "Sports Complex",
        description: "State-of-the-art sports facilities",
        url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
        thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200",
        order: 2,
        isPublic: true,
        createdBy: 4
      },
      {
        schoolId: 1,
        type: "image",
        title: "Science Lab",
        description: "Modern science laboratory",
        url: "https://images.unsplash.com/photo-1576153192396-180ecef2a715",
        thumbnail: "https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=200",
        order: 3,
        isPublic: true,
        createdBy: 4
      },
      {
        schoolId: 1,
        type: "image",
        title: "Library",
        description: "Our extensive library collection",
        url: "https://images.unsplash.com/photo-1568667256549-094345857637",
        thumbnail: "https://images.unsplash.com/photo-1568667256549-094345857637?w=200",
        order: 4,
        isPublic: true,
        createdBy: 4
      },
      {
        schoolId: 1,
        type: "video",
        title: "Campus Tour",
        description: "A virtual tour of our beautiful campus",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1544979590-37e9b47eb785?w=200",
        order: 5,
        isPublic: true,
        createdBy: 4
      },
      {
        schoolId: 2,
        type: "image",
        title: "Karachi Grammar School Campus",
        description: "Main campus view",
        url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
        thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200",
        order: 1,
        isPublic: true,
        createdBy: 5
      },
      {
        schoolId: 2,
        type: "image",
        title: "Art Studio",
        description: "Our creative arts studio",
        url: "https://images.unsplash.com/photo-1598237601465-af66b7475e92",
        thumbnail: "https://images.unsplash.com/photo-1598237601465-af66b7475e92?w=200",
        order: 2,
        isPublic: true,
        createdBy: 5
      }
    ];

    // Check if data already exists
    const existingFaculty = await db.select({ count: sql`count(*)` }).from(faculty);
    const facultyCount = parseInt(existingFaculty[0].count.toString());
    
    const existingCampuses = await db.select({ count: sql`count(*)` }).from(campuses);
    const campusCount = parseInt(existingCampuses[0].count.toString());
    
    const existingInquiries = await db.select({ count: sql`count(*)` }).from(inquiries);
    const inquiryCount = parseInt(existingInquiries[0].count.toString());
    
    const existingPosts = await db.select({ count: sql`count(*)` }).from(schoolPosts);
    const postCount = parseInt(existingPosts[0].count.toString());
    
    const existingMedia = await db.select({ count: sql`count(*)` }).from(schoolMedia);
    const mediaCount = parseInt(existingMedia[0].count.toString());

    // Seed faculty if none exist
    if (facultyCount === 0) {
      console.log("Seeding faculty data...");
      for (const member of facultyMembers) {
        await db.insert(faculty).values(member);
      }
      console.log(`Added ${facultyMembers.length} faculty members`);
    } else {
      console.log(`Database already has ${facultyCount} faculty members. Skipping faculty seeding.`);
    }

    // Seed campuses if none exist
    if (campusCount === 0) {
      console.log("Seeding campus data...");
      for (const campus of campusData) {
        await db.insert(campuses).values(campus);
      }
      console.log(`Added ${campusData.length} campuses`);
    } else {
      console.log(`Database already has ${campusCount} campuses. Skipping campus seeding.`);
    }

    // Seed inquiries if none exist
    if (inquiryCount === 0) {
      console.log("Seeding inquiry data...");
      for (const inquiry of inquiryData) {
        await db.insert(inquiries).values(inquiry);
      }
      console.log(`Added ${inquiryData.length} inquiries`);
    } else {
      console.log(`Database already has ${inquiryCount} inquiries. Skipping inquiry seeding.`);
    }

    // Seed posts if none exist
    if (postCount === 0) {
      console.log("Seeding school post data...");
      for (const post of postData) {
        await db.insert(schoolPosts).values(post);
      }
      console.log(`Added ${postData.length} school posts`);
    } else {
      console.log(`Database already has ${postCount} school posts. Skipping post seeding.`);
    }
    
    // Seed media if none exist
    if (mediaCount === 0) {
      console.log("Seeding school media data...");
      for (const media of mediaData) {
        await db.insert(schoolMedia).values(media);
      }
      console.log(`Added ${mediaData.length} school media items`);
    } else {
      console.log(`Database already has ${mediaCount} school media items. Skipping media seeding.`);
    }

    // Seed content data
    await seedContentData();
    
    console.log("Test data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding test data:", error);
  }
}
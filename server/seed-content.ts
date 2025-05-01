import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  faqItems, 
  contentPages, 
  categories,
  blogPosts,
  type InsertFaqItem,
  type InsertContentPage,
  type InsertCategory,
  type InsertBlogPost
} from "@shared/schema";

/**
 * Seeds the content tables with initial data
 */
export async function seedContentData() {
  console.log("Starting content data seeding...");

  // Check if we already have content in the database
  const existingFaqs = await db.select({ count: { value: faqItems.id } }).from(faqItems);
  const faqCount = Number(existingFaqs[0]?.count?.value) || 0;

  const existingPages = await db.select({ count: { value: contentPages.id } }).from(contentPages);
  const pageCount = Number(existingPages[0]?.count?.value) || 0;

  const existingCategories = await db.select({ count: { value: categories.id } }).from(categories);
  const categoryCount = Number(existingCategories[0]?.count?.value) || 0;

  const existingBlogPosts = await db.select({ count: { value: blogPosts.id } }).from(blogPosts);
  const blogPostCount = Number(existingBlogPosts[0]?.count?.value) || 0;

  // Seed FAQ items if none exist
  if (faqCount === 0) {
    await seedFaqItems();
  } else {
    console.log(`Database already has ${faqCount} FAQ items. Skipping FAQ seeding.`);
  }

  // Seed content pages if none exist
  if (pageCount === 0) {
    await seedContentPages();
  } else {
    console.log(`Database already has ${pageCount} content pages. Skipping content page seeding.`);
  }

  // Seed categories if none exist
  if (categoryCount === 0) {
    await seedCategories();
  } else {
    console.log(`Database already has ${categoryCount} categories. Skipping category seeding.`);
  }

  // Seed blog posts if none exist
  if (blogPostCount === 0) {
    await seedBlogPosts();
  } else {
    console.log(`Database already has ${blogPostCount} blog posts. Skipping blog post seeding.`);
  }

  console.log("Content data seeding completed successfully");
}

/**
 * Seeds the FAQ items table with initial data
 */
async function seedFaqItems() {
  // First, we need to check if we have a General category for FAQs
  // If not, create one
  let categoryId = 1; // Default category ID

  try {
    const generalCategory = await db.execute(
      sql`SELECT id FROM categories WHERE name = 'FAQ Categories' AND type = 'faq' LIMIT 1`
    );
    
    if (!generalCategory.rows || generalCategory.rows.length === 0) {
      const result = await db.execute(
        sql`INSERT INTO categories (name, description, slug, type, created_at, updated_at) 
            VALUES ('FAQ Categories', 'FAQ categories', 'faq-categories', 'faq', NOW(), NOW()) RETURNING id`
      );
      categoryId = result.rows[0].id;
    } else {
      categoryId = parseInt(generalCategory.rows[0].id);
    }
  } catch (error) {
    console.error("Error checking/creating FAQ category:", error);
    // Continue with the default category ID
  }

  const faqData = [
    {
      question: "How does SmartSchool Finder work?",
      answer: "SmartSchool Finder uses your preferences, location data, and our comprehensive database of schools across Pakistan to match you with schools that best fit your needs. You can browse schools, compare them side by side, and connect directly with admissions offices.",
      category_id: categoryId,
      order_index: 1
    },
    {
      question: "Are all major cities in Pakistan covered?",
      answer: "Yes, we cover all major cities including Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Faisalabad, Multan and many other areas. We are continuously expanding our database to include more schools from smaller cities and towns.",
      category_id: categoryId,
      order_index: 2
    },
    {
      question: "Does SmartSchool Finder include information about fee structures?",
      answer: "Yes, we provide fee ranges for most schools to give you an idea of the investment required. However, we always recommend confirming the exact fee structure directly with schools as they may vary based on grade level, additional facilities, and can change annually.",
      category_id: categoryId,
      order_index: 3
    },
    {
      question: "Is SmartSchool Finder free to use?",
      answer: "Basic features like school search, profiles, and comparisons are completely free. We offer premium features for families who need additional assistance, such as personalized consultation, priority application support, and enhanced comparison tools starting at PKR 5,000.",
      category_id: categoryId,
      order_index: 4
    },
    {
      question: "Can I schedule school tours through SmartSchool Finder?",
      answer: "Yes, for many partner schools in major cities, you can schedule tours directly through our platform. For other schools, we provide contact information and guidance on setting up visits. We also offer virtual tours for some schools so you can get a feel for the campus before visiting in person.",
      category_id: categoryId,
      order_index: 5
    }
  ];

  try {
    // Using raw SQL instead of Drizzle's typed insert, since our schema doesn't match the actual DB
    for (const faq of faqData) {
      await db.execute(
        sql`INSERT INTO faq_items (question, answer, category_id, order_index, created_at, updated_at) 
            VALUES (${faq.question}, ${faq.answer}, ${faq.category_id}, ${faq.order_index}, NOW(), NOW())`
      );
    }
    console.log(`Successfully seeded ${faqData.length} FAQ items`);
  } catch (error) {
    console.error("Error seeding FAQ items:", error);
  }
}

/**
 * Seeds the content pages table with initial data
 */
async function seedContentPages() {
  // We need to modify our data to match the actual database schema
  const contentPageData = [
    {
      title: "About Us",
      slug: "about-us",
      content: `
        <h1>About SmartSchool Finder</h1>
        <p>SmartSchool Finder is Pakistan's premier education platform connecting families with the right schools for their children.</p>
        <p>Founded in 2022, we've helped thousands of families navigate the complex world of education choices in Pakistan.</p>
        
        <h2>Our Mission</h2>
        <p>To simplify the school selection process and ensure every child in Pakistan has access to quality education that meets their unique needs.</p>
        
        <h2>Our Vision</h2>
        <p>A Pakistan where every student attends a school that nurtures their talents, builds their character, and prepares them for future success.</p>
        
        <h2>Our Team</h2>
        <p>SmartSchool Finder is powered by a dedicated team of education specialists, technology experts, and parents who understand the challenges of finding the right school.</p>
      `,
      is_published: true,
      meta_description: "Learn about SmartSchool Finder, Pakistan's leading platform connecting families with the right schools for their children since 2022.",
      published_at: new Date()
    },
    {
      title: "How It Works",
      slug: "how-it-works",
      content: `
        <h1>How SmartSchool Finder Works</h1>
        <p>Discovering the perfect school for your child is just a few steps away.</p>
        
        <h2>1. Explore Schools</h2>
        <p>Browse our comprehensive database of schools across Pakistan. Filter by location, curriculum, fee structure, and many other criteria.</p>
        
        <h2>2. Compare Options</h2>
        <p>Select up to three schools to compare side-by-side across important factors like academic programs, facilities, extracurriculars, and more.</p>
        
        <h2>3. Connect Directly</h2>
        <p>Reach out to schools that interest you directly through our platform. Schedule visits, ask questions, and get the information you need.</p>
        
        <h2>4. Take Our School Matching Quiz</h2>
        <p>Not sure where to start? Take our personalized school matching quiz to receive tailored recommendations based on your child's needs and your family's preferences.</p>
        
        <h2>5. Get Expert Guidance</h2>
        <p>For premium members, our education consultants provide personalized guidance throughout the school selection process.</p>
      `,
      is_published: true,
      meta_description: "Learn how to use SmartSchool Finder to discover, compare, and connect with the perfect school for your child in Pakistan.",
      published_at: new Date()
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: `
        <h1>Privacy Policy</h1>
        <p>Last Updated: April 1, 2025</p>
        
        <h2>Introduction</h2>
        <p>At SmartSchool Finder, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
        
        <h2>Information We Collect</h2>
        <p>We collect information that you provide directly to us, such as when you create an account, fill out a form, or communicate with us. This may include your name, email address, phone number, and information about your education preferences.</p>
        
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience.</p>
        
        <h2>Information Sharing</h2>
        <p>We may share your information with schools you express interest in, with your consent. We do not sell your personal information to third parties.</p>
        
        <h2>Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information.</p>
        
        <h2>Your Choices</h2>
        <p>You may update your account information or opt out of marketing communications at any time.</p>
        
        <h2>Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at privacy@smartschoolfinder.pk.</p>
      `,
      is_published: true,
      meta_description: "Read our privacy policy to understand how SmartSchool Finder collects, uses, and protects your personal information.",
      published_at: new Date()
    }
  ];

  try {
    // Using raw SQL instead of Drizzle's typed insert, since our schema doesn't match the actual DB
    for (const page of contentPageData) {
      await db.execute(
        sql`INSERT INTO content_pages (title, slug, content, is_published, meta_description, published_at, created_at, updated_at) 
            VALUES (${page.title}, ${page.slug}, ${page.content}, ${page.is_published}, ${page.meta_description}, ${page.published_at}, NOW(), NOW())`
      );
    }
    console.log(`Successfully seeded ${contentPageData.length} content pages`);
  } catch (error) {
    console.error("Error seeding content pages:", error);
  }
}

/**
 * Seeds the categories table with initial data
 */
async function seedCategories() {
  const categoryData: InsertCategory[] = [
    {
      name: "School Categories",
      description: "Categories of schools based on curriculum and focus",
      slug: "school-categories",
      type: "school",
      color: "#4f46e5",
      icon: "school"
    },
    {
      name: "International Baccalaureate",
      description: "Schools offering the International Baccalaureate curriculum",
      slug: "international-baccalaureate",
      type: "school",
      parentId: 1,
      color: "#0ea5e9",
      icon: "globe"
    },
    {
      name: "Cambridge",
      description: "Schools offering the Cambridge curriculum (O/A Levels)",
      slug: "cambridge",
      type: "school",
      parentId: 1,
      color: "#10b981",
      icon: "graduation-cap"
    },
    {
      name: "Matric/Federal",
      description: "Schools following the Pakistani National Curriculum",
      slug: "matric-federal",
      type: "school",
      parentId: 1,
      color: "#f59e0b",
      icon: "book"
    },
    {
      name: "Montessori",
      description: "Schools that employ the Montessori educational approach",
      slug: "montessori",
      type: "school",
      parentId: 1,
      color: "#ec4899",
      icon: "users"
    },
    {
      name: "STEM Focus",
      description: "Schools with strong emphasis on Science, Technology, Engineering and Mathematics",
      slug: "stem-focus",
      type: "school",
      parentId: 1,
      color: "#8b5cf6",
      icon: "flask"
    },
    {
      name: "Blog Categories",
      description: "Categories for blog posts",
      slug: "blog-categories",
      type: "blog",
      color: "#6366f1",
      icon: "newspaper"
    },
    {
      name: "Education News",
      description: "Latest news and updates from the education sector",
      slug: "education-news",
      type: "blog",
      parentId: 7,
      color: "#0ea5e9",
      icon: "rss"
    },
    {
      name: "Parenting Tips",
      description: "Helpful tips and guidance for parents",
      slug: "parenting-tips",
      type: "blog",
      parentId: 7,
      color: "#f43f5e",
      icon: "heart"
    },
    {
      name: "School Selection",
      description: "Guides on how to choose the right school for your child",
      slug: "school-selection",
      type: "blog",
      parentId: 7,
      color: "#84cc16",
      icon: "check-circle"
    }
  ];

  try {
    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`Successfully seeded ${insertedCategories.length} categories`);
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
}

/**
 * Seeds the blog posts table with initial data
 */
export async function seedBlogPosts() {
  // Check if we already have blog posts in the database
  const existingPosts = await db.select({ count: { value: blogPosts.id } }).from(blogPosts);
  const postCount = Number(existingPosts[0]?.count?.value) || 0;

  if (postCount > 0) {
    console.log(`Database already has ${postCount} blog posts. Skipping blog post seeding.`);
    return;
  }

  // Use admin user (ID 3) as the author
  const adminUserId = 3;
  
  // Define category IDs
  const schoolSelectionCategoryId = 1; // Educational Guidance category
  const educationNewsCategoryId = 2;   // Education News category

  const blogPostData: InsertBlogPost[] = [
    {
      title: "How to Choose the Right School for Your Child in Pakistan",
      slug: "how-to-choose-right-school-for-child-pakistan",
      summary: "Selecting the right school is one of the most important decisions parents make. Here's a comprehensive guide to help you navigate the process in Pakistan.",
      content: `
        <h1>How to Choose the Right School for Your Child in Pakistan</h1>
        
        <p>Selecting the right school is one of the most important decisions you'll make as a parent. In Pakistan's diverse educational landscape, with options ranging from traditional Matric/Federal schools to international curricula like Cambridge and IB, the choice can feel overwhelming.</p>
        
        <p>Here's a comprehensive guide to help you navigate the process:</p>
        
        <h2>1. Understand Your Child's Needs</h2>
        
        <p>Before looking at schools, take time to understand your child's:</p>
        <ul>
          <li>Learning style: Does your child thrive in structured environments or need more creative freedom?</li>
          <li>Interests and strengths: Is your child artistically inclined, scientifically curious, or athletically gifted?</li>
          <li>Personality: Is your child outgoing and adaptable or more reserved and in need of individualized attention?</li>
          <li>Special needs: Does your child require any specific learning support?</li>
        </ul>
        
        <h2>2. Consider Your Family's Values and Practical Needs</h2>
        
        <p>Think about:</p>
        <ul>
          <li>Educational philosophy: Do you prefer traditional methods or progressive approaches?</li>
          <li>Religious and cultural values: How important is religious education or cultural alignment?</li>
          <li>Location and transportation: What's a manageable commute for your family?</li>
          <li>Budget: What can your family reasonably afford for tuition and additional costs?</li>
          <li>Long-term educational goals: Are you looking toward specific universities or careers?</li>
        </ul>
        
        <h2>3. Research Different Curricula</h2>
        
        <p>Pakistan offers several curricula options:</p>
        <ul>
          <li><strong>Matric/Federal:</strong> The national curriculum, leading to Secondary School Certificate (SSC) and Higher Secondary School Certificate (HSSC)</li>
          <li><strong>Cambridge:</strong> The British curriculum leading to O and A Levels</li>
          <li><strong>International Baccalaureate (IB):</strong> A globally recognized program emphasizing critical thinking</li>
          <li><strong>American:</strong> Following the US education system, culminating in a High School Diploma</li>
          <li><strong>Hybrid systems:</strong> Some schools offer combinations of these curricula</li>
        </ul>
        
        <p>Each has its strengths, weaknesses, and implications for university admissions both locally and internationally.</p>
        
        <h2>4. Create a Shortlist</h2>
        
        <p>Use tools like SmartSchool Finder to:</p>
        <ul>
          <li>Filter schools by location, curriculum, fee range, and other factors</li>
          <li>Read reviews from other parents</li>
          <li>Compare schools side by side</li>
          <li>Take note of application deadlines and admission requirements</li>
        </ul>
        
        <h2>5. Visit Schools and Ask Questions</h2>
        
        <p>Nothing replaces an in-person visit. When touring schools, observe:</p>
        <ul>
          <li>Classroom environment and teaching methods</li>
          <li>Student engagement and behavior</li>
          <li>Facilities and resources</li>
          <li>Safety and security measures</li>
        </ul>
        
        <p>Ask questions about:</p>
        <ul>
          <li>Teacher qualifications and turnover rate</li>
          <li>Class sizes and student-teacher ratio</li>
          <li>Academic performance metrics</li>
          <li>Extracurricular offerings</li>
          <li>Approach to homework and assessments</li>
          <li>Support for different learning needs</li>
          <li>Parent involvement opportunities</li>
        </ul>
        
        <h2>6. Trust Your Instincts</h2>
        
        <p>After gathering all this information, trust your parental instinct. The right school should feel like a place where your child will be safe, happy, challenged appropriately, and respected for who they are.</p>
        
        <p>Remember that no school is perfect, and the best choice is one that aligns most closely with your child's needs and your family's values at this point in time. Don't be afraid to reevaluate if circumstances change or if your child's needs evolve.</p>
        
        <h2>7. Prepare for Admission</h2>
        
        <p>Once you've made your choice:</p>
        <ul>
          <li>Understand the admission process and timeline</li>
          <li>Prepare your child for any entrance exams or interviews</li>
          <li>Gather all required documentation</li>
          <li>Plan for financial commitments (tuition, uniforms, books, etc.)</li>
        </ul>
        
        <p>By taking a thoughtful, systematic approach to school selection, you'll be well on your way to finding an educational environment where your child can thrive academically, socially, and emotionally.</p>
      `,
      categoryId: schoolSelectionCategoryId,
      featuredImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
      authorId: adminUserId,
      publishedAt: new Date()
    },
    {
      title: "Understanding Different Curriculum Options in Pakistani Schools",
      slug: "understanding-curriculum-options-pakistani-schools",
      summary: "A comprehensive comparison of Matric/Federal, Cambridge, and IB curricula available in Pakistan to help parents make informed decisions.",
      content: `
        <h1>Understanding Different Curriculum Options in Pakistani Schools</h1>
        
        <p>One of the most significant decisions parents face when choosing a school in Pakistan is selecting the right curriculum. The curriculum forms the foundation of a child's education, influencing not only what they learn but how they learn and what opportunities will be available to them in the future.</p>
        
        <p>Here's a detailed comparison of the major curriculum options available in Pakistani schools:</p>
        
        <h2>Pakistani National Curriculum (Matric/Federal)</h2>
        
        <h3>Overview:</h3>
        <p>Developed by the Ministry of Education, the national curriculum leads to Secondary School Certificate (SSC/Matric) after grade 10 and Higher Secondary School Certificate (HSSC/Intermediate) after grade 12.</p>
        
        <h3>Strengths:</h3>
        <ul>
          <li>Most affordable option</li>
          <li>Culturally relevant content with emphasis on Pakistani history, geography, and Islamic studies</li>
          <li>Taught in both English and Urdu, supporting bilingual development</li>
          <li>Seamless pathway to Pakistani universities</li>
          <li>Extensive network of schools across urban and rural areas</li>
        </ul>
        
        <h3>Considerations:</h3>
        <ul>
          <li>Traditional teaching methods often emphasize memorization</li>
          <li>Less focus on critical thinking and practical application</li>
          <li>May require additional preparation for international university admissions</li>
          <li>Quality varies significantly between institutions</li>
        </ul>
        
        <h2>Cambridge International (O/A Levels)</h2>
        
        <h3>Overview:</h3>
        <p>The British curriculum divided into Ordinary Level (O Level) for grades 9-10 and Advanced Level (A Level) for grades 11-12, administered by Cambridge Assessment International Education.</p>
        
        <h3>Strengths:</h3>
        <ul>
          <li>Internationally recognized qualifications</li>
          <li>Emphasis on conceptual understanding and application</li>
          <li>Promotes critical thinking and analysis</li>
          <li>Flexible subject choices, especially at A Level</li>
          <li>Strong preparation for both domestic and international universities</li>
          <li>Widely available in urban centers across Pakistan</li>
        </ul>
        
        <h3>Considerations:</h3>
        <ul>
          <li>Significantly higher cost than the national curriculum</li>
          <li>Less focus on Pakistani studies and Islamic education (though schools often supplement)</li>
          <li>Examination-focused, with high-stakes testing</li>
          <li>May require equivalence certificates for some Pakistani universities</li>
        </ul>
        
        <h2>International Baccalaureate (IB)</h2>
        
        <h3>Overview:</h3>
        <p>A comprehensive program with Primary Years Programme (PYP), Middle Years Programme (MYP), and Diploma Programme (DP), focused on developing inquiring, knowledgeable students with global mindsets.</p>
        
        <h3>Strengths:</h3>
        <ul>
          <li>Holistic approach emphasizing intellectual, personal, emotional, and social growth</li>
          <li>Strong focus on inquiry-based learning and research skills</li>
          <li>Encourages international-mindedness and global perspective</li>
          <li>Rigorous academic standards with balanced assessment methods</li>
          <li>Highly regarded by top universities worldwide</li>
          <li>Emphasis on community service and extracurricular development</li>
        </ul>
        
        <h3>Considerations:</h3>
        <ul>
          <li>Most expensive option in Pakistan</li>
          <li>Limited availability - only offered at select schools in major cities</li>
          <li>Demanding workload requiring strong time management skills</li>
          <li>May require equivalence certificates for Pakistani universities</li>
        </ul>
        
        <h2>American Curriculum</h2>
        
        <h3>Overview:</h3>
        <p>Based on the US education system with Grade Point Average (GPA) assessment, culminating in an American High School Diploma, sometimes with Advanced Placement (AP) courses.</p>
        
        <h3>Strengths:</h3>
        <ul>
          <li>Continuous assessment rather than high-stakes examinations</li>
          <li>Balanced approach to academics, sports, and extracurricular activities</li>
          <li>Emphasis on project-based learning and practical skills</li>
          <li>Good preparation for US universities</li>
          <li>Flexible curriculum allowing specialization in areas of interest</li>
        </ul>
        
        <h3>Considerations:</h3>
        <ul>
          <li>High cost comparable to Cambridge and IB</li>
          <li>Very limited availability in Pakistan</li>
          <li>May require additional standardized tests (SAT/ACT) for college admissions</li>
          <li>Requires equivalence for Pakistani universities</li>
        </ul>
        
        <h2>Making the Right Choice</h2>
        
        <p>When selecting a curriculum for your child, consider:</p>
        
        <h3>Your child's learning style and aspirations:</h3>
        <ul>
          <li>Does your child thrive in structured environments or prefer more self-directed learning?</li>
          <li>Are they planning to attend university in Pakistan or abroad?</li>
          <li>Do they have specific career goals that align better with certain curriculum systems?</li>
        </ul>
        
        <h3>Practical considerations:</h3>
        <ul>
          <li>Your budget for education</li>
          <li>Available options in your location</li>
          <li>The importance of cultural and religious education</li>
          <li>Your ability to support the curriculum's demands (e.g., helping with homework, providing resources)</li>
        </ul>
        
        <p>Many schools in Pakistan now offer hybrid models that combine elements of different systems, such as Matric with Cambridge O Levels or National Curriculum with enhanced English and technology components. These can provide balanced options that draw from the strengths of multiple approaches.</p>
        
        <p>Remember that the curriculum is just one aspect of a school's overall offering. Teaching quality, school culture, facilities, and support services all play crucial roles in your child's educational experience. The best curriculum for your child is one that not only provides appropriate academic challenges but also nurtures their unique talents, supports their well-being, and prepares them for future success in an increasingly complex world.</p>
      `,
      categoryId: educationNewsCategoryId,
      featuredImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
      authorId: adminUserId,
      publishedAt: new Date()
    }
  ];

  try {
    console.log(`Attempting to seed ${blogPostData.length} blog posts...`);
    
    // Using raw SQL since our schema might not match the actual DB structure
    for (const post of blogPostData) {
      await db.execute(
        sql`INSERT INTO blog_posts (
          title, slug, content, summary, category_id, is_published, 
          featured_image, author_id, published_at, created_at, updated_at
        ) VALUES (
          ${post.title}, ${post.slug}, ${post.content}, ${post.summary}, 
          ${post.categoryId}, true, 
          ${post.featuredImage}, ${post.authorId}, ${post.publishedAt}, NOW(), NOW()
        )`
      );
    }
    
    console.log(`Successfully seeded ${blogPostData.length} blog posts`);
  } catch (error) {
    console.error("Error seeding blog posts:", error);
  }
}
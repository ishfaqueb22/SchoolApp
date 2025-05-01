# School Discovery Platform Database Schema

```
+-------------------+       +------------------+       +-------------------+
|      USERS        |       |     SCHOOLS      |       |      CAMPUSES     |
+-------------------+       +------------------+       +-------------------+
| id (PK)           |       | id (PK)          |       | id (PK)           |
| username          |       | name             |       | schoolId (FK)     |
| password          |       | description      |       | name              |
| email             |       | location         |       | location          |
| fullName          |<----->| adminId (FK)     |<----->| address           |
| role              |       | type             |       | coordinates       |
| avatarUrl         |       | imageUrl         |       | facilities        |
| schoolId (FK)     |       | rating           |       | contactInfo       |
| createdAt         |       | curriculumType   |       +-------------------+
| isActive          |       | gradeRange       |
+-------------------+       | classSize        |       +-------------------+
         |                  | tuitionRange     |       |      FACULTY      |
         |                  | hasFinancialAid  |       +-------------------+
         |                  | features         |       | id (PK)           |
         |                  | coordinates      |       | schoolId (FK)     |
         |                  | multiCampus      |       | campusId (FK)     |
         |                  | campusCount      |       | name              |
         |                  | campusLocations  |       | title             |
         |                  | establishedYear  |       | department        |
         |                  | contactEmail     |       | bio               |
         |                  | contactPhone     |       | photoUrl          |
         |                  | website          |       | specializations   |
         |                  +------------------+       +-------------------+
         |                          ^
         |                          |
+-------------------+       +------------------+       +-------------------+
|  SAVED_SCHOOLS    |       |    REVIEWS       |       |    COMPARISONS    |
+-------------------+       +------------------+       +-------------------+
| id (PK)           |       | id (PK)          |       | id (PK)           |
| userId (FK)       |       | schoolId (FK)    |       | userId (FK)       |
| schoolId (FK)     |       | userId (FK)      |       | schoolIds (JSON)  |
| createdAt         |       | rating           |       | createdAt         |
+-------------------+       | title            |       +-------------------+
                            | content          |
                            | pros             |       +-------------------+
                            | cons             |       |     INQUIRIES     |
                            | recommended      |       +-------------------+
                            | status           |       | id (PK)           |
                            | moderationNotes  |       | schoolId (FK)     |
                            | moderatedBy      |       | name              |
                            | createdAt        |       | email             |
                            +------------------+       | phone             |
                                                       | message           |
+-------------------+       +------------------+       | forGrade          |
|  SCHOOL_POSTS     |       | QUIZ_QUESTIONS   |       | status            |
+-------------------+       +------------------+       | response          |
| id (PK)           |       | id (PK)          |       | responseDate      |
| schoolId (FK)     |       | question         |       | createdAt         |
| campusId (FK)     |       | category         |       +-------------------+
| title             |       | options          |
| content           |       | order            |       +-------------------+
| type              |       | createdAt        |       | QUIZ_RESPONSES    |
| imageUrl          |       +------------------+       +-------------------+
| eventDate         |                |                 | id (PK)           |
| postedBy (FK)     |                |                 | questionId (FK)   |
| isPublished       |                v                 | userId (FK)       |
| createdAt         |       +------------------+       | sessionId         |
+-------------------+       |   QUIZ_RESULTS   |       | response          |
                            +------------------+       | createdAt         |
                            | id (PK)          |       +-------------------+
                            | userId (FK)      |
                            | sessionId        |       +-------------------+
                            | results (JSON)   |       | ACTIVITY_LOGS     |
                            | recommendations  |       +-------------------+
                            | createdAt        |       | id (PK)           |
                            +------------------+       | userId (FK)       |
                                                       | action            |
+-------------------+       +------------------+       | entityType        |
|  CONTENT_PAGES    |       |    BLOG_POSTS    |       | entityId          |
+-------------------+       +------------------+       | metadata          |
| id (PK)           |       | id (PK)          |       | createdAt         |
| title             |       | title            |       +-------------------+
| slug              |       | slug             |
| content           |       | content          |       +-------------------+
| metaDescription   |       | excerpt          |       |  CONVERSATIONS    |
| author            |       | author           |       +-------------------+
| status            |       | featuredImage    |       | id (PK)           |
| createdAt         |       | status           |       | title             |
| updatedAt         |       | categoryId (FK)  |       | isUrgent          |
| publishedAt       |       | createdAt        |       | isFlagged         |
+-------------------+       | updatedAt        |       | status            |
                            | publishedAt      |       | createdBy (FK)    |
                            +------------------+       | createdAt         |
                                     ^                 | updatedAt         |
                                     |                 | lastMessageAt     |
                            +------------------+       +-------------------+
                            |    CATEGORIES    |                ^
                            +------------------+                |
                            | id (PK)          |       +-------------------+
                            | name             |       |      MESSAGES     |
                            | description      |       +-------------------+
                            | slug             |       | id (PK)           |
                            | parentId (FK)    |       | conversationId(FK)|
                            | type             |       | senderId (FK)     |
                            | createdAt        |       | content           |
                            | updatedAt        |       | isRead            |
                            +------------------+       | attachments       |
                                     ^                 | createdAt         |
                                     |                 +-------------------+
                            +------------------+
                            |    FAQ_ITEMS     |       +-------------------+
                            +------------------+       | CONVERSATION_PART |
                            | id (PK)          |       +-------------------+
                            | question         |       | id (PK)           |
                            | answer           |       | conversationId(FK)|
                            | category         |       | userId (FK)       |
                            | order            |       | role              |
                            | status           |       | joinedAt          |
                            | createdBy (FK)   |       | leftAt            |
                            | updatedBy (FK)   |       +-------------------+
                            | createdAt        |
                            | updatedAt        |       +-------------------+
                            +------------------+       |   SITE_SETTINGS   |
                                                       +-------------------+
                                                       | id (PK)           |
                                                       | key               |
                                                       | value             |
                                                       | description       |
                                                       | category          |
                                                       | isPublic          |
                                                       | createdAt         |
                                                       | updatedAt         |
                                                       | updatedBy (FK)    |
                                                       +-------------------+

+-------------------+       +------------------+
| PLATFORM_NOTIF    |       |   SYSTEM_LOGS    |
+-------------------+       +------------------+
| id (PK)           |       | id (PK)          |
| title             |       | level            |
| message           |       | component        |
| targetGroup       |       | message          |
| startDate         |       | details          |
| endDate           |       | ipAddress        |
| isActive          |       | userAgent        |
| createdBy (FK)    |       | userId (FK)      |
| createdAt         |       | createdAt        |
+-------------------+       +------------------+
```

## Legend:
- PK: Primary Key
- FK: Foreign Key
- <-----> : One-to-many relationship
- ^ : References another table

## Key Relationships:

1. **Users to Schools**: 
   - School Admins manage specific schools (adminId in schools)
   - Users can be associated with a school (schoolId in users)

2. **Schools to Campuses**:
   - A school can have multiple campuses
   - Campuses belong to one school

3. **Schools to Faculty**:
   - Schools have multiple faculty members
   - Faculty can be assigned to specific campuses

4. **User Interactions**:
   - Users can save multiple schools (saved_schools)
   - Users can create comparisons between schools (comparisons)
   - Users can write reviews for schools (reviews)
   - Schools receive inquiries from users (inquiries)

5. **Content Management**:
   - The platform has static content pages, blog posts, and FAQs
   - Content is organized into categories
   - Blog posts and FAQs belong to categories

6. **Communication System**:
   - Users participate in conversations
   - Messages belong to conversations
   - Conversations have multiple participants

7. **User Activity**:
   - All user actions are logged in activity_logs
   - System events are logged in system_logs

8. **Personalization**:
   - Users take quizzes that match them with schools
   - Quiz responses are stored and analyzed
   - Results generate personalized recommendations
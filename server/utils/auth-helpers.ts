import { storage } from "../storage";

/**
 * Check if a user has admin access to a specific school
 * @param userId User ID
 * @param schoolId School ID
 * @returns Promise resolving to true if the user has access, false otherwise
 */
export async function checkSchoolAccess(userId: number, schoolId: number): Promise<boolean> {
  console.log(`[ACCESS CHECK] Checking if user ${userId} has access to school ${schoolId}`);
  
  // Platform admins have access to all schools
  const user = await storage.getUser(userId);
  console.log(`[ACCESS CHECK] User data:`, {
    id: user?.id,
    username: user?.username,
    email: user?.email,
    role: user?.role,
    schoolId: user?.schoolId
  });
  
  if (user?.role === 'platformAdmin') {
    console.log(`[ACCESS CHECK] User ${userId} granted access as platform admin`);
    return true;
  }
  
  // Check if user is an admin of this school
  const school = await storage.getSchool(schoolId);
  if (!school) {
    console.log(`[ACCESS CHECK] School ${schoolId} not found`);
    return false;
  }
  
  console.log(`[ACCESS CHECK] School data:`, {
    id: school.id,
    name: school.name,
    adminId: school.admin_id,
    associatedWithUser: school.admin_id === userId
  });
  
  // Check if user is directly the admin of this school via schoolId field
  if (user?.schoolId === schoolId) {
    console.log(`[ACCESS CHECK] User ${userId} has direct access to school ${schoolId} via schoolId field`);
    return true;
  }
  
  // Check if the user is assigned as admin_id in the school record
  if (school.admin_id === userId) {
    console.log(`[ACCESS CHECK] User ${userId} has access to school ${schoolId} as admin_id`);
    return true;
  }
  
  // Get all schools user is admin of - for debugging
  try {
    const adminSchools = await storage.getSchoolsByAdminId(userId);
    const schoolIds = adminSchools.map(s => s.id);
    console.log(`[ACCESS CHECK] User ${userId} admin of schools:`, schoolIds);
    
    // Check if this schoolId is in the list
    if (schoolIds.includes(schoolId)) {
      console.log(`[ACCESS CHECK] User ${userId} has access to school ${schoolId} via getSchoolsByAdminId check`);
      return true;
    }
  } catch (error) {
    console.error(`[ACCESS CHECK] Error getting schools by admin ID:`, error);
  }
  
  // Check if user has admin access through userSchools association
  try {
    const userSchools = await storage.getUserSchools(userId);
    const hasAccess = userSchools.some(us => us.schoolId === schoolId);
    
    if (hasAccess) {
      console.log(`[ACCESS CHECK] User ${userId} has access to school ${schoolId} via userSchools association`);
      return true;
    }
    
    console.log(`[ACCESS CHECK] User ${userId} denied access to school ${schoolId}. User's schoolId: ${user?.schoolId}`);
    return false;
  } catch (error) {
    console.error(`[ACCESS CHECK] Error checking school access for user ${userId} to school ${schoolId}:`, error);
    return false;
  }
}
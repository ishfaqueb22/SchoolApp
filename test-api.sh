#!/bin/bash

# Test script for school admin API endpoints

echo "Starting API tests..."
echo "======================"

# Login as school admin
echo "Logging in as school admin..."
curl -s -X POST -H "Content-Type: application/json" -d '{"username":"schooladmin", "password":"admin123"}' http://localhost:5000/api/auth/login --cookie-jar cookie.txt > /dev/null

# Get authenticated user
echo "Testing GET /api/auth/me..."
USER_RESPONSE=$(curl -s -b cookie.txt http://localhost:5000/api/auth/me)
if [[ $USER_RESPONSE == *"schoolAdmin"* ]]; then
  echo "✓ Authentication successful"
else
  echo "✗ Authentication failed"
  exit 1
fi

# Check school details
echo "Testing GET /api/schools/1..."
SCHOOL_RESPONSE=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1)
if [[ $SCHOOL_RESPONSE == *"Aitchison College"* ]]; then
  echo "✓ School details retrieved successfully"
else
  echo "✗ School details retrieval failed"
  exit 1
fi

# Check school categories
echo "Testing GET /api/schools/1/categories..."
CATEGORIES_RESPONSE=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1/categories)
if [[ $CATEGORIES_RESPONSE == *"International Baccalaureate"* ]]; then
  echo "✓ School categories retrieved successfully"
else
  echo "✗ School categories retrieval failed"
  exit 1
fi

# Add a category to the school
echo "Testing POST /api/schools/1/categories..."
ADD_CATEGORY_RESPONSE=$(curl -s -b cookie.txt -X POST -H "Content-Type: application/json" -d '{"categoryId":5}' http://localhost:5000/api/schools/1/categories)
if [[ $ADD_CATEGORY_RESPONSE == *"id"* ]]; then
  echo "✓ Category added successfully"
  # Extract the relation ID
  RELATION_ID=$(echo $ADD_CATEGORY_RESPONSE | grep -o '"id":[0-9]*' | cut -d: -f2)
else
  echo "✗ Category addition failed"
  exit 1
fi

# Verify category was added
echo "Verifying category addition..."
UPDATED_CATEGORIES=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1/categories)
if [[ $UPDATED_CATEGORIES == *"Special Needs"* ]]; then
  echo "✓ Category verification successful"
else
  echo "✗ Category verification failed"
  exit 1
fi

# Remove the category
echo "Testing DELETE /api/schools/1/categories/5..."
DELETE_CATEGORY_RESPONSE=$(curl -s -b cookie.txt -X DELETE http://localhost:5000/api/schools/1/categories/5)
if [[ $DELETE_CATEGORY_RESPONSE == *"success"* ]]; then
  echo "✓ Category removed successfully"
else
  echo "✗ Category removal failed"
  exit 1
fi

# Check school media
echo "Testing GET /api/schools/1/media..."
MEDIA_RESPONSE=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1/media)
if [[ $MEDIA_RESPONSE == *"Main Building"* ]]; then
  echo "✓ School media retrieved successfully"
else
  echo "✗ School media retrieval failed"
  exit 1
fi

# Add a media item
echo "Testing POST /api/schools/1/media..."
ADD_MEDIA_RESPONSE=$(curl -s -b cookie.txt -X POST -H "Content-Type: application/json" -d '{"type":"image", "title":"Test Image", "description":"API test", "url":"https://images.unsplash.com/photo-1532012197267-da84d127e765", "thumbnail":"https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200", "order":10, "isPublic":true}' http://localhost:5000/api/schools/1/media)
if [[ $ADD_MEDIA_RESPONSE == *"id"* ]]; then
  echo "✓ Media item added successfully"
  # Extract the media ID
  MEDIA_ID=$(echo $ADD_MEDIA_RESPONSE | grep -o '"id":[0-9]*' | cut -d: -f2)
else
  echo "✗ Media item addition failed"
  exit 1
fi

# Verify media was added
echo "Verifying media addition..."
UPDATED_MEDIA=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1/media)
if [[ $UPDATED_MEDIA == *"Test Image"* ]]; then
  echo "✓ Media verification successful"
else
  echo "✗ Media verification failed"
  exit 1
fi

# Remove the media item
echo "Testing DELETE /api/schools/1/media/$MEDIA_ID..."
DELETE_MEDIA_RESPONSE=$(curl -s -b cookie.txt -X DELETE http://localhost:5000/api/schools/1/media/$MEDIA_ID)
if [[ $DELETE_MEDIA_RESPONSE == *"success"* ]]; then
  echo "✓ Media item removed successfully"
else
  echo "✗ Media item removal failed"
  exit 1
fi

# Test faculty members
echo "Testing GET /api/schools/1/faculty..."
FACULTY_RESPONSE=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1/faculty)
if [[ $FACULTY_RESPONSE == *"Dr. Ayesha Khan"* ]]; then
  echo "✓ Faculty retrieved successfully"
else
  echo "✗ Faculty retrieval failed"
  exit 1
fi

# Test campuses
echo "Testing GET /api/schools/1/campuses..."
CAMPUS_RESPONSE=$(curl -s -b cookie.txt http://localhost:5000/api/schools/1/campuses)
if [[ $CAMPUS_RESPONSE == *"Junior Campus"* ]]; then
  echo "✓ Campuses retrieved successfully"
else
  echo "✗ Campuses retrieval failed"
  exit 1
fi

echo "======================"
echo "All tests completed successfully!"
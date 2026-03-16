# 📋 **COMPLETE API DOCUMENTATION**
## *12 Flexible Listing APIs - As Requested*

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  "I only need LISTING APIs - One single API per module that does it all"  ║
║                                   - Boss                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📑 **TABLE OF CONTENTS**
1. [System Architecture Overview](#-system-architecture-overview)
2. [Universal Query Parameters](#-universal-query-parameters)
3. [The 12 Core APIs](#-the-12-core-apis)
4. [API Details with Examples](#-api-details-with-examples)
5. [Response Structure](#-response-structure)
6. [Error Handling](#-error-handling)
7. [Implementation Notes](#-implementation-notes)

---

## 🏗 **SYSTEM ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Frontend)                          │
│         (Web, Mobile, Admin Panel, Salesforce)                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (api/v1)                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Properties  │  │   Projects   │  │  Developers  │           │
│  │    APIs      │  │    APIs      │  │    APIs      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Agents    │  │ Communities  │  │Sub-Communities│          │
│  │    APIs      │  │    APIs      │  │    APIs      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                   │
│           (PostgreSQL / MySQL / Salesforce)                      │
└─────────────────────────────────────────────────────────────────┘
```

### **Core Principle:**
> **12 APIs Total** - 2 per module (Public + Admin)  
> Each API handles: **LISTING + SEARCH + FILTERS + PAGINATION**

---

## 🔧 **UNIVERSAL QUERY PARAMETERS**

*These parameters work on ALL 12 APIs exactly the same way*

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `page` | integer | Page number for pagination | 1 | `?page=2` |
| `limit` | integer | Items per page (max: 100) | 10 | `?limit=20` |
| `offset` | integer | Skip N records | 0 | `?offset=30` |
| `search` | string | Search across all text fields | - | `?search=luxury` |
| `sort_by` | string | Field to sort by | `created_at` | `?sort_by=price` |
| `sort_order` | string | `asc` or `desc` | `desc` | `?sort_order=asc` |
| `fields` | string | Comma-separated fields to return | all | `?fields=id,name,price` |
| `status` | integer | `1`=active, `0`=inactive | all | `?status=1` |
| `featured` | boolean | Filter featured items | all | `?featured=true` |
| `min_price` | number | Minimum price | - | `?min_price=1000000` |
| `max_price` | number | Maximum price | - | `?max_price=5000000` |
| `city_id` | integer | Filter by city | - | `?city_id=1` |
| `developer_id` | integer | Filter by developer | - | `?developer_id=5` |
| `bedrooms` | integer | Filter by bedrooms | - | `?bedrooms=3` |
| `amenities` | string | Filter by amenities | - | `?amenities=pool,gym` |
| `from_date` | date | Start date (YYYY-MM-DD) | - | `?from_date=2024-01-01` |
| `to_date` | date | End date (YYYY-MM-DD) | - | `?to_date=2024-12-31` |

---

## 🎯 **THE 12 CORE APIS**

| # | Module | API Type | Endpoint | Description |
|---|--------|----------|----------|-------------|
| **1** | **Properties** | Public | `GET /api/v1/properties` | Public property listings with filters |
| **2** | | Admin | `GET /api/v1/admin/properties` | Admin property listings (incl. inactive) |
| **3** | **Projects** | Public | `GET /api/v1/projects` | Public project listings |
| **4** | | Admin | `GET /api/v1/admin/projects` | Admin project listings |
| **5** | **Developers** | Public | `GET /api/v1/developers` | Public developer listings |
| **6** | | Admin | `GET /api/v1/admin/developers` | Admin developer listings |
| **7** | **Agents** | Public | `GET /api/v1/agents` | Public agent listings |
| **8** | | Admin | `GET /api/v1/admin/agents` | Admin agent listings |
| **9** | **Communities** | Public | `GET /api/v1/communities` | Public community listings |
| **10** | | Admin | `GET /api/v1/admin/communities` | Admin community listings |
| **11** | **Sub-Communities** | Public | `GET /api/v1/sub-communities` | Public sub-community listings |
| **12** | | Admin | `GET /api/v1/admin/sub-communities` | Admin sub-community listings |

---

## 📚 **API DETAILS WITH EXAMPLES**

---

### **1. PUBLIC PROPERTIES API**
```http
GET /api/v1/properties
```

#### **Use Cases:**

**✅ Homepage - Featured 6 Properties**
```
GET /api/v1/properties?page=1&limit=6&featured=true&sort_by=created_at&sort_order=desc
```

**✅ Property Listing Page with Filters**
```
GET /api/v1/properties?page=2&limit=12&city_id=1&min_price=1000000&max_price=3000000&bedrooms=3&sort_by=price&sort_order=asc
```

**✅ Search Properties**
```
GET /api/v1/properties?search=dubai marina&limit=20
```

**✅ Get Only Specific Fields**
```
GET /api/v1/properties?fields=id,name,price,featured_image&limit=10
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Properties fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Luxury Villa in Palm Jumeirah",
      "slug": "luxury-villa-palm-jumeirah",
      "price": 2500000,
      "bedrooms": 5,
      "bathrooms": 6,
      "area": 5000,
      "description": "Beautiful villa with private beach access...",
      "featured_image": "https://api.example.com/uploads/properties/villa.jpg",
      "gallery": [
        "https://api.example.com/uploads/projects/gallery/villa1.jpg",
        "https://api.example.com/uploads/projects/gallery/villa2.jpg"
      ],
      "location": "Palm Jumeirah, Dubai",
      "city_id": 1,
      "city_name": "Dubai",
      "developer_id": 3,
      "developer_name": "Emaar Properties",
      "property_purpose": "sale",
      "property_type": "villa",
      "featured": true,
      "amenities": ["pool", "gym", "beach-access"],
      "status": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Modern Apartment Downtown",
      "slug": "modern-apartment-downtown",
      "price": 850000,
      "bedrooms": 2,
      "bathrooms": 2,
      "area": 1200,
      "description": "Stylish apartment with Burj Khalifa view",
      "featured_image": "https://api.example.com/uploads/properties/apartment.jpg",
      "location": "Downtown Dubai",
      "city_id": 1,
      "developer_id": 5,
      "property_purpose": "sale",
      "property_type": "apartment",
      "featured": false,
      "status": 1,
      "created_at": "2024-01-14T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 6,
    "total": 124,
    "pages": 21,
    "has_next": true,
    "has_prev": false,
    "next_page": "/api/v1/properties?page=2&limit=6&featured=true",
    "prev_page": null
  },
  "filters_applied": {
    "featured": true,
    "page": 1,
    "limit": 6,
    "sort_by": "created_at",
    "sort_order": "desc"
  },
  "stats": {
    "min_price": 850000,
    "max_price": 5000000,
    "avg_price": 2100000
  }
}
```

---

### **2. ADMIN PROPERTIES API**
```http
GET /api/v1/admin/properties
```
*Headers: `Authorization: Bearer <admin-token>`*

#### **Use Cases:**

**✅ Get ALL Properties (including inactive/deleted)**
```
GET /api/v1/admin/properties?page=1&limit=50
```

**✅ Get Pending Properties**
```
GET /api/v1/admin/properties?status=0&sort_by=created_at&sort_order=desc
```

**✅ Get Properties by Specific Developer**
```
GET /api/v1/admin/properties?developer_id=3&limit=100
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Properties fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Luxury Villa in Palm Jumeirah",
      "price": 2500000,
      "status": 1,
      "created_by": "admin@example.com",
      "updated_by": "manager@example.com",
      "deleted_at": null,
      // ... all other fields from public API
    },
    {
      "id": 3,
      "name": "Old Villa (Inactive)",
      "price": 1800000,
      "status": 0,
      "deleted_at": "2024-01-10T11:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 245,
    "pages": 5
  },
  "stats": {
    "total": 245,
    "active": 198,
    "inactive": 47,
    "deleted": 12,
    "pending_review": 23,
    "by_purpose": {
      "sale": 180,
      "rent": 65
    },
    "by_type": {
      "apartment": 120,
      "villa": 85,
      "commercial": 40
    }
  }
}
```

---

### **3. PUBLIC PROJECTS API**
```http
GET /api/v1/projects
```

#### **Use Cases:**

**✅ All Projects by City**
```
GET /api/v1/projects?city_id=1&page=1&limit=10
```

**✅ Featured Projects**
```
GET /api/v1/projects?featured=true&limit=6
```

**✅ Projects by Developer**
```
GET /api/v1/projects?developer_id=3&sort_by=completion_date&sort_order=asc
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Dubai Hills Estate",
      "slug": "dubai-hills-estate",
      "description": "Master community with golf course",
      "price_from": 1200000,
      "price_to": 5000000,
      "developer_id": 3,
      "developer_name": "Emaar Properties",
      "city_id": 1,
      "city_name": "Dubai",
      "featured_image": "https://api.example.com/uploads/projects/dubai-hills.jpg",
      "gallery": [
        "https://api.example.com/uploads/projects/gallery/img1.jpg",
        "https://api.example.com/uploads/projects/gallery/img2.jpg"
      ],
      "completion_date": "2025-12-31",
      "total_units": 1200,
      "available_units": 450,
      "amenities": ["golf", "park", "school", "mall"],
      "featured": true,
      "status": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### **4. ADMIN PROJECTS API**
```http
GET /api/v1/admin/projects
```
*Headers: `Authorization: Bearer <admin-token>`*

#### **📤 Response** - Similar structure with admin fields

---

### **5. PUBLIC DEVELOPERS API**
```http
GET /api/v1/developers
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Developers fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Emaar Properties",
      "slug": "emaar-properties",
      "logo": "https://api.example.com/uploads/developers/emaar-logo.jpg",
      "description": "Leading developer in UAE",
      "year_established": 1997,
      "headquarters": "Dubai, UAE",
      "total_projects": 150,
      "total_properties": 45000,
      "featured": true,
      "status": 1,
      "contact_email": "info@emaar.com",
      "contact_phone": "+971-4-1234567",
      "website": "https://www.emaar.com",
      "social_media": {
        "facebook": "emaar",
        "twitter": "emaardubai",
        "instagram": "emaar"
      },
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Nakheel Properties",
      "slug": "nakheel-properties",
      "logo": "https://api.example.com/uploads/developers/nakheel-logo.jpg",
      "description": "Developers of Palm Jumeirah",
      "year_established": 2001,
      "headquarters": "Dubai, UAE",
      "total_projects": 80,
      "featured": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### **6. ADMIN DEVELOPERS API**
```http
GET /api/v1/admin/developers
```
*Headers: `Authorization: Bearer <admin-token>`*

---

### **7. PUBLIC AGENTS API**
```http
GET /api/v1/agents
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Agents fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "slug": "john-smith",
      "profile_image": "https://api.example.com/uploads/agents/john.jpg",
      "title": "Senior Real Estate Consultant",
      "bio": "10+ years experience in Dubai real estate",
      "email": "john@example.com",
      "phone": "+971-50-1234567",
      "languages": ["English", "Arabic", "Hindi"],
      "agency_id": 1,
      "agency_name": "ABC Realty",
      "experience_years": 10,
      "specializations": ["luxury villas", "off-plan"],
      "total_listings": 45,
      "total_sales": 120,
      "rating": 4.8,
      "reviews_count": 56,
      "featured": true,
      "status": 1,
      "social_media": {
        "linkedin": "johnsmith",
        "twitter": "@johnsmith"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

---

### **8. ADMIN AGENTS API**
```http
GET /api/v1/admin/agents
```
*Headers: `Authorization: Bearer <admin-token>`*

---

### **9. PUBLIC COMMUNITIES API**
```http
GET /api/v1/communities
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Communities fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Dubai Marina",
      "slug": "dubai-marina",
      "description": "Waterfront community with skyscrapers",
      "image": "https://api.example.com/uploads/communities/marina.jpg",
      "city_id": 1,
      "city_name": "Dubai",
      "latitude": 25.080,
      "longitude": 55.140,
      "total_properties": 3500,
      "total_projects": 25,
      "featured": true,
      "status": 1,
      "amenities": ["marina", "beach", "restaurants", "shops"],
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Downtown Dubai",
      "slug": "downtown-dubai",
      "image": "https://api.example.com/uploads/communities/downtown.jpg",
      "featured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 35,
    "pages": 4
  }
}
```

---

### **10. ADMIN COMMUNITIES API**
```http
GET /api/v1/admin/communities
```
*Headers: `Authorization: Bearer <admin-token>`*

---

### **11. PUBLIC SUB-COMMUNITIES API**
```http
GET /api/v1/sub-communities
```

#### **📤 Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Sub-communities fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Jumeirah Lakes Towers (JLT)",
      "slug": "jlt",
      "description": "Cluster of towers around lakes",
      "image": "https://api.example.com/uploads/subcommunities/jlt.jpg",
      "community_id": 1,
      "community_name": "Dubai Marina",
      "city_id": 1,
      "city_name": "Dubai",
      "latitude": 25.070,
      "longitude": 55.140,
      "total_properties": 850,
      "featured": false,
      "status": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### **12. ADMIN SUB-COMMUNITIES API**
```http
GET /api/v1/admin/sub-communities
```
*Headers: `Authorization: Bearer <admin-token>`*

---

## 📊 **UNIFIED RESPONSE STRUCTURE**

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": [],  // Array of objects
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "has_next": true,
    "has_prev": false,
    "next_page": "/api/v1/properties?page=2&limit=10",
    "prev_page": null
  },
  "filters_applied": {
    // All query parameters that were applied
    "page": 1,
    "limit": 10,
    "featured": true,
    "search": "luxury"
  },
  "stats": {  // Optional - summary statistics
    "total": 100,
    "min_price": 500000,
    "max_price": 5000000
  }
}
```

---

## ❌ **ERROR HANDLING**

### **400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid parameters",
  "errors": {
    "limit": "Maximum limit is 100",
    "page": "Page must be a positive integer"
  }
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required",
  "error_code": "AUTH_REQUIRED"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "message": "Admin access required",
  "error_code": "ADMIN_ONLY"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Resource not found",
  "error_code": "NOT_FOUND"
}
```

### **429 Too Many Requests**
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "retry_after": 30  // seconds
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Something went wrong",
  "error_code": "INTERNAL_ERROR",
  "request_id": "req-123-abc"  // for debugging
}
```

---

## 📋 **IMPLEMENTATION NOTES**

### **Backend Requirements:**
1. **One controller per module** with unified listing function
2. **Dynamic query builder** that handles all parameters
3. **Field selection** - return only requested fields
4. **Pagination** - always return pagination info
5. **Caching** - Cache public APIs (5 min), no cache for admin
6. **Rate limiting** - 100 requests/min for public, 1000/min for admin
7. **Logging** - Log all API calls with request_id

### **Database Indexes Required:**
- `status`, `featured`, `created_at`
- `city_id`, `developer_id`, `agent_id`
- `price`, `bedrooms`, `area`
- `name` (for search)
- `slug` (unique)

### **Search Implementation:**
```sql
-- Example SQL pattern
SELECT * FROM properties 
WHERE 
  (status = :status OR :status IS NULL)
  AND (featured = :featured OR :featured IS NULL)
  AND (city_id = :city_id OR :city_id IS NULL)
  AND (price BETWEEN :min_price AND :max_price)
  AND (bedrooms = :bedrooms OR :bedrooms IS NULL)
  AND (
    :search IS NULL 
    OR name ILIKE '%:search%' 
    OR description ILIKE '%:search%'
    OR location ILIKE '%:search%'
  )
ORDER BY :sort_by :sort_order
LIMIT :limit OFFSET :offset;
```

---

## 🔐 **AUTHENTICATION**

### **Public APIs**
- No authentication required
- Rate limited by IP address

### **Admin APIs**
```
Headers:
  Authorization: Bearer <jwt-token>
  X-API-Key: <optional-api-key>
```

### **Token Format**
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🚀 **PERFORMANCE OPTIMIZATION**

### **Response Times Expected:**
- **Public APIs**: < 200ms
- **Admin APIs**: < 500ms
- **Search queries**: < 300ms

### **Caching Strategy:**
- **Public APIs**: Redis cache, TTL 5 minutes
- **Admin APIs**: No cache
- **Search results**: Cache for 1 minute
- **Clear cache on**: Data updates (CREATE/UPDATE/DELETE)

---

## 📦 **SAMPLE API CALLS**

```bash
# Get 6 featured properties for homepage
curl -X GET "https://api.example.com/api/v1/properties?page=1&limit=6&featured=true&sort_by=created_at&sort_order=desc"

# Search properties
curl -X GET "https://api.example.com/api/v1/properties?search=dubai marina&limit=20"

# Filter properties by price and bedrooms
curl -X GET "https://api.example.com/api/v1/properties?min_price=1000000&max_price=3000000&bedrooms=3&page=2&limit=12&sort_by=price&sort_order=asc"

# Admin get all pending properties
curl -X GET "https://api.example.com/api/v1/admin/properties?status=0&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Get only specific fields
curl -X GET "https://api.example.com/api/v1/projects?fields=id,name,price,featured_image&limit=10"

# Get projects by developer with pagination
curl -X GET "https://api.example.com/api/v1/projects?developer_id=3&page=1&limit=5&sort_by=completion_date&sort_order=asc"
```

---

## 📌 **SUMMARY**

| Total APIs | 12 (6 modules × 2) |
|------------|-------------------|
| Public APIs | 6 |
| Admin APIs | 6 |
| Parameters | Universal across all APIs |
| Pagination | Page/Limit based |
| Search | Single search parameter |
| Filters | Field-specific filters |
| Sorting | Any field with direction |
| Field Selection | Comma-separated fields |
| Response Format | Unified JSON structure |

---

## ✅ **WHY THIS ARCHITECTURE?**

1. **Simple** - 12 APIs only, no confusion
2. **Flexible** - One API does everything
3. **Scalable** - Same pattern works for all modules
4. **Maintainable** - Update one function, all APIs benefit
5. **Fast Development** - Reusable code pattern
6. **Frontend Friendly** - Predictable responses
7. **Salesforce Compatible** - Easy to integrate
8. **Cost Effective** - Less code, less maintenance

---

```
╔════════════════════════════════════════════════════════════════╗
║  "12 APIs. No more. No less. Each one does everything."        ║
║                       - The Perfect Architecture                ║
╚════════════════════════════════════════════════════════════════╝
```

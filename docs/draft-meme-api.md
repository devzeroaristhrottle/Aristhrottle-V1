# Draft Meme API Documentation

This document provides an overview of the Draft Meme API, which allows users to save, retrieve, update, and publish draft memes.

## Overview

The Draft Meme system enables users to:
- Save memes as drafts
- Edit and update drafts
- List all their draft memes
- Delete unwanted drafts
- Publish drafts as complete memes

## API Endpoints

### 1. Get User's Drafts

**Endpoint:** `GET /api/draft-meme`  
**Authentication:** Required

**Query Parameters:**
- `id` (optional): Get a specific draft by ID
- `offset` (optional): Pagination offset

**Example Response:**
```json
{
  "drafts": [
    {
      "_id": "123456789",
      "name": "My Draft Meme",
      "image_url": "https://cloudinary.com/...",
      "raw_tags": ["funny", "cats"],
      "created_by": "user_id",
      "last_edited": "2023-08-15T12:30:45Z",
      "createdAt": "2023-08-15T10:20:30Z",
      "updatedAt": "2023-08-15T12:30:45Z"
    }
  ],
  "totalCount": 5
}
```

### 2. Create/Update Draft

**Endpoint:** `POST /api/draft-meme`  
**Authentication:** Required

**Form Data:**
- `id` (optional): Existing draft ID (if updating)
- `name` (optional): Meme name/title
- `file` (optional): Image file
- `tags` (optional): JSON array of tag strings
- `draft_data` (optional): Additional JSON data

**Example Response:**
```json
{
  "draft": {
    "_id": "123456789",
    "name": "My Draft Meme",
    "image_url": "https://cloudinary.com/...",
    "raw_tags": ["funny", "cats"],
    "created_by": "user_id",
    "last_edited": "2023-08-15T12:30:45Z"
  }
}
```

### 3. Delete Draft

**Endpoint:** `DELETE /api/draft-meme?id=draft_id`  
**Authentication:** Required

**Query Parameters:**
- `id` (required): ID of the draft to delete

**Example Response:**
```json
{
  "message": "Draft deleted successfully"
}
```

### 4. Publish Draft as Meme

**Endpoint:** `POST /api/draft-meme/publish`  
**Authentication:** Required

**Request Body:**
```json
{
  "id": "draft_id"
}
```

**Example Response:**
```json
{
  "meme": {
    "_id": "987654321",
    "name": "My Published Meme",
    "image_url": "https://cloudinary.com/...",
    "tags": ["tag_id1", "tag_id2"],
    "created_by": "user_id"
    // other meme properties
  },
  "message": "Draft published successfully"
}
```

## Data Model

The `DraftMeme` schema includes:

- `name`: Title of the draft meme
- `image_url`: URL to the uploaded image
- `tags`: Array of tag IDs (referenced to Tags collection)
- `raw_tags`: Array of tag strings before conversion to IDs
- `created_by`: User ID (referenced to User collection)
- `last_edited`: Timestamp of last edit
- `is_published`: Boolean indicating if draft has been published
- `draft_data`: Optional additional data as JSON

## Usage Examples

### Creating a New Draft

```javascript
// Example frontend code
const formData = new FormData();
formData.append('name', 'My funny cat meme');
formData.append('file', imageFile);
formData.append('tags', JSON.stringify(['funny', 'cats']));

const response = await fetch('/api/draft-meme', {
  method: 'POST',
  body: formData
});
```

### Publishing a Draft

```javascript
// Example frontend code
const response = await fetch('/api/draft-meme/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'draft_id'
  })
});
```

## Error Handling

All endpoints return appropriate error responses with status codes and messages:

- `401`: Authentication required
- `404`: Resource not found
- `400`: Bad request (missing required fields)
- `500`: Server error

## Security

- All endpoints require authentication
- Users can only access and modify their own drafts
- Permissions are verified for each operation
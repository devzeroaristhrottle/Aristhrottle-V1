# User API Documentation

## Update User Profile (PUT /api/user)

Updates an existing user's profile information including username, bio, profile picture, tags, and interests.

### Request

- **Method:** PUT
- **Endpoint:** `/api/user`
- **Content-Type:** `multipart/form-data`

### Authentication

- Requires a valid auth token that matches the wallet address

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_wallet_address` | string | The user's wallet address (must match authenticated user) |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | The user's display name |
| `bio` | string | The user's bio/description |
| `file` | File | Profile picture image file (JPG/PNG recommended) |
| `tags` | JSON string | Array of user tags as JSON string |
| `interests` | JSON string | Array of interest categories, each with name and tags. Max 5 categories, each with max 10 tags |

### Example Request

```
// Using form data
const formData = new FormData();
formData.append('user_wallet_address', '0x123abc...');
formData.append('username', 'CryptoUser');
formData.append('bio', 'NFT enthusiast and meme creator');
formData.append('file', profileImageFile);
formData.append('tags', JSON.stringify(['crypto', 'memes']));
formData.append('interests', JSON.stringify([
  {
    name: 'Crypto',
    tags: ['bitcoin', 'ethereum', 'web3']
  },
  {
    name: 'Art',
    tags: ['digital', 'nft']
  }
]));
```

### Response

#### Success (200 OK)
```json
{
  "user": {
    "_id": "...",
    "username": "CryptoUser",
    "user_wallet_address": "0x123abc...",
    "bio": "NFT enthusiast and meme creator",
    "profile_pic": "https://cloudinary.com/...",
    "tags": ["crypto", "memes"],
    "interests": [
      {
        "name": "Crypto",
        "tags": ["bitcoin", "ethereum", "web3"]
      },
      {
        "name": "Art",
        "tags": ["digital", "nft"]
      }
    ],
    "createdAt": "2023-...",
    "updatedAt": "2023-..."
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing authentication |
| 404 | Not Found - User not found |
| 500 | Internal Server Error |

#### Error Response Format
```json
{
  "error": "Error message"
}
``` 
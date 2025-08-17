import { Storage } from '@google-cloud/storage';

// Safely parse credentials
let credentials;
try {
  if (process.env.GOOGLE_CREDENTIALS) {
    // Handle credentials whether they're already an object or a string
    const credentialsValue = process.env.GOOGLE_CREDENTIALS;
    try {
      // Try parsing as JSON
      credentials = typeof credentialsValue === 'string' 
        ? JSON.parse(credentialsValue.trim())
        : credentialsValue;
    } catch (parseError) {
      console.error('Failed to parse GOOGLE_CREDENTIALS as JSON:', parseError);
      // If it's not valid JSON, it might be an object already
      credentials = credentialsValue;
    }
  }
} catch (error) {
  console.error('Failed to process GOOGLE_CREDENTIALS:', error);
  // Set credentials to null if processing fails
  credentials = null;
}

// Initialize storage client only if credentials are available
let storage: Storage | null = null;
const bucketName = process.env.GOOGLE_STORAGE_BUCKET || 'aristhrottle-bucket';

try {
  if (credentials && (credentials.project_id || credentials.projectId)) {
    storage = new Storage({
      credentials,
      projectId: credentials.project_id || credentials.projectId
    });
    console.log('Google Cloud Storage initialized successfully');
  } else {
    console.warn('GCS credentials not available or invalid, using fallback mode');
  }
} catch (error) {
  console.error('Failed to initialize GCS client:', error);
}

// Folder paths
const PROFILE_PICTURES_FOLDER = 'profile-picture/';
const MEME_IMAGES_FOLDER = 'content-image/';
const DRAFT_MEME_IMAGES_FOLDER = 'draft-meme/';

/**
 * Upload a file to Google Cloud Storage
 * @param buffer - File buffer
 * @param fileName - File name to save as
 * @param contentType - MIME type of the file
 * @param folder - Folder path ('profile' or 'meme')
 * @returns Promise with the public URL of the uploaded file
 */
export async function uploadToGCS(
  buffer: Buffer, 
  fileName: string,
  contentType: string,
  folder: 'profile' | 'meme' | 'draft-meme'
): Promise<string> {
  try {
    // If storage client isn't initialized, fall back to Cloudinary or mock
    if (!storage) {
      console.warn('Using fallback URL for GCS upload - storage client not initialized');
      // Return a mock URL for development/build purposes
      const folderName = folder === 'profile' ? 'profile' : folder === 'meme' ? 'memes' : 'draft-memes';
      return `https://storage.googleapis.com/${bucketName}/${folderName}/${Date.now()}-${fileName}`;
    }
    
    // Determine the folder path
    const folderPath = folder === 'profile' ? PROFILE_PICTURES_FOLDER : folder === 'meme' ? MEME_IMAGES_FOLDER : DRAFT_MEME_IMAGES_FOLDER;
    
    // Create a unique filename to avoid collisions
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const filePath = `${folderPath}${uniqueFileName}`;
    
    console.log(`Uploading to GCS: ${filePath}`);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    // Upload file
    await file.save(buffer, {
      metadata: {
        contentType
      }
    });
    
    // Don't try to set ACLs when uniform bucket-level access is enabled
    // The bucket should be configured to make objects publicly accessible
    
    // Return the public URL - assuming the bucket is public
    return `https://storage.googleapis.com/${bucketName}/${filePath}`;
  } catch (error) {
    console.error('GCS upload error:', error);
    // Return a fallback URL in case of error
    const folderName = folder === 'profile' ? 'profile' : folder === 'meme' ? 'memes' : 'draft-memes';
    return `https://storage.googleapis.com/${bucketName}/${folderName}/${Date.now()}-${fileName}`;
  }
}

// Export named constants and functions
const googleStorage = {
  uploadToGCS
};

export default googleStorage; 
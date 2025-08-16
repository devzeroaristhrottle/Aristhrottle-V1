import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// Load credentials from creds.json file
let credentials;
let storage: Storage | null = null;
const bucketName = 'aristhrottle-bucket';

try {
  // Get the path to creds.json in the project root
  const credsPath = path.resolve(process.cwd(), 'creds.json');
  
  if (fs.existsSync(credsPath)) {
    // Read and parse the credentials file
    const credentialsFile = fs.readFileSync(credsPath, 'utf8');
    credentials = JSON.parse(credentialsFile);
    
    console.log('Google Cloud Storage credentials loaded from creds.json');
    
    // Log some non-sensitive credential info for debugging
    console.log('GCS Credentials Debug:', {
      hasProjectId: !!credentials.project_id,
      hasPrivateKey: !!credentials.private_key,
      hasClientEmail: !!credentials.client_email,
      projectId: credentials.project_id,
      credentialsPath: credsPath
    });
    
    // Initialize the storage client
    storage = new Storage({
      keyFilename: credsPath,
      projectId: credentials.project_id
    });
    
    console.log('Google Cloud Storage initialized successfully with creds.json');
  } else {
    console.warn('creds.json file not found at:', credsPath);
    console.warn('Google Cloud Storage will not be available');
    credentials = null;
  }
} catch (error) {
  console.error('Failed to load Google Cloud Storage credentials from creds.json:', error);
  credentials = null;
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
      throw new Error('Google Cloud Storage client not initialized. Please ensure creds.json file exists in the project root and contains valid service account credentials.');
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
    
    // Provide more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        throw new Error('Google Cloud Storage authentication failed. Please check your service account credentials and ensure the private key is valid.');
      }
      if (error.message.includes('Invalid JWT Signature')) {
        throw new Error('Google Cloud Storage JWT signature is invalid. Please verify your service account key format and private key.');
      }
      if (error.message.includes('403')) {
        throw new Error('Google Cloud Storage access denied. Please check bucket permissions and service account roles.');
      }
      if (error.message.includes('404')) {
        throw new Error(`Google Cloud Storage bucket '${bucketName}' not found. Please verify the bucket name and access permissions.`);
      }
    }
    
    // Generic error for other cases
    throw new Error(`Failed to upload file to Google Cloud Storage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export named constants and functions
const googleStorage = {
  uploadToGCS
};

export default googleStorage; 
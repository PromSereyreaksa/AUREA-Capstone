import multer from 'multer';

/**
 * Avatar upload configuration
 * - Stores files in memory for Supabase upload
 * - Max size: 10MB
 * - Allowed types: JPEG, PNG, WebP
 */
export const avatarUpload = multer({
  storage: multer.memoryStorage(), // Store in memory buffer for Supabase upload
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

/**
 * Portfolio PDF upload configuration
 * - Stores files in memory for Supabase upload
 * - Max size: 10MB
 * - Allowed types: PDF only
 */
export const portfolioPdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});


const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");

// Configure cloudinary using the recommended v2 approach
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom Cloudinary storage engine for multer
class CloudinaryStorage {
  constructor(options) {
    this.options = options;
  }

  _handleFile(req, file, cb) {
    const { folder, transformation = [] } = this.options;

    // Create upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vaatco/${folder}`,
        resource_type: "auto",
        transformation:
          transformation.length > 0
            ? transformation
            : [{ quality: "auto:good" }, { fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          return cb(error);
        }

        // Return file info in the format multer expects
        cb(null, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          path: result.secure_url, // This is the Cloudinary URL
          filename: result.public_id, // This is the Cloudinary public_id
          size: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    // Handle upload stream errors
    uploadStream.on("error", (error) => {
      cb(error);
    });

    // Pipe the file stream to Cloudinary
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    // Remove file from Cloudinary if needed
    if (file.filename) {
      cloudinary.uploader
        .destroy(file.filename)
        .then((result) => cb(null, result))
        .catch((error) => cb(error));
    } else {
      cb(null);
    }
  }
}

// Create storage instances for different content types
const createStorage = (folder, transformation = []) => {
  return new CloudinaryStorage({
    folder,
    transformation,
  });
};

// Different storages for different content types
const productStorage = createStorage("products");
const galleryStorage = createStorage("gallery");
const blogStorage = createStorage("blogs");
const teamStorage = createStorage("team");
const serviceStorage = createStorage("services");

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Upload configurations with appropriate limits
const uploadProduct = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: imageFilter,
});

const uploadGallery = multer({
  storage: galleryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files for bulk upload
  },
  fileFilter: imageFilter,
});

const uploadBlog = multer({
  storage: blogStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3, // Maximum 3 files
  },
  fileFilter: imageFilter,
});

const uploadTeam = multer({
  storage: teamStorage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
    files: 1, // Single file upload for team photos
  },
  fileFilter: imageFilter,
});

const uploadService = multer({
  storage: serviceStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: imageFilter,
});

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Helper function to get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: "auto:good",
    fetch_format: "auto",
  };

  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

// Helper function for direct upload (base64 or URL)
const uploadDirect = async (source, folder, options = {}) => {
  try {
    const uploadOptions = {
      folder: `vaatco/${folder}`,
      resource_type: "auto",
      transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
      ...options,
    };

    const result = await cloudinary.uploader.upload(source, uploadOptions);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

// Helper function to get image details
const getImageDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error("Error getting image details:", error);
    throw error;
  }
};

// Helper function to generate transformation URLs
const generateTransformationUrl = (publicId, transformations) => {
  return cloudinary.url(publicId, {
    transformation: transformations,
  });
};

// Bulk delete function
const bulkDeleteImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error("Error bulk deleting images:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadProduct,
  uploadGallery,
  uploadBlog,
  uploadTeam,
  uploadService,
  deleteImage,
  getOptimizedImageUrl,
  uploadDirect,
  getImageDetails,
  generateTransformationUrl,
  bulkDeleteImages,
};

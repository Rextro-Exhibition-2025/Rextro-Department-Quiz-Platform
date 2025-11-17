import type { Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';

/**
 * Upload image to Cloudinary
 * Accepts base64 image data
 */
export const uploadImage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { image, folder } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    // Determine the folder based on request or default to 'department-quiz/quiz-images'
    const uploadFolder = folder || 'department-quiz/quiz-images';

    // Log upload attempt
    console.log('📤 Uploading to Cloudinary...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
    console.log('Folder:', uploadFolder);

    // Upload to Cloudinary with optimized settings
    const result = await cloudinary.uploader.upload(image, {
      folder: uploadFolder,
      resource_type: 'auto',
      // Optimize images
      quality: 'auto:good',
      fetch_format: 'auto',
      // Timeout and chunk settings
      timeout: 120000, // 120 seconds timeout
      chunk_size: 6000000, // 6MB chunks for large files
    });

    console.log('✅ Upload successful:', result.secure_url);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      console.error('No public ID provided in request body');
      return res.status(400).json({
        success: false,
        message: 'No public ID provided',
      });
    }

    console.log('Attempting to delete image with publicId:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

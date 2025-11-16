import { createAdminApi } from '@/interceptors/admins';

/**
 * Convert file to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    publicId: string;
  };
}

/**
 * Upload image to Cloudinary via backend
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder: string = 'department-quiz/quiz-images'
): Promise<{ url: string; publicId: string }> => {
  try {
    // Validate file size (max 5MB to avoid timeout issues)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds 5MB. Please use a smaller image.`);
    }

    // Convert file to base64
    const base64Image = await fileToBase64(file);

    console.log(`Uploading image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Send to backend with extended timeout
    const api = await createAdminApi();
    const response = await api.post<UploadResponse>(
      '/upload/upload',
      {
        image: base64Image,
        folder: folder,
      },
      {
        timeout: 120000, // 120 seconds timeout
      }
    );

    console.log('✅ Upload successful');
    return response.data.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const api = await createAdminApi();
    await api.request({
      method: 'DELETE',
      url: '/upload/delete',
      data: { publicId },
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

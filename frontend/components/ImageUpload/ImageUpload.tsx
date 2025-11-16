"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '@/lib/cloudinaryService';

interface ImageUploadProps {
  label: string;
  currentImage?: string;
  onImageChange: (url: string) => void;
  onPublicIdChange?: (publicId: string) => void; // New callback for publicId
  folder?: string;
  maxSizeMB?: number;
  recommendedSize?: string;
}

export default function ImageUpload({
  label,
  currentImage = '',
  onImageChange,
  onPublicIdChange,
  folder = 'department-quiz/quiz-images',
  maxSizeMB = 2,
  recommendedSize = '800×600px',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImage);
  const [publicId, setPublicId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Upload to Cloudinary
      const { url, publicId: uploadedPublicId } = await uploadImageToCloudinary(file, folder);
      
      // Update preview, publicId and notify parent
      setPreview(url);
      setPublicId(uploadedPublicId);
      onImageChange(url);
      
      // Notify parent of publicId if callback provided
      if (onPublicIdChange) {
        onPublicIdChange(uploadedPublicId);
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      // Delete from Cloudinary if publicId exists
      if (publicId) {
        console.log('Deleting image with publicId:', publicId);
        await deleteImageFromCloudinary(publicId);
        console.log('Image deleted from Cloudinary successfully');
      }
      
      // Clear local state
      setPreview('');
      setPublicId('');
      onImageChange('');
      
      // Notify parent that publicId is cleared
      if (onPublicIdChange) {
        onPublicIdChange('');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image from Cloudinary');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Upload Button */}
      <div className="flex items-start gap-4">
        {!preview && (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload Image</span>
              </>
            )}
          </button>
        )}

        {preview && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-red-500 text-white shadow-sm hover:bg-red-600 transition-all duration-200"
          >
            <X size={16} />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-2">
        Recommended: {recommendedSize}, Max: {maxSizeMB}MB (JPG, PNG, GIF)
      </p>

      {/* Preview */}
      {preview && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-[300px] object-contain rounded-lg shadow-md border border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              setError('Failed to load image preview');
            }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadPreviewProps {
  label: string;
  currentImage?: string;
  onImageSelect: (file: File | null) => void;
  onImageRemove: () => void;
  folder?: string;
  maxSizeMB?: number;
  recommendedSize?: string;
}

export default function ImageUploadPreview({
  label,
  currentImage = '',
  onImageSelect,
  onImageRemove,
  maxSizeMB = 2,
  recommendedSize = '800×600px',
}: ImageUploadPreviewProps) {
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImage changes (e.g., when loading question)
  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

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

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    // Notify parent with the file
    onImageSelect(file);
  };

  const handleRemoveImage = () => {
    // Clear preview
    setPreview('');
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Notify parent
    onImageRemove();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Upload/Remove Buttons */}
      <div className="flex items-start gap-4">
        {!preview && (
          <button
            type="button"
            onClick={handleClick}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200"
          >
            <Upload size={16} />
            <span>Select Image</span>
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
        <span className="block mt-1 text-orange-600 font-medium">
          ⚠ Image will be uploaded when you click "Save Changes"
        </span>
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

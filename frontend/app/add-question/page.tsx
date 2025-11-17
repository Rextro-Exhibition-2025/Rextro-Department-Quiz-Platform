"use client";

import ImageUploadPreview from '@/components/ImageUpload/ImageUploadPreview';
import { createAdminApi } from '@/interceptors/admins';
import { deleteImageFromCloudinary, uploadImageToCloudinary } from '@/lib/cloudinaryService';
import { RotateCcw, Save } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { transformQuestion } from './questionTransformer';
import { QUIZ_SETS } from '@/constants/quizSets';

// Error modal state for alerts
type ErrorModalState = { open: boolean; message: string };

interface Answer {
  id: string;
  text: string;
  image: string;
  imagePublicId?: string;
}

export interface Question {
  question: string;
  image: string;
  imagePublicId?: string;
  answers: Answer[];
  correctAnswer: string;
  quizSet: number | null;
}

export default function AddQuestion(): React.ReactElement | null {
  const [errorModal, setErrorModal] = useState<ErrorModalState>({ open: false, message: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const [question, setQuestion] = useState<Question>({
    question: '',
    image: '',
    answers: [
      { id: 'a', text: '', image: '' },
      { id: 'b', text: '', image: '' },
      { id: 'c', text: '', image: '' },
      { id: 'd', text: '', image: '' }
    ],
    correctAnswer: '',
    quizSet: null,
  });

  // Track pending image files (to upload on save)
  const [pendingImageFiles, setPendingImageFiles] = useState<{
    questionImage?: File;
    answers: Record<string, File>; // answerId -> File
  }>({
    answers: {}
  });

  // Track Cloudinary publicIds for uploaded images
  const [uploadedImageIds, setUploadedImageIds] = useState<{
    questionImage?: string;
    answers: Record<string, string>; // answerId -> publicId
  }>({
    answers: {}
  });

  // Key to force ImageUpload components to remount when form is cleared
  const [formResetKey, setFormResetKey] = useState(0);

  const handleQuizSetChange = (value: string): void => {
    const parsed = value ? parseInt(value) : null;
    setQuestion(prev => ({ ...prev, quizSet: parsed }));
  };

  const handleQuestionChange = (value: string): void => {
    setQuestion(prev => ({ ...prev, question: value }));
  };

  const handleQuestionImageChange = (value: string): void => {
    setQuestion(prev => ({ ...prev, image: value }));
  };

  const handleAnswerChange = (answerId: string, field: keyof Omit<Answer, 'id'>, value: string): void => {
    setQuestion(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === answerId ? { ...answer, [field]: value } : answer
      )
    }));
  };

  const handleCorrectAnswerChange = (answerId: string): void => {
    setQuestion(prev => ({ ...prev, correctAnswer: answerId }));
  };

  const handleSave = async (): Promise<void> => {
    if (!question.question.trim()) {
      setErrorModal({ open: true, message: 'Please enter a question.' });
      return;
    }

    // Validate that ALL 4 answers have either text or image
    const emptyAnswers = question.answers.filter(answer => 
      !answer.text.trim() && !answer.image.trim()
    );

    if (emptyAnswers.length > 0) {
      const emptyIds = emptyAnswers.map(a => a.id.toUpperCase()).join(', ');
      setErrorModal({ 
        open: true, 
        message: `All answer options must have text or image. Empty: ${emptyIds}` 
      });
      return;
    }

    if (!question.correctAnswer) {
      setErrorModal({ open: true, message: 'Please select the correct answer.' });
      return;
    }

    // Validate that the selected correct answer is not empty
    const correct = question.answers.find(a => a.id === question.correctAnswer);
    if (!correct || (!correct.text.trim() && !correct.image.trim())) {
      setErrorModal({ open: true, message: 'The selected correct answer must have text or image.' });
      return;
    }

    if (!question.quizSet) {
      setErrorModal({ open: true, message: 'Please select a quiz set.' });
      return;
    }

    try {
      setIsSaving(true);
      const api = await createAdminApi();
      const updatedQuestion = { ...question };
      const uploadedPublicIds: string[] = []; // Track for rollback
      
      // Upload question image if selected
      if (pendingImageFiles.questionImage) {
        const { url, publicId } = await uploadImageToCloudinary(pendingImageFiles.questionImage, 'department-quiz/quiz-questions');
        updatedQuestion.image = url;
        updatedQuestion.imagePublicId = publicId;
        uploadedPublicIds.push(publicId); // Track for potential rollback
      }
      
      // Upload answer images if selected
      for (const [answerId, file] of Object.entries(pendingImageFiles.answers)) {
        const answerIndex = updatedQuestion.answers.findIndex(a => a.id === answerId);
        if (answerIndex !== -1) {
          const { url, publicId } = await uploadImageToCloudinary(file, 'department-quiz/quiz-answers');
          updatedQuestion.answers[answerIndex].image = url;
          updatedQuestion.answers[answerIndex].imagePublicId = publicId;
          uploadedPublicIds.push(publicId); // Track for potential rollback
        }
      }
      
      
      
      try {
        const payload = transformQuestion(updatedQuestion);
        console.debug('Creating question, POST to', api.defaults.baseURL + '/questions', 'payload:', payload);
        const response = await api.post('/questions', payload);

      } catch (dbError) {
        // Database save failed - rollback uploaded images
        console.error('Database save failed, rolling back uploaded images:', dbError);
        for (const publicId of uploadedPublicIds) {
          try {
            await deleteImageFromCloudinary(publicId);
    
          } catch (deleteError) {
            console.error('Failed to rollback image:', publicId, deleteError);
          }
        }
        throw dbError; // Re-throw to be caught by outer catch
      }
      
      // Reset form - images are now uploaded
      setQuestion({
        question: '',
        image: '',
        answers: [
          { id: 'a', text: '', image: '' },
          { id: 'b', text: '', image: '' },
          { id: 'c', text: '', image: '' },
          { id: 'd', text: '', image: '' }
        ],
        correctAnswer: '',
        quizSet: null,
      });

      // Clear pending image files
      setPendingImageFiles({
        answers: {}
      });

      // Clear uploaded image IDs tracking
      setUploadedImageIds({
        answers: {}
      });

      // Force ImageUpload components to remount and reset their internal state
      setFormResetKey(prev => prev + 1);
      
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setShowSaveConfirm(true);
    } catch (error) {
      setErrorModal({ open: true, message: 'Failed to save question. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };


  const clearForm = async (): Promise<void> => {
    setIsClearing(true);
    // No need to delete from Cloudinary since images haven't been uploaded yet
    // Just clear local state

    // Clear the form state
    setQuestion({
      question: '',
      image: '',
      answers: [
        { id: 'a', text: '', image: '' },
        { id: 'b', text: '', image: '' },
        { id: 'c', text: '', image: '' },
        { id: 'd', text: '', image: '' }
      ],
      correctAnswer: '',
      quizSet: null,
    });

    // Clear pending image files
    setPendingImageFiles({
      answers: {}
    });

    // Clear uploaded image IDs
    setUploadedImageIds({
      answers: {}
    });

    // Force ImageUpload components to remount and reset their internal state
    setFormResetKey(prev => prev + 1);

    setShowClearConfirm(false);
    setIsClearing(false);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df7500]"></div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c16401] via-[#623400] to-[#251400] p-4">
      {/* Error Modal for Save Button Alerts */}
      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-[#df7500]">
            <div className="mb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#df7500] to-[#651321] shadow-lg">
                <span className="text-white text-2xl font-bold">!</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">Alert</h2>
              <p className="text-[#651321]">{errorModal.message}</p>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setErrorModal({ open: false, message: '' })}
                className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                style={{ minWidth: 120 }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Add New Question</h1>
            </div>
          </div>
        </div>

        {/* Instructions Card - Separate from form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-orange-100">
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#df7500] to-[#651321] flex items-center justify-center">
              <span className="text-white text-xl">📝</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">Instructions & Image Guidelines</h2>
              <p className="text-sm text-gray-600 mt-1">Please read these guidelines before adding questions</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-5 border border-orange-200">
              <ul className="text-sm text-gray-700 space-y-2.5">
                <li className="flex items-start">
                  <span className="mr-2 font-bold text-orange-600 text-base">•</span>
                  <span>Fill in the question text (required)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold text-orange-600 text-base">•</span>
                  <span>Add answer options - you can use text, images, or both</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold text-orange-600 text-base">•</span>
                  <span>At least one answer option must be provided</span>
                </li>
              </ul>
            
            <div className="mt-5 pt-5 border-t border-orange-300">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">🖼️</span>
                <h3 className="text-sm font-bold text-gray-800">Recommended Image Sizes (displayed large in quiz):</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                  <p className="font-bold text-orange-700 mb-2 flex items-center">
                    <span className="mr-2">🖼️</span> Question Image:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1.5 ml-1">
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Size:</b> 1024×768 pixels or larger for best quality</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Format:</b> JPG, PNG, or GIF</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Max file size:</b> 2MB</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Display:</b> Up to 768px wide in quiz (full width on mobile)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                  <p className="font-bold text-orange-700 mb-2 flex items-center">
                    <span className="mr-2">📸</span> Answer Option Images:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1.5 ml-1">
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Size:</b> 600×600 pixels or larger recommended</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Format:</b> JPG, PNG, or GIF</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Max file size:</b> 1MB</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span><b>Display:</b> Up to 384px wide in quiz (larger on desktop)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-xs text-gray-700 flex items-start">
                  <span className="mr-2 text-lg">💡</span>
                  <span><b>Tip:</b> Use high-quality images for better readability. Images are displayed large to help students see details clearly.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save confirmation popup */}
        {showSaveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-[#df7500]">
              <div className="mb-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#df7500] to-[#651321] shadow-lg">
                  <Save size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">Question Saved!</h2>
                <p className="text-[#651321]">Your question has been saved successfully.</p>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                  style={{ minWidth: 120 }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Clear confirmation popup */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-[#df7500]">
              <div className="mb-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#df7500] to-[#651321] shadow-lg">
                  <RotateCcw size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">Clear All Fields?</h2>
                <p className="text-[#651321]">This will remove all question and answer data. Are you sure?</p>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-gray-200 to-gray-400 text-[#651321] shadow hover:scale-105 hover:shadow transition-all duration-200 border border-gray-300"
                  style={{ minWidth: 100 }}
                >
                  Cancel
                </button>
                <button
                  onClick={clearForm}
                  className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                  style={{ minWidth: 100 }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Details</h2>
          {/* Quiz Set Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Set *
            </label>
            <select
              value={question.quizSet ?? ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleQuizSetChange(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none hover:border-gray-300 hover:bg-gray-50 focus:bg-[#df7500]/5 transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium shadow-sm focus:shadow-md"
            >
              <option value="">Select a quiz set</option>
              {QUIZ_SETS.map((s, idx) => (
                <option key={s} value={String(idx + 1)}>{s}</option>
              ))}
            </select>
          </div>
          {/* Question Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={question.question}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleQuestionChange(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none hover:border-gray-300 hover:bg-gray-50 focus:bg-[#df7500]/5 transition-all duration-200 resize-none placeholder-gray-400 text-gray-800 font-medium text-left shadow-sm focus:shadow-md"
              rows={3}
              placeholder="Enter your question here..."
            />
          </div>

          {/* Question Image */}
          <ImageUploadPreview
            key={`question-image-${formResetKey}`}
            label="Question Image (Optional)"
            currentImage={question.image}
            onImageSelect={(file) => {
              if (file) {
                setPendingImageFiles(prev => ({ ...prev, questionImage: file }));
                // Create preview URL for immediate display
                const previewUrl = URL.createObjectURL(file);
                setQuestion(prev => ({ ...prev, image: previewUrl }));
              }
            }}
            onImageRemove={() => {
              setPendingImageFiles(prev => {
                const { questionImage, ...rest } = prev;
                return rest;
              });
              setQuestion(prev => ({ ...prev, image: '' }));
            }}
            folder="department-quiz/quiz-questions"
            maxSizeMB={2}
            recommendedSize="1024×768px (displays up to 768px wide in quiz)"
          />
        </div>

        {/* Answers Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Answer Options</h2>
          
          <div className="space-y-4">
            {question.answers.map((answer, index) => (
              <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Option {answer.id.toUpperCase()}
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={answer.id}
                      checked={question.correctAnswer === answer.id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCorrectAnswerChange(e.target.value)}
                      className="text-[#df7500] focus:ring-[#df7500]"
                    />
                    <span className="text-sm text-gray-600">Correct Answer</span>
                  </label>
                </div>
                
                {/* Answer Text */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(answer.id, 'text', e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none hover:border-gray-300 hover:bg-gray-50 focus:bg-[#df7500]/5 transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium shadow-sm focus:shadow-md"
                    placeholder={`Enter text for option ${answer.id.toUpperCase()}`}
                  />
                </div>

                {/* Answer Image Upload */}
                <ImageUploadPreview
                  key={`answer-${answer.id}-image-${formResetKey}`}
                  label={`Image for Option ${answer.id.toUpperCase()} (Optional)`}
                  currentImage={answer.image}
                  onImageSelect={(file) => {
                    if (file) {
                      setPendingImageFiles(prev => ({
                        ...prev,
                        answers: { ...prev.answers, [answer.id]: file }
                      }));
                      // Create preview URL for immediate display
                      const previewUrl = URL.createObjectURL(file);
                      handleAnswerChange(answer.id, 'image', previewUrl);
                    }
                  }}
                  onImageRemove={() => {
                    setPendingImageFiles(prev => {
                      const { [answer.id]: removed, ...restAnswers } = prev.answers;
                      return { ...prev, answers: restAnswers };
                    });
                    handleAnswerChange(answer.id, 'image', '');
                  }}
                  folder="department-quiz/quiz-answers"
                  maxSizeMB={1}
                  recommendedSize="600×600px (displays up to 384px wide)"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons at the bottom */}
        <div className="p-6 mt-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isSaving || isClearing}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isClearing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <RotateCcw size={16} />
              )}
              <span>{isClearing ? 'Clearing...' : 'Clear'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isClearing}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Save size={16} />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Question'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

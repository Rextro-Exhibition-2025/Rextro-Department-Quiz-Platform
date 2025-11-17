"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, Trash2 } from "lucide-react";
import { createAdminApi } from "@/interceptors/admins";
import transformQuizApiQuestion from "../manage-questions/questionTransformer";
import { QUIZ_SETS } from '@/constants/quizSets';
import { Question, QuestionApiResponse } from "@/types/quiz";
import { transformQuestionToApi } from "./questionTransformer";
import ImageUploadPreview from "@/components/ImageUpload/ImageUploadPreview";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinaryService";

// Error modal state for alerts


type ErrorModalState = { open: boolean; message: string };





function EditQuestionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [originalQuestion, setOriginalQuestion] = useState<Question | null>(null); // Store original for comparison
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({ open: false, message: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const questionId = searchParams.get("id");
  
  // Track pending image changes (files to upload, URLs to delete)
  const [pendingImageChanges, setPendingImageChanges] = useState<{
    questionImage?: { action: 'upload' | 'delete', file?: File, oldUrl?: string };
    answers: Record<string, { action: 'upload' | 'delete', file?: File, oldUrl?: string }>;
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



  // Helper function to extract publicId from Cloudinary URL
  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  // Detect changes in question data
  useEffect(() => {
    if (question && originalQuestion) {
      const hasChanges = JSON.stringify(question) !== JSON.stringify(originalQuestion);
      setHasUnsavedChanges(hasChanges);
    }
  }, [question, originalQuestion]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {





    const getQuestionById = async (id: string) => {

      const api = await createAdminApi();
      try {



        const response = await api.get(`/questions/${id}`);

        const loadedQuestion = transformQuizApiQuestion((response?.data as { data: QuestionApiResponse; success: boolean }).data);
        
        // Convert QuestionItem to Question format (questionImage -> image)
        const convertedQuestion: Question = {
          id: loadedQuestion.id,
          question: loadedQuestion.question,
          image: loadedQuestion.questionImage || '',
          imagePublicId: loadedQuestion.questionImage ? extractPublicIdFromUrl(loadedQuestion.questionImage) || undefined : undefined,
          answers: loadedQuestion.answers.map(ans => ({
            id: ans.id,
            text: ans.text || null,
            image: ans.image || null,
            imagePublicId: ans.imagePublicId
          })),
          correctAnswer: loadedQuestion.correctAnswer,
          quizSet: loadedQuestion.quizSet
        };
        
        setQuestion(convertedQuestion);
        setOriginalQuestion(JSON.parse(JSON.stringify(convertedQuestion))); // Deep clone for comparison
        
        // Extract and store publicIds from existing images
        const newUploadedImageIds: {
          questionImage?: string;
          answers: Record<string, string>;
        } = { answers: {} };
        
        if (convertedQuestion.image) {
          const publicId = extractPublicIdFromUrl(convertedQuestion.image);
          if (publicId) {
            newUploadedImageIds.questionImage = publicId;
          }
        }
        
        convertedQuestion.answers.forEach(answer => {
          if (answer.image) {
            const publicId = extractPublicIdFromUrl(answer.image);
            if (publicId) {
              newUploadedImageIds.answers[answer.id] = publicId;
            }
          }
        });
        
        setUploadedImageIds(newUploadedImageIds);
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      getQuestionById(questionId);
    } else {
      setLoading(false);
    }

  }, [questionId]);



  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df7500]"></div>
      </div>
    );
  }

  if (!question) {
    return <div className="text-center mt-10 text-gray-500">Question not found.</div>;
  }

  // Validation and save logic (copied from Add Question)
  const handleSave = async (): Promise<void> => {
    if (!question) return;
    if (!question.question.trim()) {
      setErrorModal({ open: true, message: 'Please enter a question.' });
      return;
    }
    
    // Validate that ALL 4 answers have either text or image
    const emptyAnswers = question.answers.filter(answer => 
      !answer?.text?.trim() && !answer?.image?.trim()
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
    if (!correct || (!correct?.text?.trim() && !correct?.image?.trim())) {
      setErrorModal({ open: true, message: 'The selected correct answer must have text or image.' });
      return;
    }
    if (!question.quizSet) {
      setErrorModal({ open: true, message: 'Please select a quiz set.' });
      return;
    }

    try {
      setIsSaving(true);
      setShowSaveConfirm(true);
      const api = await createAdminApi();
      
      // Process image changes before saving
      const updatedQuestion = { ...question };
      const newUploadedPublicIds: string[] = []; // Track newly uploaded images for rollback
      
      // Handle question image
      if (pendingImageChanges.questionImage) {
        if (pendingImageChanges.questionImage.action === 'upload' && pendingImageChanges.questionImage.file) {
          // Upload new image
          const { url, publicId } = await uploadImageToCloudinary(pendingImageChanges.questionImage.file, 'department-quiz/quiz-questions');
          updatedQuestion.image = url;
          updatedQuestion.imagePublicId = publicId;
          newUploadedPublicIds.push(publicId); // Track for rollback
          
          // Delete old image if exists
          if (pendingImageChanges.questionImage.oldUrl) {
            const oldPublicId = extractPublicIdFromUrl(pendingImageChanges.questionImage.oldUrl);
            if (oldPublicId) {
              await deleteImageFromCloudinary(oldPublicId).catch(err => 
                console.warn('Failed to delete old question image:', err)
              );
            }
          }
        } else if (pendingImageChanges.questionImage.action === 'delete') {
          // Delete existing image
          if (pendingImageChanges.questionImage.oldUrl) {
            const oldPublicId = extractPublicIdFromUrl(pendingImageChanges.questionImage.oldUrl);
            if (oldPublicId) {
              await deleteImageFromCloudinary(oldPublicId).catch(err => 
                console.warn('Failed to delete question image:', err)
              );
            }
          }
          updatedQuestion.image = '';
          updatedQuestion.imagePublicId = '';
        }
      }
      
      // Handle answer images
      for (const [answerId, change] of Object.entries(pendingImageChanges.answers)) {
        const answerIndex = updatedQuestion.answers.findIndex(a => a.id === answerId);
        if (answerIndex === -1) continue;
        
        if (change.action === 'upload' && change.file) {
          // Upload new image
          const { url, publicId } = await uploadImageToCloudinary(change.file, 'department-quiz/quiz-answers');
          updatedQuestion.answers[answerIndex].image = url;
          updatedQuestion.answers[answerIndex].imagePublicId = publicId;
          newUploadedPublicIds.push(publicId); // Track for rollback
          
          // Delete old image if exists
          if (change.oldUrl) {
            const oldPublicId = extractPublicIdFromUrl(change.oldUrl);
            if (oldPublicId) {
              await deleteImageFromCloudinary(oldPublicId).catch(err => 
                console.warn(`Failed to delete old answer ${answerId} image:`, err)
              );
            }
          }
        } else if (change.action === 'delete') {
          // Delete existing image
          if (change.oldUrl) {
            const oldPublicId = extractPublicIdFromUrl(change.oldUrl);
            if (oldPublicId) {
              await deleteImageFromCloudinary(oldPublicId).catch(err => 
                console.warn(`Failed to delete answer ${answerId} image:`, err)
              );
            }
          }
          updatedQuestion.answers[answerIndex].image = '';
          updatedQuestion.answers[answerIndex].imagePublicId = '';
        }
      }
      
      console.log(updatedQuestion);
      const transformedQuestion = transformQuestionToApi(updatedQuestion);
      console.log(transformedQuestion);
      console.log(updatedQuestion.id);

      try {
        await api.put(`/questions/${updatedQuestion.id}`, transformedQuestion);
        
        // Reset pending changes and unsaved changes flag after successful save
        setPendingImageChanges({ answers: {} });
        setHasUnsavedChanges(false);
        setOriginalQuestion(JSON.parse(JSON.stringify(updatedQuestion))); // Update original to current
        
        router.push("/manage-questions");
      } catch (dbError) {
        // Database save failed - rollback newly uploaded images
        console.error('Database save failed, rolling back newly uploaded images:', dbError);
        for (const publicId of newUploadedPublicIds) {
          try {
            await deleteImageFromCloudinary(publicId);
            console.log('Rolled back image:', publicId);
          } catch (deleteError) {
            console.error('Failed to rollback image:', publicId, deleteError);
          }
        }
        throw dbError; // Re-throw to be caught by outer catch
      }

    } catch (error) {
      console.error('Error saving question:', error);
      setShowSaveConfirm(false);
      setErrorModal({ open: true, message: 'Failed to save question. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete logic
  const handleDelete = async () => {
    if (!question) return;
    
    try {
      setIsDeleting(true);
      const api = await createAdminApi();
      
      // Delete the question from the database first
      await api.delete(`/questions/${question.id}`);
      
      // Then delete images from Cloudinary
      // Delete question image if exists
      if (question.image) {
        const publicId = uploadedImageIds.questionImage || extractPublicIdFromUrl(question.image);
        if (publicId) {
          console.log('Deleting question image from Cloudinary:', publicId);
          await deleteImageFromCloudinary(publicId).catch(err => 
            console.warn('Failed to delete question image:', err)
          );
        }
      }
      
      // Delete answer images if exist
      for (const answer of question.answers) {
        if (answer.image) {
          const publicId = uploadedImageIds.answers[answer.id] || extractPublicIdFromUrl(answer.image);
          if (publicId) {
            console.log(`Deleting answer ${answer.id} image from Cloudinary:`, publicId);
            await deleteImageFromCloudinary(publicId).catch(err => 
              console.warn(`Failed to delete answer ${answer.id} image:`, err)
            );
          }
        }
      }
      
      setShowDeleteConfirm(false);
      setHasUnsavedChanges(false); // Clear flag before navigation
      setTimeout(() => {
        router.push("/manage-questions");
      }, 500);
    } catch (error) {
      console.error('Error deleting question:', error);
      setErrorModal({ open: true, message: 'Failed to delete question. Please try again.' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c16401] via-[#623400] to-[#251400] p-4">
      {/* Error Modal for Alerts */}
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
      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-[#df7500]">
            <div className="mb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-red-500 to-red-800 shadow-lg">
                <Trash2 size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent mb-1">Delete Question?</h2>
              <p className="text-[#651321]">Are you sure you want to delete this question? This action cannot be undone.</p>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-gray-200 to-gray-400 text-[#651321] shadow hover:scale-105 hover:shadow transition-all duration-200 border border-gray-300"
                style={{ minWidth: 100 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-red-800 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                style={{ minWidth: 100 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Save Confirmation Popup */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-[#df7500]">
            <div className="mb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#df7500] to-[#651321] shadow-lg">
                <Save size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">Question Saved!</h2>
              <p className="text-[#651321]">Your changes have been saved successfully.</p>
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
      {/* Unsaved Changes Warning Popup */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-[#df7500]">
            <div className="mb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg">
                <span className="text-white text-2xl font-bold">⚠</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">Unsaved Changes</h2>
              <p className="text-[#651321] mb-2">You have unsaved changes that will be lost if you leave this page.</p>
              <p className="text-sm text-gray-600">Would you like to save your changes before leaving?</p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setShowUnsavedChangesModal(false)}
                className="px-5 py-2 rounded-lg font-semibold bg-gradient-to-r from-gray-200 to-gray-400 text-[#651321] shadow hover:scale-105 hover:shadow transition-all duration-200 border border-gray-300"
                style={{ minWidth: 110 }}
              >
                Stay Here
              </button>
              <button
                onClick={() => {
                  setShowUnsavedChangesModal(false);
                  setHasUnsavedChanges(false);
                  router.push("/manage-questions");
                }}
                className="px-5 py-2 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                style={{ minWidth: 110 }}
              >
                Leave
              </button>
              <button
                onClick={async () => {
                  setShowUnsavedChangesModal(false);
                  await handleSave();
                }}
                className="px-5 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                style={{ minWidth: 110 }}
              >
                <div className="flex items-center space-x-1">
                  <Save size={16} />
                  <span>Save</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">Edit Question</h1>
              {hasUnsavedChanges && (
                <span className="px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full border border-orange-300">
                  Unsaved Changes
                </span>
              )}
            </div>
          </div>
        </div>
        {/* ...existing code... */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Details</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Set *</label>
            <select
              value={question.quizSet}
              onChange={e => setQuestion(q => q ? { ...q, quizSet: e.target.value } : q)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none hover:border-gray-300 hover:bg-gray-50 focus:bg-[#df7500]/5 text-gray-800  transition-all duration-200 cursor-pointer"
            >
              <option value="">Select a quiz set</option>
              {QUIZ_SETS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
            <textarea
              value={question.question}
              onChange={e => setQuestion(q => q ? { ...q, question: e.target.value } : q)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none hover:border-gray-300 hover:bg-gray-50 focus:bg-[#df7500]/5 transition-all duration-200 resize-none placeholder-gray-400 text-gray-800 font-medium text-left shadow-sm focus:shadow-md"
              rows={3}
              placeholder="Enter your question here..."
            />
          </div>
          
          {/* Question Image Upload */}
          <ImageUploadPreview
            label="Question Image (Optional)"
            currentImage={question.image || ""}
            onImageSelect={(file) => {
              if (file) {
                setPendingImageChanges(prev => ({
                  ...prev,
                  questionImage: { action: 'upload', file, oldUrl: question.image || undefined }
                }));
                // Create preview URL for immediate display
                const previewUrl = URL.createObjectURL(file);
                setQuestion(q => q ? { ...q, image: previewUrl } : q);
              }
            }}
            onImageRemove={() => {
              const oldUrl = originalQuestion?.image;
              if (oldUrl) {
                // Mark for deletion on save
                setPendingImageChanges(prev => ({
                  ...prev,
                  questionImage: { action: 'delete', oldUrl }
                }));
              } else {
                // Just clear pending upload
                setPendingImageChanges(prev => {
                  const { questionImage, ...rest } = prev;
                  return rest;
                });
              }
              setQuestion(q => q ? { ...q, image: '' } : q);
            }}
            folder="department-quiz/quiz-questions"
            maxSizeMB={2}
            recommendedSize="1024×768px (displays up to 768px wide in quiz)"
          />
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Answer Options</h2>
          <div className="space-y-4">
            {question.answers.map((answer, index) => (
              <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Option {answer.id.toUpperCase()}</label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={answer.id}
                      checked={question.correctAnswer === answer.id}
                      onChange={() => setQuestion(q => q ? { ...q, correctAnswer: answer.id } : q)}
                      className="text-[#df7500] focus:ring-[#df7500]"
                    />
                    <span className="text-sm text-gray-600">Correct Answer</span>
                  </label>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={answer?.text || ""}
                    onChange={e => setQuestion(q => q ? { ...q, answers: q.answers.map((a, i) => i === index ? { ...a, text: e.target.value } : a) } : q)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none hover:border-gray-300 hover:bg-gray-50 focus:bg-[#df7500]/5 transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium shadow-sm focus:shadow-md"
                    placeholder={`Enter text for option ${answer.id.toUpperCase()}`}
                  />
                </div>
                
                {/* Answer Image Upload */}
                <ImageUploadPreview
                  label={`Image for Option ${answer.id.toUpperCase()} (Optional)`}
                  currentImage={answer?.image || ""}
                  onImageSelect={(file) => {
                    if (file) {
                      setPendingImageChanges(prev => ({
                        ...prev,
                        answers: {
                          ...prev.answers,
                          [answer.id]: { action: 'upload', file, oldUrl: answer.image || undefined }
                        }
                      }));
                      // Create preview URL for immediate display
                      const previewUrl = URL.createObjectURL(file);
                      setQuestion(q => q ? { 
                        ...q, 
                        answers: q.answers.map((a, i) => i === index ? { ...a, image: previewUrl } : a) 
                      } : q);
                    }
                  }}
                  onImageRemove={() => {
                    const oldUrl = originalQuestion?.answers[index]?.image;
                    if (oldUrl) {
                      // Mark for deletion on save
                      setPendingImageChanges(prev => ({
                        ...prev,
                        answers: {
                          ...prev.answers,
                          [answer.id]: { action: 'delete', oldUrl }
                        }
                      }));
                    } else {
                      // Just clear pending upload
                      setPendingImageChanges(prev => {
                        const { [answer.id]: removed, ...restAnswers } = prev.answers;
                        return { ...prev, answers: restAnswers };
                      });
                    }
                    setQuestion(q => q ? { 
                      ...q, 
                      answers: q.answers.map((a, i) => i === index ? { ...a, image: '' } : a) 
                    } : q);
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
              onClick={() => {
                if (hasUnsavedChanges) {
                  setShowUnsavedChangesModal(true);
                } else {
                  router.push("/manage-questions");
                }
              }}
              disabled={isSaving || isDeleting}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span>Cancel</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-red-800 text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Trash2 size={16} />
              )}
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Save size={16} />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditQuestionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df7500]"></div>
      </div>
    }>
      <EditQuestionContent />
    </Suspense>
  );
}

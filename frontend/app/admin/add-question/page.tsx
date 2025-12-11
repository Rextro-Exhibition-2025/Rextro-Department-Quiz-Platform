"use client";

import ImageUploadPreview from "@/components/ImageUpload/ImageUploadPreview";
import { createAdminApi } from "@/interceptors/admins";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/lib/cloudinaryService";
import { RotateCcw, Save } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { transformQuestion } from "./questionTransformer";
import AncientLoader from "@/components/AncientLoader";

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
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    open: false,
    message: "",
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin-access");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        try {
          const api = await createAdminApi();
          const resp = await api.get("/quizzes/get-quiz-sets");
          if (resp && resp.data) {
            const body: any = resp.data as any;
            const sets = Array.isArray(body)
              ? (body as { quizId: number; name: string }[])
              : ((body?.data ?? []) as { quizId: number; name: string }[]);
            setQuizSets(sets);

            if (Array.isArray(sets) && sets.length > 0) {
              const selected =
                sets.find((s) => s.quizId === question.quizSet) ?? sets[0];
              setQuestion((prev) => ({ ...prev, quizSet: selected.quizId }));
            }
          }
        } catch (err) {
          console.error("Failed to fetch quiz sets", err);
        }
      })();
    }
  }, [status]);

  const [question, setQuestion] = useState<Question>({
    question: "",
    image: "",
    answers: [
      { id: "a", text: "", image: "" },
      { id: "b", text: "", image: "" },
      { id: "c", text: "", image: "" },
      { id: "d", text: "", image: "" },
    ],
    correctAnswer: "",
    quizSet: null,
  });

  const [pendingImageFiles, setPendingImageFiles] = useState<{
    questionImage?: File;
    answers: Record<string, File>;
  }>({
    answers: {},
  });

  const [uploadedImageIds, setUploadedImageIds] = useState<{
    questionImage?: string;
    answers: Record<string, string>;
  }>({
    answers: {},
  });

  const [formResetKey, setFormResetKey] = useState(0);

  const [quizSets, setQuizSets] = useState<{ quizId: number; name: string }[]>(
    []
  );

  const handleQuizSetChange = (value: string): void => {
    const parsed = value ? parseInt(value) : null;
    setQuestion((prev) => ({ ...prev, quizSet: parsed }));
  };

  const refreshQuizSets = async (): Promise<void> => {
    try {
      const api = await createAdminApi();
      const resp = await api.get("/quizzes/get-quiz-sets");
      if (resp && resp.data) {
        const body: any = resp.data as any;
        const sets = Array.isArray(body)
          ? (body as { quizId: number; name: string }[])
          : ((body?.data ?? []) as { quizId: number; name: string }[]);
        setQuizSets(sets);
      }
    } catch (err) {
      console.error("Failed to refresh quiz sets", err);
    }
  };

  const handleQuestionChange = (value: string): void => {
    setQuestion((prev) => ({ ...prev, question: value }));
  };

  const handleQuestionImageChange = (value: string): void => {
    setQuestion((prev) => ({ ...prev, image: value }));
  };

  const handleAnswerChange = (
    answerId: string,
    field: keyof Omit<Answer, "id">,
    value: string
  ): void => {
    setQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((answer) =>
        answer.id === answerId ? { ...answer, [field]: value } : answer
      ),
    }));
  };

  const handleCorrectAnswerChange = (answerId: string): void => {
    setQuestion((prev) => ({ ...prev, correctAnswer: answerId }));
  };

  const handleSave = async (): Promise<void> => {
    if (!question.question.trim()) {
      setErrorModal({ open: true, message: "Please enter a question." });
      return;
    }

    const emptyAnswers = question.answers.filter(
      (answer) => !answer.text.trim() && !answer.image.trim()
    );

    if (emptyAnswers.length > 0) {
      const emptyIds = emptyAnswers.map((a) => a.id.toUpperCase()).join(", ");
      setErrorModal({
        open: true,
        message: `All answer options must have text or image. Empty: ${emptyIds}`,
      });
      return;
    }

    if (!question.correctAnswer) {
      setErrorModal({
        open: true,
        message: "Please select the correct answer.",
      });
      return;
    }

    const correct = question.answers.find(
      (a) => a.id === question.correctAnswer
    );
    if (!correct || (!correct.text.trim() && !correct.image.trim())) {
      setErrorModal({
        open: true,
        message: "The selected correct answer must have text or image.",
      });
      return;
    }

    if (!question.quizSet) {
      setErrorModal({ open: true, message: "Please select a quiz set." });
      return;
    }

    try {
      setIsSaving(true);
      const api = await createAdminApi();
      const updatedQuestion = { ...question };
      const uploadedPublicIds: string[] = [];

      if (pendingImageFiles.questionImage) {
        const { url, publicId } = await uploadImageToCloudinary(
          pendingImageFiles.questionImage,
          "department-quiz/quiz-questions"
        );
        updatedQuestion.image = url;
        updatedQuestion.imagePublicId = publicId;
        uploadedPublicIds.push(publicId);
      }

      for (const [answerId, file] of Object.entries(
        pendingImageFiles.answers
      )) {
        const answerIndex = updatedQuestion.answers.findIndex(
          (a) => a.id === answerId
        );
        if (answerIndex !== -1) {
          const { url, publicId } = await uploadImageToCloudinary(
            file,
            "department-quiz/quiz-answers"
          );
          updatedQuestion.answers[answerIndex].image = url;
          updatedQuestion.answers[answerIndex].imagePublicId = publicId;
          uploadedPublicIds.push(publicId);
        }
      }

      try {
        const payload = transformQuestion(updatedQuestion);
        console.debug(
          "Creating question, POST to",
          api.defaults.baseURL + "/questions",
          "payload:",
          payload
        );
        const response = await api.post("/questions", payload);
      } catch (dbError) {
        console.error(
          "Database save failed, rolling back uploaded images:",
          dbError
        );
        for (const publicId of uploadedPublicIds) {
          try {
            await deleteImageFromCloudinary(publicId);
          } catch (deleteError) {
            console.error("Failed to rollback image:", publicId, deleteError);
          }
        }
        throw dbError;
      }

      setQuestion({
        question: "",
        image: "",
        answers: [
          { id: "a", text: "", image: "" },
          { id: "b", text: "", image: "" },
          { id: "c", text: "", image: "" },
          { id: "d", text: "", image: "" },
        ],
        correctAnswer: "",
        quizSet: null,
      });

      setPendingImageFiles({
        answers: {},
      });

      setUploadedImageIds({
        answers: {},
      });

      setFormResetKey((prev) => prev + 1);

      window.scrollTo({ top: 0, behavior: "smooth" });

      setShowSaveConfirm(true);
    } catch (error) {
      setErrorModal({
        open: true,
        message: "Failed to save question. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearForm = async (): Promise<void> => {
    setIsClearing(true);

    setQuestion({
      question: "",
      image: "",
      answers: [
        { id: "a", text: "", image: "" },
        { id: "b", text: "", image: "" },
        { id: "c", text: "", image: "" },
        { id: "d", text: "", image: "" },
      ],
      correctAnswer: "",
      quizSet: null,
    });

    setPendingImageFiles({
      answers: {},
    });

    setUploadedImageIds({
      answers: {},
    });

    setFormResetKey((prev) => prev + 1);

    setShowClearConfirm(false);
    setIsClearing(false);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin-access" });
  };

  if (status === "loading") {
    return (
      <AncientLoader
        fullScreen={true}
        text="Verifying Cartographer Credentials..."
      />
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen p-4 relative" style={{ background: 'linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)' }}>
      {/* Parchment texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`
      }} />
      {/* Map grid */}
      <div className="absolute inset-0 map-grid pointer-events-none" style={{ zIndex: 0 }} />
      {/* Error Modal for Save Button Alerts */}
      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-[#df7500]">
            <div className="mb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#df7500] to-[#651321] shadow-lg">
                <span className="text-white text-2xl font-bold">!</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">
                Alert
              </h2>
              <p className="text-[#651321]">{errorModal.message}</p>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setErrorModal({ open: false, message: "" })}
                className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                style={{ minWidth: 120 }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="parchment-card rounded-2xl shadow-xl p-6 mb-6 relative">
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#651321', letterSpacing: '0.03em' }}>
                Add New Question
              </h1>
            </div>
          </div>
        </div>

        {/* Instructions Card - Separate from form */}
        <div className="parchment-card rounded-2xl shadow-xl p-8 mb-6 relative">
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
          <div className="flex items-start space-x-4 mb-6">
            <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(180deg, #c04000 0%, #4a2511 100%)' }}>
              <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>📝</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
                Instructions & Image Guidelines
              </h2>
              <p className="text-sm font-medium mt-1" style={{ color: '#4a2511', fontFamily: 'Crimson Text, serif' }}>
                Please read these guidelines before adding questions
              </p>
            </div>
          </div>

          <div className="rounded-xl p-6 relative" style={{ background: 'linear-gradient(135deg, rgba(255, 248, 231, 0.6) 0%, rgba(232, 213, 181, 0.6) 100%)', border: '2px solid #8b5a2b' }}>
            <ul className="text-sm font-medium space-y-3" style={{ color: '#2a1a11', fontFamily: 'Crimson Text, serif' }}>
              <li className="flex items-start">
                <span className="mr-3 font-bold text-lg" style={{ color: '#c04000' }}>✦</span>
                <span>Fill in the question text (required)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 font-bold text-lg" style={{ color: '#c04000' }}>✦</span>
                <span>
                  Add answer options - you can use text, images, or both
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 font-bold text-lg" style={{ color: '#c04000' }}>✦</span>
                <span>At least one answer option must be provided</span>
              </li>
            </ul>

            <div className="mt-5 pt-5 border-t border-orange-300">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🖼️</span>
                <h3 className="text-base font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
                  Recommended Image Sizes (displayed large in quiz):
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="parchment-card p-4 rounded-lg shadow-md">
                  <p className="font-bold flex items-center mb-3" style={{ color: '#c04000', fontFamily: 'Cinzel, serif' }}>
                    <span className="mr-2">🖼️</span> Question Image:
                  </p>
                  <ul className="text-xs font-medium space-y-2 ml-1" style={{ color: '#2a1a11', fontFamily: 'Crimson Text, serif' }}>
                    <li className="flex items-start">
                      <span className="mr-2" style={{ color: '#c04000' }}>▸</span>
                      <span>
                        <b>Size:</b> 1024×768 pixels or larger for best quality
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2" style={{ color: '#c04000' }}>▸</span>
                      <span>
                        <b>Format:</b> JPG, PNG, or GIF
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2" style={{ color: '#c04000' }}>▸</span>
                      <span>
                        <b>Max file size:</b> 2MB
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2" style={{ color: '#c04000' }}>▸</span>
                      <span>
                        <b>Display:</b> Up to 768px wide in quiz (full width on
                        mobile)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="parchment-card p-4 rounded-lg shadow-md">
                  <p className="font-bold flex items-center mb-3" style={{ color: '#c04000', fontFamily: 'Cinzel, serif' }}>
                    <span className="mr-2">📸</span> Answer Option Images:
                  </p>
                  <ul className="text-xs font-medium space-y-2 ml-1" style={{ color: '#2a1a11', fontFamily: 'Crimson Text, serif' }}>
                    <li className="flex items-start">
                      <span className="mr-2" style={{ color: '#c04000' }}>▸</span>
                      <span>
                        <b>Size:</b> 600×600 pixels or larger recommended
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span>
                        <b>Format:</b> JPG, PNG, or GIF
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span>
                        <b>Max file size:</b> 1MB
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1.5 text-orange-500">▸</span>
                      <span>
                        <b>Display:</b> Up to 384px wide in quiz (larger on
                        desktop)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-xs text-gray-700 flex items-start">
                  <span className="mr-2 text-lg">💡</span>
                  <span>
                    <b>Tip:</b> Use high-quality images for better readability.
                    Images are displayed large to help students see details
                    clearly.
                  </span>
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
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">
                  Question Saved!
                </h2>
                <p className="text-[#651321]">
                  Your question has been saved successfully.
                </p>
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
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent mb-1">
                  Clear All Fields?
                </h2>
                <p className="text-[#651321]">
                  This will remove all question and answer data. Are you sure?
                </p>
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
        <div className="parchment-card rounded-2xl shadow-xl p-8 mb-6 relative">
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
            Question Details
          </h2>
          {/* Quiz Set Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-3" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
              Quiz Set *
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label htmlFor="existing-sets" className="sr-only">
                  Choose existing set
                </label>
                <select
                  id="existing-sets"
                  onFocus={() => {
                    void refreshQuizSets();
                  }}
                  value={question.quizSet ? String(question.quizSet) : ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleQuizSetChange(e.target.value)
                  }
                  className="w-full p-3 rounded-lg font-semibold shadow-sm transition-all duration-200"
                  style={{
                    fontFamily: 'Crimson Text, serif',
                    background: 'linear-gradient(135deg, #FFF8E7 0%, #F4E8D0 100%)',
                    color: '#2a1a11',
                    border: '2px solid #704214'
                  }}
                >
                  <option value="">Select set</option>
                  {quizSets.map((s) => (
                    <option key={s.quizId} value={String(s.quizId)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Question Text */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-3" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
              Question Text *
            </label>
            <textarea
              value={question.question}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleQuestionChange(e.target.value)
              }
              className="w-full p-4 rounded-xl resize-none shadow-md transition-all duration-200 font-medium"
              style={{
                fontFamily: 'Crimson Text, serif',
                background: 'linear-gradient(135deg, #FFF8E7 0%, #F4E8D0 100%)',
                color: '#2a1a11',
                border: '2px solid #704214'
              }}
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
                setPendingImageFiles((prev) => ({
                  ...prev,
                  questionImage: file,
                }));

                const previewUrl = URL.createObjectURL(file);
                setQuestion((prev) => ({ ...prev, image: previewUrl }));
              }
            }}
            onImageRemove={() => {
              setPendingImageFiles((prev) => {
                const { questionImage, ...rest } = prev;
                return rest;
              });
              setQuestion((prev) => ({ ...prev, image: "" }));
            }}
            folder="department-quiz/quiz-questions"
            maxSizeMB={2}
            recommendedSize="1024×768px (displays up to 768px wide in quiz)"
          />
        </div>

        {/* Answers Form */}
        <div className="parchment-card rounded-2xl shadow-xl p-8 relative">
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-right" />
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
            Answer Options
          </h2>

          <div className="space-y-4">
            {question.answers.map((answer, index) => (
              <div
                key={answer.id}
                className="rounded-xl p-5 shadow-md transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, rgba(255, 248, 231, 0.5) 0%, rgba(244, 232, 208, 0.5) 100%)', border: '2px solid #8b5a2b' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>
                    Option {answer.id.toUpperCase()}
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={answer.id}
                      checked={question.correctAnswer === answer.id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCorrectAnswerChange(e.target.value)
                      }
                      className="text-[#c04000] focus:ring-[#c04000]"
                    />
                    <span className="text-sm font-semibold" style={{ color: '#4a2511', fontFamily: 'Crimson Text, serif' }}>
                      Correct Answer
                    </span>
                  </label>
                </div>

                {/* Answer Text */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAnswerChange(answer.id, "text", e.target.value)
                    }
                    className="w-full p-4 rounded-xl shadow-md font-medium transition-all duration-200"
                    style={{
                      fontFamily: 'Crimson Text, serif',
                      background: 'linear-gradient(135deg, #FFF8E7 0%, #F4E8D0 100%)',
                      color: '#2a1a11',
                      border: '2px solid #704214'
                    }}
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
                      setPendingImageFiles((prev) => ({
                        ...prev,
                        answers: { ...prev.answers, [answer.id]: file },
                      }));

                      const previewUrl = URL.createObjectURL(file);
                      handleAnswerChange(answer.id, "image", previewUrl);
                    }
                  }}
                  onImageRemove={() => {
                    setPendingImageFiles((prev) => {
                      const { [answer.id]: removed, ...restAnswers } =
                        prev.answers;
                      return { ...prev, answers: restAnswers };
                    });
                    handleAnswerChange(answer.id, "image", "");
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
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isSaving || isClearing}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'linear-gradient(135deg, #e3d5b8 0%, #d4c5a3 100%)',
                color: '#4a2511',
                border: '2px solid #8b5a2b'
              }}
            >
              {isClearing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#4a2511] border-t-transparent"></div>
              ) : (
                <RotateCcw size={16} />
              )}
              <span>{isClearing ? "Clearing..." : "Clear"}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isClearing}
              className="ancient-button flex items-center space-x-2 px-8 py-3 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Save size={16} />
              )}
              <span>{isSaving ? "Saving..." : "Save Question"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

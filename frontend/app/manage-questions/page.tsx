"use client";
import { createAdminApi } from "@/interceptors/admins";
import { QuestionApiResponse, QuestionItem, QuizApiResponse } from "@/types/quiz";
// Replaced Tab-based UI with a simple dropdown selector for quiz sets
import { Edit, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { transformQuizApiQuestions } from "./questionTransformer";
import { QUIZ_SETS } from '@/constants/quizSets';
import { useQuiz } from '@/contexts/QuizContext';
// Dummy data for demonstration. Replace with API call in production.


export default function ManageQuestions() {


	const router = useRouter();
	const { data: session, status } = useSession();
	const [questions, setQuestions] = useState<QuestionItem[]>();
	const [selectedQuizSet, setSelectedQuizSet] = useState(QUIZ_SETS[0]);
	const [isLoadingTab, setIsLoadingTab] = useState(false);
	const [loadingQuestionId, setLoadingQuestionId] = useState<string | null>(null);
	const [published, setPublished] = useState<boolean>(false);

// Move memoized calculations up so hooks order is stable across renders
const countsBySet = useMemo(() => {
    if (!questions) return {} as Record<string, number>;
    return questions.reduce((acc: Record<string, number>, q) => {
        acc[q.quizSet] = (acc[q.quizSet] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}, [questions]);

const totalQuestions = questions?.length ?? 0;

useEffect(() => {
	const checkPublishedStatus = async () => {
		const api = await createAdminApi();
		try {
			const response = await api.get<{ isPublished: boolean }>('/quizzes/check-quiz-published-status');
			setPublished(response?.data?.isPublished ?? false);
		} catch (error) {
			// Better error reporting for axios
			if ((error as any)?.response) {
				console.error('Error fetching published status:', (error as any).response.status, (error as any).response.data);
			} else {
				console.error('Error fetching published status:', error);
			}
		}
	};
	checkPublishedStatus();
}, []);

	useEffect(() => {

		const fetchQuestions = async () => {
			const api = await createAdminApi();
			try {
				const response = await api.get('/questions');
				setQuestions(transformQuizApiQuestions((response?.data as { data: QuestionApiResponse[], success: boolean }).data));

			} catch (error) {
				if ((error as any)?.response) {
					console.error('Error fetching questions:', (error as any).response.status, (error as any).response.data, 'url:', (error as any).config?.url);
				} else {
					console.error('Error fetching questions:', error);
				}
			}
		}

		fetchQuestions();
	}, []);


	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/admin/login");
		}
	}, [status, router]);

	if (status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df7500]"></div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	const handleDelete = (id: string) => {
		if (window.confirm("Are you sure you want to delete this question?")) {
			setQuestions((prev) => prev?.filter((q) => q.id !== id));
		}
	};

	const handleEdit = (id: string) => {
		setLoadingQuestionId(id);
		router.push(`/edit-question?id=${id}`);
	};

	const handleTabChange = (index: number) => {
		setSelectedQuizSet(QUIZ_SETS[index] || QUIZ_SETS[0]);
	};

	const filteredQuestions = questions?.filter(
		(q) => q.quizSet === selectedQuizSet
	);

	const isTableLoading = !filteredQuestions; // Add a loading state for the table content

	const handlePublish = async () => {
		
		try{
			const api =await createAdminApi();
			
			if(published){
				
				

				await  api.post('/quizzes/unpublish-all-quizzes');
				setPublished(false);

			}else{
				console.log("publishiingggggggggggg");
				await api.post('/quizzes/publish-all-quizzes');
				setPublished(true);
			}
		} catch (error) {
			console.error('Error publishing quiz:', error);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br p-4 relative" style={{ backgroundImage: 'url("/Container.png")', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
			<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.6)', zIndex: 1 }} />
			<div className="max-w-4xl mx-auto relative z-10">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-gray-800">Manage Questions</h1>
					<div className="flex items-center gap-3">
						<button
							onClick={handlePublish}
							className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white text-[#651321] border border-[#dfd7d0] shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200"
							aria-label="Publish Quizzers"
						>
							{/* simple publish label; use icon if desired */}
							{published ? 'Unpublish Quizzers' : 'Publish Quizzers'}
						</button>
						{/* Quiz selector placed between Publish and Add buttons */}
						<div className="w-38">
							<label htmlFor="quizSelectHeader" className="sr-only">Select Quiz</label>
							<select
								id="quizSelectHeader"
								value={selectedQuizSet}
								onChange={(e) => setSelectedQuizSet(e.target.value)}
								disabled={isLoadingTab}
								className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df7500] focus:border-transparent text-[#651321] bg-white"
							>
								{QUIZ_SETS.map((set, idx) => (
										<option key={set} value={set}>{`${set} - ${countsBySet[set] ?? 0}/${totalQuestions}`}</option>
									))}
							</select>
						</div>
						<button
							onClick={() => router.push("/add-question")}
							className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200"
						>
							<Plus size={18} /> Add New Question
						</button>
					</div>
				</div>


				{/* Panel content for the selected quiz set */}
				<div className="bg-white rounded-2xl shadow-lg p-6">
					{isTableLoading ? (
						<div className="flex justify-center items-center">
							<div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-transparent"></div>
						</div>
					) : filteredQuestions?.length === 0 ? (
						<div className="text-center text-gray-500">No questions found.</div>
					) : (
						<table className="min-w-full divide-y divide-gray-200">
							<thead>
								<tr>
									<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Correct Answer</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredQuestions?.map((q) => {
									const correct = q.answers.find(a => a.id === q.correctAnswer);
									return (
										<tr key={q.id} className="hover:bg-gray-50">
											<td className="px-4 py-2 text-gray-800 max-w-xs truncate">{q.question}</td>
											<td className="px-4 py-2 text-gray-800 ">{correct ? correct.text : '-'}</td>
											<td className="px-4 py-2">
												<button
													onClick={() => handleEdit(q.id)}
													disabled={loadingQuestionId === q.id}
													className="bg-gradient-to-r from-[#df7500] to-[#651321] text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
													title="Edit"
												>
													{loadingQuestionId === q.id ? (
														<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
													) : (
														<>
															<Edit size={16} /> Edit
														</>
													)}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}

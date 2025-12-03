"use client";
import { createAdminApi } from "@/interceptors/admins";
import { QuestionApiResponse, QuestionItem, QuizApiResponse } from "@/types/quiz";
import { Edit, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { transformQuizApiQuestions } from "./questionTransformer";
import { useQuiz } from '@/contexts/QuizContext';


export default function ManageQuestions() {


	const router = useRouter();
	const { data: session, status } = useSession();
	const [questions, setQuestions] = useState<QuestionItem[]>();
	const [selectedQuizSet, setSelectedQuizSet] = useState<string>('');
	const [quizSets, setQuizSets] = useState<{ quizId: number; name: string }[]>([]);
	const [isLoadingTab, setIsLoadingTab] = useState(false);
	const [loadingQuestionId, setLoadingQuestionId] = useState<string | null>(null);
	const [published, setPublished] = useState<boolean>(false);


	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newSetName, setNewSetName] = useState('');
	const [creatingSet, setCreatingSet] = useState(false);
	const [createSetError, setCreateSetError] = useState<string | null>(null);


	const [showEditModal, setShowEditModal] = useState(false);
	const [editSetName, setEditSetName] = useState('');
	const [editingSet, setEditingSet] = useState(false);
	const [editSetError, setEditSetError] = useState<string | null>(null);

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
		
			if ((error as any)?.response) {
				console.error('Error fetching published status:', (error as any).response.status, (error as any).response.data);
			} else {
				console.error('Error fetching published status:', error);
			}
		}
	};
	checkPublishedStatus();
	}, [status, session]);

	useEffect(() => {
		if (status === 'authenticated') {
			(async () => {
				try {
					const api = await createAdminApi();
					const resp = await api.get('/quizzes/get-quiz-sets');
					if (resp && resp.data) {
						const body: any = resp.data as any;
						const sets = Array.isArray(body) ? body as { quizId: number; name: string }[] : (body?.data ?? []) as { quizId: number; name: string }[];
						setQuizSets(sets);
						if (!selectedQuizSet && Array.isArray(sets) && sets.length > 0) {
							setSelectedQuizSet(String(sets[0].quizId));
						}
					}
				} catch (err) {
					console.error('Failed to fetch quiz sets', err);
				}
			})();
		}
	}, [status]);

	useEffect(() => {

		    const fetchQuestions = async () => {
			    
			    if (status !== 'authenticated' || !(session as any)?.user?.isAdmin) return;
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
	}, [status, session]);


	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/admin-access");
		}

		
		if (status === 'authenticated' && !(session as any)?.user?.isAdmin) {
			router.push('/admin-access');
		}
	}, [status, router, session]);

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
		router.push(`/admin/edit-question?id=${id}`);
	};

	const handleTabChange = (index: number) => {
		setSelectedQuizSet((quizSets[index] && String(quizSets[index].quizId)) || (quizSets[0] && String(quizSets[0].quizId)) || '');
	};

	const filteredQuestions = questions?.filter(
		(q) => q.quizSet === selectedQuizSet
	);

	const isTableLoading = !filteredQuestions;

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


	const handleCreateSet = async () => {
		if (!newSetName.trim()) {
			setCreateSetError('Please enter a set name');
			return;
		}
		setCreatingSet(true);
		setCreateSetError(null);
		try {
			const api = await createAdminApi();
			const resp = await api.post('/quizzes/create-quiz-set', { name: newSetName.trim() });
			const body: any = resp?.data;
			const created = body?.quiz ?? body?.data ?? body;
			if (created && typeof created.quizId !== 'undefined') {
				setQuizSets((prev) => [created, ...prev]);
				setSelectedQuizSet(String(created.quizId));
				setNewSetName('');
				setShowCreateModal(false);
			} else {
				setCreateSetError('Unexpected server response');
				console.error('Create quiz set - unexpected response:', resp?.data);
			}
		} catch (error) {
			const msg = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to create set';
			setCreateSetError(String(msg));
			console.error('Create quiz set error:', error);
		} finally {
			setCreatingSet(false);
		}
	};

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
						<button
							onClick={() => router.push("/admin/add-question")}
							className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200"
						>
							<Plus size={18} /> Add New Question
						</button>
					</div>
				</div>
				<div className="flex items-center gap-6 mb-6">
						<button
							onClick={() => setShowCreateModal(true)}
							className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#df7500] to-[#651321] text-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200"
						>
							<Plus size={18} /> Add Question Set
						</button>
						{/* Quiz selector placed between Publish and Add buttons */}
						<button
							onClick={() => {
								if (!selectedQuizSet) return;
								const selected = quizSets.find(s => String(s.quizId) === String(selectedQuizSet));
								if (!selected) return;
								setEditSetName(selected.name || '');
								setShowEditModal(true);
							}}
							className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-white text-[#651321] border border-[#dfd7d0] shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200"
							aria-label="Edit selected quiz set"
						>
							<Edit size={16} /> Edit Set
						</button>
						<div className="">
							<label htmlFor="quizSelectHeader" className="sr-only">Select Quiz</label>
							<select
								id="quizSelectHeader"
								value={selectedQuizSet}
								onChange={(e) => setSelectedQuizSet(e.target.value)}
								disabled={isLoadingTab}
								className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df7500] focus:border-transparent text-[#651321] bg-white"
							>
								{quizSets.map((set) => (
										<option key={set.quizId} value={String(set.quizId)}>{`${set.name} - ${countsBySet[String(set.quizId)] ?? 0}`}</option>
									))}
							</select>
						</div>
				</div>

				{showCreateModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowCreateModal(false)} />
						<div className="bg-white rounded-lg p-6 z-60 w-full max-w-md shadow-lg text-gray-900">
							<h2 className="text-lg font-bold mb-4 text-gray-900">Create Question Set</h2>
							<input
								autoFocus
								value={newSetName}
								onChange={(e) => setNewSetName(e.target.value)}
								placeholder="Enter set name"
								className="w-full p-3 border-2 border-gray-200 rounded mb-3 focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none"
							/>
							{createSetError && <div className="text-sm text-red-800 mb-2">{createSetError}</div>}
							<div className="flex justify-end gap-2">
								<button
									onClick={() => setShowCreateModal(false)}
									disabled={creatingSet}
									className="px-4 py-2 rounded bg-gray-100"
								>
									Cancel
								</button>
								<button
									onClick={handleCreateSet}
									disabled={creatingSet}
									className="px-4 py-2 rounded bg-gradient-to-r from-[#df7500] to-[#651321] text-white"
								>
									{creatingSet ? 'Creating...' : 'Create'}
								</button>
							</div>
						</div>
					</div>
				)}

				{showEditModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowEditModal(false)} />
						<div className="bg-white rounded-lg p-6 z-60 w-full max-w-md shadow-lg text-gray-900">
							<h2 className="text-lg font-bold mb-4 text-gray-900">Edit Question Set</h2>
							<input
								autoFocus
								value={editSetName}
								onChange={(e) => setEditSetName(e.target.value)}
								placeholder="Enter new set name"
								className="w-full p-3 border-2 border-gray-200 rounded mb-3 focus:border-[#df7500] focus:ring-2 focus:ring-[#df7500]/20 focus:outline-none"
							/>
							{editSetError && <div className="text-sm text-red-800 mb-2">{editSetError}</div>}
							<div className="flex justify-end gap-2">
								<button
									onClick={() => setShowEditModal(false)}
									disabled={editingSet}
									className="px-4 py-2 rounded bg-gray-100"
								>
									Cancel
								</button>
								<button
									onClick={async () => {
										if (!selectedQuizSet) return;
										if (!editSetName.trim()) {
											setEditSetError('Please enter a set name');
											return;
										}
										setEditingSet(true);
										setEditSetError(null);
										try {
											const api = await createAdminApi();
											const resp = await api.patch(`/quizzes/${selectedQuizSet}`, { name: editSetName.trim() });
											const body: any = resp?.data;
											const updated = body?.quiz ?? body?.data ?? body;
											if (updated && typeof updated.quizId !== 'undefined') {
												setQuizSets(prev => prev.map(s => s.quizId === updated.quizId ? { ...s, name: updated.name } : s));
												setShowEditModal(false);
											} else {
												setEditSetError('Unexpected server response');
												console.error('Update quiz set - unexpected response:', resp?.data);
											}
										} catch (err) {
											const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to update set';
											setEditSetError(String(msg));
											console.error('Update quiz set error:', err);
										} finally {
											setEditingSet(false);
										}
									}}
									disabled={editingSet}
									className="px-4 py-2 rounded bg-gradient-to-r from-[#df7500] to-[#651321] text-white"
								>
									{editingSet ? 'Saving...' : 'Save'}
								</button>
							</div>
						</div>
					</div>
				)}

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
				{/* Instructions card (styled like Add New Question page) */}
				<div className="bg-white rounded-2xl shadow-lg p-6 my-6 border-2 border-orange-100">
					<div className="flex items-start space-x-4 mb-4">
						<div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#df7500] to-[#651321] flex items-center justify-center shadow-md">
							<span className="text-white text-lg font-bold">i</span>
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-bold text-gray-800">Quick Instructions</h2>
							<p className="text-sm text-gray-600 mt-1">Follow these steps to manage question sets and add questions.</p>
						</div>
					</div>

					<div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-5 border border-orange-200">
						<ul className="text-sm text-gray-700 space-y-3">
							<li className="flex items-start">
								<span className="mr-3 font-bold text-orange-600">•</span>
								<span><strong>First — create Question Sets:</strong> Click <strong>"Add Question Set"</strong> to create and save one or more sets on the server.</span>
							</li>
							<li className="flex items-start">
								<span className="mr-3 font-bold text-orange-600">•</span>
								<span><strong>Then — add questions:</strong> After creating or selecting a set, click <strong>"Add New Question"</strong> to add questions to the chosen set.</span>
							</li>
							<li className="flex items-start">
								<span className="mr-3 font-bold text-orange-600">•</span>
								<span><strong>Edit Set:</strong> Use <strong>"Edit Set"</strong> to rename the currently selected set.</span>
							</li>
							<li className="flex items-start">
								<span className="mr-3 font-bold text-orange-600">•</span>
								<span><strong>Select a set:</strong> Use the dropdown to choose which set to view or manage.</span>
							</li>
							<li className="flex items-start">
								<span className="mr-3 font-bold text-orange-600">•</span>
								<span><strong>Publish/Unpublish:</strong> Toggle visibility so quizzes are (un)available to students.</span>
							</li>
						</ul>
					</div>
				</div>
				
			</div>
			</div>
		);
		}


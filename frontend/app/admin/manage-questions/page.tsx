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
			<div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)' }}>
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
		<div className="min-h-screen p-4 relative" style={{ background: 'linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)' }}>
			{/* Parchment texture */}
			<div className="absolute inset-0 opacity-20 pointer-events-none" style={{
				backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`
			}} />
			{/* Map grid */}
			<div className="absolute inset-0 map-grid pointer-events-none" style={{ zIndex: 0 }} />
			<div className="max-w-4xl mx-auto relative z-10">
				<div className="parchment-card rounded-2xl p-6 mb-6 relative">
					<img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
					<img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
					<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#651321', letterSpacing: '0.03em' }}>Manage Questions</h1>
					<div className="flex items-center gap-3">
						<button
							onClick={handlePublish}
							className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all duration-200"
							style={{
								fontFamily: 'Cinzel, serif',
								background: 'linear-gradient(135deg, #fdf6e3 0%, #e3d5b8 100%)',
								color: '#4a2511',
								border: '2px solid #8b5a2b'
							}}
							aria-label="Publish Quizzers"
						>
							{published ? 'Unpublish Quizzers' : 'Publish Quizzers'}
						</button>
						<button
							onClick={() => router.push("/admin/add-question")}
							className="ancient-button flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
						>
							<Plus size={18} /> Add New Question
						</button>
					</div>
					</div>
				</div>
				<div className="parchment-card rounded-2xl p-6 mb-6 relative">
					<div className="flex flex-wrap items-center gap-4">
						<button
							onClick={() => setShowCreateModal(true)}
							className="ancient-button flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
						>
							<Plus size={18} /> Add Question Set
						</button>
						<button
							onClick={() => {
								if (!selectedQuizSet) return;
								const selected = quizSets.find(s => String(s.quizId) === String(selectedQuizSet));
								if (!selected) return;
								setEditSetName(selected.name || '');
								setShowEditModal(true);
							}}
							className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all duration-200"
							style={{
								fontFamily: 'Cinzel, serif',
								background: 'linear-gradient(135deg, #fdf6e3 0%, #e3d5b8 100%)',
								color: '#4a2511',
								border: '2px solid #8b5a2b'
							}}
							aria-label="Edit selected quiz set"
						>
							<Edit size={16} /> Edit Set
						</button>
						<div className="flex-1 min-w-[200px]">
							<label htmlFor="quizSelectHeader" className="sr-only">Select Quiz</label>
							<select
								id="quizSelectHeader"
								value={selectedQuizSet}
								onChange={(e) => setSelectedQuizSet(e.target.value)}
								disabled={isLoadingTab}
								className="block w-full px-4 py-2 rounded-lg font-semibold shadow-sm transition-all duration-200"
								style={{
									fontFamily: 'Cinzel, serif',
									background: 'linear-gradient(135deg, #FFF8E7 0%, #F4E8D0 100%)',
									color: '#4a2511',
									border: '2px solid #704214'
								}}
							>
								{quizSets.map((set) => (
										<option key={set.quizId} value={String(set.quizId)}>{`${set.name} - ${countsBySet[String(set.quizId)] ?? 0}`}</option>
									))}
							</select>
						</div>
					</div>
				</div>

			{showCreateModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black opacity-40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
					<div className="parchment-card rounded-2xl p-8 z-60 w-full max-w-md shadow-2xl relative">
						<img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
						<img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
						<h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>Create Question Set</h2>
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
									className="ancient-button px-6 py-2 rounded-lg font-bold shadow-lg transition-all duration-200"
								>
									{editingSet ? 'Saving...' : 'Save'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Panel content for the selected quiz set */}
				<div className="parchment-card rounded-2xl shadow-xl p-6 relative">
					<img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
					<img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
					<img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-left" />
					<img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-right" />
					{isTableLoading ? (
						<div className="flex justify-center items-center">
							<div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-transparent"></div>
						</div>
					) : filteredQuestions?.length === 0 ? (
						<div className="text-center text-gray-500">No questions found.</div>
					) : (
						<table className="min-w-full divide-y" style={{ borderColor: '#8b5a2b' }}>
							<thead>
								<tr style={{ background: 'linear-gradient(135deg, #e3d5b8 0%, #d4c5a3 100%)' }}>
									<th className="px-4 py-3 text-left text-sm font-bold uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>Question</th>
									<th className="px-4 py-3 text-left text-sm font-bold uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>Correct Answer</th>
									<th className="px-4 py-3 text-left text-sm font-bold uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredQuestions?.map((q) => {
									const correct = q.answers.find(a => a.id === q.correctAnswer);
									return (
										<tr key={q.id} className="border-b hover:bg-opacity-50 transition-colors" style={{ borderColor: '#d4c5a3', background: 'rgba(255, 248, 231, 0.3)' }}>
											<td className="px-4 py-3 max-w-xs truncate font-medium" style={{ color: '#2a1a11', fontFamily: 'Crimson Text, serif' }}>{q.question}</td>
											<td className="px-4 py-3 font-medium" style={{ color: '#2a1a11', fontFamily: 'Crimson Text, serif' }}>{correct ? correct.text : '-'}</td>
											<td className="px-4 py-3">
												<button
													onClick={() => handleEdit(q.id)}
													disabled={loadingQuestionId === q.id}
													className="ancient-button px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
				<div className="parchment-card rounded-2xl shadow-xl p-8 my-6 relative">
					<img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
					<img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
					<div className="flex items-start space-x-4 mb-6">
						<div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(180deg, #c04000 0%, #4a2511 100%)' }}>
							<span className="text-white text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>i</span>
						</div>
						<div className="flex-1">
							<h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#651321' }}>Quick Instructions</h2>
							<p className="text-sm font-medium mt-1" style={{ color: '#4a2511', fontFamily: 'Crimson Text, serif' }}>Follow these steps to manage question sets and add questions.</p>
						</div>
					</div>

					<div className="rounded-xl p-6 relative" style={{ background: 'linear-gradient(135deg, rgba(255, 248, 231, 0.6) 0%, rgba(232, 213, 181, 0.6) 100%)', border: '2px solid #8b5a2b' }}>
						<ul className="text-sm font-medium space-y-3" style={{ color: '#2a1a11', fontFamily: 'Crimson Text, serif' }}>
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


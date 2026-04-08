import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, Circle } from 'lucide-react';
import clsx from 'clsx';
import SpotlightCard from '../components/SpotlightCard';

const SheetView = ({ sheetName, studentId }) => {
    const [topics, setTopics] = useState([]);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTopic, setExpandedTopic] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                console.log(`Fetching sheet: ${sheetName}`);
                const contentRes = await axios.get(`${API_URL}/api/sheets/${encodeURIComponent(sheetName)}`);
                console.log(`Fetched ${sheetName}: `, contentRes.data);
                setTopics(contentRes.data);

                // Only fetch progress if user is logged in
                const token = localStorage.getItem('dsa_token');
                if (token) {
                    try {
                        const progressRes = await axios.get(`${API_URL}/api/sheets/${encodeURIComponent(sheetName)}/progress`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setProgress(progressRes.data);
                    } catch (error) {
                        console.log("Not logged in, progress tracking unavailable");
                    }
                }
            } catch (error) {
                console.error("Error fetching sheet data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (sheetName) fetchData();
    }, [sheetName]);

    const handleToggle = async (topic, problemId) => {
        try {
            const token = localStorage.getItem('dsa_token');
            await axios.post(`${API_URL}/api/sheets/update-progress`, {
                sheetName,
                topic,
                problemId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistic update logic could go here, but for simplicity we'll re-fetch or update local state
            // Let's update local state manually to avoid full refetch
            setProgress(prev => {
                const existing = prev.find(p => p.topic === topic);
                let newCompleted = existing ? [...existing.completedProblems] : [];

                if (newCompleted.includes(problemId)) {
                    newCompleted = newCompleted.filter(id => id !== problemId);
                } else {
                    newCompleted.push(problemId);
                }

                const otherTopics = prev.filter(p => p.topic !== topic);
                return [...otherTopics, { topic, completedProblems: newCompleted }];
            });

        } catch (error) {
            console.error("Failed to update progress", error);
        }
    };

    const isCompleted = (topicName, problemId) => {
        const topicProgress = progress.find(p => p.topic === topicName);
        return topicProgress?.completedProblems.includes(problemId);
    };

    const getTopicProgress = (topicName, totalProblems) => {
        const topicProgress = progress.find(p => p.topic === topicName);
        const completedCount = topicProgress?.completedProblems?.length || 0;
        return (completedCount / totalProblems) * 100;
    };

    if (loading) return <div className="text-center py-10 animate-pulse text-cyan-400">Loading Sheet...</div>;

    return (
        <div className="space-y-3 md:space-y-4">
            {topics.map((topicData) => {
                const progressPercent = getTopicProgress(topicData.topic, topicData.problems.length);
                const isExpanded = expandedTopic === topicData.topic;

                return (
                    <SpotlightCard key={topicData._id} className="overflow-hidden">
                        <div
                            className="p-3 md:p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-2"
                            onClick={() => setExpandedTopic(isExpanded ? null : topicData.topic)}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 md:gap-4 mb-2 flex-wrap">
                                    <h3 className="text-base md:text-lg font-bold text-white truncate">{topicData.topic}</h3>
                                    <span className="text-xs md:text-sm text-gray-400 flex-shrink-0">
                                        {Math.round(progressPercent)}% Done
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                            </div>
                            <div className="text-gray-400 flex-shrink-0">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-gray-700/50 bg-black/20"
                                >
                                    <div className="p-3 md:p-4 space-y-2">
                                        {topicData.problems.map((prob) => {
                                            const completed = isCompleted(topicData.topic, prob.problemId);
                                            return (
                                                <div
                                                    key={prob.problemId}
                                                    className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg hover:bg-white/5 group border border-transparent hover:border-gray-700/50 transition-all flex-wrap md:flex-nowrap"
                                                >
                                                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden flex-1 min-w-0">
                                                        <button
                                                            onClick={() => handleToggle(topicData.topic, prob.problemId)}
                                                            className={clsx("transition-colors flex-shrink-0", completed ? "text-green-400" : "text-gray-600 hover:text-gray-400")}
                                                        >
                                                            {completed ? <CheckCircle size={18} className="fill-green-900/30" /> : <Circle size={18} />}
                                                        </button>
                                                        <span className={clsx("truncate font-medium text-sm md:text-base", completed ? "text-gray-500 line-through" : "text-gray-200")}>
                                                            {prob.title}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                                                        <span className={clsx(
                                                            "text-xs px-1.5 md:px-2 py-0.5 rounded border opacity-80 whitespace-nowrap",
                                                            prob.difficulty === 'Easy' ? "border-green-500 text-green-400 bg-green-500/10" :
                                                                prob.difficulty === 'Medium' ? "border-yellow-500 text-yellow-400 bg-yellow-500/10" :
                                                                    "border-red-500 text-red-400 bg-red-500/10"
                                                        )}>
                                                            {prob.difficulty}
                                                        </span>
                                                        <a
                                                            href={prob.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-gray-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </SpotlightCard>
                );
            })}

            {topics.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-8 md:py-10 text-sm md:text-base">No topics found for this sheet.</div>
            )}
        </div>
    );
};

export default SheetView;

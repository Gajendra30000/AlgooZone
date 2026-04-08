import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import Navbar from '../components/Navbar';
import Heatmap from '../components/Heatmap';
import TopicStats from '../components/TopicStats';
import SpotlightCard from '../components/SpotlightCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user: authUser } = useAuth();
    const { id } = useParams();
    const [viewUser, setViewUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    // AI Analysis Function
    const analyzeProgress = async () => {
        setAnalyzing(true);
        try {
            const token = localStorage.getItem('dsa_token');
            const { data } = await axios.post(
                `${API_URL}/api/gemini/analyze-progress`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update the user state with new analysis data
            if (viewUser) {
                const updatedUser = { ...viewUser, aiProgressAnalysis: data.data };
                setViewUser(updatedUser);
            }
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Failed to generate analysis. Please try again later.");
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        const fetchStudentData = async () => {
            if (id) {
                try {
                    const token = localStorage.getItem('dsa_token');
                    const { data } = await axios.get(`${API_URL}/api/student/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setViewUser(data);
                } catch (err) {
                    console.error("Failed to fetch student", err);
                } finally {
                    setLoading(false);
                }
            } else {
                // Fetch fresh profile for logged-in user
                try {
                    const token = localStorage.getItem('dsa_token');
                    const { data } = await axios.get(`${API_URL}/api/student/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setViewUser(data);
                } catch (err) {
                    console.error("Failed to fetch profile", err);
                    // Fallback to authUser if catch fails (optional, keeps UI working)
                    setViewUser(authUser);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchStudentData();
    }, [id, authUser]);

    if (loading) return <div className="min-h-screen pt-20 text-center text-white">Loading...</div>;
    if (!viewUser) return <div className="min-h-screen pt-20 text-center text-white">Student not found</div>;

    // Use viewUser for all data display instead of user
    const user = viewUser;

    // Fallback data if user has no stats yet
    const stats = user.stats || {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: 0
    };
    const recent = user?.recentSubmissions || [];

    const data = [
        { name: 'Easy', value: stats.easySolved, color: '#00b8a3' }, // LeetCode Green
        { name: 'Medium', value: stats.mediumSolved, color: '#ffc01e' }, // LeetCode Yellow
        { name: 'Hard', value: stats.hardSolved, color: '#ef4743' }, // LeetCode Red
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen pt-20 px-4 md:px-10 pb-10">
            <Navbar />

            <motion.div
                className="max-w-7xl mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                {/* Top Row: Student Profile & Stats */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Left: User Details */}
                    <SpotlightCard className="md:col-span-2 p-4 md:p-8 flex flex-col justify-center">
                        <h2 className="text-lg md:text-3xl font-bold text-white mb-3 md:mb-4">{user.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-gray-400">
                            <span className="bg-gray-800/50 px-2 md:px-3 py-1 rounded-full border border-gray-700 text-xs md:text-sm flex items-center gap-2">
                                🎓 Year {user.year}
                            </span>
                            <span className="text-xs md:text-sm font-mono text-gray-500 bg-black/30 px-2 py-1 rounded border border-gray-800 break-all">
                                {user.registrationNumber}
                            </span>
                        </div>
                    </SpotlightCard>

                    {/* Right: Total Solved */}
                    <SpotlightCard className="p-4 md:p-8 flex flex-col items-center justify-center text-center">
                        <h3 className="text-gray-400 text-xs md:text-sm uppercase tracking-wider mb-2 flex items-center gap-2 justify-center flex-wrap">
                            <CheckCircle size={16} className="text-neon-cyan flex-shrink-0" /> <span>Total Solved</span>
                        </h3>
                        <div className="text-3xl md:text-6xl font-bold text-white tracking-tight leading-none">{stats.totalSolved}</div>
                    </SpotlightCard>
                </motion.div>

                {/* Middle Grid: DSA Stats, Topics, Recent Problems */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* DSA Stats Chart */}
                    <motion.div variants={itemVariants} className="h-full">
                        <SpotlightCard className="p-4 md:p-8 min-h-[300px] md:min-h-[400px] h-full">
                            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center text-white">
                                <span className="w-1 h-5 md:h-6 bg-white mr-2 md:mr-3"></span>
                                DSA Stats
                            </h3>
                            <hr className="border-gray-700/50 mb-4 md:mb-8" />

                            <div className="flex flex-col items-center h-full pb-4">
                                {/* Stats Count */}
                                <div className="w-full space-y-3 md:space-y-4 mb-4">
                                    <div className="flex items-center justify-between text-sm md:text-base">
                                        <span className="text-green-400 font-bold">Easy</span>
                                        <span className="text-white font-bold">{stats.easySolved}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm md:text-base">
                                        <span className="text-yellow-400 font-bold">Medium</span>
                                        <span className="text-white font-bold">{stats.mediumSolved}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm md:text-base">
                                        <span className="text-red-500 font-bold">Hard</span>
                                        <span className="text-white font-bold">{stats.hardSolved}</span>
                                    </div>
                                </div>

                                {/* Chart - Centered in remaining space */}
                                <div className="flex-1 flex items-center justify-center w-full relative">
                                    <div className="relative w-32 h-32 md:w-48 md:h-48">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={80} minHeight={80}>
                                            <PieChart>
                                                <Pie
                                                    data={data}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    cornerRadius={6}
                                                    stroke="none"
                                                >
                                                    {data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    cursor={{ fill: 'transparent' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xs text-gray-500 uppercase">Total</span>
                                            <span className="text-2xl font-bold text-white">{stats.totalSolved}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>
                    </motion.div>

                    {/* Topic Stats */}
                    <motion.div variants={itemVariants} className="min-h-[300px] md:min-h-[400px]">
                        <TopicStats topics={stats.topics} />
                    </motion.div>

                    {/* Recent Submissions */}
                    <motion.div variants={itemVariants} className="h-full">
                        <SpotlightCard className="p-4 md:p-6 min-h-[300px] md:min-h-[400px] h-full">
                            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                                <span className="w-1 h-5 md:h-6 bg-neon-purple mr-2 md:mr-3 rounded-full"></span>
                                Recent Problems
                            </h3>
                            <div className="space-y-2 md:space-y-3">
                                {recent.length > 0 ? recent.slice(0, 5).map((sub, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                                        <div className="overflow-hidden flex-1 min-w-0">
                                            <p className="font-medium text-cyan-100 truncate text-sm md:text-base pr-2">{sub.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString()}</p>
                                        </div>
                                        {sub.status && sub.status !== 'Unknown' ? (
                                            <span className={clsx(
                                                "text-xs px-2 py-1 rounded-full border flex-shrink-0 whitespace-nowrap",
                                                sub.status === 'Accepted' ? "border-green-500/50 text-green-400 bg-green-500/10" : "border-red-500/50 text-red-400 bg-red-500/10"
                                            )}>
                                                {sub.status}
                                            </span>
                                        ) : (
                                            <a
                                                href={`https://leetcode.com/problems/${sub.titleSlug || sub.title?.toLowerCase().replace(/\s+/g, '-')}/`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs px-2 md:px-3 py-1 rounded-full border border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex-shrink-0 whitespace-nowrap"
                                            >
                                                View
                                            </a>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-center py-6 md:py-10 text-sm">No recent submissions found.</p>
                                )}
                            </div>
                        </SpotlightCard>
                    </motion.div>
                </div>

                {/* Streak & Heatmap Section */}
                <motion.div variants={itemVariants}>
                    <SpotlightCard className="p-8 mb-6">
                        <Heatmap
                            calendar={user?.stats?.submissionCalendar || {}}
                            maxStreak={user?.streak?.maxStreak || 0}
                        />
                    </SpotlightCard>
                </motion.div>

                {/* AI Progress Analysis Section */}
                <motion.div variants={itemVariants} className="mb-10">
                    <SpotlightCard className="p-4 md:p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-6">
                            <h3 className="text-lg md:text-xl font-bold flex items-center text-white">
                                <span className="w-1 h-5 md:h-6 bg-gradient-to-b from-purple-400 to-blue-500 mr-2 md:mr-3 rounded-full"></span>
                                AI Smart Progress Analysis
                            </h3>
                            {/* Analyze Button */}
                            {!loadingAnalysis && authUser?.role !== 'admin' ? (
                                <button
                                    onClick={analyzeProgress}
                                    disabled={analyzing}
                                    className={`px-4 md:px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${analyzing
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/25'
                                        }`}
                                >
                                    {analyzing ? 'Analyzing...' : (user.aiProgressAnalysis ? 'Re-Analyze' : 'Analyze Progress')}
                                </button>
                            ) : null}
                        </div>

                        {/* Analysis Content */}
                        {user.aiProgressAnalysis ? (
                            <div className="space-y-4 md:space-y-8 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Weak Areas */}
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg md:rounded-xl p-4 md:p-6">
                                        <h4 className="text-red-400 font-bold mb-3 md:mb-4 flex items-center text-sm md:text-base">
                                            <span className="bg-red-500/20 p-1 rounded mr-2">📉</span> Weak Areas
                                        </h4>
                                        <ul className="space-y-2 text-sm">
                                            {user.aiProgressAnalysis.weakTopics?.map((topic, idx) => (
                                                <li key={idx} className="flex items-center text-gray-300">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                                                    <span className="truncate">{topic}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Strong Areas */}
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg md:rounded-xl p-4 md:p-6">
                                        <h4 className="text-green-400 font-bold mb-3 md:mb-4 flex items-center text-sm md:text-base">
                                            <span className="bg-green-500/20 p-1 rounded mr-2">💪</span> Strong Areas
                                        </h4>
                                        <ul className="space-y-2 text-sm">
                                            {user.aiProgressAnalysis.strongTopics?.map((topic, idx) => (
                                                <li key={idx} className="flex items-center text-gray-300">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                                                    <span className="truncate">{topic}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Improvement Plan */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg md:rounded-xl p-4 md:p-6">
                                    <h4 className="text-blue-400 font-bold mb-3 md:mb-4 flex items-center text-sm md:text-base">
                                        <span className="bg-blue-500/20 p-1 rounded mr-2">📅</span> 14-Day Plan
                                    </h4>
                                    <p className="text-gray-300 whitespace-pre-line leading-relaxed text-sm">
                                        {user.aiProgressAnalysis.improvementPlan}
                                    </p>
                                </div>

                                {/* Suggestions */}
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg md:rounded-xl p-4 md:p-6">
                                    <h4 className="text-purple-400 font-bold mb-3 md:mb-4 flex items-center text-sm md:text-base">
                                        <span className="bg-purple-500/20 p-1 rounded mr-2">💡</span> Suggestions
                                    </h4>
                                    <ul className="space-y-2 md:space-y-3 text-sm">
                                        {user.aiProgressAnalysis.suggestions?.map((suggestion, idx) => (
                                            <li key={idx} className="flex items-start text-gray-300">
                                                <span className="text-purple-400 mr-2 mt-0.5 flex-shrink-0">•</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Summary */}
                                <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg md:rounded-xl p-4 md:p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10">
                                        <Zap size={60} />
                                    </div>
                                    <h4 className="text-white font-bold mb-2 relative z-10 text-sm md:text-base">Coach's Summary</h4>
                                    <p className="text-gray-400 italic relative z-10 text-xs md:text-sm">
                                        "{user.aiProgressAnalysis.summary}"
                                    </p>
                                    <div className="mt-3 text-xs text-gray-600 text-right">
                                        Last analyzed: {new Date(user.aiProgressAnalysis.lastAnalyzedAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 md:py-10">
                                <div className="bg-gray-800/50 inline-block p-3 md:p-4 rounded-full mb-3 md:mb-4">
                                    <Zap size={28} className="text-yellow-400" />
                                </div>
                                <h4 className="text-lg md:text-xl font-bold text-white mb-2">Unlock Your Full Potential</h4>
                                <p className="text-gray-400 max-w-lg mx-auto mb-4 md:mb-6 text-sm px-4">
                                    Get a personalized AI analysis. Discover your strengths and get a 14-day roadmap.
                                </p>
                                <button
                                    onClick={analyzeProgress}
                                    disabled={analyzing}
                                    className="px-6 md:px-8 py-2 md:py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base"
                                >
                                    {analyzing ? 'Analyzing...' : 'Start Analysis'}
                                </button>
                            </div>
                        )}
                    </SpotlightCard>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default Dashboard;

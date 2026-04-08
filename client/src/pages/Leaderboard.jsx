import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import API_URL from '../config';
import { Trophy, Filter, Search } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Simple in-memory cache to prevent re-fetching on tab switching
let leaderboardCache = {
    data: null,
    timestamp: 0,
    params: {}
};

const CACHE_DURATION = 60 * 1000; // 1 minute

const Leaderboard = () => {
    const [students, setStudents] = useState([]);
    const [filterYear, setFilterYear] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [filterYear]);

    const fetchLeaderboard = async () => {
        const currentParams = JSON.stringify({ year: filterYear });

        // Check cache foundation
        if (leaderboardCache.data &&
            Date.now() - leaderboardCache.timestamp < CACHE_DURATION &&
            JSON.stringify(leaderboardCache.params) === currentParams) {
            setStudents(leaderboardCache.data);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const params = {};
            if (filterYear) params.year = filterYear;

            const { data } = await axios.get(`${API_URL}/student/leaderboard`, { params });

            // Update cache
            leaderboardCache = {
                data: data,
                timestamp: Date.now(),
                params: { year: filterYear }
            };

            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-20 px-4 md:px-10 pb-10">
            <Navbar />

            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-6 md:mb-10"
                >
                    <h1 className="text-2xl md:text-4xl font-bold neon-text-cyan mb-2">Leaderboard</h1>
                    <p className="text-gray-400 text-sm md:text-base">Top performers in DSA</p>
                </motion.div>

                {/* Filters & Search */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8 bg-[#0a0a2a]/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-700/50 backdrop-blur-sm"
                >

                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-[#050511] border border-gray-600 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base focus:border-cyan-500 outline-none transition-all hover:border-cyan-400"
                        >
                            <option value="">All Years</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>

                    <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#050511] border border-gray-600 text-white text-sm md:text-base rounded-lg pl-10 pr-3 md:pr-4 py-2 focus:border-cyan-500 outline-none transition-all hover:border-cyan-400"
                        />
                    </div>
                </motion.div>

                {/* List */}
                <div className="glass-card rounded-lg md:rounded-xl overflow-x-auto min-h-[300px] md:min-h-[500px]">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-700/50 bg-black/20 text-gray-400 font-medium text-sm sticky top-0 z-10 backdrop-blur-md">
                        <div className="col-span-1 text-center">Rank</div>
                        <div className="col-span-6">Name</div>
                        <div className="col-span-3 text-center">Total</div>
                        <div className="col-span-2 text-center">Year</div>
                    </div>

                    <div className="divide-y divide-gray-700/30">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 md:py-20">
                                <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
                                <p className="text-gray-400 animate-pulse text-sm md:text-base">Loading leaderboard...</p>
                            </div>
                        ) : filteredStudents.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index < 20 ? index * 0.03 : 0 }}
                                    >
                                        {/* Desktop Grid Layout */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                            <div className="col-span-1 text-center font-bold">
                                                {index + 1 === 1 && <Trophy className="text-yellow-400 w-5 h-5 mx-auto drop-shadow-lg" />}
                                                {index + 1 === 2 && <Trophy className="text-gray-300 w-5 h-5 mx-auto drop-shadow-lg" />}
                                                {index + 1 === 3 && <Trophy className="text-amber-600 w-5 h-5 mx-auto drop-shadow-lg" />}
                                                {index + 1 > 3 && <span className="text-gray-500 text-sm">#{index + 1}</span>}
                                            </div>
                                            <div className="col-span-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className={clsx(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-offset-2 ring-offset-[#0a0a2a]",
                                                        index === 0 ? "bg-yellow-400 text-black ring-yellow-400/30" :
                                                            index === 1 ? "bg-gray-300 text-black ring-gray-300/30" :
                                                                index === 2 ? "bg-amber-600 text-white ring-amber-600/30" :
                                                                    "bg-gray-800 text-gray-300 ring-gray-700"
                                                    )}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors text-sm">{student.name}</p>
                                                        <p className="text-xs text-gray-500">{student.registrationNumber}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-3 text-center font-mono font-bold text-cyan-400">
                                                {student.stats?.totalSolved || 0}
                                            </div>
                                            <div className="col-span-2 text-center text-gray-400 text-sm">
                                                {student.year ? `Year ${student.year}` : '-'}
                                            </div>
                                        </div>

                                        {/* Mobile Card Layout */}
                                        <div className="md:hidden p-4 hover:bg-white/5 transition-colors border-b border-gray-700/30 last:border-b-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                                        {index + 1 === 1 && <Trophy className="text-yellow-400 w-5 h-5" />}
                                                        {index + 1 === 2 && <Trophy className="text-gray-300 w-5 h-5" />}
                                                        {index + 1 === 3 && <Trophy className="text-amber-600 w-5 h-5" />}
                                                        {index + 1 > 3 && <span className="text-xs text-gray-500 font-bold h-5 flex items-center">#{index + 1}</span>}
                                                    </div>
                                                    <div className={clsx(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-offset-2 ring-offset-[#0a0a2a]",
                                                        index === 0 ? "bg-yellow-400 text-black ring-yellow-400/30" :
                                                            index === 1 ? "bg-gray-300 text-black ring-gray-300/30" :
                                                                index === 2 ? "bg-amber-600 text-white ring-amber-600/30" :
                                                                    "bg-gray-800 text-gray-300 ring-gray-700"
                                                    )}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white truncate text-sm">{student.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{student.registrationNumber}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-mono font-bold text-cyan-400 text-lg">{student.stats?.totalSolved || 0}</p>
                                                    <p className="text-xs text-gray-400">solved</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2 ml-11">
                                                <span className="text-xs bg-gray-800/50 text-gray-400 px-2 py-1 rounded">
                                                    Year {student.year || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-10 text-center text-gray-500"
                            >
                                No students found.
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;

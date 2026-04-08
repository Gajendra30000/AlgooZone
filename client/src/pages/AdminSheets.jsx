import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import clsx from 'clsx';
import { Search } from 'lucide-react';

const AdminSheets = () => {
    const [sheets, setSheets] = useState([]);
    const [activeSheet, setActiveSheet] = useState(null);
    const [studentProgress, setStudentProgress] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch list of sheets
        const fetchSheets = async () => {
            try {
                const token = localStorage.getItem('dsa_token');
                const { data } = await axios.get(`${API_URL}/api/sheets`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSheets(data);
                if (data.length > 0) setActiveSheet(data[0]);
            } catch (error) {
                console.error("Error fetching sheets:", error);
            }
        };
        fetchSheets();
    }, []);

    useEffect(() => {
        if (!activeSheet) return;

        const fetchProgress = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('dsa_token');
                const { data } = await axios.get(`${API_URL}/api/sheets/admin/progress/${encodeURIComponent(activeSheet)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // The API returns all progress docs. We need to aggregate by student.
                // Structure: [{ studentId: { name, section }, sheetName, topic, completedProblems: [] }]

                const aggregated = {};

                data.forEach(doc => {
                    const sId = doc.studentId._id;
                    if (!aggregated[sId]) {
                        aggregated[sId] = {
                            id: sId,
                            name: doc.studentId.name,
                            section: doc.studentId.section,
                            totalCompleted: 0
                        };
                    }
                    aggregated[sId].totalCompleted += doc.completedProblems.length;
                });

                setStudentProgress(Object.values(aggregated));
            } catch (error) {
                console.error("Error fetching student progress:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [activeSheet]);

    const filteredStudents = studentProgress.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.section.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-20 px-4 md:px-10 pb-10">
            <Navbar />

            <div className="max-w-7xl mx-auto">
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Sheet Progress Monitoring</h1>
                    <p className="text-gray-400 text-sm md:text-base">Track student progress across problem sheets.</p>
                </div>

                {/* Sheet Tabs */}
                <div className="flex gap-2 md:gap-4 mb-6 md:mb-8 overflow-x-auto pb-2 px-1">
                    {sheets.map(sheet => (
                        <button
                            key={sheet}
                            onClick={() => setActiveSheet(sheet)}
                            className={clsx(
                                "px-3 md:px-5 py-2 rounded-lg border text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                                activeSheet === sheet
                                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                            )}
                        >
                            {sheet}
                        </button>
                    ))}
                </div>

                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-6">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm md:text-base text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="text-gray-400 text-xs md:text-sm whitespace-nowrap">
                        Showing {filteredStudents.length} students
                    </div>
                </div>

                {/* Table */}
                <SpotlightCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-gray-700/50 bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <th className="p-3 md:p-4">Student Name</th>
                                    <th className="p-3 md:p-4">Section</th>
                                    <th className="p-3 md:p-4 text-center">Solved</th>
                                    <th className="p-3 md:p-4 text-center">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="p-6 md:p-8 text-center text-gray-500 animate-pulse text-sm">Loading progress data...</td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-6 md:p-8 text-center text-gray-500 text-sm">No progress found for this sheet.</td>
                                    </tr>
                                ) : (
                                    filteredStudents.map(student => (
                                        <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-3 md:p-4 font-medium text-white truncate">{student.name}</td>
                                            <td className="p-3 md:p-4 text-gray-400 text-xs md:text-sm">{student.section}</td>
                                            <td className="p-3 md:p-4 text-cyan-400 font-bold text-sm md:text-base text-center">{student.totalCompleted}</td>
                                            <td className="p-3 md:p-4 w-32 md:w-1/3">
                                                {/* Percentage bar is tricky without total problems count passed from backend. 
                                                    For now, displaying raw count is safest. 
                                                    Or we can fetch total problems count for the sheet separate.
                                                */}
                                                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-cyan-500"
                                                        style={{ width: `${Math.min((student.totalCompleted / 450) * 100, 100)}%` }} // Rough estimate based on 450
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </SpotlightCard>
            </div>
        </div>
    );
};

export default AdminSheets;

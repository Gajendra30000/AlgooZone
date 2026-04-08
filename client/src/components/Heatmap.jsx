import { useState } from 'react';

const Heatmap = ({ calendar, maxStreak }) => {
    // 1. Process Data
    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1); // 1 year ago

    const weeks = [];
    let currentWeek = [];
    const monthLabels = [];

    // We need 52-53 weeks.
    // Start from the Sunday on or before startDate
    const loopDate = new Date(startDate);
    loopDate.setDate(loopDate.getDate() - loopDate.getDay());

    let totalSubmissions = 0;
    let activeDays = 0;
    const dayMilliseconds = 24 * 60 * 60 * 1000;

    // Iterate until we reach today (or end of this week)
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End of this week

    let weekIndex = 0;
    while (loopDate <= endDate) {
        // Collect month label if it's the first week of the month
        if (loopDate.getDate() <= 7 && currentWeek.length === 0) {
            monthLabels.push({
                label: loopDate.toLocaleString('default', { month: 'short' }),
                index: weekIndex
            });
        }

        const timestamp = Math.floor(loopDate.getTime() / 1000);

        // Check calendar for this date (match simple date string or simplistic timestamp check)
        // Calendar keys are usually unix timestamps at specific times. Let's fuzzy match date.

        // Find if this date exists in calendar keys (converted to date)
        // Optimization: Convert calendar keys to YYYY-MM-DD map once

        const dateStr = loopDate.toISOString().split('T')[0];
        // We'll simplistic check in render or pre-process. 
        // For accurate count, we ideally iterate calendar keys.
        // But for rendering grid, we iterate dates.

        let count = 0;
        // This is expensive inside loop if calendar is big, but for <365 it's ok. 
        // Better: Pre-process calendar.

        // (See pre-process below component)

        const foundKey = Object.keys(calendar).find(k => {
            const d = new Date(parseInt(k) * 1000);
            return d.toISOString().split('T')[0] === dateStr;
        });

        if (foundKey) {
            count = calendar[foundKey];
            totalSubmissions += count;
            activeDays++;
        }

        let color = 'bg-[#2d333b]'; // Default dark grey (LeetCode style)
        if (count > 0) color = 'bg-[#0e4429]';
        if (count > 2) color = 'bg-[#006d32]';
        if (count > 5) color = 'bg-[#26a641]';
        if (count > 10) color = 'bg-[#39d353]';

        currentWeek.push({
            date: dateStr,
            count,
            color,
            formattedDate: loopDate.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })
        });

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
            weekIndex++;
        }

        loopDate.setDate(loopDate.getDate() + 1);
    }
    // Push remaining days
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
        <div className="w-full text-white">
            {/* Header: Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <span className="text-xl font-medium">
                    {totalSubmissions} <span className="text-gray-400 text-base">submissions in the past one year <span className="inline-block w-4 h-4 rounded-full border border-gray-600 text-[10px] text-center ml-1 leading-3">i</span></span>
                </span>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Total active days: <span className="text-white font-medium">{activeDays}</span></span>
                    <span>Max streak: <span className="text-white font-medium">{maxStreak}</span></span>

                    {/* Mock Dropdown */}
                    <div className="bg-[#2d333b] px-3 py-1 rounded text-white flex items-center gap-2 cursor-pointer border border-gray-700">
                        Current <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Heatmap Container */}
            <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800 overflow-x-auto custom-scrollbar">
                <div className="min-w-[700px]">
                    {/* Month Labels */}
                    <div className="flex mb-2 ml-8 relative h-4">
                        {monthLabels.map((m, i) => (
                            <span
                                key={i}
                                className="absolute text-xs text-gray-500"
                                style={{ left: `${m.index * 14}px` }} // Approx width of col + gap
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-[3px]">
                        {/* Day Labels (Mon/Wed/Fri) */}
                        <div className="flex flex-col gap-[3px] text-[10px] text-gray-500 mr-2 relative top-[1px]">
                            <span className="h-3 w-3"></span>
                            <span className="h-3 leading-3">Mon</span>
                            <span className="h-3 w-3"></span>
                            <span className="h-3 leading-3">Wed</span>
                            <span className="h-3 w-3"></span>
                            <span className="h-3 leading-3">Fri</span>
                            <span className="h-3 w-3"></span>
                        </div>

                        {/* Grid */}
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                {week.map((day, dIdx) => (
                                    <div
                                        key={dIdx}
                                        className={`w-3 h-3 rounded-[2px] ${day.color} hover:ring-1 hover:ring-white/50 relative group cursor-pointer`}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap bg-[#6e7681] text-white text-xs px-2 py-1 rounded shadow-lg">
                                            {day.count} {day.count <= 1 ? 'submission' : 'submissions'} on {day.formattedDate}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#6e7681]"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center text-xs text-gray-500 gap-2 justify-start ml-8">
                <span>Less</span>
                <div className="w-3 h-3 bg-[#2d333b] rounded-[2px]"></div>
                <div className="w-3 h-3 bg-[#0e4429] rounded-[2px]"></div>
                <div className="w-3 h-3 bg-[#006d32] rounded-[2px]"></div>
                <div className="w-3 h-3 bg-[#26a641] rounded-[2px]"></div>
                <div className="w-3 h-3 bg-[#39d353] rounded-[2px]"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default Heatmap;

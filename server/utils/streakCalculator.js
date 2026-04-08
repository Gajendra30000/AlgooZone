export const calculateStreaks = (submissionCalendar) => {
    if (!submissionCalendar) return { currentStreak: 0, maxStreak: 0 };

    const timestamps = Object.keys(submissionCalendar).map(t => parseInt(t)).sort((a, b) => a - b);
    if (timestamps.length === 0) return { currentStreak: 0, maxStreak: 0 };

    // Convert to unique date strings (YYYY-MM-DD) to handle multiple submissions same day
    const uniqueDates = new Set();
    timestamps.forEach(ts => {
        const date = new Date(ts * 1000);
        uniqueDates.add(date.toISOString().split('T')[0]);
    });

    const sortedDates = Array.from(uniqueDates).sort();

    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dateStr of sortedDates) {
        const date = new Date(dateStr);

        if (prevDate) {
            const diffTime = Math.abs(date - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        } else {
            tempStreak = 1;
        }

        if (tempStreak > maxStreak) maxStreak = tempStreak;
        prevDate = date;
    }

    // Check if the streak is active (last submission was today or yesterday)
    const lastDateStr = sortedDates[sortedDates.length - 1];
    const lastDate = new Date(lastDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalize lastDate to midnight for comparison
    const lastDateMidnight = new Date(lastDate);
    lastDateMidnight.setHours(0, 0, 0, 0); // Assuming dates are UTC or consistent

    // Simple check: if last date is today or yesterday, current streak is valid.
    // Otherwise 0.
    // Note: This logic assumes server time matches (using server local time here).

    const isActive = lastDateMidnight.getTime() === today.getTime() || lastDateMidnight.getTime() === yesterday.getTime();

    currentStreak = isActive ? tempStreak : 0;

    return { currentStreak, maxStreak };
};

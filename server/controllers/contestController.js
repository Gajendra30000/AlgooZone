import axios from 'axios';
import { fetchAllLeetCodeContests } from '../services/leetcodeContestService.js';

// Cache for contests to avoid hitting API too often
let contestsCache = {
    data: [],
    lastUpdated: 0
};

export const getUpcomingContests = async (req, res) => {
    const NOW = Date.now();
    const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

    if (contestsCache.data.length > 0 && (NOW - contestsCache.lastUpdated < CACHE_DURATION)) {
        return res.json(contestsCache.data);
    }

    try {
        // Fetch all contests (LeetCode + others)
        const leetcodeContests = await fetchAllLeetCodeContests();
        
        // Fetch Codeforces
        const cfResponse = await axios.get('https://codeforces.com/api/contest.list');
        const cfContests = cfResponse.data.result
            .filter(c => c.phase === 'BEFORE')
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                title: c.name,
                platform: 'Codeforces',
                startTime: c.startTimeSeconds * 1000,
                duration: c.durationSeconds,
                link: `https://codeforces.com/contest/${c.id}`,
                type: 'upcoming'
            }));

        const allContests = {
            leetcode: leetcodeContests,
            codeforces: cfContests,
            combined: [
                ...leetcodeContests.upcoming.map(c => ({ ...c, platform: 'LeetCode' })),
                ...cfContests
            ].sort((a, b) => a.startTime - b.startTime)
        };

        contestsCache = {
            data: allContests,
            lastUpdated: NOW
        };

        res.json(allContests);
    } catch (error) {
        console.error("Error fetching contests:", error.message);
        res.json(contestsCache.data.length ? contestsCache.data : { leetcode: { upcoming: [], past: [] }, codeforces: [], combined: [] });
    }
};

// Endpoint for LeetCode contests specifically
export const getLeetCodeContests = async (req, res) => {
    try {
        const contests = await fetchAllLeetCodeContests();
        res.json(contests);
    } catch (error) {
        console.error("Error fetching LeetCode contests:", error.message);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
};

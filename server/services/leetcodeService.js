import axios from 'axios';

// Helper to fetch general stats (User specified API)
// Helper to fetch general stats (GraphQL Replacement for broken Heroku API)
export const fetchLeetCodeStats = async (username) => {
    const query = `
    query userProfileStats($username: String!) {
        matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            profile {
                ranking
                reputation
            }
            submissionCalendar
        }
    }
    `;

    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { username }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.data.errors) {
            console.error(`GraphQL error for ${username}:`, response.data.errors);
            return null;
        }

        const data = response.data.data.matchedUser;
        if (!data) return null;

        // Parse stats to match previous format for compatibility
        const stats = {
            status: 'success',
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            ranking: data.profile?.ranking || 0,
            reputation: data.profile?.reputation || 0,
            submissionCalendar: JSON.parse(data.submissionCalendar || '{}')
        };

        data.submitStats?.acSubmissionNum?.forEach(item => {
            if (item.difficulty === 'All') stats.totalSolved = item.count;
            if (item.difficulty === 'Easy') stats.easySolved = item.count;
            if (item.difficulty === 'Medium') stats.mediumSolved = item.count;
            if (item.difficulty === 'Hard') stats.hardSolved = item.count;
        });

        return stats;

    } catch (error) {
        console.error(`Network error fetching stats for ${username}:`, error.message);
        return null;
    }
};

// Helper to fetch recent submissions (GraphQL)
export const fetchRecentSubmissions = async (username) => {
    const query = `
    query recentSubmissions($username: String!, $limit: Int) {
        recentSubmissionList(username: $username, limit: $limit) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
        }
    }
    `;

    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { username, limit: 10 }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.data.errors) {
            console.error(`GraphQL error for ${username}:`, response.data.errors);
            return [];
        }

        return response.data.data.recentSubmissionList;
    } catch (error) {
        console.error(`Network error fetching submissions for ${username}:`, error.message);
        return [];
    }
};

// Helper to fetch topic stats (GraphQL)
export const fetchTopicStats = async (username) => {
    const query = `
    query skillStats($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
      }
    }
    `;

    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { username }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.data.errors) {
            console.error(`GraphQL error for ${username}:`, response.data.errors);
            return [];
        }

        const counts = response.data.data.matchedUser?.tagProblemCounts;
        if (!counts) return [];

        // Flatten the structure
        const allTopics = [
            ...counts.advanced,
            ...counts.intermediate,
            ...counts.fundamental
        ];

        // Sort by problems solved desc
        return allTopics.sort((a, b) => b.problemsSolved - a.problemsSolved);

    } catch (error) {
        console.error(`Network error fetching topics for ${username}:`, error.message);
        return [];
    }
};

export const fetchAllStudentData = async (username) => {
    const [stats, submissions, topics] = await Promise.all([
        fetchLeetCodeStats(username),
        fetchRecentSubmissions(username),
        fetchTopicStats(username)
    ]);

    return { stats, submissions, topics };
};

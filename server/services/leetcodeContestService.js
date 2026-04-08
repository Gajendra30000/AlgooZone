import axios from 'axios';

// Fetch upcoming LeetCode contests
export const fetchUpcomingContests = async () => {
    const query = `
    {
        upcomingContests {
            title
            description
            startTime
            duration
            isVirtual
        }
    }
    `;

    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });

        if (response.data.errors) {
            console.error('❌ GraphQL error (upcoming):', JSON.stringify(response.data.errors, null, 2));
            return [];
        }

        const contests = response.data.data?.upcomingContests || [];
        console.log(`✅ Fetched ${contests.length} upcoming contests from LeetCode`);
        
        return contests.map((c, index) => ({
            id: `upcoming-${index}`,
            title: c.title,
            description: c.description,
            startTime: c.startTime * 1000,
            duration: c.duration,
            coverUrl: '',
            isVirtual: c.isVirtual,
            type: 'upcoming'
        }));
    } catch (error) {
        console.error('❌ Error fetching upcoming contests:', error.response?.status, error.response?.statusText);
        if (error.response?.data?.errors) {
            console.error('GraphQL Errors:', JSON.stringify(error.response.data.errors, null, 2));
        }
        return [];
    }
};

// Fetch past/finished LeetCode contests
export const fetchPastContests = async () => {
    const query = `
    {
        pastContests(pageNo: 1) {
            data {
                title
                description
                startTime
                duration
                isVirtual
            }
            totalNum
        }
    }
    `;

    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });

        if (response.data.errors) {
            console.error('❌ GraphQL error (past):', JSON.stringify(response.data.errors, null, 2));
            return [];
        }

        const contestData = response.data.data?.pastContests?.data || [];
        console.log(`✅ Fetched ${contestData.length} past contests from LeetCode`);
        
        return contestData.map((c, index) => ({
            id: `past-${index}`,
            title: c.title,
            description: c.description,
            startTime: c.startTime * 1000,
            duration: c.duration,
            coverUrl: '',
            isVirtual: c.isVirtual,
            type: 'past'
        }));
    } catch (error) {
        console.error('❌ Error fetching past contests:', error.response?.status, error.response?.statusText);
        if (error.response?.data?.errors) {
            console.error('GraphQL Errors:', JSON.stringify(error.response.data.errors, null, 2));
        }
        return [];
    }
};

// Get all contests (upcoming + past)
export const fetchAllLeetCodeContests = async () => {
    const [upcoming, past] = await Promise.all([
        fetchUpcomingContests(),
        fetchPastContests()
    ]);

    console.log(`📊 Total: ${upcoming.length} upcoming, ${past.length} past contests`);

    return {
        upcoming,
        past,
        all: [...upcoming, ...past]
    };
};

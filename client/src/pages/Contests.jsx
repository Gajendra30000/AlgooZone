import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Zap, Calendar, Clock, Trophy } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';
import clsx from 'clsx';

export default function Contests() {
  const [contests, setContests] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/contests/leetcode`);
      setContests(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch contests:', err);
      setError('Failed to load contests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const extractTextFromDescription = (description) => {
    // If description is a string, return it
    if (typeof description === 'string') {
      // Check if it looks like JSON
      try {
        const parsed = JSON.parse(description);
        // If it's Slate JSON structure, extract text
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => {
              if (item.children && Array.isArray(item.children)) {
                return item.children.map(child => child.text || '').join('');
              }
              return '';
            })
            .join(' ')
            .substring(0, 150) + '...';
        }
        return description.substring(0, 150) + '...';
      } catch {
        // Not JSON, return as is
        return description.substring(0, 150) + '...';
      }
    }
    
    // If it's already an object (from API response)
    if (Array.isArray(description)) {
      return description
        .map(item => {
          if (item.children && Array.isArray(item.children)) {
            return item.children.map(child => child.text || '').join('');
          }
          return '';
        })
        .join(' ')
        .substring(0, 150) + '...';
    }

    return 'Contest details available on LeetCode';
  };

  const generateContestUrl = (contest) => {
    // Generate URL slug from title
    // "Weekly Contest 497" -> "weekly-contest-497"
    // "Biweekly Contest 180" -> "biweekly-contest-180"
    const slug = contest.title.toLowerCase().replace(/\s+/g, '-');
    return `https://leetcode.com/contest/${slug}/`;
  };

  const displayContests = activeTab === 'upcoming' ? contests.upcoming : contests.past;

  return (
    <div className="min-h-screen pt-20 px-4 md:px-10 pb-10">
      <Navbar />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="flex justify-center mb-4 md:mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl md:text-6xl"
            >
              <Zap className="text-yellow-400" size={48} />
            </motion.div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 mb-2 md:mb-4">
            LeetCode Contests
          </h1>

          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto px-4">
            Compete with programmers worldwide. Choose from Weekly or Biweekly Contests.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 md:gap-4 mb-6 md:mb-8 justify-center flex-wrap px-4"
        >
          <button
            onClick={() => setActiveTab('upcoming')}
            className={clsx(
              'px-4 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base',
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-cyan-500/50'
            )}
          >
            <span className="flex items-center gap-2">
              <Zap size={16} />
              Upcoming ({contests.upcoming.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={clsx(
              'px-4 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base',
              activeTab === 'past'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-cyan-500/50'
            )}
          >
            <span className="flex items-center gap-2">
              <Trophy size={16} />
              Past ({contests.past.length})
            </span>
          </button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 md:mb-8 p-4 md:p-6 glass-card rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <span className="text-sm md:text-base">{error}</span>
            <button
              onClick={fetchContests}
              className="px-4 md:px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold text-sm whitespace-nowrap"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 md:py-20"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-3 md:mb-4"></div>
            <p className="text-gray-400 animate-pulse text-sm md:text-base">Loading contests...</p>
          </motion.div>
        ) : displayContests.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4 md:px-0"
          >
            <AnimatePresence mode="popLayout">
              {displayContests.map((contest, index) => {
                const { date, time } = formatDate(contest.startTime);
                const duration = formatDuration(contest.duration);

                return (
                  <motion.div
                    key={contest.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="glass-card rounded-lg md:rounded-xl border border-cyan-500/20 overflow-hidden hover:border-cyan-500/50 transition-all group hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    {/* Cover Image */}
                    {contest.coverUrl && (
                      <div className="relative h-32 md:h-48 overflow-hidden">
                        <img
                          src={contest.coverUrl}
                          alt={contest.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a2a] via-transparent to-transparent"></div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 md:p-6">
                      <div className="flex items-start justify-between gap-2 md:gap-4 mb-2 md:mb-3">
                        <h3 className="text-base md:text-xl font-bold text-cyan-400 flex-1 group-hover:text-cyan-300 transition-colors truncate">
                          {contest.title}
                        </h3>
                        {contest.isVirtual && (
                          <span className="px-2 md:px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-semibold flex-shrink-0">
                            Virtual
                          </span>
                        )}
                      </div>

                      {contest.description && (
                        <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                          {extractTextFromDescription(contest.description)}
                        </p>
                      )}

                      {/* Contest Details */}
                      <div className="space-y-2 mb-4 md:mb-6">
                        <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm">
                          <Calendar size={14} className="text-cyan-400 flex-shrink-0" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm">
                          <Clock size={14} className="text-purple-400 flex-shrink-0" />
                          <span>{time} ({duration})</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <a
                        href={generateContestUrl(contest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-block text-center px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 hover:border-cyan-500 transition-all"
                      >
                        {activeTab === 'upcoming' ? 'Register Now' : 'View Results'}
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 md:py-20 px-4"
          >
            <p className="text-gray-400 text-base md:text-lg mb-4">
              {activeTab === 'upcoming'
                ? 'No upcoming contests at the moment. Check back soon!'
                : 'No past contests found.'}
            </p>
            <button
              onClick={fetchContests}
              className="px-6 py-2 rounded-lg font-semibold bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all"
            >
              Refresh
            </button>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0"
        >
          <div className="glass-card p-4 md:p-6 rounded-lg md:rounded-xl border border-cyan-500/20">
            <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2 text-sm md:text-base">
              <Zap size={18} />
              Weekly Contests
            </h4>
            <p className="text-gray-400 text-xs md:text-sm">
              Held every Sunday. Test your skills against thousands of programmers.
            </p>
          </div>

          <div className="glass-card p-4 md:p-6 rounded-lg md:rounded-xl border border-purple-500/20">
            <h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2 text-sm md:text-base">
              <Trophy size={18} />
              Biweekly Contests
            </h4>
            <p className="text-gray-400 text-xs md:text-sm">
              Held every other Saturday. Compete for ratings and rankings.
            </p>
          </div>

          <div className="glass-card p-4 md:p-6 rounded-lg md:rounded-xl border border-emerald-500/20">
            <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2 text-sm md:text-base">
              <Calendar size={18} />
              Special Events
            </h4>
            <p className="text-gray-400 text-xs md:text-sm">
              Seasonal contests and themed competitions throughout the year.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

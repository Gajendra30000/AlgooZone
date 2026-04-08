import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Copy, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import API_URL from '../config';
import clsx from 'clsx';

const CodeReviewer = () => {
  const [code, setCode] = useState('');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter some code to review');
      return;
    }

    setLoading(true);
    setError('');
    setReview('');

    try {
      const token = localStorage.getItem('dsa_token');
      const response = await axios.post(
        `${API_URL}/api/gemini/review-code`,
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReview(response.data);
    } catch (err) {
      console.error('Review error:', err);
      setError(err.response?.data?.error || 'Failed to review code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopyFeedback('Code copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleCopyReview = () => {
    navigator.clipboard.writeText(review);
    setCopyFeedback('Review copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReview = () => {
    const blob = new Blob([review], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-review.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCode('');
    setReview('');
    setError('');
    setCopyFeedback('');
  };

  const formatReviewContent = (reviewText) => {
    const sections = reviewText.split(/##\s+/);

    return sections
      .map((section, index) => {
        if (!section.trim()) return null;

        const lines = section.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();

        const iconMap = {
          'Analysis Summary': '🔍',
          'Issues Found': '❌',
          'Corrected Code': '✅',
          'Improvements Made': '💡',
          'Additional Recommendations': '🚀',
          'Code Quality Score': '📊',
        };

        const icon = Object.entries(iconMap).find(([key]) => title.includes(key))?.[1] || '📋';

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 rounded-lg border border-cyan-500/20 mb-4 hover:border-cyan-500/40 transition-all"
          >
            <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              {title.replace(/[*]/g, '')}
            </h4>
            <div className="text-gray-300 space-y-2">
              {content.includes('```') ? (
                <pre className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto border border-gray-700 text-sm">
                  <code className="text-green-400 font-mono">{content}</code>
                </pre>
              ) : (
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: content
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
                      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-yellow-300">$1</code>'),
                  }}
                />
              )}
            </div>
          </motion.div>
        );
      })
      .filter(Boolean);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen pt-20 px-4 md:px-10 pb-10">
      <Navbar />

      <motion.div
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="mb-8 md:mb-12 text-center">
          <div className="inline-block mb-4 md:mb-6">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl md:text-6xl"
            >
              🤖
            </motion.div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 mb-2 md:mb-4">
            AI Code Reviewer
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-3xl mx-auto mb-4 md:mb-6">
            Get instant AI-powered code reviews with suggestions for improvements, best practices, and potential issues.
          </p>

          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-8">
            <span className="px-3 md:px-4 py-2 glass-card rounded-full text-cyan-400 text-xs md:text-sm border border-cyan-500/20">
              ✨ Smart Analysis
            </span>
            <span className="px-3 md:px-4 py-2 glass-card rounded-full text-purple-400 text-xs md:text-sm border border-purple-500/20">
              🔧 Code Fixes
            </span>
            <span className="px-3 md:px-4 py-2 glass-card rounded-full text-emerald-400 text-xs md:text-sm border border-emerald-500/20">
              🚀 Best Practices
            </span>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 glass-card border border-red-500/50 bg-red-500/10 p-4 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-400 font-semibold">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
          {/* Input Section */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <div className="glass-card p-4 md:p-8 rounded-lg md:rounded-xl border border-cyan-500/20 flex-1 flex flex-col">
              <h2 className="text-xl md:text-2xl font-bold text-cyan-400 mb-3 md:mb-4 flex items-center gap-2">
                <span>📝</span>
                Your Code
              </h2>

              <textarea
                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg p-3 md:p-4 text-white text-xs md:text-sm font-mono focus:outline-none focus:border-cyan-500/50 resize-none min-h-[200px] md:min-h-[300px]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
              />

              <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 flex-wrap">
                {code && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCopyCode}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all text-xs md:text-sm font-semibold"
                  >
                    <Copy size={14} />
                    Copy
                  </motion.button>
                )}

                {code && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleDownloadCode}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-xs md:text-sm font-semibold"
                  >
                    <Download size={14} />
                    Download
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Review Section */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <div className="glass-card p-4 md:p-8 rounded-lg md:rounded-xl border border-purple-500/20 flex-1 flex flex-col min-h-[300px] md:min-h-[400px]">
              <h2 className="text-xl md:text-2xl font-bold text-purple-400 mb-3 md:mb-4 flex items-center gap-2">
                <span>🔍</span>
                AI Review
              </h2>

              {!review && !loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-center px-4">
                  <div>
                    <p className="text-base md:text-lg mb-2">No review yet</p>
                    <p className="text-xs md:text-sm">Submit your code to get AI-powered feedback</p>
                  </div>
                </div>
              ) : review ? (
                <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-3 md:space-y-4">
                  {formatReviewContent(review)}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="mb-4 flex justify-center">
                      <div className="inline-block">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-3xl md:text-4xl"
                        >
                          ⚙️
                        </motion.div>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-2 text-sm md:text-base">Analyzing your code...</p>
                    <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-transparent rounded-full mx-auto animate-pulse"></div>
                  </div>
                </div>
              )}

              {review && (
                <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyReview}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all text-xs md:text-sm font-semibold"
                  >
                    <Copy size={14} />
                    Copy
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadReview}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs md:text-sm font-semibold"
                  >
                    <Download size={14} />
                    Download
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-2 md:gap-4 flex-wrap justify-center mb-6 md:mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className={clsx(
              'flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base',
              loading || !code.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/50'
            )}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span className="hidden sm:inline">Reviewing...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span className="hidden sm:inline">Review Code</span>
                <span className="sm:hidden">Review</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3 rounded-lg font-semibold bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600 transition-all text-sm md:text-base"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </motion.button>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-12 rounded-xl border border-cyan-500/20 text-center mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-5xl mb-4"
            >
              🧠
            </motion.div>
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">AI is analyzing your code...</h3>
            <p className="text-gray-400 mb-6">Our advanced AI is examining every line for improvements, bugs, and best practices</p>

            <div className="space-y-2 text-left max-w-md mx-auto">
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="flex items-center gap-3 text-gray-300"
              >
                <CheckCircle size={16} className="text-cyan-400" />
                <span className="text-sm">Parsing code structure</span>
              </motion.div>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <CheckCircle size={16} className="text-cyan-400" />
                <span className="text-sm">Identifying issues</span>
              </motion.div>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>
                  <span className="text-lg">⏳</span>
                </motion.div>
                <span className="text-sm">Generating improvements</span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Review Results */}
        {review && !loading && (
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 mb-6 flex items-center gap-2">
              <span>🔍</span>
              Detailed Review Analysis
            </h2>
            <div className="space-y-4">{formatReviewContent(review)}</div>
          </motion.div>
        )}

        {/* Copy Feedback */}
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-8 right-8 glass-card px-6 py-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle size={16} />
            {copyFeedback}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CodeReviewer;

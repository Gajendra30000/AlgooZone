import { ChevronRight } from 'lucide-react';
import SpotlightCard from './SpotlightCard';

const TopicStats = ({ topics }) => {
    if (!topics || topics.length === 0) {
        return (
            <SpotlightCard className="p-6 flex items-center justify-center text-gray-500 h-full">
                No topic data available yet.
            </SpotlightCard>
        );
    }

    // Limit to top 10 for display
    const topTopics = topics.slice(0, 10);

    return (
        <SpotlightCard className="p-4 md:p-6 h-full">
            <h3 className="text-gray-400 text-xs md:text-sm uppercase tracking-wider mb-3 md:mb-4">Strongest Topics</h3>

            <div className="space-y-3 md:space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {topTopics.map((topic, idx) => (
                    <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="text-white text-xs md:text-sm font-medium group-hover:text-cyan-400 transition-colors truncate">
                                {topic.tagName}
                            </span>
                            <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full border border-gray-700 flex-shrink-0">
                                {topic.count}
                            </span>
                        </div>
                        {/* Visual bar just for effect, max width relative to top topic */}
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full"
                                style={{ width: `${Math.min((topic.count / Math.max(topics[0].count, 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {topics.length > 10 && (
                <div className="mt-3 md:mt-4 text-center">
                    <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 mx-auto transition-colors">
                        View All <ChevronRight size={12} />
                    </button>
                </div>
            )}
        </SpotlightCard>
    );
};

export default TopicStats;

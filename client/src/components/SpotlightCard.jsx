import { useRef, useState } from 'react';
import clsx from 'clsx';

const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(0, 255, 255, 0.15)" }) => {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={clsx(
                "relative overflow-hidden rounded-2xl border border-gray-800 bg-[#0a0a2a]/60 backdrop-blur-md", // Base glass style
                className
            )}
        >
            {/* Spotlight Gradient */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`
                }}
            />

            {/* Content Content Filter to keep text sharp */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};

export default SpotlightCard;

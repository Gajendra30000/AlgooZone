import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Trophy, Calendar, BookOpen, Wand2, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavLink = ({ to, icon: Icon, label, onClick }) => (
        <Link
            to={to}
            onClick={onClick}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors w-full md:w-auto"
        >
            <Icon size={18} />
            <span className="text-sm md:text-base">{label}</span>
        </Link>
    );

    return (
        <nav className="fixed top-0 w-full z-50 glass-card border-b border-gray-700/50 h-16 px-4 md:px-10">
            <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        AlgoZone
                    </span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-2">
                    {user?.role === 'admin' ? (
                        <>
                            <NavLink to="/admin/dashboard" icon={LayoutDashboard} label="Admin Panel" />
                            <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
                            <NavLink to="/admin/sheets" icon={BookOpen} label="Sheets Progress" />
                            <NavLink to="/code-reviewer" icon={Wand2} label="Code Reviewer" />
                        </>
                    ) : (
                        <>
                            <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
                            <NavLink to="/contests" icon={Calendar} label="Contests" />
                            <NavLink to="/sheets" icon={BookOpen} label="Sheets" />
                            <NavLink to="/code-reviewer" icon={Wand2} label="Code Reviewer" />
                        </>
                    )}
                </div>

                {/* Desktop User Info & Logout */}
                <div className="hidden md:flex items-center space-x-4">
                    <div className="text-sm text-right">
                        <p className="text-white font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.registrationNumber || user?.username}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-gray-700/50 text-red-400 hover:text-red-300 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center space-x-2">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-cyan-400 transition-colors"
                        title="Menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
                        {user?.role === 'admin' ? (
                            <>
                                <NavLink to="/admin/dashboard" icon={LayoutDashboard} label="Admin Panel" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/admin/sheets" icon={BookOpen} label="Sheets Progress" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/code-reviewer" icon={Wand2} label="Code Reviewer" onClick={() => setMobileMenuOpen(false)} />
                            </>
                        ) : (
                            <>
                                <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/contests" icon={Calendar} label="Contests" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/sheets" icon={BookOpen} label="Sheets" onClick={() => setMobileMenuOpen(false)} />
                                <NavLink to="/code-reviewer" icon={Wand2} label="Code Reviewer" onClick={() => setMobileMenuOpen(false)} />
                            </>
                        )}
                        <div className="border-t border-gray-700/50 pt-2 mt-2">
                            <div className="text-sm px-3 py-2">
                                <p className="text-white font-medium text-sm">{user?.name}</p>
                                <p className="text-xs text-gray-400">{user?.registrationNumber || user?.username}</p>
                            </div>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

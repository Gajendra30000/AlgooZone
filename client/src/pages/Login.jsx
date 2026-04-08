import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Shield, AlertCircle } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import { motion } from 'framer-motion';

const Login = () => {
    const [role, setRole] = useState('student');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, adminLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorDetails('');
        setLoading(true);

        console.log('📝 FORM SUBMIT:', { role, registrationNumber });

        let res;
        if (role === 'student') {
            res = await login(registrationNumber, password);
        } else {
            res = await adminLogin(registrationNumber, password);
        }

        setLoading(false);

        if (res.success) {
            console.log('✅ Login successful, redirecting...');
            navigate(role === 'student' ? '/dashboard' : '/admin/dashboard');
        } else {
            console.log('❌ Login failed:', res);
            setError(res.message);
            setErrorDetails(res.details || (res.statusCode && `Status: ${res.statusCode}`));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <SpotlightCard className="p-8 rounded-2xl neon-border relative overflow-visible">

                    {/* Decorative elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-neon-cyan blur-[4px] z-20"></div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2 neon-text-cyan">DSA Tracker</h1>
                        <p className="text-gray-400">Sign in to your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg overflow-hidden"
                        >
                            <div className="flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-red-200 font-semibold text-sm">{error}</p>
                                    {errorDetails && (
                                        <p className="text-red-300 text-xs mt-1 opacity-80">{errorDetails}</p>
                                    )}
                                    {error.includes('Cannot connect') && (
                                        <div className="mt-2 text-xs text-red-300 bg-red-900/30 p-2 rounded">
                                            💡 Try: Make sure the backend server is running on port 5000
                                        </div>
                                    )}
                                    {error.includes('Invalid registration') && (
                                        <div className="mt-2 text-xs text-red-300 bg-red-900/30 p-2 rounded">
                                            💡 Account: 2045pg / Password: nayak123 (test account)
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role Select */}
                        <div className="relative">
                            <Shield className="absolute left-3 top-3 text-neon-purple w-5 h-5" />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                disabled={loading}
                                className="w-full bg-[#0a0a2a]/50 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-purple transition-colors appearance-none disabled:opacity-50"
                            >
                                <option value="student">Student</option>
                                <option value="admin">Admin / Teacher</option>
                            </select>
                        </div>

                        {/* ID Input */}
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-neon-cyan w-5 h-5" />
                            <input
                                type="text"
                                placeholder={role === 'student' ? "Registration Number" : "Username"}
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                disabled={loading}
                                className="w-full bg-[#0a0a2a]/50 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors disabled:opacity-50"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-neon-cyan w-5 h-5" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="w-full bg-[#0a0a2a]/50 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors disabled:opacity-50"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Don't have an account? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4">Register Now</Link></p>
                    </div>

                </SpotlightCard>
            </motion.div>
        </div>
    );
};

export default Login;

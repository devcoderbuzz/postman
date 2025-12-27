import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { activateUser, register } from '../services/apiservice';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [tempUser, setTempUser] = useState(null);

    // Registration states
    const [isRegistering, setIsRegistering] = useState(false);
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [regRole, setRegRole] = useState('user');

    const generateProfileImage = (name) => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        const hue = Math.floor(Math.random() * 360);
        ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = name ? name.charAt(0).toUpperCase() : '?';
        ctx.fillText(letter, 50, 50);
        return canvas.toDataURL('image/png');
    };

    const handleResetPassword = async (passwords) => {
        try {
            setError('');
            await activateUser(
                tempUser.userId,
                passwords.newPassword,
                tempUser.token
            );
            window.alert('Password reset successful! Please login with your new password.');
            setIsResetOpen(false);
            setTempUser(null);
            setPassword('');
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (regPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const profileImageData = generateProfileImage(regUsername);
            await register({
                username: regUsername,
                password: regPassword,
                role: regRole,
                status: 'PENDING',
                profileImage: profileImageData
            });
            window.alert('Registration successful! You can now login.');
            setIsRegistering(false);
            setUsername(regUsername);
        } catch (err) {
            setError(err.message || 'Registration failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(username, password);
            if (user && user.status === 'RESETPASSWORD') {
                setTempUser({ ...user, originalPassword: password });
                setIsResetOpen(true);
                return;
            }
            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'developer' || user.role === 'dev') {
                    navigate('/dev');
                } else if (user.role === 'user') {
                    navigate('/user');
                } else {
                    navigate('/workspace');
                }
            } else {
                setError('Invalid credentials or account inactive');
            }
        } catch (err) {
            setError('Login service failed. Please check your connection or try again later.');
            console.error('Submit Error:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-96 border-t-4 border-red-600">
                <h2 className="text-3xl font-extrabold mb-8 text-center text-slate-800 dark:text-white uppercase tracking-wider">
                    {isRegistering ? 'Register' : 'Login'}
                </h2>

                {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md mb-6 text-sm font-medium">{error}</div>}

                {!isRegistering ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-5">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wide">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                                required
                            />
                            <div className="mt-2 text-right">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegistering(true);
                                        setError('');
                                    }}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-tighter"
                                >
                                    Register now ?
                                </button>
                            </div>
                        </div>
                        <div className="mb-8">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-red-600 text-white font-black py-3 px-4 rounded-md hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/20 active:scale-[0.98] uppercase tracking-widest text-sm"
                        >
                            Sign In
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <div className="mb-4">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wide">Username</label>
                            <input
                                type="text"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wide">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wide">Role</label>
                            <select
                                value={regRole}
                                onChange={(e) => setRegRole(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                            >
                                <option value="user">User</option>
                                <option value="developer">Developer</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-red-600 text-white font-black py-3 px-4 rounded-md hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/20 active:scale-[0.98] uppercase tracking-widest text-sm mb-4"
                        >
                            Register
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(false);
                                setError('');
                            }}
                            className="w-full text-xs font-bold text-slate-500 hover:text-red-600 uppercase tracking-tight transition-colors"
                        >
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
            <ResetPasswordModal
                isOpen={isResetOpen}
                onClose={() => setIsResetOpen(false)}
                onSave={handleResetPassword}
                username={tempUser?.username}
            />
        </div>
    );
}


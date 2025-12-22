import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { activateUser } from '../services/apiservice';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [tempUser, setTempUser] = useState(null);

    const handleResetPassword = async (passwords) => {
        try {
            setError(''); // Clear previous errors
            await activateUser(
                tempUser.userId,
                passwords.newPassword,
                tempUser.token
            );
            window.alert('Password reset successful! Please login with your new password.');
            setIsResetOpen(false);
            setTempUser(null);
            setPassword(''); // Clear password field
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            const user = await login(username, password);
            if (user && user.status === 'RESETPASSWORD') {
                setTempUser({ ...user, originalPassword: password });
                setIsResetOpen(true);
                return;
            }
            if (user) {
                // Role-based navigation
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
                // Inactive user or invalid login handled partially by context (alert)
                // If context returns null without alert, show generic error
                setError('Invalid credentials or account inactive');
            }
        } catch (err) {
            setError('Login service failed. Please check your connection or try again later.');
            console.error('Submit Error:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-white">Login</h2>
                {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                        Sign In
                    </button>
                    <div className="mt-4 text-xs text-center text-slate-500">

                    </div>
                </form>
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

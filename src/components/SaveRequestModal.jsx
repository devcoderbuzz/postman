import { useState } from 'react';
import { X } from 'lucide-react';

export function SaveRequestModal({ isOpen, onClose, onSave, collections }) {
    const [requestName, setRequestName] = useState('');
    const [selectedCollection, setSelectedCollection] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!requestName.trim()) {
            alert('Please enter a request name');
            return;
        }
        if (!selectedCollection) {
            alert('Please select a collection');
            return;
        }
        onSave(requestName, selectedCollection);
        setRequestName('');
        setSelectedCollection('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 w-[400px] shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Save Request</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Request Name</label>
                        <input
                            type="text"
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            placeholder="e.g., Get User Profile"
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Collection</label>
                        <select
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="">Choose a collection...</option>
                            {collections.map(col => (
                                <option key={col.id} value={col.id}>{col.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-600/20"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

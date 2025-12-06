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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Save Request</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-2">Request Name</label>
                        <input
                            type="text"
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            placeholder="e.g., Get User Profile"
                            className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-2">Collection</label>
                        <select
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                        >
                            <option value="">Select a collection</option>
                            {collections.map(col => (
                                <option key={col.id} value={col.id}>{col.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

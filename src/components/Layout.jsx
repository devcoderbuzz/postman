import { Sidebar } from './Sidebar';

export function Layout({ children, activeView, setActiveView, onRefresh }) {
    return (
        <div className="flex flex-1 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} onRefresh={onRefresh} />
            <main className="flex-1 flex flex-col min-w-0">
                {children}
            </main>
        </div>
    );
}

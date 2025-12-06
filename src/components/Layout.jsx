import { Sidebar } from './Sidebar';

export function Layout({ children, activeView, setActiveView }) {
    return (
        <div className="flex flex-1 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-1 flex flex-col min-w-0">
                {children}
            </main>
        </div>
    );
}

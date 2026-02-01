import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                <header className="bg-white border-b-2 border-gray-200 py-6 px-10">
                    <h1 className="text-2xl font-bold text-gray-800">Panel Kendali Digisign</h1>
                </header>
                <div className="p-10 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}

import { Header } from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 w-full mx-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
}

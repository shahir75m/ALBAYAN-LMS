import React, { useMemo } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Book, User, HistoryRecord, Fine } from '../types';

interface AnalyticsDashboardProps {
    books: Book[];
    users: User[];
    history: HistoryRecord[];
    fines: Fine[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ books, users, history, fines }) => {

    // 1. Borrowing Trends (Last 7 Days)
    const borrowingData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const borrowed = history.filter(h => new Date(h.borrowDate).toISOString().split('T')[0] === date).length;
            const returned = history.filter(h => h.returnDate && new Date(h.returnDate).toISOString().split('T')[0] === date).length;
            return { name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }), borrowed, returned };
        });
    }, [history]);

    // 2. Category Distribution
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        books.forEach(b => {
            counts[b.category] = (counts[b.category] || 0) + b.totalCopies;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [books]);

    // 3. Top Readers
    const topReadersData = useMemo(() => {
        const readerCounts: Record<string, number> = {};
        const readerNames: Record<string, string> = {};

        history.forEach(h => {
            readerCounts[h.userId] = (readerCounts[h.userId] || 0) + 1;
            readerNames[h.userId] = h.userName;
        });

        return Object.entries(readerCounts)
            .map(([id, count]) => ({ name: readerNames[id], count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [history]);

    // 4. Inventory Stats
    const totalBooks = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const availableBooks = books.reduce((acc, b) => acc + b.availableCopies, 0);
    const issuedBooks = totalBooks - availableBooks;

    const inventoryData = [
        { name: 'Available', value: availableBooks },
        { name: 'Issued', value: issuedBooks }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-2xl">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1">Circulation Velocity</p>
                    <p className="text-2xl font-bold text-white">{(history.length / 30).toFixed(1)} <span className="text-xs text-zinc-600 font-normal">avg borrows/day</span></p>
                </div>
                <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-2xl">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1">Total Fine Revenue</p>
                    <p className="text-2xl font-bold text-emerald-500">₹{fines.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0)}</p>
                </div>
                <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-2xl">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1">Library Utilization</p>
                    <p className="text-2xl font-bold text-blue-500">{totalBooks > 0 ? ((issuedBooks / totalBooks) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>

            {/* Middle Row: Trends & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Borrowing Trends Chart */}
                <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-3xl">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Borrowing Activity (Weekly)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={borrowingData}>
                                <defs>
                                    <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="borrowed" stroke="#10b981" fillOpacity={1} fill="url(#colorBorrowed)" strokeWidth={3} />
                                <Area type="monotone" dataKey="returned" stroke="#3b82f6" fillOpacity={0} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-3xl">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Collection by Category</h3>
                    <div className="h-80 w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Readers & Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Readers Bar Chart */}
                <div className="lg:col-span-2 bg-[#0c0c0e] border border-zinc-900 p-6 rounded-3xl">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Reader Leaderboard</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topReadersData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} width={100} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#18181b' }}
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health Gauge (Using Pie as Gauge) */}
                <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Inventory Health</h3>
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="80%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#18181b" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                            <p className="text-3xl font-black text-white">{((availableBooks / totalBooks) * 100).toFixed(0)}%</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Safe to Borrow</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                        <div className="p-3 bg-zinc-900/50 rounded-xl">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">In Stock</p>
                            <p className="text-white font-bold">{availableBooks}</p>
                        </div>
                        <div className="p-3 bg-zinc-900/50 rounded-xl">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">On Loan</p>
                            <p className="text-white font-bold">{issuedBooks}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

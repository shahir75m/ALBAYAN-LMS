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
                <div className="glass-card p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Circulation Velocity</p>
                    <p className="text-2xl font-black text-gray-900">{(history.length / 30).toFixed(1)} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Daily Avg</span></p>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Fine Revenue</p>
                    <p className="text-2xl font-black text-emerald-600">₹{fines.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Library Utilization</p>
                    <p className="text-2xl font-black text-blue-600">{totalBooks > 0 ? ((issuedBooks / totalBooks) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>

            {/* Middle Row: Trends & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Borrowing Trends Chart */}
                <div className="glass-panel p-8 rounded-[2rem] shadow-xl">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10">Borrowing Activity Trend</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={borrowingData}>
                                <defs>
                                    <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="borrowed" stroke="#2563eb" fillOpacity={1} fill="url(#colorBorrowed)" strokeWidth={4} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="returned" stroke="#10b981" fillOpacity={0} strokeWidth={4} strokeDasharray="8 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="glass-panel p-8 rounded-[2rem] shadow-xl">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10">Collection Distribution</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="40%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '10px' }}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    iconSize={10}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Readers & Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Readers Bar Chart */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] shadow-xl">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10">Reader Leaderboard</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topReadersData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={120} axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health Gauge (Using Pie as Gauge) */}
                <div className="glass-panel p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10">Inventory Health</h3>
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="80%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={75}
                                    outerRadius={95}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f1f5f9" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                            <p className="text-4xl font-black text-gray-900">{totalBooks > 0 ? ((availableBooks / totalBooks) * 100).toFixed(0) : 0}%</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Operational</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-inner">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">In Stock</p>
                            <p className="text-gray-900 font-black text-lg">{availableBooks}</p>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-inner">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">On Loan</p>
                            <p className="text-gray-900 font-black text-lg">{issuedBooks}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

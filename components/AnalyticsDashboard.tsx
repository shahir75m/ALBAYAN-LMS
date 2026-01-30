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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-10 rounded-[2.5rem] border-white/60 shadow-sm relative overflow-hidden group hover:glass-card-hover">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 opacity-60">Circulation Velocity</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight">{(history.length / 30).toFixed(1)} <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest ml-2">Daily Avg</span></p>
                </div>
                <div className="glass-card p-10 rounded-[2.5rem] border-white/60 shadow-sm relative overflow-hidden group hover:glass-card-hover">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v2h-2v2h2v2h2v-2h2V9h-2V7z" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 opacity-60">Revenue Performance</p>
                    <p className="text-4xl font-black text-teal-600 tracking-tight">₹{fines.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0)}</p>
                </div>
                <div className="glass-card p-10 rounded-[2.5rem] border-white/60 shadow-sm relative overflow-hidden group hover:glass-card-hover">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 opacity-60">Asset Utilization</p>
                    <p className="text-4xl font-black text-blue-600 tracking-tight">{totalBooks > 0 ? ((issuedBooks / totalBooks) * 100).toFixed(0) : 0}% <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest ml-2">Active</span></p>
                </div>
            </div>

            {/* Middle Row: Trends & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Borrowing Trends Chart */}
                <div className="glass-panel p-10 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.04)] border-white/60">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 opacity-60 text-center">Circulation Dynamics (7D Forecast)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={borrowingData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 'black' }} />
                                <YAxis stroke="#cbd5e1" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 'black' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '24px', fontSize: '10px', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.08)' }}
                                    itemStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.1em' }}
                                    labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: '#1e293b', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="borrowed" stroke="#2563eb" fillOpacity={1} fill="url(#colorBorrowed)" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: '#2563eb' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#2563eb' }} />
                                <Area type="monotone" dataKey="returned" stroke="#10b981" fillOpacity={0} strokeWidth={4} strokeDasharray="12 6" opacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="glass-panel p-10 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.04)] border-white/60">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 opacity-60 text-center">Topic Classification Analysis</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="40%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '20px', fontSize: '10px' }}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    iconSize={12}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Readers & Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Readers Bar Chart */}
                <div className="lg:col-span-2 glass-panel p-10 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.04)] border-white/60">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 opacity-60">High Performance Readers</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topReadersData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} axisLine={false} tickLine={false} tick={{ fontWeight: 'black', fontSize: '9px' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '20px', fontSize: '10px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 12, 12, 0]} barSize={28} opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health Gauge (Using Pie as Gauge) */}
                <div className="glass-panel p-10 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.04)] border-white/60 flex flex-col items-center justify-center text-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 opacity-60">System Integrity Health</h3>
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="80%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={80}
                                    outerRadius={105}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#10b981" opacity={0.6} />
                                    <Cell fill="#f1f5f9" opacity={0.5} />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalBooks > 0 ? ((availableBooks / totalBooks) * 100).toFixed(0) : 0}%</p>
                            <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.4em] mt-2 mb-2">Operational</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-12 w-full">
                        <div className="p-6 bg-white/40 border border-white/80 rounded-3xl shadow-sm">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 opacity-60">In Stock</p>
                            <p className="text-gray-900 font-black text-xl tracking-tight">{availableBooks}</p>
                        </div>
                        <div className="p-6 bg-white/40 border border-white/80 rounded-3xl shadow-sm">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 opacity-60">On Loan</p>
                            <p className="text-gray-900 font-black text-xl tracking-tight">{issuedBooks}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

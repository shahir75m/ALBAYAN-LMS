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
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Top Row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KPIBox title="Circulation Velocity" value={(history.length / 30).toFixed(1)} unit="avg syncs/day" color="emerald" />
                <KPIBox title="Protocol Revenue" value={`₹${fines.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0)}`} color="emerald" />
                <KPIBox title="Unit Utilization" value={`${totalBooks > 0 ? ((issuedBooks / totalBooks) * 100).toFixed(1) : 0}%`} color="blue" />
            </div>

            {/* Middle Row: Trends & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Borrowing Trends Chart */}
                <div className="glass-main border-white/5 p-10 rounded-[3rem] group">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10">Sequential Activity Logs</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={borrowingData}>
                                <defs>
                                    <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="name" stroke="#3f3f46" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis stroke="#3f3f46" fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(5,5,7,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontSize: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ fontWeight: 'black', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="borrowed" stroke="#10b981" fillOpacity={1} fill="url(#colorBorrowed)" strokeWidth={3} />
                                <Area type="monotone" dataKey="returned" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="glass-main border-white/5 p-10 rounded-[3rem]">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10">Category Matrix Distribution</h3>
                    <div className="h-80 w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={105}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(5,5,7,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontSize: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Readers & Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Top Readers Bar Chart */}
                <div className="lg:col-span-2 glass-main border-white/5 p-10 rounded-[3rem]">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10">Top Tier Knowledge Nodes</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topReadersData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={120} axisLine={false} tickLine={false} className="font-black uppercase tracking-widest" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: 'rgba(5,5,7,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health Gauge */}
                <div className="glass-main border-white/5 p-10 rounded-[3rem] flex flex-col items-center">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10 text-center">System Integrity Gauge</h3>
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="85%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={75}
                                    outerRadius={95}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#10b981" className="drop-shadow-[0_0_10px_#10b981]" />
                                    <Cell fill="rgba(255,255,255,0.05)" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                            <p className="text-4xl font-black text-white tracking-tighter">{((availableBooks / totalBooks) * 100).toFixed(0)}%</p>
                            <p className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-1">Operational</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                        <div className="p-5 glass-card border-white/5 rounded-2xl text-center group hover:border-emerald-500/20 transition-all">
                            <p className="text-[8px] text-zinc-500 font-black uppercase mb-1 tracking-widest">Active Units</p>
                            <p className="text-lg font-black text-white">{availableBooks}</p>
                        </div>
                        <div className="p-5 glass-card border-white/5 rounded-2xl text-center group hover:border-blue-500/20 transition-all">
                            <p className="text-[8px] text-zinc-500 font-black uppercase mb-1 tracking-widest">Linked Nodes</p>
                            <p className="text-lg font-black text-white">{issuedBooks}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPIBox = ({ title, value, unit, color }: any) => {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]'
    };
    return (
        <div className="glass-main border-white/5 p-8 rounded-[2.5rem] group hover:bg-white/[0.03] transition-all">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">{title}</p>
            <div className="flex items-baseline gap-3">
                <p className={`text-4xl font-black tracking-tighter ${colors[color].split(' ')[0]}`}>{value}</p>
                {unit && <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">{unit}</p>}
            </div>
            <div className={`mt-6 h-1 w-full rounded-full opacity-20 ${colors[color].split(' ')[1]}`} />
        </div>
    );
};

export default AnalyticsDashboard;

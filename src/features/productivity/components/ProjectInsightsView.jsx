import React, { useMemo } from 'react';
import { 
    CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Users, ShieldCheck, Flame 
} from 'lucide-react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie 
} from 'recharts';
import { getInitials, getAvatarStyle } from '@/global/utils/user';

export const ProjectInsightsView = ({ tasks = [], project, members = [] }) => {
    const stats = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const review = tasks.filter(t => t.status === 'review').length;
        const todo = tasks.filter(t => t.status === 'todo').length;
        
        const overdue = tasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
        ).length;

        const urgent = tasks.filter(t => t.priority === 'urgent').length;
        const high = tasks.filter(t => t.priority === 'high').length;
        const medium = tasks.filter(t => t.priority === 'medium').length;
        const low = tasks.filter(t => t.priority === 'low').length;

        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
            total,
            done,
            inProgress,
            review,
            todo,
            overdue,
            urgent,
            high,
            medium,
            low,
            completionRate,
        };
    }, [tasks]);

    // Status Chart Data
    const statusData = [
        { name: 'To Do', count: stats.todo, color: '#94a3b8' },
        { name: 'In Progress', count: stats.inProgress, color: '#3b82f6' },
        { name: 'Review', count: stats.review, color: '#6366f1' },
        { name: 'Done', count: stats.done, color: '#10b981' },
    ];

    // Priority Chart Data
    const priorityData = [
        { name: 'Urgent', count: stats.urgent, color: '#ef4444' },
        { name: 'High', count: stats.high, color: '#f97316' },
        { name: 'Medium', count: stats.medium, color: '#eab308' },
        { name: 'Low', count: stats.low, color: '#22c55e' },
    ];

    // Assignee Workload
    const assigneeData = useMemo(() => {
        const counts = {};
        tasks.forEach(t => {
            const name = t.assigneeSnapshot?.name || (t.assignedTo ? 'Assigned' : 'Unassigned');
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [tasks]);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Total Issues</span>
                        <ListTodo className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {stats.total}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Across all columns & boards
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Completion Rate</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {stats.completionRate}%
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                        <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${stats.completionRate}%` }} 
                        />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>In Progress</span>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.inProgress + stats.review}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Active development & review
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Overdue / Blocked</span>
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold text-destructive">
                        {stats.overdue}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Past due date or high risk
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div className="p-5 rounded-xl border border-border bg-card shadow-2xs">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                        Issues by Status
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--card)', 
                                        borderColor: 'var(--border)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="p-5 rounded-xl border border-border bg-card shadow-2xs">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                        Issues by Priority
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--card)', 
                                        borderColor: 'var(--border)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Workload by Assignee */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                    Team Workload
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {assigneeData.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 truncate">
                                <div 
                                    style={getAvatarStyle(item.userId || item.name)}
                                    className="w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border border-border/40"
                                >
                                    {getInitials(item.name)}
                                </div>
                                <span className="text-xs font-medium truncate">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {item.count} issues
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectInsightsView;

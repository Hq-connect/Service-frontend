import React, { useMemo } from 'react';
import { 
    CheckCircle2, Clock, AlertTriangle, ListTodo 
} from 'lucide-react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { getInitials, getAvatarStyle } from '@/global/utils/user';

export const ProjectInsightsView = ({ tasks = [] }) => {
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

    // Status Chart Data using existing CSS chart tokens from index.css
    const statusData = [
        { name: 'To Do', count: stats.todo, color: 'var(--chart-2)' },
        { name: 'In Progress', count: stats.inProgress, color: 'var(--chart-3)' },
        { name: 'Review', count: stats.review, color: 'var(--chart-4)' },
        { name: 'Done', count: stats.done, color: 'var(--status-live-fg)' },
    ];

    // Priority Chart Data using existing CSS tokens from index.css
    const priorityData = [
        { name: 'Urgent', count: stats.urgent, color: 'var(--destructive)' },
        { name: 'High', count: stats.high, color: 'var(--primary-sidebar-marker)' },
        { name: 'Medium', count: stats.medium, color: 'var(--status-warn-fg)' },
        { name: 'Low', count: stats.low, color: 'var(--chart-2)' },
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background custom-scrollbar animate-fade-in">
            {/* Top Metrics Cards (Matches Settings KPI aesthetic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card shadow-(--shadow-card)">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium mb-1.5">
                        <span>Total Issues</span>
                        <ListTodo className="size-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                        {stats.total}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        Across all columns & boards
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card shadow-(--shadow-card)">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium mb-1.5">
                        <span>Completion Rate</span>
                        <CheckCircle2 className="size-4 text-status-live-foreground" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-status-live-foreground font-mono tabular-nums">
                        {stats.completionRate}%
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                        <div 
                            className="bg-status-live-foreground h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${stats.completionRate}%` }} 
                        />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card shadow-(--shadow-card)">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium mb-1.5">
                        <span>In Execution</span>
                        <Clock className="size-4 text-status-warn-foreground" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                        {stats.inProgress + stats.review}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        Active development & review
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card shadow-(--shadow-card)">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium mb-1.5">
                        <span>Overdue / At Risk</span>
                        <AlertTriangle className="size-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-destructive font-mono tabular-nums">
                        {stats.overdue}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        Past due date or blocked
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <section className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                Issues by Workflow Status
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Distribution across To Do, In Progress, Review, and Done
                            </p>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {stats.total} total
                        </Badge>
                    </div>
                    <div className="p-5 h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--card)', 
                                        borderColor: 'var(--border)',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        boxShadow: 'var(--shadow-popover)'
                                    }} 
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Priority Breakdown */}
                <section className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                Issues by Priority Level
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Severity breakdown across Urgent, High, Medium, and Low
                            </p>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {stats.urgent + stats.high} high/urgent
                        </Badge>
                    </div>
                    <div className="p-5 h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--card)', 
                                        borderColor: 'var(--border)',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        boxShadow: 'var(--shadow-popover)'
                                    }} 
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Workload by Assignee */}
            <section className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                        Team Workload Distribution
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Assigned issue count per workspace contributor
                    </p>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {assigneeData.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 truncate">
                                <div 
                                    style={getAvatarStyle(item.userId || item.name)}
                                    className="size-7 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border border-border/40"
                                >
                                    {getInitials(item.name)}
                                </div>
                                <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
                            </div>
                            <Badge variant="secondary" className="font-mono tabular-nums text-[10px] shrink-0">
                                {item.count} {item.count === 1 ? 'issue' : 'issues'}
                            </Badge>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ProjectInsightsView;

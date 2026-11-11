import React from 'react';
import { useTaskActivities } from '../queries/taskDetails.queries';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, FileText, Tag, MessageSquare, Paperclip, Move, UserPlus, Activity } from 'lucide-react';

const TaskActivityFeed = ({ projectId, taskId }) => {
    const { data: activitiesResponse, isLoading } = useTaskActivities(projectId, taskId);
    const activities = activitiesResponse?.data?.activities || [];

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="flex gap-3"><div className="w-8 h-8 bg-muted rounded-full" /><div className="flex-1 h-8 bg-muted rounded" /></div>
                <div className="flex gap-3"><div className="w-8 h-8 bg-muted rounded-full" /><div className="flex-1 h-8 bg-muted rounded" /></div>
            </div>
        );
    }

    if (activities.length === 0) {
        return <p className="text-sm text-muted-foreground italic py-4">No recent activity.</p>;
    }

    const getActivityIcon = (type) => {
        switch (type) {
            case 'TASK_CREATED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'TASK_UPDATED': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'STATUS_CHANGED': return <Move className="w-4 h-4 text-purple-500" />;
            case 'ASSIGNEE_CHANGED': return <UserPlus className="w-4 h-4 text-orange-500" />;
            case 'COMMENT_ADDED': return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
            case 'ATTACHMENT_ADDED': return <Paperclip className="w-4 h-4 text-indigo-500" />;
            case 'LABEL_ADDED': return <Tag className="w-4 h-4 text-pink-500" />;
            default: return <Activity className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[1.8rem] before:w-px before:bg-border">
            {activities.map((activity, index) => (
                <div key={activity._id || index} className="relative flex gap-4">
                    
                    {/* Icon Bubble */}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {getActivityIcon(activity.activityType)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-1.5 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                            <span className="font-semibold">{activity.userSnapshot?.name || 'System'}</span>
                            {' '}
                            <span className="text-muted-foreground">{activity.description}</span>
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TaskActivityFeed;

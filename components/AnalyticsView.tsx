
import React, { useMemo } from 'react';
import { UserStats, Workspace, SavedLecture } from '../types';
import { BarChart3, Clock, Flame, Zap, Calendar, TrendingUp } from 'lucide-react';

interface AnalyticsViewProps {
  stats: UserStats;
  lectures: SavedLecture[];
  workspaces: Workspace[];
  t: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, lectures, workspaces, t }) => {
  // Calculate workspace distribution
  const workspaceData = workspaces.map(ws => {
      const count = lectures.filter(l => l.workspaceId === ws.id).length;
      return { name: ws.name, count, color: ws.color || '#ccc' };
  }).filter(d => d.count > 0);

  const maxCount = Math.max(...workspaceData.map(d => d.count), 1);

  // Activity Heatmap Logic
  const heatmapData = useMemo(() => {
    const today = new Date();
    const data: { date: string; count: number; intensity: number }[] = [];
    // Generate last 126 days (18 weeks) roughly
    for (let i = 125; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateString = d.toDateString();
        
        // Count events on this day
        const count = stats.activityLog ? stats.activityLog.filter(ts => new Date(ts).toDateString() === dateString).length : 0;
        
        // Calculate intensity (0-4)
        let intensity = 0;
        if (count > 0) intensity = 1;
        if (count > 2) intensity = 2;
        if (count > 5) intensity = 3;
        if (count > 10) intensity = 4;

        data.push({ date: dateString, count, intensity });
    }
    return data;
  }, [stats.activityLog]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold text-text flex items-center gap-3">
           <TrendingUp className="w-8 h-8 text-primary" /> {t?.analytics || "Analytics"}
        </h2>
        <p className="text-gray-500 mt-2">Track your study progress and habits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <AnalyticCard 
             icon={<Clock className="w-6 h-6 text-blue-500" />}
             value={stats.studyHours.toFixed(1)}
             unit="Hours"
             label={t?.studyHours}
             bg="bg-blue-500/10"
             border="border-blue-500/20"
          />
          <AnalyticCard 
             icon={<Flame className="w-6 h-6 text-orange-500" />}
             value={stats.streakDays.toString()}
             unit="Days"
             label={t?.streak}
             bg="bg-orange-500/10"
             border="border-orange-500/20"
          />
          <AnalyticCard 
             icon={<BarChart3 className="w-6 h-6 text-purple-500" />}
             value={stats.completedLectures.toString()}
             unit="Lectures"
             label="Processed"
             bg="bg-purple-500/10"
             border="border-purple-500/20"
          />
          <AnalyticCard 
             icon={<Zap className="w-6 h-6 text-yellow-500" />}
             value={stats.activeFlashcards.toString()}
             unit="Cards"
             label={t?.activeFlashcards}
             bg="bg-yellow-500/10"
             border="border-yellow-500/20"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Workspace Distribution */}
         <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
             <h3 className="font-bold text-xl mb-6 text-text">Lectures per Workspace</h3>
             {workspaceData.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 italic">No data available</div>
             ) : (
                 <div className="space-y-6">
                     {workspaceData.map((ws) => (
                         <div key={ws.name}>
                             <div className="flex justify-between text-sm mb-2 font-medium">
                                 <span className="text-text">{ws.name}</span>
                                 <span className="text-gray-500">{ws.count}</span>
                             </div>
                             <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(ws.count / maxCount) * 100}%`, backgroundColor: ws.color }}
                                 ></div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
         </div>

         {/* Functional Contribution Graph */}
         <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
             <h3 className="font-bold text-xl mb-6 text-text flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-gray-400" /> Activity Log
             </h3>
             <div className="flex-1 flex flex-col justify-center items-center">
                 <div className="flex flex-wrap gap-1.5 max-w-sm justify-center">
                     {heatmapData.map((day, i) => {
                         let colorClass = 'bg-gray-100 dark:bg-gray-800';
                         if (day.intensity === 1) colorClass = 'bg-primary/30';
                         if (day.intensity === 2) colorClass = 'bg-primary/50';
                         if (day.intensity === 3) colorClass = 'bg-primary/70';
                         if (day.intensity === 4) colorClass = 'bg-primary';
                         
                         return (
                            <div 
                                key={i} 
                                className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 ${colorClass}`}
                                title={`${day.date}: ${day.count} activities`}
                            ></div>
                         )
                     })}
                 </div>
                 <div className="flex items-center gap-2 mt-6 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
                    <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
                    <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                    <div className="w-3 h-3 rounded-sm bg-primary"></div>
                    <span>More</span>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

const AnalyticCard = ({ icon, value, unit, label, bg, border }: any) => (
    <div className={`p-6 rounded-2xl border bg-surface ${border} flex flex-col items-center text-center`}>
        <div className="mb-3 p-3 bg-background dark:bg-surface rounded-full backdrop-blur-sm shadow-sm">{icon}</div>
        <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text font-heading">{value}</span>
            <span className="text-xs font-medium opacity-70 text-text">{unit}</span>
        </div>
        <span className="text-sm font-medium opacity-60 mt-1 text-text">{label}</span>
    </div>
);

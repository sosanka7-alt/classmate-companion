import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface AttendanceRecord {
  id: string;
  subject_id: string;
  date: string;
  status: 'present' | 'absent' | 'canceled';
}

interface AttendanceStatsProps {
  records: AttendanceRecord[];
  subjects: Subject[];
}

export function AttendanceStats({ records, subjects }: AttendanceStatsProps) {
  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const canceled = records.filter(r => r.status === 'canceled').length;
    const totalClasses = present + absent; // Canceled doesn't count
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
    
    return { present, absent, canceled, totalClasses, percentage };
  }, [records]);

  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const subjectRecords = records.filter(r => r.subject_id === subject.id);
      const present = subjectRecords.filter(r => r.status === 'present').length;
      const absent = subjectRecords.filter(r => r.status === 'absent').length;
      const canceled = subjectRecords.filter(r => r.status === 'canceled').length;
      const totalClasses = present + absent;
      const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
      
      return {
        ...subject,
        present,
        absent,
        canceled,
        totalClasses,
        percentage,
      };
    });
  }, [records, subjects]);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '0ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-display ${getPercentageColor(stats.percentage)}`}>
              {stats.percentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalClasses} total classes
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-success">
              {stats.present}
            </div>
            <p className="text-xs text-muted-foreground mt-1">classes attended</p>
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-destructive">
              {stats.absent}
            </div>
            <p className="text-xs text-muted-foreground mt-1">classes missed</p>
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              Canceled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-muted-foreground">
              {stats.canceled}
            </div>
            <p className="text-xs text-muted-foreground mt-1">classes canceled</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Stats */}
      {subjects.length > 0 && (
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject-wise Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectStats.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="font-medium text-sm">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {subject.present}/{subject.totalClasses} classes
                      </span>
                      <span className={cn("font-bold", getPercentageColor(subject.percentage))}>
                        {subject.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={cn("h-full transition-all", getProgressColor(subject.percentage))}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="text-success">✓ {subject.present} present</span>
                    <span className="text-destructive">✗ {subject.absent} absent</span>
                    {subject.canceled > 0 && (
                      <span>⊘ {subject.canceled} canceled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

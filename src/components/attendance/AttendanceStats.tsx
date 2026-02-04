import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  subject_id: string;
  date: string;
  status: 'present' | 'absent' | 'canceled';
}

interface AttendanceStatsProps {
  records: AttendanceRecord[];
}

export function AttendanceStats({ records }: AttendanceStatsProps) {
  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const canceled = records.filter(r => r.status === 'canceled').length;
    const totalClasses = present + absent; // Canceled doesn't count
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
    
    return { present, absent, canceled, totalClasses, percentage };
  }, [records]);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
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
  );
}

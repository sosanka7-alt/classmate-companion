import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

interface Subject {
  id: string;
  name: string;
  color: string;
  day_of_week: number;
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
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const canceled = records.filter(r => r.status === 'canceled').length;
    const totalClasses = present + absent;
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
    
    return { present, absent, canceled, totalClasses, percentage };
  }, [records]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const subjectRecords = records.filter(r => r.subject_id === subject.id);
      const present = subjectRecords.filter(r => r.status === 'present').length;
      const absent = subjectRecords.filter(r => r.status === 'absent').length;
      const canceled = subjectRecords.filter(r => r.status === 'canceled').length;
      const totalClasses = present + absent;
      const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

      // Get records for the selected month
      const monthRecords = subjectRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === selectedMonth.getMonth() && 
               recordDate.getFullYear() === selectedMonth.getFullYear();
      });

      // Create a map of date -> status for quick lookup
      const recordMap = new Map(monthRecords.map(r => [r.date, r.status]));

      return {
        ...subject,
        present,
        absent,
        canceled,
        totalClasses,
        percentage,
        recordMap,
      };
    });
  }, [records, subjects, selectedMonth]);

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

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

      {/* Subject-wise Monthly Stats */}
      {subjects.length > 0 && (
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Subject-wise Attendance
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(selectedMonth, 'MMMM yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {subjectStats.map((subject) => (
                <div key={subject.id} className="space-y-3 p-4 rounded-lg border bg-card/50">
                  {/* Subject Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="font-medium">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {subject.present}/{subject.totalClasses}
                      </span>
                      <span className={cn("font-bold", getPercentageColor(subject.percentage))}>
                        {subject.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={cn("h-full transition-all", getProgressColor(subject.percentage))}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>

                  {/* Monthly Calendar Grid */}
                  <div className="mt-3">
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {WEEKDAYS.map((day, i) => (
                        <div key={i} className="text-center text-xs text-muted-foreground font-medium">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: getDay(monthDays[0]) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      {/* Day cells */}
                      {monthDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const status = subject.recordMap.get(dateStr);
                        const isSubjectDay = getDay(day) === subject.day_of_week;
                        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                        return (
                          <div
                            key={dateStr}
                            className={cn(
                              "aspect-square rounded-md flex items-center justify-center text-xs relative",
                              isSubjectDay && !status && "bg-muted/50 border border-dashed border-muted-foreground/30",
                              status === 'present' && "bg-success/20 text-success border border-success/30",
                              status === 'absent' && "bg-destructive/20 text-destructive border border-destructive/30",
                              status === 'canceled' && "bg-muted text-muted-foreground border border-muted-foreground/30",
                              isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            )}
                            title={status ? `${format(day, 'MMM d')}: ${status}` : isSubjectDay ? `${format(day, 'MMM d')}: Scheduled` : ''}
                          >
                            <span className={cn(
                              "text-xs",
                              !isSubjectDay && !status && "text-muted-foreground/50"
                            )}>
                              {format(day, 'd')}
                            </span>
                            {status === 'present' && (
                              <CheckCircle2 className="absolute bottom-0.5 right-0.5 w-2 h-2" />
                            )}
                            {status === 'absent' && (
                              <XCircle className="absolute bottom-0.5 right-0.5 w-2 h-2" />
                            )}
                            {status === 'canceled' && (
                              <AlertCircle className="absolute bottom-0.5 right-0.5 w-2 h-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
                      Present
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" />
                      Absent
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-muted border border-muted-foreground/30" />
                      Canceled
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-muted/50 border border-dashed border-muted-foreground/30" />
                      Scheduled
                    </span>
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

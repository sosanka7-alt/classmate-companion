import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');

  // Group subjects by name so "Math" on Mon + "Math" on Wed are treated as one
  const uniqueSubjectNames = useMemo(() => {
    const nameMap = new Map<string, { name: string; color: string; ids: string[] }>();
    subjects.forEach(s => {
      const existing = nameMap.get(s.name);
      if (existing) {
        existing.ids.push(s.id);
      } else {
        nameMap.set(s.name, { name: s.name, color: s.color, ids: [s.id] });
      }
    });
    return Array.from(nameMap.values());
  }, [subjects]);

  const overallStats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const canceled = records.filter(r => r.status === 'canceled').length;
    const totalClasses = present + absent;
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
    return { present, absent, canceled, totalClasses, percentage };
  }, [records]);

  const selectedSubjectStats = useMemo(() => {
    if (!selectedSubjectName) return null;
    const group = uniqueSubjectNames.find(g => g.name === selectedSubjectName);
    if (!group) return null;

    // Aggregate records across all subject IDs with this name
    const subjectRecords = records.filter(r => group.ids.includes(r.subject_id));
    const present = subjectRecords.filter(r => r.status === 'present').length;
    const absent = subjectRecords.filter(r => r.status === 'absent').length;
    const canceled = subjectRecords.filter(r => r.status === 'canceled').length;
    const totalClasses = present + absent;
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    return { name: group.name, color: group.color, present, absent, canceled, totalClasses, percentage };
  }, [records, uniqueSubjectNames, selectedSubjectName]);

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
      {/* Overall Stats - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '0ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-display ${getPercentageColor(overallStats.percentage)}`}>
              {overallStats.percentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.totalClasses} total classes
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
              {overallStats.present}
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
              {overallStats.absent}
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
              {overallStats.canceled}
            </div>
            <p className="text-xs text-muted-foreground mt-1">classes canceled</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Subject Attendance - Dropdown */}
      {subjects.length > 0 && (
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Subject Attendance
              </CardTitle>
              <Select value={selectedSubjectName} onValueChange={setSelectedSubjectName}>
                <SelectTrigger className="w-full sm:w-[220px] bg-background">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {uniqueSubjectNames.map((group) => (
                    <SelectItem key={group.name} value={group.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSubjectName ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a subject to view its attendance</p>
              </div>
            ) : selectedSubjectStats ? (
              <div className="space-y-5">
                {/* Percentage + Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                    <span className={cn("text-2xl font-bold font-display", getPercentageColor(selectedSubjectStats.percentage))}>
                      {selectedSubjectStats.percentage}%
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full transition-all duration-500", getProgressColor(selectedSubjectStats.percentage))}
                      style={{ width: `${selectedSubjectStats.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                    <div className="text-xl font-bold font-display text-success">{selectedSubjectStats.present}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
                    <div className="text-xl font-bold font-display text-destructive">{selectedSubjectStats.absent}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted border border-border">
                    <AlertCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <div className="text-xl font-bold font-display text-muted-foreground">{selectedSubjectStats.canceled}</div>
                    <div className="text-xs text-muted-foreground">Canceled</div>
                  </div>
                </div>

                {/* Summary text */}
                <p className="text-sm text-muted-foreground text-center">
                  Attended <span className="font-medium text-foreground">{selectedSubjectStats.present}</span> out of <span className="font-medium text-foreground">{selectedSubjectStats.totalClasses}</span> classes
                  {selectedSubjectStats.percentage < 75 && (
                    <span className="block mt-1 text-destructive font-medium">
                      ⚠️ Below 75% minimum attendance requirement
                    </span>
                  )}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

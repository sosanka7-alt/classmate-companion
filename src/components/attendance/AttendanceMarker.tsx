import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarDays, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

interface AttendanceRecord {
  id: string;
  subject_id: string;
  date: string;
  status: 'present' | 'absent' | 'canceled';
}

interface AttendanceMarkerProps {
  subjects: Subject[];
  records: AttendanceRecord[];
  onRecordsChange: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AttendanceMarker({ subjects, records, onRecordsChange }: AttendanceMarkerProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<string | null>(null);

  const dayOfWeek = selectedDate.getDay();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const todaysSubjects = subjects.filter(s => s.day_of_week === dayOfWeek);

  const getRecordForSubject = (subjectId: string) => {
    return records.find(r => r.subject_id === subjectId && r.date === dateStr);
  };

  const markAttendance = async (subjectId: string, status: 'present' | 'absent' | 'canceled') => {
    if (!user) return;
    
    setLoading(subjectId);
    const existingRecord = getRecordForSubject(subjectId);

    if (existingRecord) {
      if (existingRecord.status === status) {
        // Remove record if clicking same status
        const { error } = await supabase
          .from('attendance_records')
          .delete()
          .eq('id', existingRecord.id);
        
        if (error) {
          toast.error('Failed to update attendance');
        } else {
          onRecordsChange();
        }
      } else {
        // Update to new status
        const { error } = await supabase
          .from('attendance_records')
          .update({ status })
          .eq('id', existingRecord.id);
        
        if (error) {
          toast.error('Failed to update attendance');
        } else {
          toast.success('Attendance updated');
          onRecordsChange();
        }
      }
    } else {
      // Create new record
      const { error } = await supabase.from('attendance_records').insert({
        user_id: user.id,
        subject_id: subjectId,
        date: dateStr,
        status,
      });
      
      if (error) {
        toast.error('Failed to mark attendance');
      } else {
        toast.success('Attendance marked');
        onRecordsChange();
      }
    }
    
    setLoading(null);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Mark Attendance
        </CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarDays className="w-4 h-4 mr-2" />
              {format(selectedDate, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          {DAYS[dayOfWeek]}, {format(selectedDate, 'MMMM d, yyyy')}
        </div>
        
        {todaysSubjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No classes scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysSubjects.map((subject) => {
              const record = getRecordForSubject(subject.id);
              const isLoading = loading === subject.id;
              
              return (
                <div
                  key={subject.id}
                  className="p-4 rounded-lg border bg-card/50 animate-slide-up"
                  style={{ borderLeftColor: subject.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {subject.start_time.slice(0, 5)} - {subject.end_time.slice(0, 5)}
                      </p>
                    </div>
                    {record && (
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        record.status === 'present' && "bg-success/10 text-success",
                        record.status === 'absent' && "bg-destructive/10 text-destructive",
                        record.status === 'canceled' && "bg-muted text-muted-foreground"
                      )}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={record?.status === 'present' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        record?.status === 'present' && "gradient-success border-0"
                      )}
                      onClick={() => markAttendance(subject.id, 'present')}
                      disabled={isLoading}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={record?.status === 'absent' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        record?.status === 'absent' && "bg-destructive text-destructive-foreground border-0"
                      )}
                      onClick={() => markAttendance(subject.id, 'absent')}
                      disabled={isLoading}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant={record?.status === 'canceled' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        record?.status === 'canceled' && "bg-muted text-muted-foreground border-0"
                      )}
                      onClick={() => markAttendance(subject.id, 'canceled')}
                      disabled={isLoading}
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Canceled
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { TimetableManager } from '@/components/attendance/TimetableManager';
import { AttendanceMarker } from '@/components/attendance/AttendanceMarker';
import { AssignmentReminder } from '@/components/attendance/AssignmentReminder';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut } from 'lucide-react';

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

interface Assignment {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    const [subjectsRes, recordsRes, assignmentsRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id),
      supabase.from('attendance_records').select('*').eq('user_id', user.id),
      supabase.from('assignments' as any).select('*').eq('user_id', user.id),
    ]);

    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (recordsRes.data) {
      setRecords(recordsRes.data.map(r => ({
        ...r,
        status: r.status as 'present' | 'absent' | 'canceled'
      })));
    }
    if (assignmentsRes.data) {
      setAssignments(assignmentsRes.data as unknown as Assignment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold font-display text-base sm:text-lg">AttendEase</h1>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="shrink-0">
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Overall + Individual Subject Attendance */}
        <AttendanceStats records={records} subjects={subjects} />

        {/* Timetable, Attendance Marker, Assignments */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TimetableManager subjects={subjects} onSubjectsChange={fetchData} />
            <AssignmentReminder
              subjects={subjects}
              assignments={assignments}
              onAssignmentsChange={fetchData}
            />
          </div>
          <AttendanceMarker
            subjects={subjects}
            records={records}
            onRecordsChange={fetchData}
          />
        </div>
      </main>
    </div>
  );
}

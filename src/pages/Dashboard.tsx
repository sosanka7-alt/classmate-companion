import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { TimetableManager } from '@/components/attendance/TimetableManager';
import { AttendanceMarker } from '@/components/attendance/AttendanceMarker';
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

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    const [subjectsRes, recordsRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id),
      supabase.from('attendance_records').select('*').eq('user_id', user.id),
    ]);

    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (recordsRes.data) {
      setRecords(recordsRes.data.map(r => ({
        ...r,
        status: r.status as 'present' | 'absent' | 'canceled'
      })));
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold font-display text-lg">AttendEase</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        <AttendanceStats records={records} />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <TimetableManager subjects={subjects} onSubjectsChange={fetchData} />
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

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Plus, Trash2, Calendar, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Assignment {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  reminder_date: string | null;
}

interface AssignmentReminderProps {
  subjects: Subject[];
  assignments: Assignment[];
  onAssignmentsChange: () => void;
}

export function AssignmentReminder({ subjects, assignments, onAssignmentsChange }: AssignmentReminderProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('none');
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('assignments' as any).insert({
      user_id: user.id,
      title,
      description: description || null,
      subject_id: subjectId === 'none' ? null : subjectId,
      due_date: dueDate,
      reminder_date: reminderDate || null,
    } as any);

    if (error) {
      toast.error('Failed to add assignment');
    } else {
      toast.success('Assignment added!');
      setOpen(false);
      setTitle('');
      setDescription('');
      setSubjectId('none');
      setDueDate('');
      setReminderDate('');
      onAssignmentsChange();
    }
    setLoading(false);
  };

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('assignments' as any)
      .update({ is_completed: !isCompleted } as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update assignment');
    } else {
      onAssignmentsChange();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments' as any).delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete assignment');
    } else {
      toast.success('Assignment deleted');
      onAssignmentsChange();
    }
  };

  const getDueDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    if (isToday(date)) return { label: 'Due Today', urgent: true };
    if (isTomorrow(date)) return { label: 'Due Tomorrow', urgent: true };
    if (isPast(date)) return { label: 'Overdue', urgent: true };
    const days = differenceInDays(date, new Date());
    if (days <= 3) return { label: `${days} days left`, urgent: true };
    return { label: format(date, 'MMM d, yyyy'), urgent: false };
  };

  const getSubjectForAssignment = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId);
  };

  // Sort: incomplete first (overdue → soonest), then completed
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const pendingCount = assignments.filter(a => !a.is_completed).length;
  const overdueCount = assignments.filter(a => !a.is_completed && isPast(new Date(a.due_date + 'T23:59:59'))).length;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="font-display flex items-center gap-2 text-base sm:text-lg">
            <ClipboardList className="w-5 h-5" />
            Assignments
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} pending
            {overdueCount > 0 && (
              <span className="text-destructive font-medium"> · {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignTitle">Title</Label>
                <Input
                  id="assignTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 Problems"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignDesc">Description (optional)</Label>
                <Textarea
                  id="assignDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="No subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminderDate" className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" />
                  Remind Me On (optional)
                </Label>
                <Input
                  id="reminderDate"
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  max={dueDate || undefined}
                />
                <p className="text-xs text-muted-foreground">You'll get a notification on this date</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add Assignment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No assignments yet</p>
            <p className="text-sm">Add your first assignment to track deadlines</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {sortedAssignments.map((assignment) => {
              const subject = getSubjectForAssignment(assignment.subject_id);
              const dueDateInfo = getDueDateLabel(assignment.due_date);

              return (
                <div
                  key={assignment.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    assignment.is_completed
                      ? "bg-muted/30 border-border/50 opacity-60"
                      : "bg-card/50 border-border"
                  )}
                  style={subject && !assignment.is_completed ? { borderLeftColor: subject.color, borderLeftWidth: '4px' } : {}}
                >
                  <Checkbox
                    checked={assignment.is_completed}
                    onCheckedChange={() => handleToggleComplete(assignment.id, assignment.is_completed)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      assignment.is_completed && "line-through text-muted-foreground"
                    )}>
                      {assignment.title}
                    </p>
                    {assignment.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {subject && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {subject.name}
                        </span>
                      )}
                      {assignment.reminder_date && !assignment.is_completed && (
                        <span className="text-xs flex items-center gap-1 text-primary">
                          <Bell className="w-3 h-3" />
                          {format(new Date(assignment.reminder_date + 'T00:00:00'), 'MMM d')}
                        </span>
                      )}
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        !assignment.is_completed && dueDateInfo.urgent && "text-destructive font-medium",
                        assignment.is_completed && "text-muted-foreground"
                      )}>
                        {!assignment.is_completed && dueDateInfo.urgent && (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <Calendar className="w-3 h-3" />
                        {dueDateInfo.label}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

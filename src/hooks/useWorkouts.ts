import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  WorkoutSlot,
  WorkoutInterest,
  WorkoutSubmission,
  Profile,
  WorkoutLeadRequest,
  WorkoutLeadAssignment,
  SweatpalsScheduleEvent,
  UpcomingLeadableWorkout,
  Json,
} from '@/types/database.types';
import { supabaseRestFetch } from '@/lib/supabaseHttp';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Extended types
type WorkoutSlotWithLeader = WorkoutSlot & {
  leader: Profile | null;
};

type WorkoutInterestWithProfile = WorkoutInterest & {
  profile: Profile;
};

export type LeadableWorkout = UpcomingLeadableWorkout;

export type WorkoutLeadRequestWithContext = WorkoutLeadRequest & {
  profile: Profile | null;
  schedule_event: SweatpalsScheduleEvent | null;
};

export type WorkoutLeadAssignmentWithContext = WorkoutLeadAssignment & {
  leader: Profile | null;
  schedule_event: SweatpalsScheduleEvent | null;
};

export type WorkoutSubmissionWithContext = WorkoutSubmission & {
  assignment: WorkoutLeadAssignmentWithContext | null;
  schedule_event: SweatpalsScheduleEvent | null;
  leader_profile: Profile | null;
};

export type AssignedWorkoutWithSubmission = WorkoutLeadAssignmentWithContext & {
  submission: WorkoutSubmission | null;
};

export interface WorkoutHistoryItem {
  id: string;
  source: 'approved_submission' | 'legacy_slot';
  starts_at: string;
  title: string;
  location: string | null;
  leader_name: string | null;
  summary: string | null;
  workout_plan: string | null;
  message: string | null;
  leadership_note: string | null;
}

export interface SaveWorkoutGuideInput {
  slug: string;
  title: string;
  roleScope?: 'leader' | 'host' | 'admin' | 'shared';
  versionLabel?: string | null;
  isActive?: boolean;
  contentJson: Json;
}

export interface WorkoutGuideRecord {
  id: string;
  slug: string;
  title: string;
  role_scope: string;
  version_label: string | null;
  is_active: boolean;
  content_json: Json;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AssignmentNotificationPayload {
  schedule_event_id: string;
  leader_id: string;
  source: 'approve_request' | 'direct_assign';
}

async function notifyWorkoutAssignment(payload: AssignmentNotificationPayload) {
  const { error } = await supabase.functions.invoke('workout-assignment-notify', {
    body: payload,
  });

  if (error) throw error;
}

// Fetch upcoming workout (next one)
export function useUpcomingWorkout() {
  return useQuery({
    queryKey: ['workouts', 'upcoming'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const data = await supabaseRestFetch<WorkoutSlot[]>(
        `workout_slots?select=*&workout_date=gte.${today}&order=workout_date.asc&limit=1`
      );
      
      if (!data || data.length === 0) return null;
      
      // Fetch leader separately if exists (using public view)
      const slot = data[0];
      let leader = null;
      if (slot.leader_id) {
        const leaders = await supabaseRestFetch<Profile[]>(
          `public_profiles?id=eq.${slot.leader_id}`
        );
        leader = leaders[0] || null;
      }
      
      return { ...slot, leader } as WorkoutSlotWithLeader;
    },
  });
}

// Fetch all workout slots (for admin)
export function useWorkoutSlots() {
  return useQuery({
    queryKey: ['workouts', 'slots'],
    queryFn: async () => {
      const slots = await supabaseRestFetch<WorkoutSlot[]>(
        'workout_slots?select=*&order=workout_date.asc'
      );
      
      // Fetch all public profiles to join (excludes sensitive data)
      const profiles = await supabaseRestFetch<Profile[]>('public_profiles?select=*');
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      
      return slots.map(slot => ({
        ...slot,
        leader: slot.leader_id ? profileMap.get(slot.leader_id) || null : null,
      })) as WorkoutSlotWithLeader[];
    },
  });
}

// Fetch workout interest list (for admin)
export function useWorkoutInterest() {
  return useQuery({
    queryKey: ['workouts', 'interest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_interest')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as WorkoutInterestWithProfile[];
    },
  });
}

// Check if current user has expressed interest
export function useMyWorkoutInterest() {
  return useQuery({
    queryKey: ['workouts', 'my-interest'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('workout_interest')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkoutInterest | null;
    },
  });
}

// Express interest in leading a workout
export function useExpressInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      preferredDates,
      notes,
    }: {
      userId: string;
      preferredDates?: string;
      notes?: string;
    }) => {
      if (!userId) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('workout_interest')
        .insert({
          user_id: userId,
          preferred_dates: preferredDates,
          notes,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Cancel interest
export function useCancelInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interestId: string) => {
      const { error } = await supabase
        .from('workout_interest')
        .delete()
        .eq('id', interestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Create a workout slot
export function useCreateWorkoutSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutDate,
      leaderId,
      theme,
      description,
    }: {
      workoutDate: string;
      leaderId?: string;
      theme?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('workout_slots')
        .insert({
          workout_date: workoutDate,
          leader_id: leaderId,
          theme,
          description,
          status: leaderId ? 'assigned' : 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Assign a leader to a workout slot
export function useAssignLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      leaderId,
    }: {
      slotId: string;
      leaderId: string;
    }) => {
      const { error } = await supabase
        .from('workout_slots')
        .update({
          leader_id: leaderId,
          status: 'assigned',
        })
        .eq('id', slotId);

      if (error) throw error;

      // Update the interest status
      await supabase
        .from('workout_interest')
        .update({ status: 'assigned' })
        .eq('user_id', leaderId)
        .eq('status', 'pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUnassignLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { data: slot, error: fetchError } = await supabase
        .from('workout_slots')
        .select('leader_id')
        .eq('id', slotId)
        .single();

      if (fetchError) throw fetchError;
      const leaderId = slot?.leader_id;

      const { error: updateError } = await supabase
        .from('workout_slots')
        .update({ leader_id: null, status: 'open' })
        .eq('id', slotId);

      if (updateError) throw updateError;

      if (leaderId) {
        await supabase
          .from('workout_interest')
          .update({ status: 'pending' })
          .eq('user_id', leaderId)
          .eq('status', 'assigned');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Update workout slot
export function useUpdateWorkoutSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      theme,
      description,
      status,
    }: {
      slotId: string;
      theme?: string;
      description?: string;
      status?: string;
    }) => {
      const { error } = await supabase
        .from('workout_slots')
        .update({
          theme,
          description,
          status,
        })
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Delete workout slot
export function useDeleteWorkoutSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('workout_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useLeadableWorkouts(limit = 24) {
  return useQuery({
    queryKey: ['workouts', 'leadable', limit],
    queryFn: async () => {
      const { data, error } = await db
        .from('upcoming_leadable_workouts')
        .select('*')
        .order('starts_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as LeadableWorkout[];
    },
  });
}

export function useWorkoutHistory(limit = 24) {
  return useQuery({
    queryKey: ['workouts', 'history', limit],
    queryFn: async () => {
      const todayDate = new Date().toISOString().split('T')[0];
      const startOfTodayIso = new Date(new Date().toDateString()).toISOString();

      const { data: legacySlots, error: legacyError } = await db
        .from('workout_slots')
        .select('*')
        .lt('workout_date', todayDate)
        .order('workout_date', { ascending: false })
        .limit(limit * 3);

      if (legacyError) throw legacyError;

      const legacyLeaderIds = [
        ...new Set(
          (legacySlots || [])
            .map((slot) => slot.leader_id)
            .filter(Boolean),
        ),
      ] as string[];

      const legacyLeaders = legacyLeaderIds.length > 0
        ? await supabaseRestFetch<Profile[]>(`public_profiles?select=*&id=in.(${legacyLeaderIds.join(',')})`)
        : [];
      const legacyLeaderMap = new Map(legacyLeaders.map((leader) => [leader.id, leader]));

      let approvedSubmissions: WorkoutSubmission[] = [];
      const { data: submissionsData, error: submissionsError } = await db
        .from('workout_submissions')
        .select('*')
        .eq('status', 'approved')
        .not('assignment_id', 'is', null)
        .order('approved_at', { ascending: false });

      if (submissionsError) {
        const message = submissionsError.message?.toLowerCase() || '';
        const isPermissionError = message.includes('permission') || message.includes('row-level security');
        if (!isPermissionError) {
          throw submissionsError;
        }
      } else {
        approvedSubmissions = (submissionsData || []) as WorkoutSubmission[];
      }

      const history: WorkoutHistoryItem[] = [];
      const coveredDates = new Set<string>();

      if (approvedSubmissions.length > 0) {
        const assignmentIds = [
          ...new Set(
            approvedSubmissions
              .map((submission) => submission.assignment_id)
              .filter(Boolean),
          ),
        ] as string[];

        const { data: assignments, error: assignmentError } = await (db
          .from('workout_lead_assignments' as any)
          .select('*')
          .in('id', assignmentIds) as any) as { data: WorkoutLeadAssignment[] | null; error: Error | null };

        if (assignmentError) throw assignmentError;

        const scheduleEventIds = [...new Set((assignments || []).map((assignment) => assignment.schedule_event_id))];
        const scheduleEvents = scheduleEventIds.length > 0
          ? await (db
              .from('sweatpals_schedule_events' as any)
              .select('*')
              .in('id', scheduleEventIds)
              .lt('starts_at', startOfTodayIso) as any)
              .then((result: { data: SweatpalsScheduleEvent[] | null; error: Error | null }) => {
                if (result.error) throw result.error;
                return result.data || [];
              })
          : [];

        const leaderIds = [...new Set((assignments || []).map((assignment) => assignment.leader_id))];
        const leaders = leaderIds.length > 0
          ? await supabaseRestFetch<Profile[]>(`public_profiles?select=*&id=in.(${leaderIds.join(',')})`)
          : [];

        const assignmentMap = new Map((assignments || []).map((assignment) => [assignment.id, assignment]));
        const eventMap = new Map(scheduleEvents.map((event) => [event.id, event]));
        const leaderMap = new Map(leaders.map((leader) => [leader.id, leader]));

        for (const submission of approvedSubmissions) {
          if (!submission.assignment_id) continue;

          const assignment = assignmentMap.get(submission.assignment_id);
          if (!assignment || assignment.status === 'cancelled') continue;

          const scheduleEvent = eventMap.get(assignment.schedule_event_id);
          if (!scheduleEvent) continue;

          const workoutDate = scheduleEvent.starts_at.split('T')[0];
          coveredDates.add(workoutDate);

          history.push({
            id: `submission-${submission.id}`,
            source: 'approved_submission',
            starts_at: scheduleEvent.starts_at,
            title: scheduleEvent.title || 'Workout Session',
            location: scheduleEvent.location || null,
            leader_name: leaderMap.get(assignment.leader_id)?.full_name || null,
            summary: submission.message || scheduleEvent.title || null,
            workout_plan: submission.workout_plan || null,
            message: submission.message || null,
            leadership_note: submission.leadership_note || null,
          });
        }
      }

      for (const slot of legacySlots || []) {
        if (coveredDates.has(slot.workout_date)) continue;

        history.push({
          id: `slot-${slot.id}`,
          source: 'legacy_slot',
          starts_at: `${slot.workout_date}T06:00:00.000Z`,
          title: slot.theme || 'Workout Session',
          location: null,
          leader_name: slot.leader_id ? legacyLeaderMap.get(slot.leader_id)?.full_name || null : null,
          summary: slot.description || null,
          workout_plan: null,
          message: slot.description || null,
          leadership_note: null,
        });
      }

      return history
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
        .slice(0, limit);
    },
  });
}

export function useWorkoutGuide(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['workouts', 'guide', slug],
    queryFn: async () => {
      const { data, error } = await db
        .from('workout_guides')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return (data || null) as WorkoutGuideRecord | null;
    },
    enabled: enabled && !!slug,
  });
}

export function useUpsertWorkoutGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      title,
      roleScope = 'leader',
      versionLabel,
      isActive = true,
      contentJson,
    }: SaveWorkoutGuideInput) => {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await db
        .from('workout_guides')
        .upsert(
          {
            slug,
            title,
            role_scope: roleScope,
            version_label: versionLabel || null,
            is_active: isActive,
            content_json: contentJson,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' },
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as WorkoutGuideRecord;
    },
    onSuccess: (guide) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'guide'] });
      queryClient.setQueryData(['workouts', 'guide', guide.slug], guide);
    },
  });
}

export function useMyWorkoutLeadRequests() {
  return useQuery({
    queryKey: ['workouts', 'lead-requests', 'mine'],
    queryFn: async () => {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) return [] as WorkoutLeadRequestWithContext[];

      const { data: requests, error } = await db
        .from('workout_lead_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!requests || requests.length === 0) return [] as WorkoutLeadRequestWithContext[];

      const scheduleEventIds = [...new Set(requests.map((request) => request.schedule_event_id))];
      const { data: scheduleEvents } = await db
        .from('sweatpals_schedule_events')
        .select('*')
        .in('id', scheduleEventIds);

      const eventMap = new Map((scheduleEvents || []).map((event) => [event.id, event]));

      return requests.map((request) => ({
        ...request,
        profile: null,
        schedule_event: eventMap.get(request.schedule_event_id) || null,
      })) as WorkoutLeadRequestWithContext[];
    },
  });
}

export function useCreateWorkoutLeadRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      scheduleEventIds,
      notes,
    }: {
      userId: string;
      scheduleEventIds: string[];
      notes?: string;
    }) => {
      if (!userId) throw new Error('Must be logged in');
      if (!scheduleEventIds.length) throw new Error('Select at least one workout date');

      const now = new Date().toISOString();
      const payload = scheduleEventIds.map((scheduleEventId) => ({
        schedule_event_id: scheduleEventId,
        user_id: userId,
        notes: notes || null,
        status: 'pending',
        updated_at: now,
      }));

      const { error } = await db
        .from('workout_lead_requests')
        .upsert(payload, { onConflict: 'schedule_event_id,user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'leadable'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'lead-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'my-assigned'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'assignments'] });
    },
  });
}

export function useCancelWorkoutLeadRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await db
        .from('workout_lead_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'leadable'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'lead-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'assignments'] });
    },
  });
}

export function useAdminWorkoutLeadRequests(status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['workouts', 'lead-requests', 'admin', status],
    queryFn: async () => {
      let query = db
        .from('workout_lead_requests')
        .select('*')
        .order('created_at', { ascending: true });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: requests, error } = await query;
      if (error) throw error;
      if (!requests || requests.length === 0) return [] as WorkoutLeadRequestWithContext[];

      const userIds = [...new Set(requests.map((request) => request.user_id))];
      const scheduleEventIds = [...new Set(requests.map((request) => request.schedule_event_id))];

      const [profiles, scheduleEvents] = await Promise.all([
        userIds.length > 0
          ? supabaseRestFetch<Profile[]>(`public_profiles?select=*&id=in.(${userIds.join(',')})`)
          : Promise.resolve([] as Profile[]),
        scheduleEventIds.length > 0
          ? db
              .from('sweatpals_schedule_events')
              .select('*')
              .in('id', scheduleEventIds)
              .then((result: { data: SweatpalsScheduleEvent[] | null; error: Error | null }) => {
                if (result.error) throw result.error;
                return result.data || [];
              })
          : Promise.resolve([] as SweatpalsScheduleEvent[]),
      ]);

      const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
      const eventMap = new Map(scheduleEvents.map((event) => [event.id, event]));

      return requests.map((request) => ({
        ...request,
        profile: profileMap.get(request.user_id) || null,
        schedule_event: eventMap.get(request.schedule_event_id) || null,
      })) as WorkoutLeadRequestWithContext[];
    },
  });
}

export function useWorkoutLeadAssignments(status: 'assigned' | 'completed' | 'cancelled' | 'all' = 'assigned') {
  return useQuery({
    queryKey: ['workouts', 'assignments', status],
    queryFn: async () => {
      let query = db
        .from('workout_lead_assignments')
        .select('*')
        .order('created_at', { ascending: true });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: assignments, error } = await query;
      if (error) throw error;
      if (!assignments || assignments.length === 0) return [] as WorkoutLeadAssignmentWithContext[];

      const leaderIds = [...new Set(assignments.map((assignment) => assignment.leader_id))];
      const scheduleEventIds = [...new Set(assignments.map((assignment) => assignment.schedule_event_id))];

      const [leaders, scheduleEvents] = await Promise.all([
        leaderIds.length > 0
          ? supabaseRestFetch<Profile[]>(`public_profiles?select=*&id=in.(${leaderIds.join(',')})`)
          : Promise.resolve([] as Profile[]),
        scheduleEventIds.length > 0
          ? db
              .from('sweatpals_schedule_events')
              .select('*')
              .in('id', scheduleEventIds)
              .then((result: { data: SweatpalsScheduleEvent[] | null; error: Error | null }) => {
                if (result.error) throw result.error;
                return result.data || [];
              })
          : Promise.resolve([] as SweatpalsScheduleEvent[]),
      ]);

      const leaderMap = new Map(leaders.map((profile) => [profile.id, profile]));
      const eventMap = new Map(scheduleEvents.map((event) => [event.id, event]));

      return assignments.map((assignment) => ({
        ...assignment,
        leader: leaderMap.get(assignment.leader_id) || null,
        schedule_event: eventMap.get(assignment.schedule_event_id) || null,
      })) as WorkoutLeadAssignmentWithContext[];
    },
  });
}

export function useApproveWorkoutLeadRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data: request, error: requestError } = await db
        .from('workout_lead_requests')
        .select('schedule_event_id, user_id')
        .eq('id', requestId)
        .maybeSingle();

      if (requestError) throw requestError;
      if (!request) throw new Error('Lead request not found');

      const { error } = await db.rpc('approve_workout_lead_request', {
        p_request_id: requestId,
      });

      if (error) throw error;

      try {
        await notifyWorkoutAssignment({
          schedule_event_id: request.schedule_event_id,
          leader_id: request.user_id,
          source: 'approve_request',
        });
      } catch (notifyError) {
        console.warn('Assignment email notification failed', notifyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'leadable'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'lead-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'my-assigned'] });
    },
  });
}

export function useRejectWorkoutLeadRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await db
        .from('workout_lead_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'leadable'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'lead-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'assignments'] });
    },
  });
}

export function useAssignWorkoutLeaderDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleEventId,
      leaderId,
      note,
    }: {
      scheduleEventId: string;
      leaderId: string;
      note?: string;
    }) => {
      const { error } = await db.rpc('assign_workout_leader_direct', {
        p_schedule_event_id: scheduleEventId,
        p_leader_id: leaderId,
        p_note: note || null,
      });

      if (error) throw error;

      try {
        await notifyWorkoutAssignment({
          schedule_event_id: scheduleEventId,
          leader_id: leaderId,
          source: 'direct_assign',
        });
      } catch (notifyError) {
        console.warn('Assignment email notification failed', notifyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'leadable'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'lead-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'my-assigned'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'submissions'] });
    },
  });
}

export function useInviteAndAssignWorkoutLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      scheduleEventId,
    }: {
      email: string;
      scheduleEventId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('workout-invite-assign', {
        body: { email, schedule_event_id: scheduleEventId },
      });

      if (error) throw error;
      return data as { status: string; leader_id: string; is_new_user: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', 'leadable'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'lead-requests'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'my-assigned'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useMyWorkoutAssignment(assignmentId: string) {
  return useQuery({
    queryKey: ['workouts', 'my-assigned', assignmentId],
    queryFn: async () => {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) return null;

      const { data: assignment, error } = await db
        .from('workout_lead_assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('leader_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!assignment) return null;

      const { data: scheduleEvent, error: scheduleError } = await db
        .from('sweatpals_schedule_events')
        .select('*')
        .eq('id', assignment.schedule_event_id)
        .maybeSingle();

      if (scheduleError) throw scheduleError;

      return {
        ...assignment,
        leader: null,
        schedule_event: scheduleEvent || null,
      } as WorkoutLeadAssignmentWithContext;
    },
    enabled: !!assignmentId,
  });
}

// Fetch submission for a specific assignment
export function useWorkoutSubmission(assignmentId: string) {
  return useQuery({
    queryKey: ['workouts', 'submission', assignmentId],
    queryFn: async () => {
      const { data, error } = await db
        .from('workout_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkoutSubmission | null;
    },
    enabled: !!assignmentId,
  });
}

// Fetch my submission for an assignment (as leader)
export function useMyWorkoutSubmission(assignmentId: string) {
  return useQuery({
    queryKey: ['workouts', 'my-submission', assignmentId],
    queryFn: async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) return null;

      const { data, error } = await db
        .from('workout_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('leader_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkoutSubmission | null;
    },
    enabled: !!assignmentId,
  });
}

// Fetch all submissions (for admin)
export function useAllWorkoutSubmissions() {
  return useQuery({
    queryKey: ['workouts', 'submissions'],
    queryFn: async () => {
      const { data: submissions, error } = await db
        .from('workout_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!submissions || submissions.length === 0) return [] as WorkoutSubmissionWithContext[];

      const assignmentIds = [...new Set(submissions.map((submission) => submission.assignment_id).filter(Boolean))];
      const leaderIds = [...new Set(submissions.map((submission) => submission.leader_id).filter(Boolean))];

      const [assignments, leaders] = await Promise.all([
        assignmentIds.length > 0
          ? db
              .from('workout_lead_assignments')
              .select('*')
              .in('id', assignmentIds)
              .then((result: { data: WorkoutLeadAssignment[] | null; error: Error | null }) => {
                if (result.error) throw result.error;
                return result.data || [];
              })
          : Promise.resolve([] as WorkoutLeadAssignment[]),
        leaderIds.length > 0
          ? supabaseRestFetch<Profile[]>(`public_profiles?select=*&id=in.(${leaderIds.join(',')})`)
          : Promise.resolve([] as Profile[]),
      ]);

      const scheduleEventIds = [...new Set(assignments.map((assignment) => assignment.schedule_event_id))];
      const scheduleEvents = scheduleEventIds.length > 0
        ? await db
            .from('sweatpals_schedule_events')
            .select('*')
            .in('id', scheduleEventIds)
            .then((result: { data: SweatpalsScheduleEvent[] | null; error: Error | null }) => {
              if (result.error) throw result.error;
              return result.data || [];
            })
        : [];

      const leaderMap = new Map(leaders.map((leader) => [leader.id, leader]));
      const assignmentMap = new Map(assignments.map((assignment) => [assignment.id, assignment]));
      const eventMap = new Map(scheduleEvents.map((event) => [event.id, event]));

      return submissions.map((submission) => {
        const assignment = submission.assignment_id ? assignmentMap.get(submission.assignment_id) || null : null;
        const scheduleEvent = assignment ? eventMap.get(assignment.schedule_event_id) || null : null;

        return {
          ...submission,
          assignment: assignment
            ? {
                ...assignment,
                leader: leaderMap.get(assignment.leader_id) || null,
                schedule_event: scheduleEvent,
              }
            : null,
          schedule_event: scheduleEvent,
          leader_profile: leaderMap.get(submission.leader_id) || null,
        };
      }) as WorkoutSubmissionWithContext[];
    },
  });
}

// Create or update submission
export function useSaveWorkoutSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      workoutPlan,
      message,
      leadershipNote,
      status = 'draft',
    }: {
      assignmentId: string;
      workoutPlan: string;
      message?: string;
      leadershipNote?: string;
      status?: 'draft' | 'submitted';
    }) => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      // Check if submission exists
      const { data: existing } = await db
        .from('workout_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (existing) {
        // Update
        const now = new Date().toISOString();
        const { data, error } = await db
          .from('workout_submissions')
          .update({
            workout_plan: workoutPlan,
            message,
            leadership_note: leadershipNote,
            status,
            submitted_at: status === 'submitted' ? now : null,
            last_submitted_at: status === 'submitted' ? now : undefined,
            updated_at: now,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const now = new Date().toISOString();
        const { data, error } = await db
          .from('workout_submissions')
          .insert({
            assignment_id: assignmentId,
            leader_id: user.id,
            workout_plan: workoutPlan,
            message,
            leadership_note: leadershipNote,
            status,
            submitted_at: status === 'submitted' ? now : null,
            last_submitted_at: status === 'submitted' ? now : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Approve submission
export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await db
        .from('workout_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Request changes on submission
export function useRequestSubmissionChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      feedback,
    }: {
      submissionId: string;
      feedback: string;
    }) => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await db
        .from('workout_submissions')
        .update({
          status: 'changes_requested',
          admin_feedback: feedback,
          feedback_requested_at: new Date().toISOString(),
          feedback_requested_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Fetch my assigned workout entries with submission data (future workouts only)
export function useMyAssignedWorkouts() {
  return useQuery({
    queryKey: ['workouts', 'my-assigned'],
    queryFn: async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) return [];

      const { data: assignments, error: assignmentError } = await db
        .from('workout_lead_assignments')
        .select('*')
        .eq('leader_id', user.id)
        .eq('status', 'assigned')
        .order('created_at', { ascending: true });

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [] as AssignedWorkoutWithSubmission[];

      const assignmentIds = assignments.map((assignment) => assignment.id);
      const scheduleEventIds = assignments.map((assignment) => assignment.schedule_event_id);
      const startOfTodayIso = new Date(new Date().toDateString()).toISOString();

      const [scheduleEvents, submissions] = await Promise.all([
        db
          .from('sweatpals_schedule_events')
          .select('*')
          .in('id', scheduleEventIds)
          .gte('starts_at', startOfTodayIso)
          .then((result: { data: SweatpalsScheduleEvent[] | null; error: Error | null }) => {
            if (result.error) throw result.error;
            return result.data || [];
          }),
        db
          .from('workout_submissions')
          .select('*')
          .in('assignment_id', assignmentIds)
          .then((result: { data: WorkoutSubmission[] | null; error: Error | null }) => {
            if (result.error) throw result.error;
            return result.data || [];
          }),
      ]);

      const eventMap = new Map(scheduleEvents.map((event) => [event.id, event]));
      const submissionMap = new Map(
        submissions
          .filter((submission) => submission.assignment_id)
          .map((submission) => [submission.assignment_id, submission])
      );

      return assignments
        .filter((assignment) => eventMap.has(assignment.schedule_event_id))
        .map((assignment) => ({
          ...assignment,
          leader: null,
          schedule_event: eventMap.get(assignment.schedule_event_id) || null,
          submission: submissionMap.get(assignment.id) || null,
        })) as AssignedWorkoutWithSubmission[];
    },
  });
}

export function useMyPendingWorkoutActionCount() {
  return useQuery({
    queryKey: ['workouts', 'my-pending-action-count'],
    queryFn: async () => {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) return 0;

      const { data: assignments, error: assignmentError } = await db
        .from('workout_lead_assignments')
        .select('id')
        .eq('leader_id', user.id)
        .eq('status', 'assigned');

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return 0;

      const assignmentIds = assignments.map((assignment) => assignment.id);
      const { data: submissions, error: submissionError } = await db
        .from('workout_submissions')
        .select('assignment_id, status')
        .in('assignment_id', assignmentIds);

      if (submissionError) throw submissionError;

      const submissionByAssignment = new Map<string, WorkoutSubmission['status']>();
      for (const submission of submissions || []) {
        if (!submission.assignment_id) continue;
        if (!submissionByAssignment.has(submission.assignment_id)) {
          submissionByAssignment.set(submission.assignment_id, submission.status);
        }
      }

      let count = 0;
      for (const assignmentId of assignmentIds) {
        const status = submissionByAssignment.get(assignmentId);
        if (!status || status === 'draft' || status === 'changes_requested') {
          count += 1;
        }
      }

      return count;
    },
  });
}

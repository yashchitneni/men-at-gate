import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, MemberPhoto, ProfileWithPhotos, CoreRosterMember } from '@/types/database.types';

// Helper for direct fetch
async function supabaseFetch<T>(path: string): Promise<T> {
  const url = `https://prursaeokvkulphtskdn.supabase.co/rest/v1/${path}`;
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydXJzYWVva3ZrdWxwaHRza2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTYwOTIsImV4cCI6MjA4MzEzMjA5Mn0.Lqku85Nn1jKfomnrtMFpJ20z7wH70JgiMWYBN4iNP-Q';
  const response = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Fetch failed');
  }
  return response.json();
}

// Fetch core roster members (for /men page)
export function useCoreRoster() {
  return useQuery({
    queryKey: ['profiles', 'core-roster'],
    queryFn: async () => {
      const profiles = await supabaseFetch<Profile[]>(
        'profiles?is_core_member=eq.true&order=created_at.asc'
      );
      
      const photos = await supabaseFetch<MemberPhoto[]>('member_photos?select=*');
      const photosByUser = photos.reduce((acc, photo) => {
        if (!acc[photo.user_id]) acc[photo.user_id] = [];
        acc[photo.user_id].push(photo);
        return acc;
      }, {} as Record<string, MemberPhoto[]>);
      
      return profiles.map(profile => ({
        ...profile,
        photos: photosByUser[profile.id] || [],
        primary_photo: photosByUser[profile.id]?.find(p => p.is_primary) || photosByUser[profile.id]?.[0] || null,
      })) as ProfileWithPhotos[];
    },
  });
}

// Fetch all profiles (for admin)
export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const profiles = await supabaseFetch<Profile[]>(
        'profiles?order=created_at.desc'
      );
      
      const photos = await supabaseFetch<MemberPhoto[]>('member_photos?select=*');
      const photosByUser = photos.reduce((acc, photo) => {
        if (!acc[photo.user_id]) acc[photo.user_id] = [];
        acc[photo.user_id].push(photo);
        return acc;
      }, {} as Record<string, MemberPhoto[]>);
      
      return profiles.map(profile => ({
        ...profile,
        photos: photosByUser[profile.id] || [],
        primary_photo: photosByUser[profile.id]?.find(p => p.is_primary) || photosByUser[profile.id]?.[0] || null,
      })) as ProfileWithPhotos[];
    },
  });
}

// Fetch single profile
export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profiles', userId],
    queryFn: async () => {
      const profiles = await supabaseFetch<Profile[]>(
        `profiles?id=eq.${userId}`
      );
      
      if (!profiles.length) throw new Error('Profile not found');
      const profile = profiles[0];
      
      const photos = await supabaseFetch<MemberPhoto[]>(
        `member_photos?user_id=eq.${userId}`
      );
      
      return {
        ...profile,
        photos,
        primary_photo: photos?.find(p => p.is_primary) || photos?.[0] || null,
      } as ProfileWithPhotos;
    },
    enabled: !!userId,
  });
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: {
        full_name?: string;
        phone?: string;
        instagram_handle?: string;
        shirt_size?: string;
        bio?: string;
        mission?: string;
        role?: string;
      };
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

// Admin: Toggle core member status
export function useToggleCoreMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isCoreMember,
    }: {
      userId: string;
      isCoreMember: boolean;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_core_member: isCoreMember })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

// Admin: Toggle admin status
export function useToggleAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: string;
      isAdmin: boolean;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

// Upload photo
export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      file,
      isPrimary = false,
    }: {
      userId: string;
      file: File;
      isPrimary?: boolean;
    }) => {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(fileName);

      // Insert photo record
      const { error: insertError } = await supabase
        .from('member_photos')
        .insert({
          user_id: userId,
          photo_url: publicUrl,
          is_primary: isPrimary,
        });

      if (insertError) throw insertError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

// Set primary photo
export function useSetPrimaryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('member_photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

// Delete photo
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('member_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

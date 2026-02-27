import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, MemberPhoto, ProfileWithPhotos, CoreRosterMember } from '@/types/database.types';
import { supabaseRestFetch } from '@/lib/supabaseHttp';

// Fetch core roster members (for /men page) - uses secure core_roster view
export function useCoreRoster() {
  return useQuery({
    queryKey: ['profiles', 'core-roster'],
    queryFn: async () => {
      // Use the core_roster view which only exposes non-sensitive fields
      const coreMembers = await supabaseRestFetch<CoreRosterMember[]>(
        'core_roster?order=id.asc'
      );
      
      // Transform to ProfileWithPhotos shape for compatibility
      return coreMembers.map(member => ({
        id: member.id,
        full_name: member.full_name,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role,
        bio: member.bio,
        mission: member.mission,
        instagram_handle: member.instagram_handle,
        email: '', // Not exposed in view
        phone: null,
        shirt_size: null,
        is_admin: false,
        is_core_member: true,
        created_at: '',
        updated_at: '',
        photos: [],
        primary_photo: member.primary_photo_url ? { 
          id: '', 
          user_id: member.id, 
          photo_url: member.primary_photo_url, 
          is_primary: true, 
          created_at: '' 
        } : null,
      })) as ProfileWithPhotos[];
    },
  });
}

// Fetch all profiles (for admin)
export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: photos, error: photosError } = await supabase
        .from('member_photos')
        .select('*');

      if (photosError) throw photosError;

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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      const { data: photos, error: photosError } = await supabase
        .from('member_photos')
        .select('*')
        .eq('user_id', userId);

      if (photosError) throw photosError;
      
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
        first_name?: string;
        last_name?: string;
        phone?: string;
        instagram_handle?: string;
        shirt_size?: string;
        here_for?: string[];
        here_for_other?: string | null;
        onboarding_completed_at?: string;
        bio?: string;
        mission?: string;
        role?: string;
      };
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (!error) return;

      // Backward-compatible retry for environments where new profile columns
      // are not migrated yet (e.g. first_name / last_name / here_for).
      if (error.code === 'PGRST204') {
        const legacyPayload = {
          full_name: data.full_name,
          phone: data.phone,
          instagram_handle: data.instagram_handle,
          shirt_size: data.shirt_size,
          bio: data.bio,
          mission: data.mission,
          role: data.role,
        };

        const { error: legacyError } = await supabase
          .from('profiles')
          .update(legacyPayload)
          .eq('id', userId);

        if (!legacyError) return;
        throw legacyError;
      }

      throw error;
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
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }

      const extensionFromName = file.name.includes('.') ? file.name.split('.').pop() : '';
      const extensionFromMime = file.type.split('/')[1] || 'jpg';
      const fileExt = (extensionFromName || extensionFromMime || 'jpg').toLowerCase();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      async function uploadToBucket(bucket: string) {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });
        return error;
      }

      // Primary bucket.
      let uploadBucket = 'member-photos';
      let uploadError = await uploadToBucket(uploadBucket);

      // Fallback for environments that still use legacy bucket naming.
      if (uploadError && /bucket.+not found/i.test(uploadError.message)) {
        uploadBucket = 'member_photos';
        uploadError = await uploadToBucket(uploadBucket);
      }

      if (uploadError) {
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(uploadBucket)
        .getPublicUrl(fileName);

      // Insert photo record
      const { error: insertError } = await supabase
        .from('member_photos')
        .insert({
          user_id: userId,
          photo_url: publicUrl,
          is_primary: isPrimary,
        });

      if (insertError) {
        throw new Error(`Photo metadata save failed: ${insertError.message}`);
      }

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

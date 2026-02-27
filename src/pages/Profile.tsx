import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile, useUploadPhoto } from '@/hooks/useProfiles';
import { useRaces } from '@/hooks/useRaces';
import { useWorkoutSlots } from '@/hooks/useWorkouts';
import { useMySpotlightSubmission, useSaveMySpotlightDraft, useSubmitMySpotlight } from '@/hooks/useSpotlights';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Save, Trophy, Dumbbell, Sparkles, Upload, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import type { SpotlightSubmission } from '@/types/database.types';

const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const MAX_ABOUT_YOU_POINTS = 5;
const MAX_SPOTLIGHT_QUOTES = 2;
const MAX_FEATURE_PHOTOS = 3;

function spotlightStatusLabel(status: SpotlightSubmission['status'] | null) {
  if (!status) return 'Not submitted';
  if (status === 'needs_update') return 'Needs updates';
  if (status === 'approved') return 'Approved & scheduled';
  return status.replace('_', ' ');
}

function spotlightStatusVariant(status: SpotlightSubmission['status'] | null) {
  if (!status) return 'outline' as const;
  if (status === 'approved' || status === 'published') return 'default' as const;
  if (status === 'submitted') return 'secondary' as const;
  if (status === 'needs_update' || status === 'rejected') return 'destructive' as const;
  return 'outline' as const;
}

function normalizeTextList(values: string[], maxItems = 0) {
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return maxItems > 0 ? normalized.slice(0, maxItems) : normalized;
}

function dedupePhotoUrls(photoUrls: string[]) {
  return Array.from(new Set(photoUrls.filter(Boolean)));
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();
  const { data: races } = useRaces();
  const { data: workoutSlots } = useWorkoutSlots();
  const { data: profileWithPhotos } = useProfile(user?.id || '');
  const { data: spotlightSubmission } = useMySpotlightSubmission(user?.id || null);
  const saveSpotlightDraft = useSaveMySpotlightDraft();
  const submitSpotlight = useSubmitMySpotlight();
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [spotlightDisplayName, setSpotlightDisplayName] = useState('');
  const [spotlightHeadline, setSpotlightHeadline] = useState('');
  const [spotlightShortBio, setSpotlightShortBio] = useState('');
  const [spotlightAboutYouPoints, setSpotlightAboutYouPoints] = useState<string[]>(['', '', '']);
  const [spotlightWhyJoined, setSpotlightWhyJoined] = useState('');
  const [spotlightMission, setSpotlightMission] = useState('');
  const [spotlightArenaMeaning, setSpotlightArenaMeaning] = useState('');
  const [spotlightAccomplishments, setSpotlightAccomplishments] = useState('');
  const [spotlightFavoriteQuotes, setSpotlightFavoriteQuotes] = useState<string[]>(['', '']);
  const [spotlightInstagram, setSpotlightInstagram] = useState('');
  const [spotlightFeaturePhotoUrls, setSpotlightFeaturePhotoUrls] = useState<string[]>([]);
  const [spotlightConsent, setSpotlightConsent] = useState(false);

  const primaryHeadshotUrl =
    profileWithPhotos?.primary_photo?.photo_url ||
    spotlightSubmission?.photo_url ||
    '';

  const availableSpotlightPhotos = profileWithPhotos?.photos?.filter((photo) => photo.photo_url !== primaryHeadshotUrl) || [];

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Populate profile form data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setInstagramHandle(profile.instagram_handle || '');
      setShirtSize(profile.shirt_size || '');
    }
  }, [profile]);

  // Populate spotlight form data
  useEffect(() => {
    if (!profile) return;

    if (spotlightSubmission) {
      setSpotlightDisplayName(spotlightSubmission.display_name || profile.full_name || '');
      setSpotlightHeadline(spotlightSubmission.headline || '');
      setSpotlightShortBio(spotlightSubmission.short_bio || '');
      setSpotlightAboutYouPoints(normalizeTextList(spotlightSubmission.about_you_points || [], MAX_ABOUT_YOU_POINTS));
      setSpotlightWhyJoined(spotlightSubmission.why_i_joined || '');
      setSpotlightMission(spotlightSubmission.mission || '');
      setSpotlightArenaMeaning(spotlightSubmission.arena_meaning || '');
      setSpotlightAccomplishments(spotlightSubmission.favorite_accomplishments || '');
      setSpotlightFavoriteQuotes(normalizeTextList(spotlightSubmission.favorite_quotes || [], MAX_SPOTLIGHT_QUOTES));
      setSpotlightFeaturePhotoUrls(dedupePhotoUrls(spotlightSubmission.feature_photo_urls || []).slice(0, MAX_FEATURE_PHOTOS));
      setSpotlightInstagram(spotlightSubmission.instagram_handle || profile.instagram_handle || '');
      setSpotlightConsent(spotlightSubmission.consent_public_display);
      return;
    }

    setSpotlightDisplayName(profile.full_name || '');
    setSpotlightHeadline('');
    setSpotlightShortBio(profile.bio || '');
    setSpotlightAboutYouPoints(['', '', '']);
    setSpotlightWhyJoined('');
    setSpotlightMission(profile.mission || '');
    setSpotlightArenaMeaning('');
    setSpotlightAccomplishments('');
    setSpotlightFavoriteQuotes(['', '']);
    setSpotlightFeaturePhotoUrls([]);
    setSpotlightInstagram(profile.instagram_handle || '');
    setSpotlightConsent(false);
  }, [profile, spotlightSubmission]);

  async function handleSave() {
    if (!user) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        data: {
          full_name: fullName,
          phone: phone || undefined,
          instagram_handle: instagramHandle.replace('@', '').trim() || undefined,
          shirt_size: shirtSize || undefined,
        },
      });
      await refreshProfile();
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  }

  async function handleUploadHeadshot(event: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadPhoto.mutateAsync({
        userId: user.id,
        file,
        isPrimary: true,
      });
      toast({
        title: 'Headshot uploaded',
        description: 'Your new photo is now set as primary.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload photo.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  }

  function updateAboutYouPoint(index: number, value: string) {
    setSpotlightAboutYouPoints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addAboutYouPoint() {
    setSpotlightAboutYouPoints((prev) =>
      prev.length >= MAX_ABOUT_YOU_POINTS ? prev : [...prev, ''],
    );
  }

  function removeAboutYouPoint(index: number) {
    setSpotlightAboutYouPoints((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      return next.length ? next : [''];
    });
  }

  function updateFavoriteQuote(index: number, value: string) {
    setSpotlightFavoriteQuotes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addFavoriteQuote() {
    setSpotlightFavoriteQuotes((prev) =>
      prev.length >= MAX_SPOTLIGHT_QUOTES ? prev : [...prev, ''],
    );
  }

  function removeFavoriteQuote(index: number) {
    setSpotlightFavoriteQuotes((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      return next.length ? next : [''];
    });
  }

  function toggleFeaturePhoto(photoUrl: string) {
    setSpotlightFeaturePhotoUrls((prev) => {
      const alreadySelected = prev.includes(photoUrl);

      if (alreadySelected) {
        return prev.filter((url) => url !== photoUrl);
      }

      if (prev.length >= MAX_FEATURE_PHOTOS) {
        return prev;
      }

      return [...prev, photoUrl];
    });
  }

  const normalizedAboutYouPoints = normalizeTextList(spotlightAboutYouPoints);
  const normalizedFavoriteQuotes = normalizeTextList(spotlightFavoriteQuotes, MAX_SPOTLIGHT_QUOTES);
  const normalizedFeaturePhotoUrls = dedupePhotoUrls(spotlightFeaturePhotoUrls).slice(0, MAX_FEATURE_PHOTOS);

  async function handleSaveSpotlightDraft() {
    if (!user) return;

    try {
      await saveSpotlightDraft.mutateAsync({
        profileId: user.id,
        currentSubmission: spotlightSubmission || null,
        form: {
          display_name: spotlightDisplayName,
          headline: spotlightHeadline,
          short_bio: spotlightShortBio,
          about_you_points: normalizedAboutYouPoints,
          why_i_joined: spotlightWhyJoined,
          mission: spotlightMission,
          arena_meaning: spotlightArenaMeaning,
          favorite_accomplishments: spotlightAccomplishments,
          favorite_quotes: normalizedFavoriteQuotes,
          feature_photo_urls: normalizedFeaturePhotoUrls,
          instagram_handle: spotlightInstagram,
          photo_url: primaryHeadshotUrl,
          consent_public_display: spotlightConsent,
        },
      });

      toast({
        title: 'Draft saved',
        description: 'Your spotlight draft has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save spotlight draft.',
        variant: 'destructive',
      });
    }
  }

  async function handleSubmitSpotlight() {
    if (!user) return;

    if (!primaryHeadshotUrl) {
      toast({
        title: 'Headshot required',
        description: 'Upload a primary profile photo before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await submitSpotlight.mutateAsync({
        profileId: user.id,
        currentSubmission: spotlightSubmission || null,
        form: {
          display_name: spotlightDisplayName,
          headline: spotlightHeadline,
          short_bio: spotlightShortBio,
          about_you_points: normalizedAboutYouPoints,
          why_i_joined: spotlightWhyJoined,
          mission: spotlightMission,
          arena_meaning: spotlightArenaMeaning,
          favorite_accomplishments: spotlightAccomplishments,
          favorite_quotes: normalizedFavoriteQuotes,
          feature_photo_urls: normalizedFeaturePhotoUrls,
          instagram_handle: spotlightInstagram,
          photo_url: primaryHeadshotUrl,
          consent_public_display: spotlightConsent,
        },
      });

      toast({
        title: 'Submitted for review',
        description: 'An admin will review and schedule your spotlight.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Could not submit spotlight profile.',
        variant: 'destructive',
      });
    }
  }

  // Get user's race participations
  const myRaces = races?.filter((race) => race.participants.some((p) => p.user_id === user?.id)) || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingRaces = myRaces.filter((race) => new Date(race.race_date + 'T00:00:00') >= today);

  const pastRaces = myRaces.filter((race) => new Date(race.race_date + 'T00:00:00') < today);

  // Get workouts user has led
  const myWorkouts = workoutSlots?.filter((slot) => slot.leader_id === user?.id) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-heading mb-8">My Profile</h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardDescription>{profile?.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      {isEditing ? (
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      ) : (
                        <p className="text-lg">{profile?.full_name || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(512) 555-1234"
                        />
                      ) : (
                        <p className="text-lg">{profile?.phone || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                          <Input
                            id="instagram"
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value)}
                            className="pl-8"
                            placeholder="yourhandle"
                          />
                        </div>
                      ) : (
                        <p className="text-lg">{profile?.instagram_handle ? `@${profile.instagram_handle}` : '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shirtSize">T-Shirt Size</Label>
                      {isEditing ? (
                        <Select value={shirtSize} onValueChange={setShirtSize}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIRT_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg">{profile?.shirt_size || '-'}</p>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="pt-4 flex gap-2">
                      {profile?.is_admin && <Badge variant="default">Admin</Badge>}
                      {profile?.is_core_member && <Badge variant="secondary">Core Member</Badge>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Spotlight Profile
                      </CardTitle>
                      <Badge variant={spotlightStatusVariant(spotlightSubmission?.status || null)}>
                        {spotlightStatusLabel(spotlightSubmission?.status || null)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Complete this once, then admins can feature you on the public Brotherhood directory.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <Label>Headshot (required)</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full overflow-hidden border bg-muted">
                          {primaryHeadshotUrl ? (
                            <img src={primaryHeadshotUrl} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No photo</div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={uploadPhoto.isPending}
                          >
                            {uploadPhoto.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload headshot
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            This uses your primary profile photo for public spotlight pages.
                          </p>
                        </div>
                      </div>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadHeadshot}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightDisplayName">Display Name (required)</Label>
                      <Input
                        id="spotlightDisplayName"
                        value={spotlightDisplayName}
                        onChange={(e) => setSpotlightDisplayName(e.target.value)}
                        placeholder="How your name should appear publicly"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightHeadline">Headline</Label>
                      <Input
                        id="spotlightHeadline"
                        value={spotlightHeadline}
                        onChange={(e) => setSpotlightHeadline(e.target.value)}
                        placeholder="Short one-line intro"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightShortBio">Short Bio (required)</Label>
                      <Textarea
                        id="spotlightShortBio"
                        value={spotlightShortBio}
                        onChange={(e) => setSpotlightShortBio(e.target.value)}
                        rows={3}
                        maxLength={320}
                        placeholder="Who you are and what people should know"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightWhyJoined">Why I Joined (required)</Label>
                      <Textarea
                        id="spotlightWhyJoined"
                        value={spotlightWhyJoined}
                        onChange={(e) => setSpotlightWhyJoined(e.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="What brought you to Men in the Arena"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>About You (optional, 3-5 points)</Label>
                      <p className="text-xs text-muted-foreground">
                        Add a few quick points to help others know you better.
                      </p>
                      <div className="space-y-2">
                        {spotlightAboutYouPoints.map((point, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={point}
                              onChange={(event) => updateAboutYouPoint(index, event.target.value)}
                              placeholder="Write a short bullet point"
                            />
                            {spotlightAboutYouPoints.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeAboutYouPoint(index)}
                                aria-label="Remove bullet"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAboutYouPoint}
                        disabled={spotlightAboutYouPoints.length >= MAX_ABOUT_YOU_POINTS}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add point
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightArenaMeaning">What has Men in the Arena meant for you?</Label>
                      <Textarea
                        id="spotlightArenaMeaning"
                        value={spotlightArenaMeaning}
                        onChange={(event) => setSpotlightArenaMeaning(event.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="How this community has changed you"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightAccomplishments">Favorite accomplishments</Label>
                      <Textarea
                        id="spotlightAccomplishments"
                        value={spotlightAccomplishments}
                        onChange={(event) => setSpotlightAccomplishments(event.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Recent wins, moments, and moments of growth"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Favorite Quotes (optional, up to 2)</Label>
                      <div className="space-y-2">
                        {spotlightFavoriteQuotes.map((quote, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={quote}
                              onChange={(event) => updateFavoriteQuote(index, event.target.value)}
                              placeholder="A quote that inspires you"
                            />
                            {spotlightFavoriteQuotes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFavoriteQuote(index)}
                                aria-label="Remove quote"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFavoriteQuote}
                        disabled={spotlightFavoriteQuotes.length >= MAX_SPOTLIGHT_QUOTES}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add quote
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Spotlight Photos (optional, up to 3)</Label>
                      <p className="text-xs text-muted-foreground">
                        These appear with your spotlight, in addition to your headshot.
                      </p>
                      {availableSpotlightPhotos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No extra photos yet. Upload photos to your profile first if you want to add more.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSpotlightPhotos.map((photo) => {
                            const isSelected = spotlightFeaturePhotoUrls.includes(photo.photo_url);
                            return (
                              <button
                                type="button"
                                key={photo.id}
                                onClick={() => toggleFeaturePhoto(photo.photo_url)}
                                disabled={
                                  uploadPhoto.isPending ||
                                  (!isSelected && spotlightFeaturePhotoUrls.length >= MAX_FEATURE_PHOTOS)
                                }
                                className={`relative group rounded-lg overflow-hidden border-2 ${
                                  isSelected ? "border-accent" : "border-muted"
                                }`}
                              >
                                <img
                                  src={photo.photo_url}
                                  alt="Spotlight option"
                                  className="w-full aspect-square object-cover"
                                />
                                <span
                                  className={`absolute inset-0 bg-black/30 flex items-center justify-center text-xs text-white ${
                                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  {isSelected ? "Selected" : "Select"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightMission">Mission / Goal</Label>
                      <Textarea
                        id="spotlightMission"
                        value={spotlightMission}
                        onChange={(e) => setSpotlightMission(e.target.value)}
                        rows={3}
                        maxLength={320}
                        placeholder="What you're building in this season"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spotlightInstagram">Instagram (optional)</Label>
                      <Input
                        id="spotlightInstagram"
                        value={spotlightInstagram}
                        onChange={(e) => setSpotlightInstagram(e.target.value)}
                        placeholder="@yourhandle"
                      />
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      <Checkbox
                        id="spotlightConsent"
                        checked={spotlightConsent}
                        onCheckedChange={(checked) => setSpotlightConsent(checked === true)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="spotlightConsent" className="cursor-pointer">
                          I consent to public display of this spotlight profile.
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Required before submission. Admins review your profile before publishing.
                        </p>
                      </div>
                    </div>

                    {spotlightSubmission?.admin_notes && (
                      <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3">
                        <p className="text-sm font-medium mb-1">Admin feedback</p>
                        <p className="text-sm text-muted-foreground">{spotlightSubmission.admin_notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveSpotlightDraft}
                        disabled={saveSpotlightDraft.isPending || submitSpotlight.isPending}
                      >
                        {saveSpotlightDraft.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Draft
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitSpotlight}
                        disabled={submitSpotlight.isPending || saveSpotlightDraft.isPending}
                      >
                        {submitSpotlight.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Submit for Review
                      </Button>
                      <Button type="button" variant="ghost" asChild>
                        <Link to="/brotherhood">View Public Directory</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Races */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-accent" />
                      My Races
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {myRaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No races yet</p>
                    ) : (
                      <>
                        {/* Upcoming Races */}
                        {upcomingRaces.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Upcoming</p>
                            <div className="space-y-2">
                              {upcomingRaces.map((race) => (
                                <Link
                                  key={race.id}
                                  to="/races"
                                  className="block text-sm hover:bg-accent/5 p-2 -mx-2 rounded transition-colors"
                                >
                                  <p className="font-medium">{race.race_name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{format(new Date(race.race_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                                    <span>•</span>
                                    <span>{race.participants.length} going</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Past Races */}
                        {pastRaces.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Past</p>
                            <div className="space-y-2">
                              {pastRaces.slice(0, 3).map((race) => (
                                <Link
                                  key={race.id}
                                  to="/races"
                                  className="block text-sm hover:bg-accent/5 p-2 -mx-2 rounded transition-colors opacity-60"
                                >
                                  <p className="font-medium">{race.race_name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{format(new Date(race.race_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                                    <span>•</span>
                                    <span>{race.participants.length} went</span>
                                  </div>
                                </Link>
                              ))}
                              {pastRaces.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-2">+{pastRaces.length - 3} more past races</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Workouts Led */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-accent" />
                      Workouts Led
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myWorkouts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None yet</p>
                    ) : (
                      <div className="space-y-2">
                        {myWorkouts.map((workout) => (
                          <div key={workout.id} className="text-sm">
                            <p className="font-medium">{format(new Date(workout.workout_date), 'MMM d, yyyy')}</p>
                            {workout.theme && <p className="text-muted-foreground">{workout.theme}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Future: Strava connection will go here */}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

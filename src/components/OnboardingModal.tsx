import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useUploadPhoto } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, ArrowRight, ArrowLeft, Check, User, Dumbbell } from 'lucide-react';

const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const HERE_FOR_OPTIONS = [
  'Get pushed hard',
  'Grow as a leader',
  'Show up for my family better',
  'Other',
];

const TOTAL_STEPS = 4;

export function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const derivedFirstName = profile?.first_name || profile?.full_name?.split(' ')[0] || '';
  const derivedLastName = profile?.last_name || profile?.full_name?.split(' ').slice(1).join(' ') || '';
  const hasLegacyRequiredProfile = Boolean(
    derivedFirstName.trim() && derivedLastName.trim() && profile?.shirt_size,
  );
  const onboardingCompleted = Boolean(profile?.onboarding_completed_at) || hasLegacyRequiredProfile;

  const needsOnboarding = Boolean(
    profile &&
      !onboardingCompleted,
  );

  useEffect(() => {
    if (needsOnboarding && user) {
      const seededLast = profile?.last_name || profile?.full_name?.split(' ').slice(1).join(' ') || '';
      const seededFirst = profile?.first_name || profile?.full_name?.split(' ')[0] || '';

      setFirstName(seededFirst);
      setLastName(seededLast);
      setShirtSize(profile?.shirt_size || '');
      setInstagramHandle(profile?.instagram_handle || '');
      setBio(profile?.bio || '');
      setOtherGoal('');
      setSelectedGoals(profile?.here_for || []);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [needsOnboarding, user, profile]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) => {
      const isSelected = prev.includes(goal);
      if (isSelected) return prev.filter((entry) => entry !== goal);
      return [...prev, goal];
    });
  }

  async function handleSubmit() {
    if (!user || !firstName.trim() || !lastName.trim() || !shirtSize) return;

    const wantsOther = selectedGoals.includes('Other');
    if (wantsOther && !otherGoal.trim()) {
      toast({
        title: 'Tell us more',
        description: 'Add a short note when selecting Other.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedGoals.length === 0) {
      toast({
        title: 'Complete profile intent',
        description: 'Choose at least one reason you are here.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let photoUploadWarning: string | null = null;

      if (photoFile) {
        try {
          await uploadPhoto.mutateAsync({
            userId: user.id,
            file: photoFile,
            isPrimary: true,
          });
        } catch (error) {
          photoUploadWarning = error instanceof Error ? error.message : 'Photo upload failed.';
        }
      }

      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

      await updateProfile.mutateAsync({
        userId: user.id,
        data: {
          full_name: fullName,
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          shirt_size: shirtSize,
          bio: bio.trim() || null,
          mission: selectedGoals.join(', '),
          here_for: selectedGoals,
          here_for_other: wantsOther ? otherGoal.trim() : null,
          instagram_handle: instagramHandle.replace('@', '').trim() || null,
          onboarding_completed_at: new Date().toISOString(),
        },
      });

      await refreshProfile();
      setOpen(false);

      toast({
        title: "You're in!",
        description: 'Welcome to the brotherhood. Good to have you.',
      });

      if (photoUploadWarning) {
        toast({
          title: 'Profile saved without photo',
          description: `${photoUploadWarning} You can upload a headshot later from Profile.`,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save your profile details. Try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!user || !needsOnboarding) return null;

  const canProceedStep1 = firstName.trim().length > 0 && lastName.trim().length > 0;
  const canProceedStep2 = shirtSize.length > 0;
  const canProceedStep3 = (() => {
    if (selectedGoals.length === 0) return false;
    if (selectedGoals.includes('Other')) {
      return otherGoal.trim().length > 0;
    }
    return true;
  })();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full flex-1 transition-colors ${index < step ? 'bg-accent' : 'bg-muted'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <Camera className="h-6 w-6 text-accent" />
                    Welcome to Men in the Arena
                  </DialogTitle>
                  <DialogDescription>
                    Tell us your name and add a face so leaders can recognize you.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-28 h-28 rounded-full border-2 border-dashed border-accent/50 hover:border-accent transition-colors flex items-center justify-center overflow-hidden group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Onboarding profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-accent/50 mx-auto group-hover:text-accent transition-colors" />
                        <span className="text-xs text-muted-foreground mt-1 block">Add Photo</span>
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>

                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    placeholder="Your last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      placeholder="yourhandle"
                      value={instagramHandle}
                      onChange={(event) => setInstagramHandle(event.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <User className="h-6 w-6 text-accent" />
                    About You
                  </DialogTitle>
                  <DialogDescription>
                    Share your short bio and shirt size.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label>Short Bio</Label>
                  <Textarea
                    placeholder="Dad of 2. Morning runner. Here to be better."
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    maxLength={200}
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
                </div>

                <div className="space-y-2">
                  <Label>T-Shirt Size</Label>
                  <Select value={shirtSize} onValueChange={setShirtSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="For gear drop" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIRT_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-accent" />
                    What are you here for?
                  </DialogTitle>
                  <DialogDescription>
                    Pick what matters most to you. Choose all that apply.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  {HERE_FOR_OPTIONS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedGoals.includes(goal)
                          ? 'border-accent bg-accent/10 text-accent font-medium'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {selectedGoals.includes(goal) ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />} 
                        {goal}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedGoals.includes('Other') && (
                  <div className="space-y-2">
                    <Label>Tell us what else you're here for</Label>
                    <Textarea
                      placeholder="What do you want to get out of Men in the Arena?"
                      value={otherGoal}
                      onChange={(event) => setOtherGoal(event.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading">
                    You&apos;re all set
                  </DialogTitle>
                  <DialogDescription>
                    We&apos;ll use this to tailor your path and connect you with leadership opportunities.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                  <p className="text-sm font-medium">Review</p>
                  <p className="text-sm text-muted-foreground">Name: {firstName} {lastName}</p>
                  <p className="text-sm text-muted-foreground">Shirt Size: {shirtSize}</p>
                  <p className="text-sm text-muted-foreground">Goals: {selectedGoals.join(', ')}</p>
                  {otherGoal && (
                    <p className="text-sm text-muted-foreground">Other goal: {otherGoal}</p>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Finish Setup
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep((current) => current - 1)}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

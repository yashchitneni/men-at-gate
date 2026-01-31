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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, ArrowRight, ArrowLeft, Check, User, Target, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const GOALS = [
  'Build discipline',
  'Get stronger',
  'Run a marathon',
  'Find accountability',
  'Make friends',
  'Lead workouts',
  'Complete a challenge',
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

  // Form data
  const [firstName, setFirstName] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [bio, setBio] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const needsOnboarding = profile && !profile.shirt_size && !profile.instagram_handle;

  useEffect(() => {
    if (needsOnboarding && user) {
      const name = profile?.full_name || user.user_metadata?.full_name || '';
      setFirstName(name.split(' ')[0] || '');
      setOpen(true);
    }
  }, [needsOnboarding, user, profile]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function toggleGoal(goal: string) {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  }

  async function handleSubmit() {
    if (!user || !firstName.trim()) return;
    setLoading(true);

    try {
      // Upload photo if selected
      if (photoFile) {
        await uploadPhoto.mutateAsync({
          userId: user.id,
          file: photoFile,
          isPrimary: true,
        });
      }

      const existingName = profile?.full_name || user.user_metadata?.full_name || '';
      const nameParts = existingName.split(' ');
      const lastName = nameParts.slice(1).join(' ');
      const fullName = lastName ? `${firstName.trim()} ${lastName}` : firstName.trim();

      await updateProfile.mutateAsync({
        userId: user.id,
        data: {
          full_name: fullName,
          shirt_size: shirtSize || null,
          instagram_handle: instagramHandle.replace('@', '').trim() || null,
          bio: bio.trim() || null,
          mission: selectedGoals.length > 0 ? selectedGoals.join(', ') : null,
        },
      });

      await refreshProfile();
      setOpen(false);

      toast({
        title: "You're in! 🤝",
        description: 'Welcome to the brotherhood. Time to show up.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save. Try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!user || !needsOnboarding) return null;

  const canProceed = step === 1 ? firstName.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-colors ${
                i < step ? 'bg-accent' : 'bg-muted'
              }`}
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
            {/* Step 1: Photo + Name */}
            {step === 1 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <Camera className="h-6 w-6 text-accent" />
                    Show Your Face
                  </DialogTitle>
                  <DialogDescription>
                    The brotherhood needs to know who you are.
                  </DialogDescription>
                </DialogHeader>

                {/* Photo upload */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-28 h-28 rounded-full border-2 border-dashed border-accent/50 hover:border-accent transition-colors flex items-center justify-center overflow-hidden group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
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
                  <Label>First Name *</Label>
                  <Input
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instagram Handle</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      placeholder="yourhandle"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Bio + Shirt Size */}
            {step === 2 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <User className="h-6 w-6 text-accent" />
                    Tell Your Story
                  </DialogTitle>
                  <DialogDescription>
                    What should the brothers know about you?
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label>Short Bio</Label>
                  <Textarea
                    placeholder="Dad of 2. Morning runner. Here to be better."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
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
                      <SelectValue placeholder="For merch drops 👕" />
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

            {/* Step 3: Fitness Level */}
            {step === 3 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-accent" />
                    Where You At
                  </DialogTitle>
                  <DialogDescription>
                    No judgment. Just so we know how to push you.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3">
                  {FITNESS_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFitnessLevel(level)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        fitnessLevel === level
                          ? 'border-accent bg-accent/10 text-accent font-semibold'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Goals */}
            {step === 4 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                    <Target className="h-6 w-6 text-accent" />
                    Your Goals
                  </DialogTitle>
                  <DialogDescription>
                    What are you here for? Pick all that apply.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 rounded-lg border text-sm text-left transition-all ${
                        selectedGoals.includes(goal)
                          ? 'border-accent bg-accent/10 text-accent font-medium'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {selectedGoals.includes(goal) && <Check className="h-3 w-3 inline mr-1" />}
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed}
              className="bg-accent hover:bg-accent/90"
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !firstName.trim()}
              className="bg-accent hover:bg-accent/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              I'm In 🤝
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

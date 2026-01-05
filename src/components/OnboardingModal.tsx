import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2 } from 'lucide-react';

const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine if user needs onboarding (new user with incomplete profile)
  const needsOnboarding = profile && !profile.shirt_size && !profile.instagram_handle;

  useEffect(() => {
    if (needsOnboarding && user) {
      // Pre-fill first name from profile or Google metadata
      const name = profile?.full_name || user.user_metadata?.full_name || '';
      // Extract first name only
      setFirstName(name.split(' ')[0] || '');
      setOpen(true);
    }
  }, [needsOnboarding, user, profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user || !firstName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your first name.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Build full name - keep last name if we have it
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
        },
      });

      await refreshProfile();
      setOpen(false);
      
      toast({
        title: "You're in! 🤝",
        description: 'Welcome to the brotherhood.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Don't render if no user or doesn't need onboarding
  if (!user || !needsOnboarding) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading flex items-center gap-2">
            🤝 Welcome to the Brotherhood
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Help us include you in giveaways, tag you on IG, and keep you in the crew.
            </span>
            <span className="block text-xs">
              We'll also send occasional emails about upcoming races, events, and merch drops.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shirtSize">T-Shirt Size</Label>
            <Select value={shirtSize} onValueChange={setShirtSize} disabled={loading}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="instagram"
                type="text"
                placeholder="yourhandle"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                disabled={loading}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              So we can tag you in workout pics 📸
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90" 
            disabled={loading || !firstName.trim()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            I'm In →
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

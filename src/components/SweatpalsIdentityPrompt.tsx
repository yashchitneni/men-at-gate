import { useEffect, useMemo, useState } from "react";
import { Link2, Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClaimSweatpalsIdentity, useSweatpalsIdentityStatus } from "@/hooks/useIntegrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function SweatpalsIdentityPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const dismissKey = useMemo(
    () => (user ? `sweatpals-link-prompt-dismissed:${user.id}` : null),
    [user],
  );

  const { data: identityStatus, isLoading } = useSweatpalsIdentityStatus(Boolean(user));
  const claimIdentity = useClaimSweatpalsIdentity();

  useEffect(() => {
    if (!dismissKey || !identityStatus) return;
    if (identityStatus.linked) return;
    if (identityStatus.matchable_unlinked_identities <= 0) return;
    if (localStorage.getItem(dismissKey) === "1") return;
    setOpen(true);
  }, [dismissKey, identityStatus]);

  if (!user || isLoading || !identityStatus || !open) return null;

  async function handleConnect() {
    try {
      const result = await claimIdentity.mutateAsync();
      toast({
        title: "SweatPals linked",
        description: `${result.linked_attendance_facts} attendance records are now connected to your profile.`,
      });
      if (dismissKey) localStorage.setItem(dismissKey, "1");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Could not connect right now",
        description: error instanceof Error ? error.message : "Please try again from your Profile page.",
        variant: "destructive",
      });
    }
  }

  function handleDismiss() {
    if (dismissKey) localStorage.setItem(dismissKey, "1");
    setOpen(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(30rem,calc(100vw-2rem))]">
      <Card className="border-accent/40 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold inline-flex items-center gap-2">
                <Link2 className="h-4 w-4 text-accent" />
                Connect your SweatPals activity
              </p>
              <p className="text-sm text-muted-foreground">
                We found {identityStatus.matchable_unlinked_identities} SweatPals record(s) for your email. Connect now to sync attendance and leaderboard stats.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="bg-accent hover:bg-accent/90"
              onClick={() => void handleConnect()}
              disabled={claimIdentity.isPending}
            >
              {claimIdentity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Now
            </Button>
            <Button type="button" variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

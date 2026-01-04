import { useState, useMemo } from "react";
import { members as staticMembers, Member } from "@/data/members";
import { useCoreRoster } from "@/hooks/useProfiles";
import RosterCarousel from "@/components/roster/RosterCarousel";
import MemberDossier from "@/components/roster/MemberDossier";
import MemberSheet from "@/components/roster/MemberSheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Men = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const { data: coreRoster, isLoading } = useCoreRoster();
  
  // Transform Supabase profiles to Member format, fallback to static data
  const members: Member[] = useMemo(() => {
    if (coreRoster && coreRoster.length > 0) {
      return coreRoster.map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unknown',
        photo: profile.primary_photo?.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
        role: profile.role || 'Member',
        bio: profile.bio || '',
        mission: profile.mission || '',
        socials: {
          instagram: profile.instagram_handle ? `https://instagram.com/${profile.instagram_handle.replace('@', '')}` : undefined,
        },
      }));
    }
    return staticMembers;
  }, [coreRoster]);

  const activeMember = members[activeIndex] || null;

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    // On mobile, open the sheet when selecting
    if (!isDesktop) {
      setSheetOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background texture */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <div className="mt-8 md:mt-12 text-center md:text-left">
          <h1 className="font-heading text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground">
            The <span className="text-accent">Men</span>
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Meet the brotherhood
          </p>
        </div>
      </header>

      {/* Main Content */}
      {isDesktop ? (
        // Desktop: Split Layout
        <div className="relative z-10 flex h-[calc(100vh-200px)]">
          {/* Carousel - Left 40% */}
          <div className="w-[40%] h-full">
            <RosterCarousel
              members={members}
              activeIndex={activeIndex}
              onSelect={handleSelect}
            />
          </div>

          {/* Dossier - Right 60% */}
          <div className="w-[60%] h-full p-8 pr-16 flex items-center">
            <div className="w-full max-w-2xl">
              <MemberDossier member={activeMember} />
            </div>
          </div>
        </div>
      ) : (
        // Mobile: Full Width Carousel
        <div className="relative z-10 h-[calc(100vh-200px)]">
          <RosterCarousel
            members={members}
            activeIndex={activeIndex}
            onSelect={handleSelect}
          />
          
          {/* Tap hint */}
          <div className="absolute bottom-20 left-0 right-0 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              Tap a card to view profile
            </p>
          </div>

          {/* Mobile Sheet */}
          <MemberSheet
            member={activeMember}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
        </div>
      )}
    </div>
  );
};

export default Men;

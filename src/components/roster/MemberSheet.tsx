import { Instagram, Linkedin, Twitter } from "lucide-react";
import { Member } from "@/data/members";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface MemberSheetProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberSheet = ({ member, open, onOpenChange }: MemberSheetProps) => {
  if (!member) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto px-6 pb-8">
          <DrawerHeader className="text-left px-0">
            {/* Role Badge */}
            <div className="mb-2">
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-accent border border-accent/30 px-3 py-1 rounded">
                {member.role}
              </span>
            </div>
            
            {/* Name */}
            <DrawerTitle className="font-handwriting text-4xl text-foreground">
              {member.name}
            </DrawerTitle>
            <div className="w-16 h-1 bg-accent mt-2" />
          </DrawerHeader>

          {/* Photo */}
          <div className="relative w-full h-64 mb-6 overflow-hidden rounded-lg">
            <img
              src={member.photo}
              alt={member.name}
              className="w-full h-full object-cover grayscale contrast-110"
            />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]" />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Background
            </h3>
            <DrawerDescription className="text-base text-foreground/90 leading-relaxed">
              {member.bio}
            </DrawerDescription>
          </div>

          {/* Mission */}
          <div className="mb-6">
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Mission
            </h3>
            <p className="text-base text-foreground/90 leading-relaxed italic">
              "{member.mission}"
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Connect
            </h3>
            <div className="flex gap-3">
              {member.socials.instagram && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border hover:border-accent hover:text-accent"
                  asChild
                >
                  <a
                    href={member.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {member.socials.linkedin && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border hover:border-accent hover:text-accent"
                  asChild
                >
                  <a
                    href={member.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {member.socials.twitter && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border hover:border-accent hover:text-accent"
                  asChild
                >
                  <a
                    href={member.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MemberSheet;

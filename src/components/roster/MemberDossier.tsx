import { motion, AnimatePresence } from "framer-motion";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { Member } from "@/data/members";
import { Button } from "@/components/ui/button";

interface MemberDossierProps {
  member: Member | null;
}

const MemberDossier = ({ member }: MemberDossierProps) => {
  if (!member) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={member.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="h-full flex flex-col"
      >
        {/* Dossier Header - File Tab Style */}
        <div className="relative">
          <div className="absolute -top-4 left-8 bg-accent px-6 py-2 rounded-t-lg">
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-white">
              Personnel File
            </span>
          </div>
          <div className="bg-secondary/30 border border-border rounded-lg p-8 pt-10">
            {/* Classification Stamp */}
            <div className="absolute top-6 right-8">
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-accent/60 border border-accent/30 px-3 py-1 rounded rotate-[-5deg] inline-block">
                {member.role}
              </span>
            </div>

            {/* Member Name */}
            <h2 className="font-handwriting text-5xl text-foreground mb-2">
              {member.name}
            </h2>
            <div className="w-24 h-1 bg-accent mb-8" />

            {/* Bio Section */}
            <div className="mb-8">
              <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Background
              </h3>
              <p className="text-lg text-foreground/90 leading-relaxed">
                {member.bio}
              </p>
            </div>

            {/* Mission Section */}
            <div className="mb-8">
              <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Mission
              </h3>
              <p className="text-lg text-foreground/90 leading-relaxed italic">
                "{member.mission}"
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Connect
              </h3>
              <div className="flex gap-3">
                {member.socials.instagram && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-border hover:border-accent hover:text-accent transition-colors"
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
                    className="border-border hover:border-accent hover:text-accent transition-colors"
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
                    className="border-border hover:border-accent hover:text-accent transition-colors"
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

            {/* Decorative Elements */}
            <div className="absolute bottom-4 right-4 opacity-10">
              <div className="font-heading text-6xl font-black text-foreground">
                MITA
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MemberDossier;

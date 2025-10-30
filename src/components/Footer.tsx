import { Button } from "@/components/ui/button";
import { Mail, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Step In?</h2>
          <p className="text-lg mb-8 text-primary-foreground/90">
            The arena is waiting. Join us for your first workout and discover what you're capable of.
          </p>
          <Button 
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground mb-12"
          >
            Join Now
          </Button>

          <div className="border-t border-primary-foreground/20 pt-8">
            <div className="flex justify-center gap-6 mb-6">
              <a href="mailto:contact@meninthearena.com" className="hover:text-accent transition-colors">
                <Mail className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-primary-foreground/70">
              © {new Date().getFullYear()} Men in the Arena. All rights reserved.
            </p>
            <p className="text-xs text-primary-foreground/60 mt-2">
              "It is not the critic who counts... The credit belongs to the man who is actually in the arena."
              <br />— Theodore Roosevelt
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

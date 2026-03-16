import switchbackLogo from "@/assets/sponsors/switchback.png";
import myfitfoodsLogo from "@/assets/sponsors/myfitfoods.webp";
import goruckLogo from "@/assets/sponsors/goruck.png";
import dottirLogo from "@/assets/sponsors/dottir.webp";

const sponsors = [
  { name: "Switchback", logo: switchbackLogo },
  { name: "My Fit Foods", logo: myfitfoodsLogo },
  { name: "GORUCK", logo: goruckLogo },
  { name: "Dóttir", logo: dottirLogo },
];

// Duplicate for seamless loop
const marqueeItems = [...sponsors, ...sponsors];

export default function SponsorMarquee() {
  return (
    <section className="py-12 md:py-16 bg-[#0f0f0f] border-t border-b border-white/[0.06] overflow-hidden">
      <p className="text-center text-[10px] uppercase tracking-[0.5em] text-[#e3e1d9]/30 font-bold mb-8">
        Our Partners
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0f0f0f] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0f0f0f] to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee hover:[animation-play-state:paused] w-max">
          {marqueeItems.map((sponsor, i) => (
            <div
              key={`${sponsor.name}-${i}`}
              className="flex-shrink-0 px-[30px] md:px-[30px] flex items-center justify-center"
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-8 md:h-12 w-auto max-w-[140px] md:max-w-[180px] object-contain brightness-0 invert opacity-100 hover:filter-none transition-all duration-300"
                style={{ filter: "brightness(0) invert(1)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(0) invert(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

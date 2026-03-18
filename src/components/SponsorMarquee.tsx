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

const repeated = [...sponsors, ...sponsors, ...sponsors];

export default function SponsorMarquee() {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-[#0f0f0f] border-t border-b border-white/[0.06] overflow-hidden">
      <p className="text-center text-[10px] uppercase tracking-[0.4em] text-[#8a1c1c] font-bold mb-6 sm:mb-8">
        Our Partners
      </p>
      <div
        className="overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div className="flex animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none w-max">
          {repeated.map((sponsor, i) => (
            <div
              key={`a-${sponsor.name}-${i}`}
              className="flex-shrink-0 px-6 sm:px-8 md:px-10 lg:px-12 flex items-center justify-center"
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-8 sm:h-10 md:h-14 lg:h-16 w-auto max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[300px] object-contain transition-all duration-300"
                style={{ filter: "brightness(0) invert(1)" }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = "none"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(0) invert(1)"; }}
              />
            </div>
          ))}
          {repeated.map((sponsor, i) => (
            <div
              key={`b-${sponsor.name}-${i}`}
              className="flex-shrink-0 px-6 sm:px-8 md:px-10 lg:px-12 flex items-center justify-center"
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-8 sm:h-10 md:h-14 lg:h-16 w-auto max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[300px] object-contain transition-all duration-300"
                style={{ filter: "brightness(0) invert(1)" }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = "none"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(0) invert(1)"; }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import switchbackLogo from "@/assets/sponsors/switchback.png";
import myfitfoodsLogo from "@/assets/sponsors/myfitfoods.webp";
import goruckLogo from "@/assets/sponsors/goruck.png";
import dottirLogo from "@/assets/sponsors/dottir.webp";
import vivLogo from "@/assets/sponsors/viv_logo_stacked.png";
import ScrollReveal from "@/components/ScrollReveal";

const topRow = [
  { name: "Switchback", logo: switchbackLogo },
  { name: "GORUCK", logo: goruckLogo },
  { name: "Dóttir", logo: dottirLogo },
];

const bottomRow = [
  { name: "My Fit Foods", logo: myfitfoodsLogo },
  { name: "VIV", logo: vivLogo },
];

function LogoItem({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex items-center justify-center">
      <img
        src={logo}
        alt={name}
        className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto max-w-[140px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-[280px] object-contain transition-all duration-300"
        style={{ filter: "brightness(0) invert(1)" }}
        onMouseEnter={(e) => { e.currentTarget.style.filter = "none"; }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(0) invert(1)"; }}
      />
    </div>
  );
}

export default function SponsorLogos() {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-[#0f0f0f] border-t border-b border-white/[0.06]">
      <div className="container px-4 mx-auto">
        <ScrollReveal>
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-[#8a1c1c] font-bold mb-8 sm:mb-10">
            Our Partners
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex flex-col items-center gap-8 sm:gap-10 md:gap-12">
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-12 md:gap-16 lg:gap-20">
              {topRow.map((sponsor) => (
                <LogoItem key={sponsor.name} {...sponsor} />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-12 md:gap-16 lg:gap-20">
              {bottomRow.map((sponsor) => (
                <LogoItem key={sponsor.name} {...sponsor} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

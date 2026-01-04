import { motion } from "framer-motion";
import { Member } from "@/data/members";

interface PolaroidCardProps {
  member: Member;
  isActive: boolean;
  onClick: () => void;
}

const PolaroidCard = ({ member, isActive, onClick }: PolaroidCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      className="cursor-pointer select-none"
      whileHover={{ scale: isActive ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Polaroid Frame */}
      <div
        className={`
          relative bg-white p-3 pb-14
          shadow-[0_4px_20px_rgba(0,0,0,0.4)]
          transition-shadow duration-300
          ${isActive ? "shadow-[0_8px_30px_rgba(0,0,0,0.6)]" : ""}
        `}
        style={{
          // Subtle paper texture via noise
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      >
        {/* Photo Container */}
        <div className="relative w-44 h-52 overflow-hidden bg-gray-200">
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover grayscale contrast-110"
            draggable={false}
          />
          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]" />
        </div>

        {/* Handwritten Name */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="font-handwriting text-2xl text-gray-800 tracking-wide">
            {member.name}
          </span>
        </div>

        {/* Corner wear effect */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-gray-100 to-transparent opacity-50" />
      </div>
    </motion.div>
  );
};

export default PolaroidCard;

export interface Member {
  id: string;
  name: string;
  photo: string;
  role: string;
  bio: string;
  mission: string;
  socials: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

// Mock data - will be replaced with Airtable integration
export const members: Member[] = [
  {
    id: "1",
    name: "Marcus",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
    role: "Founder",
    bio: "Former Marine. Father of three. Started this brotherhood because too many men are fighting their battles alone.",
    mission: "To build men who lead their families with strength and their communities with purpose.",
    socials: {
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "2",
    name: "David",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
    role: "Lead Coach",
    bio: "15 years in strength & conditioning. Believes the iron teaches lessons that nothing else can.",
    mission: "Help men discover what they're truly capable of when they stop making excuses.",
    socials: {
      instagram: "https://instagram.com",
    },
  },
  {
    id: "3",
    name: "James",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
    role: "Spiritual Director",
    bio: "Pastor and counselor. Lost his father at 12, found his calling helping other men find theirs.",
    mission: "Guide men toward purpose greater than themselves.",
    socials: {
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
    },
  },
  {
    id: "4",
    name: "Anthony",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face",
    role: "Operations",
    bio: "Small business owner. Joined seeking accountability, stayed to help build something bigger.",
    mission: "Create systems that help men show up consistently.",
    socials: {
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "5",
    name: "Michael",
    photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop&crop=face",
    role: "Community Lead",
    bio: "Recovery advocate. 8 years sober. Knows firsthand that men need other men to make it.",
    mission: "Build bridges for men who feel they've burned them all.",
    socials: {
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com",
    },
  },
];

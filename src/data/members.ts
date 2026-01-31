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

export const members: Member[] = [
  {
    id: "1",
    name: "Yash Chitneni",
    photo: "/members/yash.jpg",
    role: "Co-Founder",
    bio: "Builder, community architect, and fitness enthusiast. Son of Indian immigrants who taught him that the hardest things in life are the most worth doing. Created MITA because he saw too many men suffering in silence.",
    mission: "Engineer serendipity — create the conditions where unexpected growth, connection, and meaning emerge for every man who steps into the arena.",
    socials: {
      instagram: "https://instagram.com/yashchitneni",
      twitter: "https://x.com/yashchitneni",
      linkedin: "https://linkedin.com/in/yashchitneni",
    },
  },
  {
    id: "2",
    name: "Braydon Alley",
    photo: "/members/braydon.jpg",
    role: "Co-Founder",
    bio: "Endurance athlete and relentless organizer. Bray brings the energy that turns a group workout into a movement. If there's a ruck to plan or a challenge to set, he's already three steps ahead.",
    mission: "Build a brotherhood where men hold each other accountable to become the best versions of themselves — physically, mentally, and spiritually.",
    socials: {
      instagram: "https://instagram.com/braydonalley",
    },
  },
  {
    id: "3",
    name: "CJ Finley",
    photo: "/members/cj.jpg",
    role: "Co-Founder",
    bio: "Entrepreneur and wellness advocate. CJ's journey through personal transformation fuels his passion for helping other men find their path. He brings depth, vulnerability, and strategic thinking to the brotherhood.",
    mission: "Create spaces where men can be real, push their limits, and discover strength they didn't know they had.",
    socials: {
      instagram: "https://instagram.com/cjfinley",
      linkedin: "https://linkedin.com/in/cjfinley",
    },
  },
  {
    id: "4",
    name: "Jack Lesser",
    photo: "/members/jack.jpg",
    role: "Co-Founder",
    bio: "Community builder and connector. Jack has a gift for making every person feel like they belong. His steady presence and servant leadership are the backbone of MITA's culture.",
    mission: "Ensure no man walks alone. Build the kind of brotherhood where showing up is the only requirement and growth is the guarantee.",
    socials: {
      instagram: "https://instagram.com/jacklesser",
    },
  },
];

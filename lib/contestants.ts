export type Contestant = {
  id: string;
  name: string;
  hometown: string;
  bio: string;
  image_url: string;
  votes: number;
};

// Real roster from the Figma design. Photos aren't fetchable from this
// environment — see README for the exact filenames to drop into
// public/images/contestants/ once exported from Figma.
export const MOCK_CONTESTANTS: Contestant[] = [
  {
    id: "benjamin-sum",
    name: "Benjamin Sum",
    hometown: "Falam, Chin State",
    bio: "A rising vocalist from Falam bringing bold, modern energy to the stage.",
    image_url: "/images/contestants/benjamin-sum.jpg",
    votes: 4213,
  },
  {
    id: "esther-dawt-chin-sung",
    name: "Esther Dawt Chin Sung",
    hometown: "Hakha, Chin State",
    bio: "A warm, expressive voice from Hakha with a gift for ballads.",
    image_url: "/images/contestants/esther-dawt-chin-sung.jpg",
    votes: 3897,
  },
  {
    id: "angela-van-ro-sung",
    name: "Angela Van Ro Sung",
    hometown: "Falam, Chin State",
    bio: "A powerhouse performer known for commanding stage presence.",
    image_url: "/images/contestants/angela-van-ro-sung.jpg",
    votes: 3564,
  },
  {
    id: "joshua-van",
    name: "Joshua Van",
    hometown: "Hakha, Chin State",
    bio: "A versatile singer from Hakha blending traditional and contemporary styles.",
    image_url: "/images/contestants/joshua-van.jpg",
    votes: 2988,
  },
];

export type PanelMember = {
  id: string;
  name: string;
  role: string;
  image_url: string;
};

export const MOCK_PANEL: PanelMember[] = [
  { id: "van-ceu-uk", name: "Van Ceu Uk", role: "Judge", image_url: "/images/panel/van-ceu-uk.jpg" },
  { id: "esther-van-hnem-sung", name: "Esther Van Hnem Sung", role: "Judge", image_url: "/images/panel/esther-van-hnem-sung.jpg" },
  { id: "simon-ci-lian", name: "Simon Ci Lian", role: "Judge", image_url: "/images/panel/simon-ci-lian.jpg" },
  { id: "steven-cung-bik", name: "Steven Cung Bik", role: "Host", image_url: "/images/panel/steven-cung-bik.jpg" },
];

const PRICE_PER_VOTE_USD = 1;
export const VOTE_PRICE_CENTS = PRICE_PER_VOTE_USD * 100;

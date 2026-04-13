export type MockChef = {
  id: string;
  name: string;
  category: string;
  location: string;
  city: string;
  state: string;
  distance: string;
  image: string;
  lat: number;
  lng: number;
};

export const mockChefs: MockChef[] = [
  {
    id: "1",
    name: "Coastal Prep Kitchen",
    category: "Meals",
    location: "Back Bay",
    city: "Boston",
    state: "MA",
    distance: "1.2 mi",
    image: "/images/chefs/coastal-prep-2.png",
    lat: 42.3505,
    lng: -71.0810,
  },
  {
    id: "2",
    name: "Chef Anna Weekly Prep",
    category: "Weekly Meal Prep",
    location: "Cambridge",
    city: "Cambridge",
    state: "MA",
    distance: "2.8 mi",
    image: "/images/chefs/prep.webp",
    lat: 42.3736,
    lng: -71.1097,
  },
  {
    id: "3",
    name: "Luxury Event Catering Co.",
    category: "Catering Platters",
    location: "Seaport",
    city: "Boston",
    state: "MA",
    distance: "4.1 mi",
    image: "/images/chefs/catering.webp",
    lat: 42.3489,
    lng: -71.0383,
  },
];
export type MenuItem = {
  name: string;
  price?: string;
  description?: string;
};

export type ChefMenu = {
  meals: MenuItem[];
  weekly: MenuItem[];
  catering: MenuItem[];
};

export type MockChef = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  category: string;
  location: string;
  city: string;
  state: string;
  distance: string;
  rating: string;
  reviews: number;
  responseTime: string;
  image: string;
  lat: number;
  lng: number;
  menu: ChefMenu;
};

export const mockChefs: MockChef[] = [
  {
    id: "1",
    slug: "coastal-prep-kitchen",
    name: "Coastal Prep Kitchen",
    bio: "Fresh, locally sourced weekly meal prep and catering by a classically trained chef. Specializing in clean, balanced plates that actually taste amazing.",
    category: "Meals",
    location: "Back Bay",
    city: "Boston",
    state: "MA",
    distance: "1.2 mi",
    rating: "4.9",
    reviews: 128,
    responseTime: "Usually responds in 1 hr",
    image: "/images/chefs/coastal-prep-2.png",
    lat: 42.3505,
    lng: -71.0810,
    menu: {
      meals: [
        { name: "Salmon Power Bowl", price: "$18", description: "Grilled salmon, quinoa, roasted veggies" },
        { name: "Lemon Herb Chicken", price: "$16", description: "Free-range chicken, herb sauce, roasted potatoes" },
        { name: "Vegan Buddha Bowl", price: "$15", description: "Chickpeas, tahini, seasonal vegetables, brown rice" },
      ],
      weekly: [
        { name: "3 Meals / Week", price: "$95/wk", description: "Perfect for solo meal prep" },
        { name: "5 Meals / Week", price: "$149/wk", description: "Full week covered" },
        { name: "Family Meal Plan", price: "$229/wk", description: "Feeds 4, varied menu each week" },
      ],
      catering: [
        { name: "Raw Bar Package", price: "From $350", description: "Oysters, shrimp cocktail, clams" },
        { name: "Seafood Boil Tray", price: "From $280", description: "Lobster, crab, corn, potatoes" },
        { name: "Brunch Platter", price: "From $200", description: "Pastries, fruit, quiche, smoked salmon" },
      ],
    },
  },
  {
    id: "2",
    slug: "chef-anna-weekly-prep",
    name: "Chef Anna Weekly Prep",
    bio: "Personal chef with 10+ years experience in Mediterranean and plant-based cuisine. Weekly meal plans tailored to your dietary needs.",
    category: "Weekly Meal Prep",
    location: "Cambridge",
    city: "Cambridge",
    state: "MA",
    distance: "2.8 mi",
    rating: "4.8",
    reviews: 94,
    responseTime: "Usually responds in 2 hrs",
    image: "/images/chefs/prep.webp",
    lat: 42.3736,
    lng: -71.1097,
    menu: {
      meals: [
        { name: "Chicken Mediterranean", price: "$17", description: "Grilled chicken, olives, feta, roasted peppers" },
        { name: "Lentil Soup + Pita", price: "$13", description: "Hearty red lentil, house-baked pita" },
        { name: "Stuffed Bell Peppers", price: "$16", description: "Ground turkey, wild rice, tomato sauce" },
      ],
      weekly: [
        { name: "3 Meals / Week", price: "$89/wk", description: "Great starter plan" },
        { name: "5 Meals / Week", price: "$139/wk", description: "Full week meal prep" },
        { name: "Couples Plan", price: "$179/wk", description: "5 meals for two people" },
      ],
      catering: [
        { name: "Mediterranean Spread", price: "From $250", description: "Hummus, mezze, pita, dips" },
        { name: "Sandwich Platter", price: "From $150", description: "Assorted gourmet sandwiches" },
        { name: "Salad Bar Setup", price: "From $180", description: "Build-your-own salad for events" },
      ],
    },
  },
  {
    id: "3",
    slug: "luxury-event-catering",
    name: "Luxury Event Catering Co.",
    bio: "Upscale event catering for weddings, corporate events, and private parties. We handle everything from setup to cleanup.",
    category: "Catering Platters",
    location: "Seaport",
    city: "Boston",
    state: "MA",
    distance: "4.1 mi",
    rating: "5.0",
    reviews: 61,
    responseTime: "Usually responds same day",
    image: "/images/chefs/catering.webp",
    lat: 42.3489,
    lng: -71.0383,
    menu: {
      meals: [
        { name: "Filet Mignon Bites", price: "$28", description: "Beef tenderloin, truffle aioli, crostini" },
        { name: "Lobster Bisque", price: "$22", description: "Rich, creamy Maine lobster bisque" },
        { name: "Tuna Tartare", price: "$24", description: "Sushi-grade tuna, avocado, wonton crisps" },
      ],
      weekly: [
        { name: "Executive Lunch Plan", price: "$199/wk", description: "5 premium lunches delivered to your office" },
        { name: "Private Dinner Plan", price: "$349/wk", description: "3 chef-prepared dinners at home" },
        { name: "Full Service Plan", price: "$499/wk", description: "Daily meals + weekend event catering" },
      ],
      catering: [
        { name: "Full Event Package", price: "From $2,000", description: "Complete setup, staff, and cleanup included" },
        { name: "Cocktail Hour Spread", price: "From $600", description: "Passed appetizers + display stations" },
        { name: "Wedding Buffet", price: "From $1,200", description: "Custom menu, full service for up to 50 guests" },
      ],
    },
  },
];
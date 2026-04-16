export type MenuItem = {
  name: string;
  price?: string;
  ingredients?: string;
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
  avatar: string;
  tags: string[];
  availability: { day: string; available: boolean }[];
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
    avatar: "/images/chefs/avatars/coastal-avatar.jpg",
    tags: ["🐟 Seafood", "🌱 Vegan Options", "🥗 Gluten-Free"],
    availability: [
      { day: "Mon", available: true },
      { day: "Tue", available: true },
      { day: "Wed", available: false },
      { day: "Thu", available: true },
      { day: "Fri", available: true },
      { day: "Sat", available: false },
      { day: "Sun", available: false },
    ],
    lat: 42.3505,
    lng: -71.0810,
    menu: {
      meals: [
        { name: "Salmon Power Bowl", price: "$18", ingredients: "Salmon, quinoa, tahini, roasted broccoli, cherry tomatoes", description: "Wild-caught salmon fillets pan-seared in garlic butter, served over fluffy quinoa with lemon-roasted broccoli, cherry tomatoes, and a drizzle of house tahini sauce." },
        { name: "Lemon Herb Chicken", price: "$16", ingredients: "Free-range chicken, lemon, rosemary, garlic, smashed potatoes", description: "Free-range chicken breast marinated overnight in lemon zest, fresh rosemary, and garlic, then roasted until golden. Served with crispy smashed potatoes and a white wine herb reduction." },
        { name: "Vegan Buddha Bowl", price: "$15", ingredients: "Chickpeas, sweet potato, brown rice, tahini, purple cabbage", description: "Crispy roasted chickpeas and sweet potato over brown rice, topped with shredded purple cabbage, sliced cucumber, and a creamy house-made tahini dressing with sesame seeds." },
      ],
      weekly: [
        { name: "3 Meals / Week", price: "$95/wk", description: "Three chef-prepped meals portioned for one, delivered fresh every Monday. Menu rotates weekly based on seasonal ingredients." },
        { name: "5 Meals / Week", price: "$149/wk", description: "Your full work week covered. Five balanced meals designed by our chef, vacuum-sealed and ready to heat in under 5 minutes." },
        { name: "Family Meal Plan", price: "$229/wk", description: "Five generous meals portioned for a family of four. Includes kid-friendly options and full reheating instructions with each delivery." },
      ],
      catering: [
        { name: "Raw Bar Package", price: "From $350", description: "Freshly shucked local oysters on ice, chilled jumbo shrimp cocktail with house remoulade, and littleneck clams with mignonette. Served on a beautiful display tray." },
        { name: "Seafood Boil Tray", price: "From $280", description: "A New England-style boil featuring whole Maine lobster, snow crab legs, corn on the cob, red potatoes, and andouille sausage, all seasoned with our signature Old Bay butter." },
        { name: "Brunch Platter", price: "From $200", description: "House-baked croissants and pastries, fresh fruit display, mini quiches with gruyère, and a cold smoked salmon board with capers, red onion, and cream cheese." },
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
    avatar: "/images/chefs/avatars/anna-avatar.jpg",
    tags: ["🌱 Vegan", "🫒 Mediterranean", "🌾 Gluten-Free"],
    availability: [
      { day: "Mon", available: true },
      { day: "Tue", available: false },
      { day: "Wed", available: true },
      { day: "Thu", available: true },
      { day: "Fri", available: false },
      { day: "Sat", available: true },
      { day: "Sun", available: false },
    ],
    lat: 42.3736,
    lng: -71.1097,
    menu: {
      meals: [
        { name: "Chicken Mediterranean", price: "$17", ingredients: "Chicken thighs, olives, feta, roasted peppers, lemon, oregano", description: "Tender chicken thighs slow-roasted with Kalamata olives, roasted red peppers, artichoke hearts, and crumbled feta, finished with a squeeze of lemon and fresh oregano." },
        { name: "Lentil Soup + Pita", price: "$13", ingredients: "Red lentils, cumin, harissa, crispy onions, house-baked pita", description: "Red lentils simmered low and slow with cumin, coriander, and a touch of harissa, topped with a swirl of olive oil and crispy fried onions. Served with house-baked warm pita." },
        { name: "Stuffed Bell Peppers", price: "$16", ingredients: "Bell peppers, ground turkey, wild rice, sun-dried tomatoes, pine nuts", description: "Colorful bell peppers packed with seasoned ground turkey, wild rice, sun-dried tomatoes, and pine nuts, baked in a rich tomato-herb sauce until tender." },
      ],
      weekly: [
        { name: "3 Meals / Week", price: "$89/wk", description: "A great way to start — three chef-crafted Mediterranean meals tailored to your dietary preferences, portioned and labeled for easy reheating." },
        { name: "5 Meals / Week", price: "$139/wk", description: "Five diverse meals covering your full week, featuring rotating seasonal ingredients. Includes a weekly menu card with nutrition info." },
        { name: "Couples Plan", price: "$179/wk", description: "Five meals portioned for two, with optional dietary customization per person. Perfect for couples with different preferences." },
      ],
      catering: [
        { name: "Mediterranean Spread", price: "From $250", description: "An abundant table of house-made hummus, smoky baba ganoush, tabbouleh, stuffed grape leaves, warm pita, and assorted pickled vegetables. Serves 10–15 guests." },
        { name: "Sandwich Platter", price: "From $150", description: "A selection of gourmet sandwiches on freshly baked bread — think roasted turkey with pesto, caprese with burrata, and smoked salmon with cucumber cream cheese." },
        { name: "Salad Bar Setup", price: "From $180", description: "A fully stocked build-your-own salad station with grilled proteins, roasted grains, seasonal toppings, and four house dressings. Great for office events." },
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
    avatar: "/images/chefs/avatars/luxury-avatar.jpg",
    tags: ["🥩 Premium Meats", "🦞 Seafood", "🍾 Events"],
    availability: [
      { day: "Mon", available: false },
      { day: "Tue", available: true },
      { day: "Wed", available: true },
      { day: "Thu", available: true },
      { day: "Fri", available: true },
      { day: "Sat", available: true },
      { day: "Sun", available: true },
    ],
    lat: 42.3489,
    lng: -71.0383,
    menu: {
      meals: [
        { name: "Filet Mignon Bites", price: "$28", ingredients: "Beef tenderloin, truffle aioli, crostini, microgreens", description: "Center-cut beef tenderloin seared in a cast iron pan with herb butter, sliced tableside and served on toasted crostini with house-made truffle aioli and microgreens." },
        { name: "Lobster Bisque", price: "$22", ingredients: "Maine lobster, sherry, cream, tarragon, cayenne", description: "A silky, cream-based bisque made from whole Maine lobster shells, slow-simmered with sherry, tarragon, and a touch of cayenne. Finished with a chunk of fresh lobster tail." },
        { name: "Tuna Tartare", price: "$24", ingredients: "Yellowfin tuna, avocado, sesame oil, ponzu, wonton crisps", description: "Sushi-grade yellowfin tuna hand-cut and seasoned with sesame oil, ponzu, and chili, served over sliced avocado with crispy wonton chips and a drizzle of sriracha mayo." },
      ],
      weekly: [
        { name: "Executive Lunch Plan", price: "$199/wk", description: "Five premium restaurant-quality lunches delivered to your office or home. Each meal is plated elegantly and includes a printed menu card." },
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
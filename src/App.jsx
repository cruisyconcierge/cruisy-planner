import React, { useState, useEffect } from 'react';
import { 
  MapPin, Calendar, DollarSign, Plane, Hotel, 
  Sun, Star, Save, User, ArrowRight, Check, Loader2, 
  X, Ship, ShoppingBag, ExternalLink, Ticket, 
  ChevronRight, Globe, Plus, Trash2, Clock, Search, Home, Mail, Printer, CheckSquare, Square, Car, Utensils, Info, ChevronDown, ShieldCheck,
  Palmtree, Martini, Mountain, Heart // Icons for Wizard
} from 'lucide-react';

// --- 1. CONFIGURATION & CONSTANTS ---

const BRAND = {
  primary: '#34a4b8',
  primaryHover: '#2a8a9b',
  fontHeader: '"Russo One", sans-serif',
  fontBody: '"Roboto", sans-serif',
  logoUrl: 'https://cruisytravel.com/wp-content/uploads/2024/01/cropped-20240120_025955_0000.png'
};

// --- EMAIL SETTINGS ---
const CONCIERGE_EMAIL = "hello@cruisytravel.com";

const AVAILABLE_DESTINATIONS = [
  "Key West, Florida",
  "Nassau, Bahamas",
  "St Thomas, US Virgin Islands",
  "Honolulu, Hawaii",
  "Cozumel, Mexico",
  "Sydney, Australia",
  "Barcelona, Spain",
  "Chania, Crete (Greece)",
  "Orlando, Florida",
  "Miami, Florida",
  "Somewhere Else" // Triggers the Wizard
];

// MANUAL URL OVERRIDES
const DESTINATION_URLS = {
  "Key West": "https://cruisytravel.com/key-west-activities/",
  "Nassau": "https://cruisytravel.com/nassau-activities/",
};

// Map IDs to Icons for Checklist
const ICON_MAP = {
  flight: Plane,
  hotel: Hotel,
  car: Car,
  dining: Utensils,
  insurance: ShieldCheck
};

// --- GLOBAL GEAR (Affiliate Links) ---
const GLOBAL_GEAR = [
  { 
    name: 'Vacation Classic Sunscreen SPF 30 (3-Pack)', 
    price: 38, 
    image: 'https://cruisytravel.com/wp-content/uploads/2025/12/71WTuq9sQxL._SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/3KmfiQ2' 
  },
  { 
    name: 'UGREEN MagFlow Power Bank 10000mAh', 
    price: 49, 
    image: 'https://cruisytravel.com/wp-content/uploads/2025/12/51Motba1XL._AC_SY741_.jpg', 
    affiliateLink: 'https://amzn.to/49X8gvo' 
  },
];

// --- 2. API LOGIC ---

const fetchRealActivities = async (destinationSelection) => {
  try {
    const searchTerm = destinationSelection.split(',')[0].trim();
    
    // 1. Fetch Location Hub
    const destRes = await fetch(`https://cruisytravel.com/wp-json/wp/v2/locations?search=${searchTerm}&acf_format=standard`);
    const destData = await destRes.json();
    
    const hub = destData.length > 0 ? destData[0] : {}; 
    const acf = hub.acf || {};

    // 2. Fetch Activities
    const actRes = await fetch(`https://cruisytravel.com/wp-json/wp/v2/itineraries?search=${searchTerm}&_embed&per_page=20&acf_format=standard`);
    const actData = await actRes.json();

    // 3. Map WordPress Data
    const mappedActivities = actData.map(post => {
      const img = post._embedded?.['wp:featuredmedia']?.[0]?.source_url 
        || 'https://via.placeholder.com/600x400?text=No+Image';

      let bookUrl = post.acf?.booking_url;
      if (!bookUrl || bookUrl === "#") bookUrl = null;

      return {
        id: post.id,
        title: post.title.rendered,
        image: img,
        price: Number(post.acf?.price) || 0,
        duration: post.acf?.duration || "Varies",
        category: post.acf?.category || "Activity",
        excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, ''), 
        description: post.content.rendered, 
        bookingUrl: bookUrl,
        tags: [] 
      };
    });

    // 4. DYNAMIC PARTNER LOGIC (Hotels)
    const potentialStays = [
      { name: "Booking.com", key: "booking_link", icon: Hotel, color: "#003580" },
      { name: "Vrbo", key: "vrbo_link", icon: Home, color: "#1e3a8a" },
      { name: "Hotels.com", key: "hotels_link", icon: Hotel, color: "#d32f2f" },
      { name: "Expedia", key: "expedia_link", icon: Plane, color: "#FFD700", textColor: "#000" },
      { name: "Orbitz", key: "orbitz_link", icon: Globe, color: "#005e83" },
      { name: "Travelocity", key: "travelocity_link", icon: Star, color: "#003a70" },
      { name: "Trivago", key: "trivago_link", icon: Search, color: "#f48f00" }
    ];

    let stayPartners = potentialStays
      .filter(p => acf[p.key]) 
      .map(p => ({ ...p, url: acf[p.key], textColor: p.textColor || "white" }));
      
    // Fallback if no hotel links provided
    if (stayPartners.length === 0) {
       stayPartners = [{
          name: "Find Hotels",
          icon: Hotel,
          color: "#003580",
          textColor: "white",
          url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchTerm)}`
       }];
    }

    // 5. DYNAMIC PARTNER LOGIC (Flights)
    const potentialFlights = [
      { name: "Kiwi.com", key: "kiwi_flight_link", icon: Plane, color: "#00a991" },
      { name: "Booking.com Flights", key: "booking_flight_link", icon: Plane, color: "#003580" },
      { name: "Expedia Flights", key: "expedia_flight_link", icon: Plane, color: "#FFD700", textColor: "#000" }
    ];

    let flightPartners = potentialFlights
      .filter(p => acf[p.key])
      .map(p => ({ ...p, url: acf[p.key], textColor: p.textColor || "white" }));
    
    // Fallback Flight Link
    let genericFlightLink = acf.flight_affiliate_link || `https://www.skyscanner.com/transport/flights/to/${searchTerm.substring(0,3)}`;
    
    if (flightPartners.length === 0) {
        flightPartners = [{
            name: "Check Flights",
            icon: Plane,
            color: "#00a991",
            textColor: "white",
            url: genericFlightLink
        }];
    }

    // 6. DYNAMIC PARTNER LOGIC (Cars)
    const potentialCars = [
      { name: "Carla Car Rentals", key: "carl_rental_link", icon: Car, color: "#ff5a00" },
      { name: "Holiday Autos", key: "holiday_autos_link", icon: Car, color: "#0073ce" }
    ];

    let carPartners = potentialCars
      .filter(p => acf[p.key])
      .map(p => ({ ...p, url: acf[p.key], textColor: p.textColor || "white" }));

    let genericCarLink = acf.car_affiliate_link || `https://www.rentalcars.com/search-results?locationName=${encodeURIComponent(searchTerm)}`;
    
    if (carPartners.length === 0) {
        carPartners = [{
            name: "Find Rental Cars",
            icon: Car,
            color: "#ff5a00",
            textColor: "white",
            url: genericCarLink
        }];
    }

    // Check for manual override, then hub link, then search fallback
    const destinationUrl = DESTINATION_URLS[searchTerm] || hub.link || `https://cruisytravel.com/?s=${searchTerm}`;

    return {
      destinationName: hub.title?.rendered || searchTerm, 
      destinationPageUrl: destinationUrl,
      stayPartners,
      flightPartners,
      carPartners,
      diningLink: acf.dining_link || `https://cruisytravel.com/?s=${searchTerm}+dining`,
      activities: mappedActivities,
    };

  } catch (error) {
    console.error("WP Fetch Error:", error);
    return { error: true, message: error.message }; 
  }
};

// --- 3. UI COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', type='button', disabled = false, fullWidth = false, style={} }) => {
  const baseStyle = `px-6 py-3 rounded-lg font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} print:hidden`;
  const variants = {
    primary: `text-white hover:brightness-110`,
    outline: `border-2 bg-transparent hover:bg-gray-50`,
    ghost: `bg-transparent shadow-none hover:bg-gray-100 text-gray-600`,
    action: `bg-[#ff8c00] text-white hover:brightness-110 shadow-lg` 
  };
  const mergedStyle = variant === 'primary' 
    ? { backgroundColor: BRAND.primary, ...style } 
    : variant === 'outline' ? { borderColor: BRAND.primary, color: BRAND.primary, ...style } : style;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} style={mergedStyle}>{children}</button>;
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className} print:shadow-none print:border-none`}>{children}</div>
);

// --- 4. SUB-VIEWS ---

// Helper components for Wizard (Defined OUTSIDE WizardView to prevent focus loss)
const WizardStep = ({ title, children }) => (
  <div className="animate-fade-in">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: BRAND.fontHeader }}>{title}</h2>
    {children}
  </div>
);

const OptionButton = ({ label, icon: Icon, selected, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
      selected 
      ? `border-[${BRAND.primary}] bg-blue-50 text-[${BRAND.primary}] shadow-md` 
      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
    }`}
    style={selected ? { borderColor: BRAND.primary, color: BRAND.primary } : {}}
  >
    <div className={`p-2 rounded-full ${selected ? 'bg-white' : 'bg-gray-100'}`}>
      <Icon size={24} />
    </div>
    <span className="font-bold text-lg">{label}</span>
  </button>
);

// --- NEW WIZARD COMPONENT ---
const WizardView = ({ setView }) => {
  const [step, setStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    destination: '',
    vibe: '',
    activityType: '',
    stayType: '',
    dates: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => step === 0 ? setView('search') : setStep(step - 1);
  
  const handleFinish = () => {
    // Better Email Format
    const subject = `🌴 New Trip Request: ${wizardData.destination || 'Custom Destination'}`;
    const body = `Hi Cruisy Travel,\n\nI am interested in planning a new trip! Here are my details:\n\n` +
      `------------------------------------------\n` +
      `📍 DESTINATION:\n${wizardData.destination}\n\n` +
      `✨ VIBE:\n${wizardData.vibe}\n\n` +
      `🚣 ACTIVITIES:\n${wizardData.activityType}\n\n` +
      `🏨 STAY PREFERENCE:\n${wizardData.stayType}\n\n` +
      `📅 DATES:\n${wizardData.dates}\n` +
      `------------------------------------------\n\n` +
      `Please contact me with some options. Thanks!`;

    window.location.href = `mailto:${CONCIERGE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsSubmitted(true);
  };

  const updateData = (key, value) => setWizardData(prev => ({...prev, [key]: value}));

  // Success View after sending email
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in">
        <Card className="p-12 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
            <Check size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: BRAND.fontHeader }}>Request Sent!</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-md">
            Thanks for sharing your travel dreams. Your email app should have opened a draft for you to send. We'll be in touch shortly!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
             <Button variant="outline" onClick={() => setIsSubmitted(false)}>Back</Button>
             <Button onClick={() => setView('search')}>Plan Another Trip</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / 5) * 100}%`, backgroundColor: BRAND.primary }}
        ></div>
      </div>

      <Card className="p-8 shadow-2xl relative min-h-[400px] flex flex-col">
        {step === 0 && (
          <WizardStep title="Where do you want to go?">
             <input 
               type="text" 
               placeholder="e.g. Bora Bora, Japan, The Moon..."
               className="w-full text-xl border-b-2 border-gray-200 py-3 focus:border-[#34a4b8] outline-none"
               value={wizardData.destination}
               onChange={(e) => updateData('destination', e.target.value)}
             />
             <p className="text-gray-400 mt-4 text-sm">Since we don't have a curated guide for this yet, tell us where you're dreaming of!</p>
          </WizardStep>
        )}

        {step === 1 && (
          <WizardStep title="What's the vibe?">
            <div className="space-y-3">
              <OptionButton icon={Palmtree} label="Chill & Relax" selected={wizardData.vibe === 'Chill'} onClick={() => updateData('vibe', 'Chill')} />
              <OptionButton icon={Martini} label="Party & Nightlife" selected={wizardData.vibe === 'Party'} onClick={() => updateData('vibe', 'Party')} />
              <OptionButton icon={Mountain} label="Adventure & Active" selected={wizardData.vibe === 'Adventure'} onClick={() => updateData('vibe', 'Adventure')} />
              <OptionButton icon={Heart} label="Romantic Getaway" selected={wizardData.vibe === 'Romantic'} onClick={() => updateData('vibe', 'Romantic')} />
            </div>
          </WizardStep>
        )}

        {step === 2 && (
          <WizardStep title="What do you want to do?">
             <textarea 
               className="w-full border-2 border-gray-100 rounded-xl p-4 h-32 focus:border-[#34a4b8] outline-none resize-none"
               placeholder="e.g. Snorkeling, hiking, food tours, museum hopping..."
               value={wizardData.activityType}
               onChange={(e) => updateData('activityType', e.target.value)}
             ></textarea>
          </WizardStep>
        )}

        {step === 3 && (
           <WizardStep title="Preferred Stay Style">
             <div className="space-y-3">
               <OptionButton icon={Hotel} label="Hotel / Resort" selected={wizardData.stayType === 'Hotel'} onClick={() => updateData('stayType', 'Hotel')} />
               <OptionButton icon={Home} label="Private Villa / Rental" selected={wizardData.stayType === 'Rental'} onClick={() => updateData('stayType', 'Rental')} />
               <OptionButton icon={Ship} label="Cruise Ship" selected={wizardData.stayType === 'Cruise'} onClick={() => updateData('stayType', 'Cruise')} />
             </div>
           </WizardStep>
        )}

        {step === 4 && (
          <WizardStep title="When are you going?">
            <input 
               type="text" 
               placeholder="e.g. Next Summer, Dec 2025..."
               className="w-full text-xl border-b-2 border-gray-200 py-3 focus:border-[#34a4b8] outline-none"
               value={wizardData.dates}
               onChange={(e) => updateData('dates', e.target.value)}
             />
          </WizardStep>
        )}

        <div className="mt-auto flex justify-between pt-8">
           <button onClick={handleBack} className="text-gray-400 font-bold hover:text-gray-600">Back</button>
           {step < 4 ? (
             <Button onClick={handleNext} disabled={step === 0 && !wizardData.destination}>Next <ChevronRight size={18}/></Button>
           ) : (
             <Button onClick={handleFinish}>Request Quote</Button>
           )}
        </div>
      </Card>
    </div>
  );
};

const SearchView = ({ handleSearch, destinationSearch, setDestinationSearch }) => (
  <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in print:hidden">
    <div className="text-center mb-10">
      <h1 className="text-4xl md:text-5xl mb-4 text-gray-800" style={{ fontFamily: BRAND.fontHeader }}>
        Dream it. Plan it. <span style={{ color: BRAND.primary }}>Book it.</span>
      </h1>
      <p className="text-lg text-gray-500 font-semibold max-w-2xl mx-auto mt-4">
        The easiest way to plan your getaway. Find curated <span className="text-[#34a4b8]">activities</span> and book <span className="text-[#34a4b8]">hotels</span>, <span className="text-[#34a4b8]">flights</span>, <span className="text-[#34a4b8]">rental cars</span>, and trip essentials instantly.
      </p>
    </div>
    <Card className="p-6 md:p-8 relative z-10 shadow-2xl">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <MapPin size={16} style={{ color: BRAND.primary }} /> Where are you going?
          </label>
          <div className="relative">
            {/* DROPDOWN SELECTOR */}
            <div className="relative w-full">
              <select 
                required 
                className="w-full pl-4 pr-16 text-base md:text-xl border-2 border-gray-100 rounded-lg py-4 focus:border-[#34a4b8] outline-none font-medium transition-colors appearance-none bg-white cursor-pointer"
                value={destinationSearch} 
                onChange={(e) => setDestinationSearch(e.target.value)}
              >
                <option value="" disabled>Destinations</option>
                {AVAILABLE_DESTINATIONS.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!destinationSearch}
              className="absolute right-2 top-2 bottom-2 bg-white text-[#34a4b8] px-4 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed border-l border-gray-100"
            >
              <Search size={24} />
            </button>
          </div>
        </div>
      </form>
    </Card>

    {/* NEW SECTION: "How it works" to fill the vertical space */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center opacity-80">
       <div className="p-4">
          <div className="w-12 h-12 bg-blue-100 text-[#34a4b8] rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin size={24} />
          </div>
          <h3 className="font-bold text-gray-700">1. Choose Destination</h3>
          <p className="text-sm text-gray-500">Pick from our curated list of tropical paradises.</p>
       </div>
       <div className="p-4">
          <div className="w-12 h-12 bg-blue-100 text-[#34a4b8] rounded-full flex items-center justify-center mx-auto mb-3">
            <Ticket size={24} />
          </div>
          <h3 className="font-bold text-gray-700">2. Select Activities</h3>
          <p className="text-sm text-gray-500">Add top-rated excursions to your trip checklist.</p>
       </div>
       <div className="p-4">
          <div className="w-12 h-12 bg-blue-100 text-[#34a4b8] rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckSquare size={24} />
          </div>
          <h3 className="font-bold text-gray-700">3. Book & Go</h3>
          <p className="text-sm text-gray-500">Use our direct links to book activities, flights, stays, and more.</p>
       </div>
    </div>

  </div>
);

const LoadingView = ({ destinationSearch }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
    <Loader2 size={48} className="animate-spin text-[#34a4b8] mb-6" />
    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: BRAND.fontHeader }}>Scouting {destinationSearch}...</h2>
  </div>
);

const ActivityListView = ({ searchResults, setView, setSelectedActivity, itinerary, addToItinerary }) => {
  if (!searchResults) return null;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-24 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => setView('search')} className="text-sm font-medium text-slate-600 hover:text-[#34a4b8] mb-1 flex items-center gap-1">← Change Destination</button>
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl text-gray-800" style={{ fontFamily: BRAND.fontHeader }}>Top Picks for <span style={{ color: BRAND.primary }}>{searchResults.destinationName}</span></h2>
            {/* KEY WEST SPECIFIC LINK */}
            {searchResults.destinationName.includes("Key West") && (
                <a 
                  href="https://cruisytravel.com/key-west" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#34a4b8] hover:underline flex items-center gap-1 font-medium"
                >
                  Explore our complete Key West Travel Guide <ExternalLink size={12}/>
                </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <h3 className="text-lg font-bold text-[#34a4b8] uppercase tracking-wide flex items-center gap-2"><Ticket size={18}/> Curated Experiences</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {searchResults.activities.length === 0 ? (
               <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                 <p className="text-gray-500">No activities loaded for this location yet.</p>
               </div>
            ) : searchResults.activities.map((activity) => {
              const isAdded = itinerary.some(i => i.id === activity.id);
              return (
                 <Card key={activity.id} className="flex flex-col hover:shadow-xl transition-all group h-full">
                   <div className="h-48 relative overflow-hidden cursor-pointer" onClick={() => { setSelectedActivity(activity); setView('detail'); }}>
                     <img src={activity.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={activity.title} />
                     <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded shadow-sm">${activity.price}</div>
                   </div>
                   <div className="p-5 flex-1 flex flex-col justify-between">
                     <div className="cursor-pointer" onClick={() => { setSelectedActivity(activity); setView('detail'); }}>
                       <div className="text-xs font-bold text-[#34a4b8] uppercase mb-1">{activity.category} • {activity.duration}</div>
                       <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{activity.title}</h3>
                       <div className="text-gray-500 text-sm line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: activity.excerpt }}></div>
                     </div>
                     <div className="flex gap-2 mt-auto">
                        <Button variant="outline" className="flex-1 text-sm py-2" onClick={() => { setSelectedActivity(activity); setView('detail'); }}>Details</Button>
                        <Button variant={isAdded ? "ghost" : "primary"} className={`flex-1 text-sm py-2 ${isAdded ? 'bg-green-50 text-green-600' : ''}`} onClick={() => isAdded ? setView('itinerary') : addToItinerary(activity)}>{isAdded ? "Added" : "Add"}</Button>
                     </div>
                   </div>
                 </Card>
              );
            })}
          </div>

          {/* DISCLAIMER UNDER CURATED EXPERIENCES */}
          <div className="text-xs text-center text-gray-400 mt-4 px-2">
              <span className="flex items-center justify-center gap-1"><Info size={10}/> Transparency:</span>
              We may earn a small commission if you book through our links, at no extra cost to you.
          </div>

          {/* KEY WEST SPECIFIC SANDBAR BANNER */}
          {searchResults.destinationName.includes("Key West") && (
            <div 
               onClick={() => window.open('https://keywest-sandbar-finder.cruisytravel.com/', '_blank')}
               className="relative rounded-xl overflow-hidden h-32 cursor-pointer group shadow-md mt-6"
            >
               <img 
                 src="https://images.pexels.com/photos/3426880/pexels-photo-3426880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                 alt="Key West Sandbar" 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
               />
               <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-bold text-2xl drop-shadow-md" style={{ fontFamily: BRAND.fontHeader }}>Find Your Perfect Key West Sandbar</h3>
               </div>
            </div>
          )}

          <div onClick={() => window.open(searchResults.destinationPageUrl, '_blank')} className="bg-[#34a4b8]/5 border-2 border-dashed border-[#34a4b8]/30 rounded-xl p-6 text-center cursor-pointer hover:bg-[#34a4b8]/10 transition-colors group mt-6">
             <h3 className="text-lg font-bold text-gray-800 mb-1">See More {searchResults.destinationName} Activities</h3>
             <span className="inline-flex items-center gap-2 font-bold text-[#34a4b8] text-sm">Browse Full Catalog <ArrowRight size={14}/></span>
          </div>
          <div className="pt-6 border-t border-gray-100">
             <h3 className="text-lg font-bold text-[#34a4b8] uppercase tracking-wide flex items-center gap-2 mb-4"><ShoppingBag size={18}/> Travel Essentials</h3>
             <div className="grid grid-cols-2 gap-4">
                {GLOBAL_GEAR.map((p, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-3 cursor-pointer border border-[#ff8c00] hover:shadow-md hover:bg-orange-50 transition-all" onClick={()=>window.open(p.affiliateLink)}>
                    <img src={p.image} className="w-12 h-12 rounded bg-gray-100 object-cover" alt={p.name} />
                    <div><div className="text-sm font-bold text-gray-700 leading-tight">{p.name}</div><div className="text-xs text-gray-400 mt-1 flex items-center gap-1">Check Amazon <ExternalLink size={10}/></div></div>
                  </div>
                ))}
             </div>
          </div>
          {/* DISCLAIMER AT THE VERY BOTTOM OF THE LIST VIEW */}
          <div className="text-xs text-center text-gray-400 mt-8 px-2 pb-8 border-t border-gray-100 pt-4">
              <span className="flex items-center justify-center gap-1"><Info size={10}/> Transparency:</span>
              We may earn a small commission if you book through our links, at no extra cost to you.
          </div>
        </div>
        <div className="lg:w-80 space-y-6">
          {/* HOTELS CARD */}
          {searchResults.stayPartners.length > 0 && (
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
               <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold"><Hotel size={20}/> Where to Stay</div>
               <p className="text-sm text-blue-700/70 mb-4">Compare prices for hotels and rentals in {searchResults.destinationName}.</p>
               <div className="space-y-2">
                 {searchResults.stayPartners.map((partner, idx) => (
                   <Button 
                     key={idx} 
                     fullWidth 
                     onClick={() => window.open(partner.url, '_blank')} 
                     style={{ backgroundColor: partner.color, color: partner.textColor }}
                     className="shadow-sm border-none justify-between"
                   >
                     <span className="flex items-center gap-2"><partner.icon size={16}/> {partner.name}</span><ExternalLink size={14} className="opacity-70"/>
                   </Button>
                 ))}
               </div>
            </Card>
          )}

          {/* FLIGHTS CARD */}
          <Card className="p-5 bg-gradient-to-br from-sky-50 to-white border-sky-100">
             <div className="flex items-center gap-2 mb-3 text-sky-900 font-bold"><Plane size={20}/> Flights to {searchResults.destinationName}</div>
             <div className="space-y-2">
               {/* Check for specific partners, otherwise use generic link */}
               {searchResults.flightPartners && searchResults.flightPartners.length > 0 ? (
                 searchResults.flightPartners.map((partner, idx) => (
                   <Button 
                     key={idx} 
                     fullWidth 
                     onClick={() => window.open(partner.url, '_blank')} 
                     style={{ backgroundColor: partner.color, color: partner.textColor }}
                     className="shadow-sm border-none justify-between"
                   >
                     <span className="flex items-center gap-2"><partner.icon size={16}/> {partner.name}</span><ExternalLink size={14} className="opacity-70"/>
                   </Button>
                 ))
               ) : (
                 <Button fullWidth onClick={() => window.open(searchResults.flightLink, '_blank')} className="bg-sky-500 hover:bg-sky-600 text-white shadow-none">Check Flights <ExternalLink size={14}/></Button>
               )}
             </div>
          </Card>

          {/* CARS CARD */}
          <Card className="p-5 bg-gradient-to-br from-orange-50 to-white border-orange-100">
             <div className="flex items-center gap-2 mb-3 text-orange-900 font-bold"><Car size={20}/> Need a Ride?</div>
             <div className="space-y-2">
                {/* Check for specific partners, otherwise use generic link */}
                {searchResults.carPartners && searchResults.carPartners.length > 0 ? (
                 searchResults.carPartners.map((partner, idx) => (
                   <Button 
                     key={idx} 
                     fullWidth 
                     onClick={() => window.open(partner.url, '_blank')} 
                     style={{ backgroundColor: partner.color, color: partner.textColor }}
                     className="shadow-sm border-none justify-between"
                   >
                     <span className="flex items-center gap-2"><partner.icon size={16}/> {partner.name}</span><ExternalLink size={14} className="opacity-70"/>
                   </Button>
                 ))
               ) : (
                 <Button fullWidth onClick={() => window.open(searchResults.carLink, '_blank')} className="bg-orange-500 hover:bg-orange-600 text-white shadow-none">Find Rental Cars <ExternalLink size={14}/></Button>
               )}
             </div>
          </Card>

          {/* TRAVEL INSURANCE (Always Visible) */}
          <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
             <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold"><ShieldCheck size={20}/> Travel Insurance</div>
             <p className="text-sm text-slate-600 mb-4">Don't forget to protect your trip. Recommended for all international travel.</p>
             <Button 
               fullWidth 
               onClick={() => window.open('https://www.anrdoezrs.net/click-101439364-15417474?url=https%3A%2F%2Fwww.worldnomads.com%2F', '_blank')} 
               className="bg-[#D4002D] hover:bg-[#b00025] text-white shadow-none justify-between"
             >
               <span className="flex items-center gap-2">World Nomads</span><ExternalLink size={14} className="opacity-70"/>
             </Button>
          </Card>

          {/* SIDEBAR DISCLAIMER */}
          <div className="text-xs text-center text-gray-400 mt-4 px-2">
            <span className="flex items-center justify-center gap-1"><Info size={10}/> Transparency:</span>
            We may earn a small commission if you book through our links, at no extra cost to you.
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryView = ({ itinerary, setView, essentials, toggleBooked, removeFromItinerary, handleEmailItinerary, destinationSearch, searchResults }) => {
  const totalCost = itinerary.reduce((sum, item) => sum + item.price, 0);
  const bookedCount = itinerary.filter(i => i.isBooked).length + essentials.filter(i => i.isBooked).length;
  const totalItems = itinerary.length + essentials.length;
  const progress = totalItems === 0 ? 0 : (bookedCount / totalItems) * 100;
  
  const displayDestination = destinationSearch || "Your Trip";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="hidden print:block mb-8 text-center border-b border-gray-200 pb-6">
         <div className="flex justify-center mb-4"><img src={BRAND.logoUrl} alt="Cruisy Travel" className="w-24 h-24 object-cover rounded-full border-2 border-[#34a4b8]" /></div>
         <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Cruisy Travel Itinerary</h1>
         <p className="text-gray-500 italic">Prepared for your upcoming adventure to {displayDestination}.</p>
         <div className="mt-4 text-sm text-gray-600 max-w-lg mx-auto">"We are thrilled to help you plan your getaway. Below is your checklist of selected activities and essentials. Safe travels!"</div>
      </div>
      
      {/* Smart Back Button */}
      <button 
        onClick={() => searchResults ? setView('list') : setView('search')} 
        className="text-sm font-medium text-slate-600 hover:text-[#34a4b8] mb-6 print:hidden flex items-center gap-1"
      >
        ← Back to {searchResults ? 'Activities' : 'Search'}
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div className="print:hidden">
            <h2 className="text-3xl text-gray-800 mb-2" style={{ fontFamily: BRAND.fontHeader }}>Trip Checklist: <span style={{ color: BRAND.primary }}>{displayDestination}</span></h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"><div className="bg-[#34a4b8] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            <p className="text-sm text-gray-500">{bookedCount} of {totalItems} items booked</p>
          </div>
          <div>
             <h3 className="text-sm font-bold text-[#34a4b8] uppercase tracking-wide mb-3 flex items-center gap-2"><Ticket size={16}/> Planned Activities</h3>
             {itinerary.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 print:hidden"><p className="text-gray-500 mb-2">No activities added yet.</p><Button variant="ghost" onClick={() => setView('search')} className="text-sm h-8">Browse Activities</Button></div>
             ) : (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
                 {itinerary.map((item) => (
                   <div key={item.id} className={`p-4 border-b border-gray-100 flex items-center justify-between transition-colors ${item.isBooked ? 'bg-green-50/50' : 'bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleBooked(item.id, 'activity')} className={`${item.isBooked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'} flex-shrink-0 print:hidden`}>{item.isBooked ? <CheckSquare size={24}/> : <Square size={24}/>}</button>
                        <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover shadow-sm hidden sm:block" />
                        <div>
                          <div className={`font-bold ${item.isBooked ? 'text-green-700' : 'text-gray-800'}`}>{item.title}</div>
                          <div className="text-xs text-gray-500">${item.price} • {item.duration}</div>
                          <div className="hidden print:block text-xs text-gray-400 mt-1">{item.bookingUrl}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 print:hidden">
                         {!item.isBooked && (
                           // SAFE CHECK: DISABLE IF URL IS MISSING OR HASH
                           <Button 
                             variant="action" 
                             className="text-xs px-3 h-8" 
                             disabled={!item.bookingUrl || item.bookingUrl === '#'}
                             onClick={() => item.bookingUrl && window.open(item.bookingUrl, '_blank')}
                           >
                             {(!item.bookingUrl || item.bookingUrl === '#') ? 'Coming Soon' : 'Book Now'}
                           </Button>
                         )}
                         <button onClick={() => removeFromItinerary(item.id)} className="text-gray-400 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
          <div>
             <h3 className="text-sm font-bold text-[#34a4b8] uppercase tracking-wide mb-3 flex items-center gap-2"><CheckSquare size={16}/> Trip Essentials</h3>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
               {essentials.map((item) => {
                 const IconComponent = ICON_MAP[item.id] || Info; 
                 return (
                   <div key={item.id} className={`p-4 border-b border-gray-100 flex items-center justify-between transition-colors ${item.isBooked ? 'bg-green-50/50' : 'bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleBooked(item.id, 'essential')} className={`${item.isBooked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'} print:hidden`}>{item.isBooked ? <CheckSquare size={24}/> : <Square size={24}/>}</button>
                        <div>
                          <div className={`font-bold ${item.isBooked ? 'text-green-700' : 'text-gray-800'}`}>{item.title}</div>
                          
                          {/* Logic for SubLinks vs Single Link */}
                          {item.subLinks ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.subLinks.map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" className="text-xs bg-gray-100 hover:bg-[#34a4b8] hover:text-white text-gray-600 px-2 py-1 rounded transition-colors flex items-center gap-1 print:hidden">
                                  {link.name} <ExternalLink size={10}/>
                                </a>
                              ))}
                              {/* Print view for sublinks */}
                              <div className="hidden print:block text-xs text-gray-400 mt-1">
                                {item.subLinks.map(l => l.name + ": " + l.url).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <>
                              <a href={item.link} target="_blank" className="text-xs text-[#34a4b8] hover:underline flex items-center gap-1 print:hidden">{item.cta} <ExternalLink size={10}/></a>
                              <div className="hidden print:block text-xs text-gray-400 mt-1">{item.link}</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-400 mt-2 sm:mt-0 self-start sm:self-center"><IconComponent size={20}/></div>
                   </div>
                 )
               })}
             </div>
          </div>
          <div className="print:hidden">
             <h3 className="text-sm font-bold text-[#34a4b8] uppercase tracking-wide mb-3 flex items-center gap-2"><ShoppingBag size={16}/> Don't Forget to Pack</h3>
             <div className="grid grid-cols-2 gap-4">
                {GLOBAL_GEAR.map((p, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-3 cursor-pointer border border-[#ff8c00] hover:shadow-md hover:bg-orange-50 transition-all" onClick={()=>window.open(p.affiliateLink)}>
                    <img src={p.image} className="w-10 h-10 rounded bg-gray-100 object-cover" alt={p.name} />
                    <div><div className="text-sm font-bold text-gray-700 leading-tight">{p.name}</div><div className="text-xs text-gray-400 mt-1 flex items-center gap-1">Check Amazon <ExternalLink size={10}/></div></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
        <div className="md:w-80 print:hidden">
           <Card className="p-6 sticky top-24">
             <h3 className="font-bold text-gray-800 mb-4 text-lg">Estimated Costs</h3>
             <div className="space-y-2 mb-6 text-sm text-gray-600">
                <div className="flex justify-between"><span>Activities</span><span>${totalCost}</span></div>
                <div className="flex justify-between"><span>Hotels/Flight</span><span>Variable</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-gray-800 text-lg"><span>Total Activity Cost</span><span>${totalCost}</span></div>
             </div>
             <Button fullWidth onClick={handleEmailItinerary} className="flex gap-2 items-center justify-center"><Mail size={16} /> Email Checklist</Button>
             <Button variant="ghost" fullWidth onClick={() => window.print()} className="mt-2 flex gap-2 items-center justify-center text-xs"><Printer size={14} /> Print Checklist</Button>
             
             {/* CHECKLIST VIEW DISCLAIMER */}
             <div className="text-xs text-center text-gray-400 mt-4 px-2">
                <span className="flex items-center justify-center gap-1"><Info size={10}/> Transparency:</span>
                We may earn a small commission if you book through our links, at no extra cost to you.
             </div>
           </Card>
        </div>
      </div>
      <div className="hidden print:block mt-12 pt-8 border-t border-gray-200 text-center">
         <p className="text-gray-600 mb-2">Warmly,</p>
         <p className="font-bold text-xl text-[#34a4b8]" style={{ fontFamily: BRAND.fontHeader }}>The Cruisy Travel Team</p>
         <p className="text-xs text-gray-400 mt-4">Visit us at cruisytravel.com</p>
      </div>
    </div>
  );
};

const DetailView = ({ selectedActivity, itinerary, setView, addToItinerary, searchResults }) => {
  if (!selectedActivity) return null;
  const isAdded = itinerary.some(i => i.id === selectedActivity.id);
  
  // Safe logic to check if bookable
  const isBookable = selectedActivity.bookingUrl && selectedActivity.bookingUrl !== "#";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in pb-24 print:hidden">
      
      {/* Smart Back Button */}
      <button 
        onClick={() => searchResults ? setView('list') : setView('search')} 
        className="text-sm font-medium text-slate-600 hover:text-[#34a4b8] mb-6 flex items-center gap-1"
      >
        ← Back to {searchResults ? 'List' : 'Search'}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div>
           <div className="rounded-xl overflow-hidden shadow-lg mb-6"><img src={selectedActivity.image} className="w-full h-64 object-cover" alt={selectedActivity.title} /></div>
           <h1 className="text-3xl md:text-4xl text-gray-900 leading-tight mb-4" style={{ fontFamily: BRAND.fontHeader }}>{selectedActivity.title}</h1>
           <div className="prose text-gray-600" dangerouslySetInnerHTML={{ __html: selectedActivity.description }}></div>
         </div>
         <div>
            <Card className="p-6 sticky top-24 border-t-4" style={{ borderColor: BRAND.primary }}>
               <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-bold uppercase text-sm">Price per person</span>
                  <span className="text-4xl font-bold text-gray-800" style={{ fontFamily: BRAND.fontHeader }}>${selectedActivity.price}</span>
               </div>
               <div className="space-y-3">
                 <Button fullWidth variant={isAdded ? "ghost" : "primary"} onClick={() => isAdded ? setView('itinerary') : addToItinerary(selectedActivity)} className={isAdded ? "bg-green-50 text-green-600 border border-green-200" : ""}>{isAdded ? "View in Trip" : "Add to Trip"}</Button>
                 
                 {/* SAFE BUTTON LOGIC */}
                 <Button 
                   fullWidth 
                   variant="action" 
                   disabled={!isBookable}
                   onClick={() => isBookable && window.open(selectedActivity.bookingUrl, '_blank')}
                 >
                    {isBookable ? "Book Now (FareHarbor)" : "Coming Soon"} <ExternalLink size={16}/>
                 </Button>

                 <div className="text-xs text-center text-gray-400 mt-2 px-2"><span className="flex items-center justify-center gap-1"><Info size={10}/> Transparency:</span> We may earn a small commission if you book through our links, at no extra cost to you.</div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  // --- LEVEL 1 PERSISTENCE: LOCAL STORAGE INIT ---
  const [view, setView] = useState('search'); 
  const [destinationSearch, setDestinationSearch] = useState(''); 
  const [searchResults, setSearchResults] = useState(null); 
  const [selectedActivity, setSelectedActivity] = useState(null); 
  
  // State 1: Itinerary (Trip Items)
  const [itinerary, setItinerary] = useState(() => {
    try {
        const saved = localStorage.getItem("cruisy_itinerary");
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // State 2: Essentials (Hotel/Flight/Car Links)
  const [essentials, setEssentials] = useState(() => {
    try {
        const saved = localStorage.getItem("cruisy_essentials");
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // --- PERSISTENCE: AUTO-SAVE ---
  useEffect(() => {
    localStorage.setItem("cruisy_itinerary", JSON.stringify(itinerary));
  }, [itinerary]);

  useEffect(() => {
    localStorage.setItem("cruisy_essentials", JSON.stringify(essentials));
  }, [essentials]);
  
  // --- REMOVED AUTO RESIZE LOGIC TO FIX OVERLAY/SCROLLING ISSUES ---
  // The iframe will now handle scrolling internally within the fixed height container.

  // Inject Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Russo+One&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Handlers
  const handleSearch = async (e) => {
    e.preventDefault();
    setView('loading');
    
    // Switch to Wizard if "Somewhere Else" is selected
    if (destinationSearch === "Somewhere Else") {
      setView('wizard');
      return;
    }
    
    // CALL THE REAL API
    const results = await fetchRealActivities(destinationSearch);
    
    // BETTER ERROR HANDLING
    if (!results || results.error) {
        alert("Connection Error: Check CORS settings.");
        setView('search');
        return;
    }

    if (results.activities.length === 0) {
        alert(`No activities found for "${destinationSearch}" (Search Term: "${destinationSearch.split(',')[0].trim()}"). \n\nPlease create an Itinerary in WordPress with this location name in the Title or Description.`);
        setView('search');
        return;
    }

    setSearchResults(results);
    
    // Initialize Essentials Checklist based on destination
    
    // Initialize Essentials Checklist based on destination
    const flightEssentials = results.flightPartners.length > 0 
        ? { 
            id: 'flight', 
            title: `Flights to ${results.destinationName}`, 
            isBooked: false, 
            subLinks: results.flightPartners 
          }
        : (results.flightLink ? { id: 'flight', title: `Flights to ${results.destinationName}`, isBooked: false, link: results.flightLink, cta: 'Check Prices' } : null);

    const hotelEssential = results.stayPartners.length > 0 
        ? { 
            id: 'hotel', 
            title: `Stay in ${results.destinationName}`, 
            isBooked: false, 
            subLinks: results.stayPartners 
          } 
        : null;

    const carEssential = results.carPartners.length > 0
        ? { id: 'car', title: `Rental Car`, isBooked: false, subLinks: results.carPartners }
        : null;

    setEssentials([
      ...(flightEssentials ? [flightEssentials] : []),
      ...(hotelEssential ? [hotelEssential] : []),
      ...(carEssential ? [carEssential] : []),
      // Removed Dining
      { id: 'insurance', title: 'Travel Insurance (World Nomads)', isBooked: false, link: 'https://www.anrdoezrs.net/click-101439364-15417474?url=https%3A%2F%2Fwww.worldnomads.com%2F', cta: 'Get Quote' }
    ]);
    
    setView('list'); 
  };

  const addToItinerary = (activity) => {
    if (!itinerary.find(i => i.id === activity.id)) {
      setItinerary([...itinerary, { ...activity, isBooked: false }]);
    }
  };

  const removeFromItinerary = (id) => {
    setItinerary(itinerary.filter(i => i.id !== id));
  };

  const toggleBooked = (id, type) => {
    if (type === 'activity') {
      setItinerary(itinerary.map(i => i.id === id ? { ...i, isBooked: !i.isBooked } : i));
    } else {
      setEssentials(essentials.map(i => i.id === id ? { ...i, isBooked: !i.isBooked } : i));
    }
  };

  const handleEmailItinerary = () => {
    const subject = `Your ${destinationSearch} Adventure with Cruisy Travel`;
    let body = `Hi there,\n\nWe are so excited for your upcoming trip to ${destinationSearch}! Here is the custom itinerary plan you built with us.\n\n`;
    body += `========================================\nYOUR ACTIVITY CHECKLIST\n========================================\n\n`;
    itinerary.forEach((item, index) => {
      body += `${index + 1}. ${item.title} ($${item.price})\n   👉 Book Here: ${item.bookingUrl}\n\n`;
    });
    body += `========================================\nTRIP ESSENTIALS\n========================================\n\n`;
    essentials.forEach((item) => {
      body += `- ${item.title}\n`;
      if (item.subLinks) {
         item.subLinks.forEach(sub => {
             body += `  ${sub.name}: ${sub.url}\n`;
         });
      } else {
         body += `  Link: ${item.link}\n`;
      }
    });
    body += `\nWarmly,\nThe Cruisy Travel Team`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: BRAND.fontBody }}>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm print:hidden">
        
        {/* Added Breadcrumb */}
        <div className="bg-slate-50 border-b border-slate-100">
           <div className="max-w-6xl mx-auto px-4 py-1">
             <a 
               href="https://cruisytravel.com" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-xs font-medium text-slate-500 hover:text-[#34a4b8] flex items-center gap-1 transition-colors"
             >
               ← Back to cruisytravel.com
             </a>
           </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('search')}>
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: BRAND.primary }}>
              <img src={BRAND.logoUrl} alt="Logo" className="w-full h-full object-cover" /> 
            </div>
            <span className="text-xl tracking-tight hidden sm:block" style={{ fontFamily: BRAND.fontHeader, color: '#333' }}>
              CRUISY<span style={{ color: BRAND.primary }}>TRAVEL</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setView('itinerary')} className="relative">
              <Calendar size={20} className={itinerary.length > 0 ? "text-[#34a4b8]" : "text-gray-400"} />
              <span className="hidden sm:inline">My Trip</span>
              {itinerary.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{itinerary.length}</span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main>
        {view === 'search' && <SearchView handleSearch={handleSearch} destinationSearch={destinationSearch} setDestinationSearch={setDestinationSearch} />}
        {view === 'loading' && <LoadingView destinationSearch={destinationSearch} />}
        {view === 'list' && <ActivityListView searchResults={searchResults} setView={setView} setSelectedActivity={setSelectedActivity} itinerary={itinerary} addToItinerary={addToItinerary} />}
        {view === 'itinerary' && <ItineraryView itinerary={itinerary} setView={setView} essentials={essentials} toggleBooked={toggleBooked} removeFromItinerary={removeFromItinerary} handleEmailItinerary={handleEmailItinerary} destinationSearch={destinationSearch} searchResults={searchResults} />}
        {view === 'detail' && <DetailView selectedActivity={selectedActivity} itinerary={itinerary} setView={setView} addToItinerary={addToItinerary} searchResults={searchResults} />}
        {view === 'wizard' && <WizardView setView={setView} />}
      </main>
    </div>
  );
}

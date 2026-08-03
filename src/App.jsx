import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
// ⚠️ Nécessite `npm install @capacitor/push-notifications` — cet import
// casse le build web tant que le paquet n'est pas installé, même s'il n'est
// jamais réellement exécuté sur le web (isNativeAndroid() le désactive à
// l'exécution, mais Webpack le résout quand même à la compilation).
import { PushNotifications } from "@capacitor/push-notifications";


// ── LOGO ──────────────────────────────────────────────────────────────────────
function PawLogo({ size = 48, color = "#fff" }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: color,
        maskImage: "url(/pawmatch-logo.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/pawmatch-logo.png)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

// ── ONBOARDING HINT (bulle contextuelle, affichée une seule fois par écran) ──────
function hintSeen(key) {
  try { return localStorage.getItem("miloute_hint_" + key) === "1"; } catch { return true; }
}
function markHintSeen(key) {
  try { localStorage.setItem("miloute_hint_" + key, "1"); } catch {}
}

function OnboardingHint({ hintKey, icon, text, position = "bottom" }) {
  const [visible, setVisible] = useState(() => !hintSeen(hintKey));

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => { setVisible(false); markHintSeen(hintKey); }, 4000);
    return () => clearTimeout(timer);
  }, [visible, hintKey]);

  if (!visible) return null;

  return (
    <div onClick={() => { setVisible(false); markHintSeen(hintKey); }}
      style={{
        position: "absolute", left: 16, right: 16, zIndex: 40, cursor: "pointer",
        [position]: 12,
        display: "flex", alignItems: "center", gap: 10,
        background: "linear-gradient(135deg,#8B3D28,#B25F46)", color: "#fff",
        borderRadius: 16, padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(139,61,40,.35)",
        animation: "hintFadeIn .3s ease",
      }}>
      <style>{`@keyframes hintFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{text}</span>
      <span style={{ fontSize: 16, opacity: .8, flexShrink: 0 }}>✕</span>
    </div>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const DOG_BREEDS = [
  "Labrador Retriever","Berger Australien","Berger Allemand","Golden Retriever","Border Collie",
  "Bouledogue Français","Caniche","Jack Russell Terrier","Cocker Spaniel","Yorkshire Terrier",
  "Chihuahua","Beagle","Husky Sibérien","Rottweiler","Boxer",
  "Shih Tzu","Bichon Frisé","Cavalier King Charles","Teckel","Westie",
  "Setter Anglais","Épagneul Breton","Braque","Malinois","Berger des Pyrénées",
  "Dogue Allemand","Saint-Bernard","Bouvier Bernois","Akita","Shiba Inu",
  "Carlin","Schnauzer","Fox Terrier","Lhassa Apso","Maltais",
  "Whippet","Greyhound","Basset Hound","Bullmastiff","American Staffordshire",
  "Staffordshire Bull Terrier","Pitbull","Dalmatien","Spitz","Pomeranian",
  "Léonberg","Terre-Neuve","Patou","Dogue de Bordeaux","Levrier Afghan",
  "Croisé / Mixte","Non déterminé","Autre",
];

const CAT_BREEDS = [
  "Européen","Chartreux","Siamois","Maine Coon","Persan",
  "British Shorthair","Ragdoll","Bengal","Sphynx","Abyssin",
  "Sacré de Birmanie","Scottish Fold","Norvégien","Sibérien","Devon Rex",
  "Cornish Rex","Burmese","Bombay","Savannah","Angora Turc",
  "Exotic Shorthair","Russian Blue","Manx","American Shorthair","Tonkinois",
  "Himalayen","Oriental","Selkirk Rex",
  "Croisé / Mixte","Non déterminé","Autre",
];

function BreedInput({ value, onChange, species, style }) {
  const [open, setOpen] = useState(false);
  const list = species === "dog" ? DOG_BREEDS : CAT_BREEDS;
  const filtered = value
    ? list.filter(b => b.toLowerCase().includes(value.toLowerCase()))
    : list;

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={species === "dog" ? "Ex: Labrador" : "Ex: Siamois"}
        style={style}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, maxHeight: 220, overflowY: "auto", zIndex: 30, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
          {filtered.slice(0, 50).map(b => (
            <div key={b} onMouseDown={() => { onChange(b); setOpen(false); }}
              style={{ padding: "10px 14px", fontSize: 14, color: "#2D1200", cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}>
              {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LIKES_RECEIVED = [
  { name: "Nala", species: "cat", breed: "Bengal", emoji: "🐱", photo: "/photos/nala-1.jpg", time: "Il y a 2h" },
  { name: "Filou", species: "dog", breed: "Border Collie", emoji: "🐕", photo: "/photos/filou-1.jpg", time: "Il y a 5h" },
  { name: "Misty", species: "cat", breed: "Sacré de Birmanie", emoji: "🐱", photo: "/photos/misty-1.jpg", time: "Hier" },
  { name: "Max", species: "dog", breed: "Labrador", emoji: "🐕", photo: "/photos/max-1.jpg", time: "Hier" },
  { name: "Tigrou", species: "cat", breed: "Ragdoll", emoji: "🐱", photo: "/photos/tigrou-1.jpg", time: "Il y a 2 jours" },
  { name: "Nanouk", species: "dog", breed: "Husky Sibérien", emoji: "🐕", photo: "/photos/nanouk-1.jpg", time: "Il y a 3 jours" },
  { name: "Choupette", species: "dog", breed: "Bouledogue Français", emoji: "🐕", photo: "/photos/choupette-1.jpg", time: "Il y a 4 jours" },
  { name: "Rosie", species: "cat", breed: "Européen", emoji: "🐱", photo: "/photos/rosie-1.jpg", time: "Il y a 5 jours" },
  { name: "Rocky", species: "dog", breed: "Berger Australien", emoji: "🐕", photo: "/photos/rocky-1.jpg", time: "Il y a 6 jours" },
  { name: "Bella", species: "dog", breed: "Cavalier King Charles", emoji: "🐕", photo: "/photos/bella-1.jpg", time: "Il y a 1 semaine" },
  { name: "Mochi", species: "cat", breed: "Maine Coon", emoji: "🐱", photo: "/photos/mochi-1.jpg", time: "Il y a 1 semaine" },
  { name: "Pixel", species: "cat", breed: "Siamois", emoji: "🐱", photo: "/photos/pixel-1.jpg", time: "Il y a 1 semaine" },
];

const PROFILES = [
  { id: 1, name: "Rosie", species: "cat", breed: "Européen", age: "3 ans", gender: "F", energy: 3, temper: ["Câline", "Joueuse", "Curieuse"], distance: "1,2 km", vaccinated: true, sterilized: true, owner: "Sophie M.", bio: "Rosie adore les séances de jeu avec une canne à plumes et passe ses après-midis à surveiller les oiseaux par la fenêtre. Sociable avec les autres chats après une courte période d'adaptation, elle cherche surtout un copain de jeu qui n'a pas peur de courir partout dans l'appart.", seeking: ["Play date", "Compagnon de vie"], emoji: "🐱", color: "#B8A9C9", photos: ["/photos/rosie-1.jpg", "/photos/rosie-2.jpg", "/photos/rosie-3.jpg"], lat: 48.833, lng: 2.362, pedigree: false },
  { id: 2, name: "Rocky", species: "dog", breed: "Berger Australien", age: "2 ans", gender: "M", energy: 5, temper: ["Joueur", "Intelligent", "Énergique"], distance: "0,8 km", vaccinated: true, sterilized: false, owner: "Thomas D.", bio: "Rocky a une énergie débordante et a besoin d'un compagnon pour ses balades quotidiennes au bois de Vincennes. Très sociable avec les autres chiens, il adore les jeux de poursuite et apprend de nouveaux tours en un temps record. Cherche partenaire aussi motivé que lui !", seeking: ["Balade", "Play date", "Reproduction"], emoji: "🐕", color: "#A9C4B8", photos: ["/photos/rocky-1.jpg", "/photos/rocky-2.jpg", "/photos/rocky-3.jpg"], lat: 48.840, lng: 2.358, pedigree: true },
  { id: 3, name: "Mochi", species: "cat", breed: "Maine Coon", age: "5 ans", gender: "M", energy: 2, temper: ["Posé", "Affectueux", "Indépendant"], distance: "2,1 km", vaccinated: true, sterilized: true, owner: "Clara B.", bio: "Mochi est un grand gaillard au caractère doux qui préfère les siestes au soleil aux courses-poursuites. Affectueux sans être collant, il cherche un compagnon tranquille pour partager le canapé — l'idéal serait un chat aussi zen que lui.", seeking: ["Compagnon de vie", "Play date"], emoji: "🐱", color: "#C9B8A9", photos: ["/photos/mochi-1.jpg", "/photos/mochi-2.jpg", "/photos/mochi-3.jpg"], lat: 48.828, lng: 2.370, pedigree: true },
  { id: 4, name: "Bella", species: "dog", breed: "Cavalier King Charles", age: "4 ans", gender: "F", energy: 4, temper: ["Douce", "Joueuse", "Affectueuse"], distance: "3,4 km", vaccinated: true, sterilized: false, owner: "Marc L.", bio: "Bella est une amoureuse des câlins et des longues balades en forêt. Toujours de bonne humeur, elle s'entend avec absolument tout le monde — chiens, enfants, inconnus dans la rue. Cherche partenaire de balade régulier ou plus, si affinités.", seeking: ["Balade", "Reproduction", "Play date"], emoji: "🐕", color: "#C9C4A9", photos: ["/photos/bella-1.jpg"], lat: 48.845, lng: 2.375, pedigree: true },
  { id: 5, name: "Pixel", species: "cat", breed: "Siamois", age: "2 ans", gender: "F", energy: 4, temper: ["Bavarde", "Curieuse", "Vive"], distance: "0,5 km", vaccinated: true, sterilized: true, owner: "Léa P.", bio: "Pixel ne tient jamais en place et a un avis sur tout (elle vous le fera savoir, miaulements à l'appui). Très curieuse, elle adore explorer chaque recoin et cherche une amie aussi vive qu'elle pour des sessions de jeu mémorables.", seeking: ["Play date", "Cat date"], emoji: "🐱", color: "#A9B8C9", photos: ["/photos/pixel-2.jpg", "/photos/pixel-1.jpg"], lat: 48.836, lng: 2.355, pedigree: false },
  { id: 6, name: "Max", species: "dog", breed: "Labrador", age: "3 ans", gender: "M", energy: 4, temper: ["Gourmand", "Affectueux", "Sociable"], distance: "1,8 km", vaccinated: true, sterilized: true, owner: "Julie R.", bio: "Max ferait n'importe quoi pour une friandise, et c'est à peu près le seul vrai défaut qu'on lui trouve. Adorable avec tout le monde, il adore l'eau et ne refuse jamais une baignade improvisée. Cherche compagnon de balade pas trop difficile sur les activités, tant qu'il y a de l'affection à la clé.", seeking: ["Balade", "Play date"], emoji: "🐕", color: "#D4C4A8", photos: ["/photos/max-2.jpg", "/photos/max-1.jpg"], lat: 48.838, lng: 2.345, pedigree: true },
  { id: 7, name: "Nala", species: "cat", breed: "Bengal", age: "2 ans", gender: "F", energy: 5, temper: ["Énergique", "Curieuse", "Indépendante"], distance: "1,4 km", vaccinated: true, sterilized: false, owner: "Karim B.", bio: "Nala a une énergie de félin sauvage et ne tient jamais en place plus de cinq minutes. Elle grimpe partout, observe tout, et adore les jeux qui imitent la chasse. Cherche une rencontre avec quelqu'un d'aussi vif qu'elle, ou éventuellement un partenaire de reproduction sérieux.", seeking: ["Play date", "Reproduction"], emoji: "🐱", color: "#E8C9A0", photos: ["/photos/nala-1.jpg", "/photos/nala-2.jpg", "/photos/nala-3.jpg"], lat: 48.825, lng: 2.378, pedigree: true },
  { id: 8, name: "Filou", species: "dog", breed: "Border Collie", age: "1 an", gender: "M", energy: 5, temper: ["Intelligent", "Joueur", "Énergique"], distance: "2,5 km", vaccinated: true, sterilized: false, owner: "Anaïs T.", bio: "Filou apprend plus vite que ses maîtres n'ont le temps de lui enseigner. Toujours en mouvement, il a besoin d'un compagnon capable de tenir le rythme — frisbee, agility, longues balades, tout l'intéresse. Cherche partenaire de jeu endurant avant tout.", seeking: ["Play date", "Balade"], emoji: "🐕", color: "#B8C9B8", photos: ["/photos/filou-1.jpg", "/photos/filou-3.jpg", "/photos/filou-4.jpg", "/photos/filou-5.jpg"], lat: 48.850, lng: 2.330, pedigree: true },
  { id: 9, name: "Misty", species: "cat", breed: "Sacré de Birmanie", age: "4 ans", gender: "F", energy: 2, temper: ["Calme", "Affectueuse", "Câline"], distance: "0,9 km", vaccinated: true, sterilized: true, owner: "Vincent L.", bio: "Misty est d'une douceur presque déconcertante — elle ne griffe jamais, miaule à peine, et passe ses journées à chercher les genoux disponibles. Idéale pour une vie tranquille à deux. Cherche compagnon paisible pour de longues siestes partagées.", seeking: ["Compagnon de vie"], emoji: "🐱", color: "#C9D4C9", photos: ["/photos/misty-1.jpg", "/photos/misty-2.jpg"], lat: 48.842, lng: 2.368, pedigree: true },
  { id: 10, name: "Choupette", species: "dog", breed: "Bouledogue Français", age: "3 mois", gender: "F", energy: 2, temper: ["Calme", "Affectueuse", "Gourmande"], distance: "1,1 km", vaccinated: true, sterilized: false, owner: "Manon S.", bio: "Choupette est une petite chipie qui ronfle déjà plus fort que la plupart des humains. Câline et placide pour son âge, elle préfère les câlins au soleil à n'importe quelle course effrénée. Cherche compagnon de jeu tout doux, à son rythme de chiot.", seeking: ["Compagnon de vie", "Play date"], emoji: "🐕", color: "#D4B8A8", photos: ["/photos/choupette-1.jpg", "/photos/choupette-2.jpg"], lat: 48.831, lng: 2.388, pedigree: true },
  { id: 11, name: "Tigrou", species: "cat", breed: "Ragdoll", age: "5 ans", gender: "M", energy: 3, temper: ["Indépendant", "Posé", "Joueur"], distance: "2,0 km", vaccinated: true, sterilized: true, owner: "Olivier F.", bio: "Tigrou a un regard perçant et un faux air sérieux, mais c'est un grand tendre une fois la confiance installée — typique des Ragdolls. Indépendant sans être distant, il apprécie la compagnie sur ses propres conditions. Cherche un copain de jeu qui respecte son rythme.", seeking: ["Play date", "Compagnon de vie"], emoji: "🐱", color: "#B8B8C9", photos: ["/photos/tigrou-1.jpg", "/photos/tigrou-2.jpg", "/photos/tigrou-3.jpg"], lat: 48.847, lng: 2.352, pedigree: false },
  { id: 12, name: "Nanouk", species: "dog", breed: "Husky Sibérien", age: "2 ans", gender: "M", energy: 5, temper: ["Énergique", "Indépendant", "Sociable"], distance: "3,1 km", vaccinated: true, sterilized: false, owner: "Émilie C.", bio: "Nanouk a hérité de toute l'énergie de ses ancêtres traîneaux et adore courir sans limite. Très sociable avec les autres chiens, un peu théâtral aussi (préparez-vous aux vocalises). Cherche partenaire de balade endurant ou reproduction sérieuse selon profil.", seeking: ["Balade", "Reproduction"], emoji: "🐕", color: "#C9C9D4", photos: ["/photos/nanouk-2.jpg", "/photos/nanouk-1.jpg", "/photos/nanouk-3.jpg"], lat: 48.819, lng: 2.341, pedigree: true },
];

const REPRO_PROFILES = [
  { id: 10, name: "Atlas", species: "dog", breed: "Berger Australien", age: "3 ans", gender: "M", emoji: "🐕", owner: "Julie R.", distance: "2,3 km", vaccinated: true, pedigree: true, testedGenes: true, price: "500 €", bio: "Champion de France 2024, bilan génétique complet. Recherche femelle saine pour reproduction sérieuse.", temper: ["Calme", "Équilibré"], color: "#A9C4B8", photos: ["/photos/atlas-1.jpg"] },
  { id: 11, name: "Isis", species: "cat", breed: "Maine Coon", age: "2 ans", gender: "F", emoji: "🐱", owner: "Pierre T.", distance: "4,1 km", vaccinated: true, pedigree: true, testedGenes: false, price: "400 €", bio: "Isis est une beauté au caractère doux. Recherche mâle avec pedigree LOOF.", temper: ["Douce", "Affectueuse"], color: "#C9B8A9", photos: ["/photos/Isis-1.png", "/photos/Isis-2.png"] },
  { id: 12, name: "Thor", species: "dog", breed: "Golden Retriever", age: "4 ans", gender: "M", emoji: "🐕", owner: "Emma G.", distance: "1,8 km", vaccinated: true, pedigree: true, testedGenes: true, price: "600 €", bio: "Hips A/A, yeux clairs. Reproducteur confirmé, 3 portées saines.", temper: ["Stable", "Joueur"], color: "#C9C4A9", photos: ["/photos/thor-1.jpg"] },
  { id: 13, name: "Luna", species: "cat", breed: "Siamois", age: "2 ans", gender: "F", emoji: "🐱", owner: "Nadia B.", distance: "3,2 km", vaccinated: true, pedigree: true, testedGenes: true, price: "450 €", bio: "Luna est vive et très sociable. Bilan félin complet fait, recherche mâle LOOF pour une première portée.", temper: ["Vive", "Sociable"], color: "#D9C9B0", photos: ["/photos/Luna-1.png", "/photos/Luna-2.png"] },
  { id: 14, name: "Simba", species: "cat", breed: "Bengal", age: "3 ans", gender: "M", emoji: "🐱", owner: "Karim H.", distance: "5,6 km", vaccinated: true, pedigree: true, testedGenes: true, price: "550 €", bio: "Simba a déjà 2 portées réussies à son actif. Robe marbrée superbe, caractère joueur et affirmé.", temper: ["Joueur", "Affirmé"], color: "#E0B98D", photos: ["/photos/Simba-1.png", "/photos/Simba-2.png"] },
  { id: 15, name: "Suki", species: "cat", breed: "Sacré de Birmanie", age: "18 mois", gender: "F", emoji: "🐱", owner: "Claire V.", distance: "2,9 km", vaccinated: true, pedigree: true, testedGenes: false, price: "420 €", bio: "Première portée envisagée pour Suki. Yeux bleus intenses, tempérament très câlin.", temper: ["Câline", "Douce"], color: "#EDE4D3", photos: ["/photos/Nala-1.png", "/photos/Nala-2.png"] },
  { id: 16, name: "Rex", species: "dog", breed: "Labrador", age: "3 ans", gender: "M", emoji: "🐕", owner: "Antoine F.", distance: "1,2 km", vaccinated: true, pedigree: true, testedGenes: true, price: "500 €", bio: "Rex est sociable et en pleine forme, bilan hanches/coudes excellent. Déjà 2 portées de qualité.", temper: ["Sociable", "Énergique"], color: "#D4C9A8", photos: ["/photos/rex-1.jpg"] },
  { id: 17, name: "Bella", species: "dog", breed: "Cavalier King Charles", age: "2 ans", gender: "F", emoji: "🐕", owner: "Marion S.", distance: "4,7 km", vaccinated: true, pedigree: true, testedGenes: true, price: "550 €", bio: "Bella recherche un mâle avec pedigree pour une première portée. Cœur testé sain, caractère très doux.", temper: ["Douce", "Câline"], color: "#E8C9B8", photos: ["/photos/bella-1.jpg"] },
  { id: 18, name: "Zeus", species: "dog", breed: "Berger Allemand", age: "4 ans", gender: "M", emoji: "🐕", owner: "Lucas M.", distance: "3,5 km", vaccinated: true, pedigree: true, testedGenes: true, price: "600 €", bio: "Zeus est un reproducteur expérimenté, ligne de travail reconnue. Bilan dysplasie A/A.", temper: ["Protecteur", "Obéissant"], color: "#B0A99C", photos: ["/photos/zeus-1.jpg"] },
];

const SPOTS = [
  { id: 1, name: "Parc Montsouris", city: "Paris", type: "park", species: "both", emoji: "🌳", animals: 8, open: true, lat: 48.821, lng: 2.337, distance: "0,9 km", desc: "Grand parc avec zone chiens sans laisse" },
  { id: 2, name: "Café des Chats Marais", city: "Paris", type: "catcafe", species: "cat", emoji: "☕", animals: 12, open: true, lat: 48.857, lng: 2.354, distance: "2,1 km", desc: "Café-chat avec 12 résidents, accueil 10h–20h" },
  { id: 3, name: "Dog Park Nation", city: "Paris", type: "dogpark", species: "dog", emoji: "🏟️", animals: 5, open: false, lat: 48.848, lng: 2.396, distance: "3,4 km", desc: "Espace clos 800m², ouverture 8h–21h" },
  { id: 4, name: "Jardins du Palais Royal", city: "Paris", type: "park", species: "both", emoji: "🌸", animals: 3, open: true, lat: 48.864, lng: 2.337, distance: "4,2 km", desc: "Jardin historique pet-friendly" },
  { id: 5, name: "Wouf Dog Park", city: "Paris", type: "dogpark", species: "dog", emoji: "🎾", animals: 11, open: true, lat: 48.870, lng: 2.360, distance: "5,1 km", desc: "Dog park premium avec agility" },
  { id: 6, name: "Vétérinaire du Marais", city: "Paris", type: "vet", species: "both", emoji: "🩺", animals: 128, metricLabel: "avis vérifiés", open: true, lat: 48.859, lng: 2.362, distance: "2,4 km", desc: "Vétérinaire partenaire Miloute — consultations chats et chiens, urgences 7j/7" },
  { id: 7, name: "Chez Marcel", city: "Paris", type: "terrace", species: "dog", emoji: "🍽️", animals: 0, metricLabel: "terrasse chien-friendly", open: true, lat: 48.872, lng: 2.365, distance: "3,8 km", desc: "Bistrot avec grande terrasse, gamelle d'eau offerte, bords du Canal Saint-Martin" },
  { id: 8, name: "La Chatterie", city: "Paris", type: "petshop", species: "cat", emoji: "🛍️", animals: 0, metricLabel: "boutique spécialisée", open: true, lat: 48.853, lng: 2.349, distance: "1,7 km", desc: "Arbres à chat, jouets et alimentation premium — ateliers découverte le week-end" },
  { id: 9, name: "Bassin de la Villette", city: "Paris", type: "walk", species: "dog", emoji: "🚶", animals: 6, open: true, lat: 48.884, lng: 2.373, distance: "6,2 km", desc: "Balade au bord de l'eau, très fréquentée par les chiens du quartier" },
];

const COMMUNITY_POSTS = [
  { id: 1, species: "dog", breed: "Berger Australien", emoji: "🐕", photo: "/photos/rocky-1.jpg", author: "Thomas D.", pet: "Rocky", time: "Il y a 2h", text: "Rocky a fait son premier agility aujourd'hui ! On cherche d'autres Aussies pour s'entraîner le dimanche matin à Vincennes 🏃", likes: 24, comments: 8, tag: "Événement" },
  { id: 2, species: "cat", breed: "Européen", emoji: "🐱", photo: "/photos/rosie-1.jpg", author: "Sophie M.", pet: "Rosie", time: "Il y a 5h", text: "Petite question : Rosie refuse de manger depuis 2 jours. Elle a pourtant l'air en forme... Quelqu'un a eu ça avec son chat ? 🤔", likes: 12, comments: 19, tag: "Conseil" },
  { id: 3, species: "cat", breed: "Maine Coon", emoji: "🐱", photo: "/photos/mochi-1.jpg", author: "Clara B.", pet: "Mochi", time: "Hier", text: "Mochi vient de fêter ses 5 ans ! 🎂 Le plus grand et le plus doux des chats parisiens. Il cherche toujours son âme sœur pour partager son canapé.", likes: 67, comments: 14, tag: "Anniversaire" },
  { id: 4, species: "dog", breed: "Cavalier King Charles", emoji: "🐕", photo: "/photos/bella-1.jpg", author: "Marc L.", pet: "Bella", time: "Hier", text: "Bella disponible pour reproduction printemps 2026. Pedigree SCC, bilan hanche A/A. Cherche mâle sain et équilibré uniquement.", likes: 9, comments: 5, tag: "Reproduction" },
];

const AGENDA = [
  { id: 1, date: "Sam. 14 Juin", time: "10h00", with: "Luna", species: "cat", ownerEmoji: "🐱", owner: "Sophie M.", place: "Parc Montsouris", type: "Play date", status: "confirmed", rating: null },
  { id: 2, date: "Dim. 15 Juin", time: "15h30", with: "Rocky", species: "dog", ownerEmoji: "🐕", owner: "Thomas D.", place: "Bois de Vincennes", type: "Balade", status: "pending", rating: null },
  { id: 3, date: "Mar. 10 Juin", time: "11h00", with: "Pixel", species: "cat", ownerEmoji: "🐱", owner: "Léa P.", place: "Café des Chats Marais", type: "Cat date", status: "done", rating: 5 },
];

const MATCHES = [
  { id: 1, name: "Rosie", species: "cat", emoji: "🐱", photo: "/photos/rosie-1.jpg", owner: "Sophie M.", lastMsg: "Super ! À samedi alors 😸", time: "12:34", unread: 2 },
  { id: 2, name: "Rocky", species: "dog", emoji: "🐕", photo: "/photos/rocky-1.jpg", owner: "Thomas D.", lastMsg: "Il adore le bois de Vincennes !", time: "Hier", unread: 0 },
  { id: 5, name: "Pixel", species: "cat", emoji: "🐱", photo: "/photos/pixel-1.jpg", owner: "Léa P.", lastMsg: "Nouveau match ✨", time: "Lun.", unread: 1 },
];

const MESSAGES = {
  1: [
    { from: "them", text: "Bonjour ! Luna serait ravie de rencontrer votre chat 😸", time: "12:20" },
    { from: "me", text: "Quelle bonne idée ! Ils ont l'air super compatibles", time: "12:25" },
    { from: "them", text: "On pourrait se retrouver au parc Montsouris ?", time: "12:30" },
    { from: "me", text: "Parfait ! Samedi matin ?", time: "12:32" },
    { from: "them", text: "Super ! À samedi alors 😸", time: "12:34" },
  ],
  2: [
    { from: "them", text: "Rocky est très sociable, pas d'inquiétude ! 🐕", time: "Hier 18:10" },
    { from: "me", text: "Super nouvelle ! Il adore jouer avec d'autres chiens ?", time: "Hier 18:15" },
    { from: "them", text: "Il adore le bois de Vincennes !", time: "Hier 18:20" },
  ],
  5: [{ from: "them", text: "Nouveau match ✨", time: "Lun. 09:00" }],
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function EnergyDots({ level }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= level ? "#B25F46" : "#E5E7EB" }} />
      ))}
    </div>
  );
}

// Variante "5 pattes" du niveau d'énergie, utilisée dans Découvrir uniquement.
function EnergyPaws({ level }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 13, opacity: i <= level ? 1 : 0.25, filter: i <= level ? "none" : "grayscale(1)" }}>🐾</span>
      ))}
    </div>
  );
}

function Badge({ children, color = "#FAF0EB", text = "#8B3D28" }) {
  return (
    <span style={{ background: color, color: text, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, display: "inline-block" }}>
      {children}
    </span>
  );
}

// Glisser vers le bas pour actualiser — ne s'active que si le conteneur est
// déjà tout en haut de son scroll, pour ne jamais gêner un scroll normal.
function PullToRefresh({ onRefresh, children, style = {} }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);
  const THRESHOLD = 64;

  function handleTouchStart(e) {
    startY.current = (containerRef.current && containerRef.current.scrollTop <= 0) ? e.touches[0].clientY : null;
  }
  function handleTouchMove(e) {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) { setPulling(true); setPullDistance(Math.min(delta * 0.6, 90)); }
  }
  async function handleTouchEnd() {
    if (pulling && pullDistance > THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(56);
      try { await onRefresh(); } finally { setRefreshing(false); setPullDistance(0); }
    } else {
      setPullDistance(0);
    }
    setPulling(false);
    startY.current = null;
  }

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", ...style }}>
      <div style={{ height: pullDistance, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: pulling ? "none" : "height .2s" }}>
        {(pulling || refreshing) && (
          <div style={{ fontSize: 12, color: "#B25F46", fontWeight: 700 }}>
            {refreshing ? "🔄 Actualisation..." : pullDistance > THRESHOLD ? "↑ Relâchez pour actualiser" : "↓ Tirez pour actualiser"}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ── SWIPE SCREEN ──────────────────────────────────────────────────────────────
// ── DISTANCE HELPER ────────────────────────────────────────────────────────────
// Accepte les deux formats : {url, name} (vrais profils Supabase) et une
// simple chaîne (profils de démo) — évite de dupliquer la logique partout.
function photoUrl(p) {
  if (!p) return null;
  return typeof p === "string" ? p : p.url;
}

// ── MESSAGE DE MATCH PERSONNALISÉ ─────────────────────────────────────────────
// Ramène un trait de caractère à sa forme canonique (les profils de démo
// utilisent parfois des variantes accordées au féminin) pour pouvoir
// retrouver une combinaison connue, peu importe le genre de l'animal.
function normalizeTemper(t) {
  if (!t) return null;
  const map = {
    "joueuse": "Joueur", "joueur": "Joueur",
    "affectueuse": "Affectueux", "affectueux": "Affectueux",
    "curieuse": "Curieux", "curieux": "Curieux",
    "câline": "Câlin", "câlin": "Câlin",
    "calme": "Calme",
    "énergique": "Énergique",
    "indépendante": "Indépendant", "indépendant": "Indépendant",
    "sociable": "Sociable",
    "timide": "Timide",
    "gourmande": "Gourmand", "gourmand": "Gourmand",
  };
  return map[t.toLowerCase()] || t;
}

// Combinaisons de traits avec une phrase dédiée, plus piquante qu'un texte
// générique. Clé = les deux traits normalisés, triés par ordre alphabétique.
const TEMPER_COMBO_MESSAGES = {
  "Joueur|Joueur": (a, b) => `${a} et ${b} : deux boules d'énergie qui ne vont jamais s'arrêter de s'amuser 🐾`,
  "Calme|Joueur": (a, b) => `${a} le trublion et ${b} le zen : l'équilibre parfait entre énergie et sérénité 🐾`,
  "Câlin|Joueur": (a, b) => `${a} adore jouer, ${b} adore les câlins — de quoi alterner les bons moments 🐾`,
  "Indépendant|Joueur": (a, b) => `${a} plein d'entrain, ${b} plus indépendant : un duo qui trouve son propre rythme 🐾`,
  "Joueur|Timide": (a, b) => `${a} pourrait bien aider ${b} à sortir de sa coquille, tout en douceur 🐾`,
  "Affectueux|Affectueux": (a, b) => `${a} et ${b} : deux cœurs tendres qui vont se le rendre au centuple 🐾`,
  "Affectueux|Calme": (a, b) => `${a} tout en tendresse et ${b} tout en tranquillité : parfait pour de longues siestes câlines 🐾`,
  "Affectueux|Indépendant": (a, b) => `${a} cherche les câlins, ${b} son espace : un bel équilibre en perspective 🐾`,
  "Curieux|Curieux": (a, b) => `${a} et ${b} : deux explorateurs qui ne manqueront pas d'aventures à vivre ensemble 🐾`,
  "Calme|Curieux": (a, b) => `${a} l'aventurier et ${b} le posé : le duo qui explore sans jamais se presser 🐾`,
  "Câlin|Câlin": (a, b) => `${a} et ${b} : deux âmes câlines faites pour se blottir l'une contre l'autre 🐾`,
  "Calme|Calme": (a, b) => `${a} et ${b} : la promesse d'une belle complicité tranquille 🐾`,
  "Énergique|Énergique": (a, b) => `${a} et ${b} : ensemble, ils ne vont jamais s'arrêter — accrochez-vous ! 🐾`,
  "Calme|Énergique": (a, b) => `${a} déborde d'énergie, ${b} garde son calme : un duo qui s'équilibre à merveille 🐾`,
  "Énergique|Indépendant": (a, b) => `${a} plein d'énergie, ${b} qui trace sa route : une belle complicité à leur rythme 🐾`,
  "Indépendant|Indépendant": (a, b) => `${a} et ${b} : deux esprits libres qui sauront respecter l'espace l'un de l'autre 🐾`,
  "Sociable|Sociable": (a, b) => `${a} et ${b} : deux boute-en-train qui vont adorer se retrouver 🐾`,
  "Sociable|Timide": (a, b) => `${a} le sociable pourrait bien mettre ${b} en confiance, doucement 🐾`,
  "Timide|Timide": (a, b) => `${a} et ${b} : deux âmes discrètes qui sauront avancer à leur rythme, ensemble 🐾`,
  "Gourmand|Gourmand": (a, b) => `${a} et ${b} : le duo qui ne dira jamais non à une friandise partagée 🐾`,
  "Calme|Gourmand": (a, b) => `${a} et ${b} : parfait pour une sieste après un bon repas 🐾`,
};

function generateMatchMessage(myPet, theirPet) {
  const myName = myPet?.name || "Votre compagnon";
  const theirName = theirPet?.name || "leur compagnon";
  const myTraitRaw = myPet?.temper?.[0];
  const theirTraitRaw = theirPet?.temper?.[0];

  if (!myTraitRaw || !theirTraitRaw) {
    return `${myName} et ${theirName} : un match plein de promesses ! 🐾`;
  }

  const key = [normalizeTemper(myTraitRaw), normalizeTemper(theirTraitRaw)].sort().join("|");
  const template = TEMPER_COMBO_MESSAGES[key];
  if (template) return template(myName, theirName);

  return `${myName} (${myTraitRaw.toLowerCase()}) et ${theirName} (${theirTraitRaw.toLowerCase()}) : le duo qui pourrait bien être fait l'un pour l'autre 🐾`;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // rayon terrestre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── STOCKAGE DES PHOTOS (Supabase Storage) ───────────────────────────────────
// Envoie un fichier dans le bucket "photos", sous un dossier propre à
// l'utilisateur (obligatoire pour les règles d'accès), et retourne son URL
// publique définitive — contrairement à URL.createObjectURL, qui ne fonctionne
// que localement et disparaît au rafraîchissement.
async function uploadPhotoToStorage(file, userId) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}

// ── MODÉRATION ────────────────────────────────────────────────────────────────
// Photos/vidéos : seuls les chats et chiens sont autorisés, contenu approprié
// obligatoire. Messages/commentaires : blocage auto si contenu problématique.
// Les vérifications réelles se font côté serveur (fonctions Vercel, voir
// /api/moderate-photo et /api/moderate-text) via l'API Claude (vision + texte).

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // retire le préfixe data:...;base64,
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

// Extrait la première image d'une vidéo (miniature) pour la faire passer par
// la même vérification que les photos — évite d'avoir à analyser tout le flux.
function extractVideoFrameBase64(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
        URL.revokeObjectURL(video.src);
        resolve(base64);
      } catch (err) { reject(err); }
    };
    video.onerror = () => reject(new Error("Lecture de la vidéo impossible"));
  });
}

// Interrupteur global de la modération automatique (photos + textes), via
// l'API Claude. Repasser à false en cas de souci (clé Anthropic manquante,
// quota dépassé...) pour ne jamais bloquer l'app — tout redevient accepté
// sans appel réseau, le temps de résoudre le problème.
const MODERATION_ENABLED = true;

// Interrupteur global des profils/contenus de démonstration (Découvrir,
// Reproduction, Communauté, Prestataires, Qui craque pour vous). Servent à
// éviter que l'app paraisse vide avant d'avoir assez d'utilisateurs réels.
// Repasser à false quand il y aura une masse critique d'utilisateurs réels —
// tout le contenu fictif disparaît alors d'un coup, partout dans l'app.
const SHOW_DEMO_CONTENT = true;

// Réduit la taille de l'image avant de l'envoyer à la vérification —
// uniquement pour cet appel, la photo d'origine (upload, affichage) n'est
// jamais touchée. Objectif : rester rapide même sur une connexion mobile
// moyenne, où l'envoi d'une photo en pleine résolution peut expirer.
function compressImageForModeration(base64, mimeType) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.6).split(",")[1]);
        } catch {
          resolve(base64); // échec de compression : on retombe sur l'original
        }
      };
      img.onerror = () => resolve(base64);
      img.src = `data:${mimeType};base64,${base64}`;
    } catch {
      resolve(base64);
    }
  });
}

// Retourne { approved: boolean, reason: string|null }. En cas d'erreur réseau,
// on refuse par prudence plutôt que de laisser passer un contenu non vérifié.
async function moderateImage(base64, mimeType = "image/jpeg", context = "pet") {
  if (!MODERATION_ENABLED) return { approved: true, reason: null };
  try {
    const compressed = await compressImageForModeration(base64, mimeType);
    const res = await fetch(apiUrl("/api/moderate-photo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: compressed, mimeType: "image/jpeg", context }),
    });
    if (!res.ok) return { approved: false, reason: "Vérification indisponible, réessayez." };
    const data = await res.json();
    return { approved: !!data.approved, reason: data.reason || null };
  } catch {
    return { approved: false, reason: "Vérification indisponible, réessayez." };
  }
}

async function moderateText(text, context = "chat") {
  if (!MODERATION_ENABLED) return { approved: true, reason: null };
  try {
    const res = await fetch(apiUrl("/api/moderate-text"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context }),
    });
    if (!res.ok) return { approved: true, reason: null }; // texte : on ne bloque pas si le service est indisponible
    const data = await res.json();
    return { approved: !!data.approved, reason: data.reason || null };
  } catch {
    return { approved: true, reason: null };
  }
}

// ── SONS DE SWIPE (synthétisés, aucun fichier à héberger) ────────────────────
// Un seul AudioContext partagé, créé à la volée au premier son (les navigateurs
// bloquent l'audio tant qu'il n'y a pas eu d'interaction utilisateur — le swipe
// lui-même sert de déclencheur, donc pas de souci ici).
let _sharedAudioCtx = null;
function getAudioCtx() {
  if (!_sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _sharedAudioCtx = new Ctx();
  }
  if (_sharedAudioCtx.state === "suspended") _sharedAudioCtx.resume();
  return _sharedAudioCtx;
}

// Petit helper commun : une note = une fréquence (ou une rampe vers une 2e
// fréquence), un délai de départ, une durée et un type d'onde. Réduit la
// duplication entre les différentes palettes ci-dessous.
function playTone(delay, freqStart, duration, { type = "sine", peakGain = 0.192, freqEnd = null } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, ctx.currentTime + delay);
  if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration);
  gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(peakGain, ctx.currentTime + delay + Math.min(0.02, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.03);
}
function playSequence(notes) {
  notes.forEach(([delay, freqStart, duration, opts]) => playTone(delay, freqStart, duration, opts));
}

// Bruit blanc filtré passe-bande — donne le grain "raspy" nécessaire à un
// aboiement crédible ; un simple oscillateur sonne trop musical/propre pour ça.
function playNoiseBurst(delay, duration, { peakGain = 0.288, freqStart = 400, freqEnd = 200, q = 1.2 } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(freqStart, t0);
  bandpass.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  bandpass.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  source.connect(bandpass).connect(gain).connect(ctx.destination);
  source.start(t0);
  source.stop(t0 + duration + 0.02);
}

// Léger froissement de page, pour le Livre Magique — volontairement neutre
// (indépendant de la palette de son choisie pour le swipe), respecte juste
// le mode son général (coupé si "Off").
function playPageTurnSound() {
  if (loadSoundMode() === "off") return;
  playNoiseBurst(0, 0.16, { peakGain: 0.1, freqStart: 2200, freqEnd: 800, q: 0.6 });
}

// Miaulement et aboiement synthétisés — approximatifs mais reconnaissables :
// le miaou monte puis redescend en douceur (onde en dents de scie, glissando),
// l'aboiement est un coup bref et grave qui chute vite (percussif).
function playMeow(delay = 0, { peakGain = 0.176, duration = 0.38 } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + delay;
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(560, t0);
  osc.frequency.linearRampToValueAtTime(880, t0 + duration * 0.3);
  osc.frequency.linearRampToValueAtTime(480, t0 + duration);
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}
function playWoof(delay = 0, { peakGain = 0.32, duration = 0.14, noiseFreqStart = 500, noiseFreqEnd = 220, oscFreqStart = 160, oscFreqEnd = 80 } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Le bruit filtré donne le grain "raspy" de l'aboiement, l'oscillateur grave
  // en renfort donne le corps/la poitrine du son — un oscillateur seul sonne
  // trop pur et musical pour évoquer un vrai aboiement. Les fréquences sont
  // réglables pour distinguer un "waouh" grave (gros chien) d'un "yip" aigu
  // (petit chien).
  playNoiseBurst(delay, duration, { peakGain, freqStart: noiseFreqStart, freqEnd: noiseFreqEnd, q: 1 });
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(oscFreqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(oscFreqEnd, t0 + duration);
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain * 0.65, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

// Petit "couic" de jouet en caoutchouc — oscillateur carré avec un pitch qui
// remonte/redescend façon jouet qu'on presse et relâche.
function playSqueak(delay = 0, { peakGain = 0.256, duration = 0.22 } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(900, t0);
  osc.frequency.linearRampToValueAtTime(500, t0 + duration * 0.4);
  osc.frequency.linearRampToValueAtTime(700, t0 + duration * 0.6);
  osc.frequency.linearRampToValueAtTime(280, t0 + duration);
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Lecture d'un vrai fichier audio (hébergé dans public/sounds/), avec repli
// automatique vers le son synthétisé si le fichier ne charge/joue pas.
function playAudioFile(url, fallback) {
  try {
    const audio = new Audio(url);
    audio.volume = 1;
    const playPromise = audio.play();
    if (playPromise?.catch) playPromise.catch(() => fallback && fallback());
  } catch {
    fallback && fallback();
  }
}
const SOUND_FILE_URLS = {
  likeChienGros: "/sounds/like-chien.mp3",
  likeChienPetit: "/sounds/like-petit-chien.mp3",
  likeChat: "/sounds/like-chat.mp3",
  jouet: "/sounds/jouet.wav",
  cadeau: "/sounds/cadeau.mp3",
};

// ── PALETTES DE SONS ──────────────────────────────────────────────────────
// Chacune définit un son pour nope (refus), like et gift (envoi de cadeau,
// un cran au-dessus du like). Tout est synthétisé, rien à héberger — sauf la
// palette "especes" qui utilise de vrais enregistrements pour like/cadeau
// (fournis par Julien), avec repli synthétisé si le fichier ne joue pas.
const SOUND_PALETTES = {
  classique: {
    label: "Classique",
    icon: "🔔",
    nope: () => playTone(0, 340, 0.25, { peakGain: 0.55, freqEnd: 120 }),
    like: () => playSequence([[0, 520, 0.19, { peakGain: 0.48 }], [0.12, 780, 0.19, { peakGain: 0.48 }]]),
    gift: () => playSequence([[0, 520, 0.21, { peakGain: 0.512 }], [0.1, 660, 0.21, { peakGain: 0.512 }], [0.2, 880, 0.21, { peakGain: 0.512 }]]),
    match: () => playSequence([[0, 392, 0.16, { peakGain: 0.55 }], [0.11, 523, 0.16, { peakGain: 0.55 }], [0.22, 659, 0.16, { peakGain: 0.55 }], [0.33, 784, 0.32, { peakGain: 0.55 }]]),
  },
  doux: {
    label: "Doux",
    icon: "🌸",
    nope: () => playTone(0, 260, 0.3, { peakGain: 0.416, freqEnd: 160 }),
    like: () => playTone(0, 640, 0.4, { peakGain: 0.32 }),
    gift: () => playSequence([[0, 600, 0.32, { peakGain: 0.32 }], [0.16, 760, 0.32, { peakGain: 0.32 }]]),
    match: () => playSequence([[0, 523, 0.3, { peakGain: 0.352 }], [0.2, 659, 0.3, { peakGain: 0.352 }], [0.4, 784, 0.45, { peakGain: 0.384 }]]),
  },
  nature: {
    label: "Nature",
    icon: "🐾",
    nope: () => playNoiseBurst(0, 0.1, { peakGain: 0.512, freqStart: 700, freqEnd: 250, q: 1.4 }),
    like: () => playSequence([[0, 900, 0.06, { freqEnd: 1400, peakGain: 0.48 }], [0.06, 1200, 0.06, { freqEnd: 800, peakGain: 0.48 }]]),
    gift: () => playSequence([[0, 900, 0.06, { freqEnd: 1400, peakGain: 0.48 }], [0.06, 1200, 0.06, { freqEnd: 800, peakGain: 0.48 }], [0.2, 1000, 0.06, { freqEnd: 1500, peakGain: 0.48 }], [0.26, 1300, 0.06, { freqEnd: 900, peakGain: 0.48 }]]),
    match: () => playSequence([[0, 900, 0.06, { freqEnd: 1400, peakGain: 0.512 }], [0.06, 1200, 0.06, { freqEnd: 800, peakGain: 0.512 }], [0.16, 1000, 0.06, { freqEnd: 1600, peakGain: 0.512 }], [0.22, 1300, 0.06, { freqEnd: 900, peakGain: 0.512 }], [0.34, 1100, 0.06, { freqEnd: 1700, peakGain: 0.512 }], [0.4, 1400, 0.1, { freqEnd: 1000, peakGain: 0.544 }]]),
  },
  retro: {
    label: "Rétro",
    icon: "🕹️",
    nope: () => playTone(0, 300, 0.12, { type: "square", peakGain: 0.416, freqEnd: 140 }),
    like: () => playSequence([[0, 440, 0.09, { type: "square", peakGain: 0.416 }], [0.09, 660, 0.09, { type: "square", peakGain: 0.416 }]]),
    gift: () => playSequence([[0, 440, 0.08, { type: "square", peakGain: 0.416 }], [0.08, 550, 0.08, { type: "square", peakGain: 0.416 }], [0.16, 660, 0.08, { type: "square", peakGain: 0.416 }], [0.24, 880, 0.12, { type: "square", peakGain: 0.416 }]]),
    match: () => playSequence([[0, 392, 0.08, { type: "square", peakGain: 0.448 }], [0.08, 523, 0.08, { type: "square", peakGain: 0.448 }], [0.16, 659, 0.08, { type: "square", peakGain: 0.448 }], [0.24, 784, 0.08, { type: "square", peakGain: 0.448 }], [0.32, 1047, 0.22, { type: "square", peakGain: 0.48 }]]),
  },
  festif: {
    label: "Festif",
    icon: "🎉",
    nope: () => playTone(0, 300, 0.22, { type: "triangle", peakGain: 0.448, freqEnd: 90 }),
    like: () => playSequence([[0, 523, 0.16, { type: "triangle", peakGain: 0.48 }], [0.09, 659, 0.16, { type: "triangle", peakGain: 0.48 }], [0.18, 784, 0.2, { type: "triangle", peakGain: 0.48 }]]),
    gift: () => playSequence([[0, 523, 0.14, { type: "triangle", peakGain: 0.48 }], [0.08, 659, 0.14, { type: "triangle", peakGain: 0.48 }], [0.16, 784, 0.14, { type: "triangle", peakGain: 0.48 }], [0.24, 1047, 0.22, { type: "triangle", peakGain: 0.48 }]]),
    match: () => playSequence([[0, 523, 0.13, { type: "triangle", peakGain: 0.512 }], [0.08, 659, 0.13, { type: "triangle", peakGain: 0.512 }], [0.16, 784, 0.13, { type: "triangle", peakGain: 0.512 }], [0.24, 1047, 0.13, { type: "triangle", peakGain: 0.512 }], [0.32, 1319, 0.4, { type: "triangle", peakGain: 0.544 }]]),
  },
  jouet: {
    label: "Jouet",
    icon: "🧸",
    nope: () => playSqueak(0, { peakGain: 0.224, duration: 0.16 }),
    like: () => playAudioFile(SOUND_FILE_URLS.jouet, () => playSqueak()),
    gift: () => (playSqueak(0), playSqueak(0.28, { duration: 0.26 })),
    match: () => {
      playAudioFile(SOUND_FILE_URLS.jouet, () => playSqueak());
      setTimeout(() => playAudioFile(SOUND_FILE_URLS.jouet, () => playSqueak()), 280);
    },
  },
  wouf_petit: {
    label: "Waouh (petit chien)",
    icon: "🐕",
    // Fréquences plus hautes et durée plus courte pour un "yip" au lieu d'un "waouh" grave.
    nope: () => playWoof(0, { peakGain: 0.32, duration: 0.08, noiseFreqStart: 900, noiseFreqEnd: 500, oscFreqStart: 320, oscFreqEnd: 180 }),
    like: () => playAudioFile(SOUND_FILE_URLS.likeChienPetit, () => {
      playWoof(0, { duration: 0.08, noiseFreqStart: 900, noiseFreqEnd: 500, oscFreqStart: 320, oscFreqEnd: 180 });
      playWoof(0.12, { duration: 0.08, noiseFreqStart: 900, noiseFreqEnd: 500, oscFreqStart: 320, oscFreqEnd: 180 });
    }),
    gift: () => [0, 0.12, 0.26].forEach(d => playWoof(d, { duration: 0.08, noiseFreqStart: 900, noiseFreqEnd: 500, oscFreqStart: 320, oscFreqEnd: 180 })),
    match: () => {
      const fallback = () => { playWoof(0, { duration: 0.08, noiseFreqStart: 900, noiseFreqEnd: 500, oscFreqStart: 320, oscFreqEnd: 180 }); playWoof(0.12, { duration: 0.08, noiseFreqStart: 900, noiseFreqEnd: 500, oscFreqStart: 320, oscFreqEnd: 180 }); };
      playAudioFile(SOUND_FILE_URLS.likeChienPetit, fallback);
      setTimeout(() => playAudioFile(SOUND_FILE_URLS.likeChienPetit, fallback), 260);
    },
  },
  wouf_gros: {
    label: "Waouh (gros chien)",
    icon: "🐶",
    nope: () => playWoof(0, { peakGain: 0.32 }),
    like: () => playAudioFile(SOUND_FILE_URLS.likeChienGros, () => { playWoof(0); playWoof(0.16); }),
    gift: () => (playWoof(0), playWoof(0.15), playWoof(0.32)),
    match: () => {
      playAudioFile(SOUND_FILE_URLS.likeChienGros, () => { playWoof(0); playWoof(0.16); });
      setTimeout(() => playAudioFile(SOUND_FILE_URLS.likeChienGros, () => { playWoof(0); playWoof(0.16); }), 260);
    },
  },
  miaou: {
    label: "Miaou",
    icon: "🐱",
    // Vrai enregistrement pour le like, avec repli synthétisé si le fichier ne joue pas.
    nope: () => playMeow(0, { peakGain: 0.224, duration: 0.22 }),
    like: () => playAudioFile(SOUND_FILE_URLS.likeChat, () => playMeow()),
    gift: () => (playMeow(0), playMeow(0.34, { duration: 0.3 })),
    match: () => {
      playAudioFile(SOUND_FILE_URLS.likeChat, () => playMeow());
      setTimeout(() => playAudioFile(SOUND_FILE_URLS.likeChat, () => playMeow()), 260);
    },
  },
};

const SOUND_MODES = ["fun", "off"];
const SOUND_MODE_INFO = {
  fun: { icon: "🔊", label: "Fun" },
  off: { icon: "🔇", label: "Off" },
};

function loadSoundMode() {
  try {
    const v = localStorage.getItem("miloute_sound_mode");
    return SOUND_MODES.includes(v) ? v : "fun";
  } catch { return "fun"; }
}
function saveSoundMode(mode) {
  try { localStorage.setItem("miloute_sound_mode", mode); } catch {}
}

function loadSoundPalette() {
  try {
    const v = localStorage.getItem("miloute_sound_palette");
    return SOUND_PALETTES[v] ? v : "classique";
  } catch { return "classique"; }
}
function saveSoundPalette(palette) {
  try { localStorage.setItem("miloute_sound_palette", palette); } catch {}
}

// Joue le son + déclenche la vibration adaptés au mode et à la palette choisis, pour un swipe donné.
function playSwipeFeedback(mode, palette, dir, species) {
  if (mode === "off") return;
  const p = SOUND_PALETTES[palette] || SOUND_PALETTES.classique;
  if (dir === "like") p.like(species); else p.nope(species);
}

// Idem pour l'envoi d'un cadeau — vibration un peu plus marquée, geste plus fort qu'un like.
function playGiftFeedback(mode, palette, species) {
  if (mode === "off") return;
  // Le vrai fichier cadeau est utilisé pour tous les styles, avec repli sur
  // le son synthétisé propre à la palette si le fichier ne joue pas.
  const p = SOUND_PALETTES[palette] || SOUND_PALETTES.classique;
  playAudioFile(SOUND_FILE_URLS.cadeau, () => p.gift(species));
}

// Son de victoire pour la célébration de match — le moment fort de l'app.
function playMatchFeedback(mode, palette, species) {
  if (mode === "off") return;
  (SOUND_PALETTES[palette] || SOUND_PALETTES.classique).match(species);
}

const FREE_RADIUS_CAP = 20; // km

// ── PHRASES D'ACCROCHE PHOTO (façon Hinge) ───────────────────────────────────
// Certains prompts sont adaptés selon l'espèce (comportements bien différents
// entre un chat et un chien) — d'autres restent identiques quand ça a du sens.
const PHOTO_CAPTION_PROMPTS_RAW = [
  { cat: "Mon plus grand talent est…", dog: "Mon plus grand talent est…" },
  { cat: "Je deviens fou/folle quand…", dog: "Je deviens fou/folle quand…" },
  { cat: "Mon rêve est de…", dog: "Mon rêve est de…" },
  { cat: "On me reconnaît à…", dog: "On me reconnaît à…" },
  { cat: "Je cherche…", dog: "Je cherche…" },
  { cat: "Mon coin de sieste préféré est…", dog: "Mon terrain de jeu préféré est…" },
  { cat: "Ce qui me rend zen, c'est…", dog: "Ce qui me rend fou/folle de joie, c'est…" },
  { cat: "Ma technique pour faire craquer mon humain est…", dog: "Ma technique pour faire craquer mon humain est…" },
  { cat: "Je juge silencieusement…", dog: "J'aboie toujours sur…" },
  { cat: "Mon rituel du soir est…", dog: "Mon rituel du soir est…" },
];

function getPhotoCaptionPrompts(species) {
  return PHOTO_CAPTION_PROMPTS_RAW.map(p => species === "cat" ? p.cat : p.dog);
}
const PHOTO_CAPTION_MAX_LENGTH = 100;
const PHOTO_CAPTION_MAX_EMOJIS = 2;

function countEmojis(str) {
  return (str.match(/\p{Extended_Pictographic}/gu) || []).length;
}

async function generatePhotoCaption(species, breed, temper, name) {
  try {
    const res = await fetch(apiUrl("/api/moderate-text"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-caption", species, breed, temper, name }),
    });
    const data = await res.json();
    return data.caption || null;
  } catch (err) {
    console.error("generatePhotoCaption error:", err);
    return null;
  }
}

function SwipeScreen({ onNav, userProfile, isPremium = false, onPremium = () => {}, onGoToShop = () => {}, onProfileUpdated = () => {} }) {
  const [idx, setIdx] = useState(0);
  const [matchedWith, setMatchedWith] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [searchRadius, setSearchRadius] = useState(isPremium ? 100 : FREE_RADIUS_CAP);
  const [showRadiusSheet, setShowRadiusSheet] = useState(false);
  const [treatsToday, setTreatsToday] = useState(loadTreatsToday);
  const [soundMode, setSoundMode] = useState(loadSoundMode);
  const [soundPalette, setSoundPalette] = useState(loadSoundPalette);
  const [showSoundSheet, setShowSoundSheet] = useState(false);

  function chooseSoundMode(mode) {
    setSoundMode(mode);
    saveSoundMode(mode);
    if (mode === "fun") SOUND_PALETTES[soundPalette].like(userProfile?.species);
  }

  function choosePalette(key) {
    setSoundPalette(key);
    saveSoundPalette(key);
    if (soundMode === "fun") SOUND_PALETTES[key].like(userProfile?.species); // petit aperçu immédiat au choix
  }
  const [treatSentId, setTreatSentId] = useState(null);
  const [likeBurstId, setLikeBurstId] = useState(null);
  const [swipeGiftMessage, setSwipeGiftMessage] = useState("");
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [fsPhotoIndex, setFsPhotoIndex] = useState(0);
  const [fsZoomScale, setFsZoomScale] = useState(1);
  const [fsZoomOffset, setFsZoomOffset] = useState({ x: 0, y: 0 });
  const fsPinchRef = useRef({ startDist: 0, startScale: 1 });
  const fsPanRef = useRef({ startX: 0, startY: 0, startOffset: { x: 0, y: 0 } });

  function fsTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function onFsTouchStart(e) {
    if (e.touches.length === 2) {
      fsPinchRef.current = { startDist: fsTouchDistance(e.touches), startScale: fsZoomScale };
    } else if (e.touches.length === 1 && fsZoomScale > 1) {
      fsPanRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startOffset: fsZoomOffset };
    }
  }
  function onFsTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = fsTouchDistance(e.touches);
      const nextScale = Math.min(4, Math.max(1, fsPinchRef.current.startScale * (dist / fsPinchRef.current.startDist)));
      setFsZoomScale(nextScale);
    } else if (e.touches.length === 1 && fsZoomScale > 1) {
      const dx = e.touches[0].clientX - fsPanRef.current.startX;
      const dy = e.touches[0].clientY - fsPanRef.current.startY;
      setFsZoomOffset({ x: fsPanRef.current.startOffset.x + dx, y: fsPanRef.current.startOffset.y + dy });
    }
  }
  function onFsDoubleTap() {
    if (fsZoomScale > 1) { setFsZoomScale(1); setFsZoomOffset({ x: 0, y: 0 }); }
    else setFsZoomScale(2);
  }
  const [showSwipeGiftPicker, setShowSwipeGiftPicker] = useState(false);
  const [sendingSwipeGift, setSendingSwipeGift] = useState(false);
  const [treatToast, setTreatToast] = useState(null); // nom de l'animal
  const [breedFilter, setBreedFilter] = useState("all");
  const [showBreedMenu, setShowBreedMenu] = useState(false);
  const [deck, setDeck] = useState([]);
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [deckError, setDeckError] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const cardRef = useRef(null);
  const infoScrollRef = useRef(null);

  useEffect(() => {
    if (infoScrollRef.current) infoScrollRef.current.scrollTop = 0;
  }, [idx]);

  async function loadDeck() {
    if (!userProfile?.id) { setLoadingDeck(false); return; }
    setDeckError(null);
    try {
      const [{ data: candidates, error: candErr }, { data: mySwipes, error: swErr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("species", userProfile.species).neq("user_id", userProfile.userId),
        supabase.from("swipes").select("target_profile_id").eq("swiper_user_id", userProfile.userId),
      ]);
      if (candErr) throw candErr;
      if (swErr) throw swErr;
      const alreadySwiped = new Set((mySwipes || []).map(s => s.target_profile_id));
      const realOnes = (candidates || [])
        .filter(row => !alreadySwiped.has(row.id))
        .map(profileFromRow);

      // Profils de démo en renfort — utile pour présenter l'app (captures
      // d'écran, vidéos) même quand peu de vrais utilisateurs sont inscrits.
      // Marqués isDemo pour ne jamais toucher à Supabase quand on les swipe.
      const demoOnes = PROFILES
        .filter(p => !userProfile?.species || p.species === userProfile.species)
        .map(p => ({ ...p, isDemo: true }));

      setDeck([...realOnes, ...(SHOW_DEMO_CONTENT ? demoOnes : [])]);
    } catch (err) {
      setDeckError("Impossible de charger les profils. Réessayez.");
      console.error("loadDeck error:", err);
    }
  }

  // Charge la pile de profils à swiper depuis Supabase : même espèce, pas soi-même,
  // pas déjà swipé. Se recharge si le profil (donc l'id/espèce) de l'utilisateur change.
  useEffect(() => {
    setLoadingDeck(true);
    loadDeck().finally(() => setLoadingDeck(false));
  }, [userProfile?.id, userProfile?.species, userProfile?.userId]);

  // Rafraîchit uniquement le statut "en ligne" des profils déjà chargés,
  // toutes les 30s — sans recharger tout le deck ni changer l'ordre/la
  // position en cours, juste pour que le badge reste à jour.
  const deckRef = useRef(deck);
  deckRef.current = deck;
  useEffect(() => {
    const interval = setInterval(async () => {
      const realIds = deckRef.current.filter(p => !p.isDemo).map(p => p.id);
      if (realIds.length === 0) return;
      const { data, error } = await supabase.from("profiles").select("id, last_active_at").in("id", realIds);
      if (error || !data) return;
      const byId = new Map(data.map(row => [row.id, row.last_active_at]));
      setDeck(d => d.map(p => byId.has(p.id) ? { ...p, lastActiveAt: byId.get(p.id) } : p));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function getProfileDistance(p) {
    // Les profils de démo gardent toujours leur fausse distance, même avec une
    // vraie position activée : leurs coordonnées sont fixes (Paris), donc un
    // vrai calcul GPS viderait Découvrir pour n'importe qui hors de cette zone.
    if (p.isDemo) {
      const parsed = parseFloat((p.distance || "0").replace(",", ".").replace(/[^\d.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    }
    // Vrai profil : distance calculable seulement si on connaît sa propre
    // position ET celle du profil en face. Sinon, on renvoie Infinity plutôt
    // que 0 — un profil de distance inconnue ne doit jamais passer un filtre
    // de rayon (ça reviendrait à prétendre "il est juste à côté").
    if (userProfile?.location && p.location?.lat && p.location?.lng) {
      return distanceKm(userProfile.location.lat, userProfile.location.lng, p.location.lat, p.location.lng);
    }
    return Infinity;
  }

  function formatProfileDistance(p) {
    if (p.isDemo) return p.distance;
    const km = getProfileDistance(p);
    if (!isFinite(km)) return "Distance inconnue";
    return km.toFixed(1).replace(".", ",") + " km";
  }

  const availableBreeds = userProfile?.species === "cat" ? CAT_BREEDS : DOG_BREEDS;

  const filtered = deck.filter(p =>
    (breedFilter === "all" || p.breed === breedFilter) &&
    (p.isDemo || searchRadius >= 100 || getProfileDistance(p) <= searchRadius)
  );
  const profile = filtered[idx];

  const THRESHOLD = 80;
  const dragRatio = Math.min(Math.abs(dragX) / THRESHOLD, 1);
  const isLiking = dragX > 20;
  const isNoping = dragX < -20;

  async function swipe(dir) {
    if (swiping) return;
    playSwipeFeedback(soundMode, soundPalette, dir, userProfile?.species);
    const swipedProfile = profile;
    const targetX = dir === "like" ? 440 : -440;
    setDragX(targetX);
    setSwiping(true);

    // Profil de démo : purement local, jamais écrit dans Supabase (ces profils
    // n'existent pas vraiment en base). On simule un match de temps en temps
    // pour que la démo reste vivante (utile pour les vidéos/captures).
    if (swipedProfile.isDemo) {
      const demoMatched = dir === "like" && Math.random() > 0.4;
      setTimeout(() => {
        setDragX(0); setDragging(false); setPhoto(0); setSwiping(false);
        if (demoMatched) { setMatchedWith(swipedProfile); playMatchFeedback(soundMode, soundPalette, userProfile?.species); }
        else setIdx(i => Math.min(i + 1, filtered.length - 1));
      }, 380);
      return;
    }

    // Enregistre le swipe et détecte un éventuel match mutuel pendant l'animation.
    let matched = false;
    try {
      await supabase.from("swipes").insert({
        swiper_user_id: userProfile.userId,
        target_profile_id: swipedProfile.id,
        direction: dir,
      });
      if (dir === "like") {
        const { data: reciprocal } = await supabase
          .from("swipes")
          .select("id")
          .eq("swiper_user_id", swipedProfile.userId)
          .eq("target_profile_id", userProfile.id)
          .eq("direction", "like")
          .maybeSingle();
        if (reciprocal) {
          matched = true;
          await supabase.from("matches").insert({
            user_a: userProfile.userId, user_b: swipedProfile.userId,
            profile_a: userProfile.id, profile_b: swipedProfile.id,
          });
          if (!userProfile?.questsCompleted?.first_match) {
            claimQuest(userProfile, "first_match").then(result => {
              if (result.claimed) onProfileUpdated({ ...userProfile, giftInventory: result.giftInventory, questsCompleted: result.questsCompleted });
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error("swipe error:", err); // on n'interrompt pas l'UI pour une erreur d'enregistrement
    }

    setTimeout(() => {
      setDragX(0); setDragging(false); setPhoto(0); setSwiping(false);
      if (matched) { setMatchedWith(swipedProfile); playMatchFeedback(soundMode, soundPalette, userProfile?.species); }
      else setIdx(i => Math.min(i + 1, filtered.length - 1));
    }, 380);
  }

  function closeMatch() { setMatchedWith(null); setIdx(i => Math.min(i + 1, filtered.length - 1)); }

  async function sendChosenGift(giftId, emoji) {
    if (!(userProfile?.giftInventory?.[giftId] > 0)) {
      setShowSwipeGiftPicker(false);
      onGoToShop();
      return;
    }
    setSendingSwipeGift(true);
    const result = await spendGift(userProfile, giftId);
    if (result.success) {
      playGiftFeedback(soundMode, soundPalette, userProfile?.species);
      onProfileUpdated({ ...userProfile, giftInventory: result.giftInventory });
      const targetProfile = profile;
      const giftInfo = GIFT_CATALOG.find(g => g.id === giftId);
      setTreatSentId(targetProfile.id);
      setTreatToast({
        name: targetProfile.name,
        emoji: giftInfo?.emoji || emoji,
        label: giftInfo?.label || "Cadeau",
        article: giftInfo?.gender === "f" ? "Une" : "Un",
        pronoun: targetProfile.gender === "F" ? "elle" : "il",
        message: swipeGiftMessage.trim() || null,
      });
      setTimeout(() => setTreatSentId(null), 900);
      setTimeout(() => setTreatToast(null), 2600);
      if (!targetProfile.isDemo) {
        sendTreatToProfile(userProfile, targetProfile, giftId, swipeGiftMessage.trim() || null).catch(err => console.error("sendTreat error:", err));
      }
      setSwipeGiftMessage("");
      if (!userProfile?.questsCompleted?.first_gift_sent) {
        claimQuest(userProfile, "first_gift_sent").then(r => {
          if (r.claimed) onProfileUpdated({ ...userProfile, giftInventory: r.giftInventory, questsCompleted: r.questsCompleted });
        }).catch(() => {});
      }
    }
    setSendingSwipeGift(false);
    setShowSwipeGiftPicker(false);
  }

  function onTouchStart(e) {
    if (showSwipeGiftPicker) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setDragging(true);
  }
  function onTouchMove(e) {
    if (showSwipeGiftPicker || !dragging || touchStartX.current === null) return;
    e.preventDefault();
    setDragX(e.touches[0].clientX - touchStartX.current);
  }
  function onTouchEnd() {
    if (showSwipeGiftPicker || !dragging) return;
    if (dragX > THRESHOLD) swipe("like");
    else if (dragX < -THRESHOLD) swipe("nope");
    else { setDragX(0); setDragging(false); }
    touchStartX.current = null;
  }
  function onMouseDown(e) {
    if (showSwipeGiftPicker) return;
    touchStartX.current = e.clientX;
    setDragging(true);
  }
  function onMouseMove(e) {
    if (showSwipeGiftPicker || !dragging || touchStartX.current === null) return;
    setDragX(e.clientX - touchStartX.current);
  }
  function onMouseUp() {
    if (showSwipeGiftPicker || !dragging) return;
    if (dragX > THRESHOLD) swipe("like");
    else if (dragX < -THRESHOLD) swipe("nope");
    else { setDragX(0); setDragging(false); }
    touchStartX.current = null;
  }

  if (loadingDeck) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PawLogo size={40} color="#E8B89F" />
    </div>
  );

  if (deckError) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#8B3D28", marginBottom: 8 }}>Oups !</div>
      <div style={{ textAlign: "center", fontSize: 14, color: "#9CA3AF" }}>{deckError}</div>
    </div>
  );

  if (!profile) {
    const effectiveMaxRadius = isPremium ? 100 : FREE_RADIUS_CAP;
    const atMaxRadius = searchRadius >= effectiveMaxRadius;
    return (
      <>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          {atMaxRadius ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#8B3D28", marginBottom: 8 }}>Tu as fait le tour de ta zone !</div>
              <div style={{ textAlign: "center", fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent régulièrement 🐾</div>
              <button onClick={() => onNav("community")}
                style={{ padding: "12px 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                → Découvrir la Communauté
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#8B3D28", marginBottom: 8 }}>Plus de profils ici !</div>
              <div style={{ textAlign: "center", fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Élargis ta zone de recherche ou reviens plus tard.</div>
              <button onClick={() => setShowRadiusSheet(true)}
                style={{ padding: "12px 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                📍 Élargir ma zone de recherche
              </button>
            </>
          )}
        </div>
        {showRadiusSheet && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setShowRadiusSheet(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#2D1200", marginBottom: 4, textAlign: "center" }}>Rayon de recherche</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 24 }}>Affichez les animaux dans cette distance</div>
              <div style={{ textAlign: "center", fontSize: 36, fontWeight: 900, color: "#B25F46", marginBottom: 16 }}>{searchRadius >= 100 ? "Illimité" : `${searchRadius} km`}</div>
              <input type="range" min="1" max={isPremium ? 100 : FREE_RADIUS_CAP} value={Math.min(searchRadius, isPremium ? 100 : FREE_RADIUS_CAP)}
                onChange={e => setSearchRadius(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 8, accentColor: "#B25F46" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: isPremium ? 24 : 12 }}>
                <span>1 km</span><span>{isPremium ? "100 km +" : `${FREE_RADIUS_CAP} km max`}</span>
              </div>
              {!isPremium && (
                <button onClick={() => { setShowRadiusSheet(false); onPremium(); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FAF0EB", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>👑</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#B25F46" }}>Rayon illimité avec Premium</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>Gratuit limité à {FREE_RADIUS_CAP} km</div>
                  </div>
                </button>
              )}
              {!userProfile?.location && (
                <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
                  Activez votre position dans Profil pour des distances précises.
                </div>
              )}
              <button onClick={() => { setIdx(0); setShowRadiusSheet(false); }}
                style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Appliquer
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

      <div style={{ position: "relative", display: "flex", gap: 8, padding: "12px 16px 0", background: "#fff", flexShrink: 0, alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setShowBreedMenu(m => !m)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${breedFilter !== "all" ? "#8B3D28" : "#E5E7EB"}`, cursor: "pointer", fontSize: 12, fontWeight: 600, background: breedFilter !== "all" ? "#FAF0EB" : "#fff", color: "#8B3D28", whiteSpace: "nowrap" }}>
          🐾 {breedFilter === "all" ? "Toutes les races" : breedFilter}
          <span style={{ fontSize: 10, color: "#9CA3AF", transform: showBreedMenu ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
        </button>
        <button onClick={() => setShowSoundSheet(true)} title="Réglages de son"
          style={{ padding: "6px 10px", borderRadius: 20, border: "1.5px solid #E5E7EB", cursor: "pointer", fontSize: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {SOUND_MODE_INFO[soundMode].icon}
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowRadiusSheet(true)}
            style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid #E5E7EB", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "#fff", color: "#8B3D28", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            📍 {searchRadius >= 100 ? "Illimité" : `${searchRadius} km`}
          </button>
          <button onClick={onGoToShop}
            style={{ padding: "6px 10px", borderRadius: 20, border: "1.5px solid #E5E7EB", cursor: "pointer", fontSize: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            🎁
          </button>
        </div>

        {showBreedMenu && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 16, background: "#fff", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,.15)", border: "1px solid #F3F4F6", zIndex: 30, overflow: "hidden", minWidth: 200, maxHeight: 280 }}>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              <button onClick={() => { setBreedFilter("all"); setShowBreedMenu(false); setIdx(0); setPhoto(0); setDragX(0); }}
                style={{ width: "100%", padding: "11px 14px", border: "none", background: breedFilter === "all" ? "#FAF0EB" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#8B3D28", textAlign: "left", borderBottom: "1px solid #F9FAFB" }}>
                Toutes les races
              </button>
              {availableBreeds.map(b => (
                <button key={b} onClick={() => { setBreedFilter(b); setShowBreedMenu(false); setIdx(0); setPhoto(0); setDragX(0); }}
                  style={{ width: "100%", padding: "11px 14px", border: "none", background: breedFilter === b ? "#FAF0EB" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: breedFilter === b ? 700 : 500, color: breedFilter === b ? "#8B3D28" : "#374151", textAlign: "left", borderBottom: "1px solid #F9FAFB" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sheet — rayon de recherche */}
      {showRadiusSheet && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowRadiusSheet(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#2D1200", marginBottom: 4, textAlign: "center" }}>Rayon de recherche</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 24 }}>Affichez les animaux dans cette distance</div>
            <div style={{ textAlign: "center", fontSize: 36, fontWeight: 900, color: "#B25F46", marginBottom: 16 }}>{searchRadius >= 100 ? "Illimité" : `${searchRadius} km`}</div>
            <input type="range" min="1" max={isPremium ? 100 : FREE_RADIUS_CAP} value={Math.min(searchRadius, isPremium ? 100 : FREE_RADIUS_CAP)}
              onChange={e => setSearchRadius(Number(e.target.value))}
              style={{ width: "100%", marginBottom: 8, accentColor: "#B25F46" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: isPremium ? 24 : 12 }}>
              <span>1 km</span><span>{isPremium ? "100 km +" : `${FREE_RADIUS_CAP} km max`}</span>
            </div>
            {!isPremium && (
              <button onClick={() => { setShowRadiusSheet(false); onPremium(); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FAF0EB", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>👑</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#B25F46" }}>Rayon illimité avec Premium</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Gratuit limité à {FREE_RADIUS_CAP} km</div>
                </div>
              </button>
            )}
            {!userProfile?.location && (
              <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
                Activez votre position dans Profil pour des distances précises.
              </div>
            )}
            <button onClick={() => { setIdx(0); setShowRadiusSheet(false); }}
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Réglages de son : mode d'abord, puis style si activé */}
      {showSoundSheet && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "flex-end" }} onClick={() => setShowSoundSheet(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", padding: "20px 20px 32px" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200", marginBottom: 4, textAlign: "center" }}>🔊 Sons de Découvrir</div>
            <div style={{ fontSize: 12.5, color: "#9CA3AF", textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
              Un petit retour sonore à chaque like, refus, cadeau envoyé ou match. Choisissez d'activer ou non le son, et — si activé — avec quel style.
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>MODE</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              {SOUND_MODES.map(m => (
                <button key={m} onClick={() => chooseSoundMode(m)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", borderRadius: 14, border: soundMode === m ? "1.5px solid #B25F46" : "1.5px solid #E5E7EB", background: soundMode === m ? "#FAF0EB" : "#fff", cursor: "pointer" }}>
                  <span style={{ fontSize: 20 }}>{SOUND_MODE_INFO[m].icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: soundMode === m ? "#8B3D28" : "#9CA3AF" }}>{SOUND_MODE_INFO[m].label}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>STYLE DE SON</div>
            {soundMode !== "fun" && (
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>Choisissez le mode "Fun" ci-dessus pour activer le son.</div>
            )}
            <div style={{ opacity: soundMode === "fun" ? 1 : 0.4, pointerEvents: soundMode === "fun" ? "auto" : "none" }}>
              {Object.entries(SOUND_PALETTES)
                .filter(([key]) => {
                  if (userProfile?.species === "dog" && key === "miaou") return false;
                  if (userProfile?.species === "cat" && (key === "wouf_petit" || key === "wouf_gros")) return false;
                  return true;
                })
                .map(([key, p]) => (
                <button key={key} onClick={() => choosePalette(key)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 14, border: soundPalette === key ? "1.5px solid #B25F46" : "1.5px solid #E5E7EB", background: soundPalette === key ? "#FAF0EB" : "#fff", cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{p.label}</span>
                  {soundPalette === key && <span style={{ color: "#B25F46", fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      <div style={{ flex: 1, minHeight: 0, padding: "12px 16px", display: "flex", flexDirection: "column", userSelect: "none", position: "relative" }}>
        <OnboardingHint hintKey="swipe" icon="👆" text="Glisse la carte à gauche ou à droite pour liker/refuser, ou fais défiler vers le bas pour découvrir toutes les infos" position="top" />
        <div ref={cardRef}
          style={{ flex: 1, minHeight: 0, borderRadius: 24, position: "relative", display: "flex", flexDirection: "column",
            background: `linear-gradient(160deg, ${profile.color}55 0%, #fff 100%)`,
            border: "1px solid #E5E7EB",
            transform: `translateX(${dragX}px) rotate(${dragX * 0.08}deg)`,
            transition: dragging ? "none" : "transform .38s cubic-bezier(.25,.46,.45,.94)",
            boxShadow: "0 8px 32px rgba(178,95,70,.10)",
            overflow: "hidden" }}>

          {/* Colonne unique déroulante : photo + infos ensemble */}
          <div ref={infoScrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>

          {/* Section photo — gère le swipe (gauche/droite). touchAction "none" = zéro ambiguïté, JS gère tout ici. */}
          <div
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            style={{ position: "relative", height: 480, overflow: "hidden", background: profile.color,
              cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}>

            {/* LIKE stamp */}
            <div style={{ position: "absolute", top: 32, left: 20, zIndex: 10,
              opacity: isLiking ? dragRatio : 0, transform: "rotate(-15deg)", pointerEvents: "none" }}>
              <div style={{ border: "4px solid #22C55E", borderRadius: 10, padding: "4px 14px" }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#22C55E", letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}><PawLogo size={22} color="#22C55E" /> LIKE</span>
              </div>
            </div>

            {/* NOPE stamp */}
            <div style={{ position: "absolute", top: 32, right: 20, zIndex: 10,
              opacity: isNoping ? dragRatio : 0, transform: "rotate(15deg)", pointerEvents: "none" }}>
              <div style={{ border: "4px solid #EF4444", borderRadius: 10, padding: "4px 14px" }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#EF4444", letterSpacing: 2 }}>NOPE ❌</span>
              </div>
            </div>

            {/* Photo dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, position: "absolute", top: 12, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}>
              {profile.photos.map((_, i) => (
                <div key={i} style={{ width: i === photo ? 24 : 16, height: 4, borderRadius: 2, background: i === photo ? "#B25F46" : "rgba(255,255,255,.6)", transition: "width .2s" }} />
              ))}
            </div>

            {/* Boutons d'action — même taille, alignés en bas de la photo */}
            <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, zIndex: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, pointerEvents: "none" }}>
              <button onClick={e => { e.stopPropagation(); swipe("nope"); }}
                style={{ pointerEvents: "auto", width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.92)", border: "none", cursor: "pointer", fontSize: 22, color: "#B25F46", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.18)" }}>
                ✕
              </button>
              <button onClick={e => { e.stopPropagation(); setShowSwipeGiftPicker(true); }}
                style={{ pointerEvents: "auto", width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.92)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.18)", position: "relative",
                  transform: treatSentId === profile.id ? "scale(1.2)" : "scale(1)", transition: "transform .25s" }}>
                🎁
              </button>
              <button onClick={e => { e.stopPropagation(); setLikeBurstId(profile.id); setTimeout(() => setLikeBurstId(null), 700); swipe("like"); }}
                style={{ pointerEvents: "auto", width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.92)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.18)", position: "relative",
                  transform: likeBurstId === profile.id ? "scale(1.25)" : "scale(1)", transition: "transform .25s cubic-bezier(.34,1.56,.64,1)" }}>
                {likeBurstId === profile.id && (
                  <>
                    <style>{`
                      @keyframes likeGlowPulse { 0% { transform: scale(0.6); opacity: .8; } 100% { transform: scale(2.4); opacity: 0; } }
                      @keyframes likeBurstFly { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(90deg); opacity: 0; } }
                    `}</style>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(178,95,70,.5) 0%, transparent 70%)", animation: "likeGlowPulse .7s ease-out", pointerEvents: "none" }} />
                    {[["-34px","-20px"], ["36px","-18px"], ["-32px","22px"], ["34px","24px"]].map(([tx, ty], idx) => (
                      <span key={idx} style={{ position: "absolute", left: "50%", top: "50%", fontSize: 14, "--tx": tx, "--ty": ty, animation: `likeBurstFly .7s ease-out ${idx * 0.05}s both`, pointerEvents: "none" }}>🐾</span>
                    ))}
                  </>
                )}
                <PawLogo size={24} color="#B25F46" />
              </button>
            </div>

            {/* Confirmation d'envoi de cadeau — même effet waouh que dans le chat */}
            {treatToast && (
              <>
                <style>{`
                  @keyframes giftBoxShake { 0%,100% { transform: scale(1) rotate(0deg); } 25% { transform: scale(0.9) rotate(-8deg); } 75% { transform: scale(0.9) rotate(8deg); } }
                  @keyframes giftItemPop { 0% { transform: translate(-50%, 6px) scale(0) rotate(-18deg); opacity: 0; } 50% { transform: translate(-50%, -24px) scale(1.4) rotate(10deg); opacity: 1; } 70% { transform: translate(-50%, -18px) scale(0.92) rotate(-4deg); } 100% { transform: translate(-50%, -18px) scale(1) rotate(0deg); opacity: 1; } }
                  @keyframes toastGlowPulse { 0% { transform: scale(0.5); opacity: .9; } 100% { transform: scale(2.8); opacity: 0; } }
                  @keyframes toastSparkleFly { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(180deg); opacity: 0; } }
                  @keyframes toastTextIn { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
                `}</style>
                <div style={{ position: "absolute", bottom: 76, left: "50%", transform: "translateX(-50%)", zIndex: 6, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
                  <div style={{ position: "relative", width: 60, height: 60, marginBottom: 8 }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,215,0,.6) 0%, transparent 70%)", animation: "toastGlowPulse .9s ease-out" }} />
                    {[["-38px","-28px"], ["40px","-24px"], ["-40px","20px"], ["36px","28px"], ["2px","-40px"]].map(([tx, ty], idx) => (
                      <span key={idx} style={{ position: "absolute", left: "50%", top: "44%", fontSize: 13, "--tx": tx, "--ty": ty, animation: `toastSparkleFly .9s ease-out ${0.1 + idx * 0.07}s both` }}>✨</span>
                    ))}
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, animation: "giftBoxShake .5s ease-out" }}>🎁</div>
                    <div style={{ position: "absolute", left: "50%", top: 0, fontSize: 28, animation: "giftItemPop .7s cubic-bezier(.34,1.56,.64,1) .15s both" }}>{treatToast.emoji}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 20, whiteSpace: "nowrap", animation: "toastTextIn .3s ease-out .3s both" }}>
                    {treatToast.article} {treatToast.label} pour {treatToast.name} — {treatToast.pronoun} va adorer ! 🎉
                  </div>
                </div>
              </>
            )}

            {/* Sélecteur rapide de cadeau (ouvert via le chevron du bouton friandise) */}
            {showSwipeGiftPicker && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
                onClick={e => { e.stopPropagation(); setShowSwipeGiftPicker(false); }}>
                <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", width: "100%", maxHeight: "70vh", overflowY: "auto", boxSizing: "border-box" }}>
                  <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
                  {profile.isDemo ? (
                    <div style={{ textAlign: "center", padding: "20px 10px", color: "#9CA3AF", fontSize: 13 }}>
                      🌱 Profil de démonstration — l'envoi de cadeaux n'est pas disponible pour ce profil.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 10 }}>🎁 Envoyer à {profile.name}</div>
                      <input value={swipeGiftMessage} onChange={e => setSwipeGiftMessage(e.target.value.slice(0, 120))} onClick={e => e.stopPropagation()}
                        placeholder="Ajouter un mot (optionnel)..."
                        style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px", borderRadius: 20, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", marginBottom: 14 }} />
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {GIFT_CATALOG.filter(g => g.species === "both" || g.species === profile.species).map(g => {
                          const owned = userProfile?.giftInventory?.[g.id] || 0;
                          return (
                            <button key={g.id} onClick={() => sendChosenGift(g.id, g.emoji)} disabled={sendingSwipeGift}
                              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 4px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: sendingSwipeGift ? "default" : "pointer", opacity: owned > 0 ? 1 : .65 }}>
                              {owned > 0 && (
                                <span style={{ position: "absolute", top: 2, right: 2, background: "#B25F46", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>{owned}</span>
                              )}
                              <span style={{ fontSize: 22 }}>{g.emoji}</span>
                              <span style={{ fontSize: 9, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>{g.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>Un article grisé n'est plus en stock — tapez dessus pour l'acheter dans la Boutique.</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tap zones — pile sur la zone photo */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", zIndex: 3 }}
              onClick={() => !dragging && setPhoto(p => Math.max(0, p - 1))} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", zIndex: 3 }}
              onClick={() => !dragging && setPhoto(p => Math.min(profile.photos.length - 1, p + 1))} />

            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {photoUrl(profile.photos?.[photo])
                ? <img src={photoUrl(profile.photos[photo])} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 110 }}>{profile.species === "cat" ? "🐱" : "🐕"}</div>
              }
            </div>

            {photoUrl(profile.photos?.[photo]) && (
              <button onClick={e => { e.stopPropagation(); setFsPhotoIndex(photo); setFsZoomScale(1); setFsZoomOffset({ x: 0, y: 0 }); setShowFullscreenPhoto(true); }}
                style={{ position: "absolute", top: 12, right: 12, zIndex: 5, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,.45)", border: "none", color: "#fff", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                🔍
              </button>
            )}

            {profile.showMainCaption !== false && profile.photoCaptions?.[photo] && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "36px 18px 16px", background: "linear-gradient(to top, rgba(0,0,0,.65), transparent)", pointerEvents: "none" }}>
                <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.4, textShadow: "0 1px 4px rgba(0,0,0,.4)" }}>{profile.photoCaptions[photo]}</div>
              </div>
            )}
          </div>

          {/* Infos complètes — fait maintenant partie de la même colonne déroulante que la photo */}
          <div style={{ padding: "16px 20px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#9CA3AF", fontSize: 11, marginBottom: 12 }}>
              <span>↓</span><span>Glissez vers le bas pour lire le profil complet</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: "#2D1200" }}>{profile.name}</span><span style={{ fontSize: 15, color: "#6B7280", marginLeft: 8 }}>{formatAge(profile.age)} {profile.gender === "F" ? "♀" : "♂"}</span></div>
              {isProfileOnline(profile) && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  En ligne
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600, marginBottom: 8 }}>{profile.breed} · {formatProfileDistance(profile)}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {profile.temper.map(t => <Badge key={t}>{t}</Badge>)}
              {profile.sterilized && <Badge color="#E8F5E9" text="#2E7D32">Stérilisé·e</Badge>}
              {profile.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné·e ✓</Badge>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>ÉNERGIE</span>
              <EnergyPaws level={profile.energy} />
            </div>

            <div style={{ height: 1, background: "rgba(0,0,0,.06)", marginBottom: 14 }} />

            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>À PROPOS</div>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>{profile.bio}</p>

            {profile.photos?.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {profile.photos.slice(1).map((p, i) => (
                  photoUrl(p) && (
                    <div key={i}>
                      <div onClick={() => { setPhoto(i + 1); setFsPhotoIndex(i + 1); setFsZoomScale(1); setFsZoomOffset({ x: 0, y: 0 }); setShowFullscreenPhoto(true); }}
                        style={{ width: "100%", aspectRatio: "1", borderRadius: 14, overflow: "hidden", background: "#FAF0EB", cursor: "pointer" }}>
                        <img src={photoUrl(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      {profile.photoCaptions?.[i + 1] && (
                        <div style={{ fontSize: 13.5, color: "#4B5563", fontStyle: "italic", marginTop: 6, paddingLeft: 2 }}>{profile.photoCaptions[i + 1]}</div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}

            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>RECHERCHE</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {profile.seeking.map(s => <Badge key={s} color="#FAF0EB" text="#B25F46">{s}</Badge>)}
            </div>

            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Propriétaire : {profile.owner}</div>
          </div>
          </div>
        </div>
      </div>

      {matchedWith && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#8B3D28,#B25F46)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4, textAlign: "center" }}>C'est un match !</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,.9)", marginBottom: 32, textAlign: "center", lineHeight: 1.5, maxWidth: 320 }}>{generateMatchMessage(userProfile, matchedWith)}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 32 }}>
            <div style={{ width: 92, height: 92, borderRadius: "50%", border: "4px solid #fff", overflow: "hidden", background: "#8B3D28", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,.25)" }}>
              {userProfile?.photos?.[0]
                ? <img src={userProfile.photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{userProfile?.species === "dog" ? "🐕" : "🐱"}</div>
              }
            </div>
            <PawLogo size={56} color="#fff" />
            <div style={{ width: 92, height: 92, borderRadius: "50%", border: "4px solid #fff", overflow: "hidden", background: "#8B3D28", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,.25)" }}>
              {photoUrl(matchedWith.photos?.[0])
                ? <img src={photoUrl(matchedWith.photos[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{matchedWith.species === "cat" ? "🐱" : "🐕"}</div>
              }
            </div>
          </div>
          <button onClick={() => { closeMatch(); onNav("messages"); }} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#fff", color: "#8B3D28", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>💬 Envoyer un message</button>
          <button onClick={closeMatch} style={{ background: "transparent", border: "2px solid rgba(255,255,255,.5)", color: "#fff", padding: "14px", borderRadius: 16, width: "100%", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Continuer à swiper</button>
        </div>
      )}

      {/* Visualiseur photo plein écran avec zoom */}
      {showFullscreenPhoto && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300, display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: 14, right: 14, zIndex: 5 }}>
            <button onClick={() => setShowFullscreenPhoto(false)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ position: "absolute", top: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 5, pointerEvents: "none" }}>
            {profile.photos.map((_, i) => (
              <div key={i} style={{ width: i === fsPhotoIndex ? 22 : 14, height: 3, borderRadius: 2, background: i === fsPhotoIndex ? "#fff" : "rgba(255,255,255,.4)", transition: "width .2s" }} />
            ))}
          </div>
          <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
            onTouchStart={onFsTouchStart} onTouchMove={onFsTouchMove}
            onClick={e => {
              const now = Date.now();
              if (now - (fsPanRef.current.lastTap || 0) < 300) onFsDoubleTap();
              fsPanRef.current.lastTap = now;
            }}>
            {photoUrl(profile.photos?.[fsPhotoIndex]) && (
              <img src={photoUrl(profile.photos[fsPhotoIndex])} alt={profile.name}
                style={{ width: "100%", height: "100%", objectFit: "contain", transform: `scale(${fsZoomScale}) translate(${fsZoomOffset.x / fsZoomScale}px, ${fsZoomOffset.y / fsZoomScale}px)`, transition: "transform .1s" }} />
            )}
            {fsZoomScale === 1 && (
              <>
                <div style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "100%" }}
                  onClick={e => { e.stopPropagation(); setFsPhotoIndex(i => Math.max(0, i - 1)); }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: "35%", height: "100%" }}
                  onClick={e => { e.stopPropagation(); setFsPhotoIndex(i => Math.min(profile.photos.length - 1, i + 1)); }} />
              </>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "10px 20px 24px", color: "rgba(255,255,255,.6)", fontSize: 11 }}>
            Pincez pour zoomer · Double-tap pour agrandir/réduire
          </div>
        </div>
      )}
    </div>
  );
}


// ── MAP SCREEN ────────────────────────────────────────────────────────────────
const RURAL_ANIMALS = [
  { id: 10, name: "Filou", species: "dog", emoji: "🐕", breed: "Border Collie", owner: "Antoine R.", distance: "3,2 km", x: 30, y: 40, live: true },
  { id: 11, name: "Caline", species: "cat", emoji: "🐱", breed: "Européen", owner: "Nathalie B.", distance: "5,8 km", x: 65, y: 25, live: true },
  { id: 12, name: "Rex", species: "dog", emoji: "🐕", breed: "Berger Allemand", owner: "Pierre G.", distance: "7,1 km", x: 75, y: 62, live: false },
  { id: 13, name: "Mimi", species: "cat", emoji: "🐱", breed: "Maine Coon", owner: "Claire M.", distance: "2,4 km", x: 20, y: 68, live: true },
  { id: 14, name: "Duke", species: "dog", emoji: "🐕", breed: "Labrador", owner: "François T.", distance: "9,3 km", x: 55, y: 75, live: false },
];

const URBAN_ANIMALS = [
  { id: 1, x: 22, y: 55, species: "cat", emoji: "🐱", name: "Luna", breed: "Chartreux", owner: "Sophie M.", distance: "1,2 km", live: true },
  { id: 2, x: 62, y: 45, species: "dog", emoji: "🐕", name: "Rocky", breed: "Berger Australien", owner: "Thomas D.", distance: "0,8 km", live: true },
  { id: 3, x: 38, y: 72, species: "cat", emoji: "🐱", name: "Mochi", breed: "Maine Coon", owner: "Clara B.", distance: "2,1 km", live: false },
  { id: 4, x: 80, y: 60, species: "dog", emoji: "🐕", name: "Bella", breed: "Cavalier King Charles", owner: "Marc L.", distance: "3,4 km", live: false },
];

// Grandes villes françaises avec leurs coordonnées, pour déterminer
// automatiquement la ville la plus proche de l'utilisateur.
// ⚠️ Liste de départ (villes majeures) — à compléter/vérifier avant d'étendre
// à d'autres villes, plutôt que de se fier uniquement à ces coordonnées.
const FRENCH_CITIES = [
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Marseille", lat: 43.2965, lng: 5.3698 },
  { name: "Lyon", lat: 45.7640, lng: 4.8357 },
  { name: "Toulouse", lat: 43.6047, lng: 1.4442 },
  { name: "Nice", lat: 43.7102, lng: 7.2620 },
  { name: "Nantes", lat: 47.2184, lng: -1.5536 },
  { name: "Montpellier", lat: 43.6108, lng: 3.8767 },
  { name: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
  { name: "Lille", lat: 50.6292, lng: 3.0573 },
  { name: "Rennes", lat: 48.1173, lng: -1.6778 },
  { name: "Reims", lat: 49.2583, lng: 4.0317 },
  { name: "Toulon", lat: 43.1242, lng: 5.9280 },
  { name: "Grenoble", lat: 45.1885, lng: 5.7245 },
  { name: "Dijon", lat: 47.3220, lng: 5.0415 },
  { name: "Angers", lat: 47.4784, lng: -0.5632 },
  { name: "Nîmes", lat: 43.8367, lng: 4.3601 },
  { name: "Le Mans", lat: 48.0061, lng: 0.1996 },
  { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  { name: "Brest", lat: 48.3904, lng: -4.4861 },
];
// Étiquette d'affichage uniquement (ex. "Spots proches · Lyon") — le vrai
// filtrage se fait désormais par case géographique, pas par nom de ville.
function nearestCity(lat, lng) {
  let best = FRENCH_CITIES[0], bestDist = Infinity;
  for (const c of FRENCH_CITIES) {
    const d = distanceKm(lat, lng, c.lat, c.lng);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best.name;
}

// Grille géographique (~5,5 km de côté) : fonctionne n'importe où, pas
// seulement dans une liste de villes prédéfinies. Même formule que côté
// serveur (api/ensure-spots-for-location.js) — les deux doivent rester identiques.
const SPOT_CELL_SIZE = 0.05;
function cellIdFor(lat, lng) {
  return `${Math.round(lat / SPOT_CELL_SIZE)}_${Math.round(lng / SPOT_CELL_SIZE)}`;
}

// Les 8 cases autour de la case principale (grille 3×3) — utile en zone peu
// dense (rurale), où une seule case peut ne contenir aucun prestataire.
function neighborCellIds(lat, lng) {
  const cellX = Math.round(lat / SPOT_CELL_SIZE);
  const cellY = Math.round(lng / SPOT_CELL_SIZE);
  const ids = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      ids.push(`${cellX + dx}_${cellY + dy}`);
    }
  }
  return ids;
}

// Déclenche (si besoin) une synchronisation Google Places pour la case de
// l'utilisateur — no-op côté serveur si elle a déjà été rafraîchie il y a
// moins de 30 jours, donc peut être appelé à chaque ouverture sans souci de coût.
async function ensureSpotsForLocation(lat, lng, city) {
  try {
    await fetch(apiUrl("/api/ensure-spots-for-location"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, city }),
    });
  } catch (err) {
    console.error("ensureSpotsForLocation error:", err); // on continue quand même avec ce qui existe déjà en base
  }
}

async function fetchSpotsForCell(cellId) {
  const { data, error } = await supabase.from("spots").select("*").eq("cell_id", cellId);
  if (error || !data) { console.error("fetchSpotsForCell error:", error); return []; }
  return data.map(row => ({
    id: row.id, name: row.name, city: row.city, type: row.type, species: row.species,
    emoji: row.emoji, lat: row.lat, lng: row.lng, desc: row.description, phone: row.phone,
    metricLabel: row.metric_label, animals: row.metric_value || 0, open: row.open,
  }));
}

// ── PRESTATAIRES ──────────────────────────────────────────────────────────────
const PROVIDER_TYPES = ["groomer", "petsitter", "trainer", "boarding", "vet", "petshop", "insurance"];
const PROVIDER_TYPE_INFO = {
  vet: { label: "Vétérinaires", emoji: "🩺" },
  groomer: { label: "Toiletteurs", emoji: "✂️" },
  boarding: { label: "Pensions", emoji: "🏠" },
  trainer: { label: "Éducateurs", emoji: "🎓" },
  petsitter: { label: "Pet-sitters", emoji: "🐾" },
  petshop: { label: "Boutiques", emoji: "🛍️" },
  insurance: { label: "Assurances", emoji: "🛡️" },
};

// Prestataires de démonstration — équilibrent l'annuaire pour les catégories
// que la communauté n'a pas encore remplies (toiletteurs, pet-sitters,
// éducateurs, pensions). Marqués isDemo : jamais de vraie réservation
// possible, jamais écrits dans Supabase.
const DEMO_PROVIDERS = [
  { id: "demo-1", type: "groomer", name: "Zen Toilettage", emoji: "✂️", address: "Paris 11e", phone: "01 42 00 00 01", desc: "Toilettage doux pour chats et chiens, spécialiste poils longs. Sur rendez-vous du mardi au samedi.", demoRating: 4.8, demoReviewCount: 34, species: "both" },
  { id: "demo-2", type: "groomer", name: "Griffe & Ronron", emoji: "✂️", address: "Paris 15e", phone: "01 42 00 00 02", desc: "Toiletteuse féline exclusivement, approche sans stress pour chats craintifs.", demoRating: 4.9, demoReviewCount: 21, species: "cat" },
  { id: "demo-3", type: "petsitter", name: "Léa, pet-sitter", emoji: "🐾", address: "Paris 12e", phone: "06 00 00 00 03", desc: "Garde à domicile ou chez moi, week-ends et vacances. 5 ans d'expérience.", demoRating: 5.0, demoReviewCount: 18, species: "both" },
  { id: "demo-4", type: "petsitter", name: "Nino Dog Sitting", emoji: "🐾", address: "Paris 18e", phone: "06 00 00 00 04", desc: "Promenades quotidiennes et garde ponctuelle, spécial grands chiens.", demoRating: 4.7, demoReviewCount: 12, species: "dog" },
  { id: "demo-5", type: "trainer", name: "Canin Attitude", emoji: "🎓", address: "Paris 20e", phone: "01 42 00 00 05", desc: "Éducateur canin comportementaliste, cours particuliers et collectifs.", demoRating: 4.9, demoReviewCount: 27, species: "dog" },
  { id: "demo-6", type: "trainer", name: "Patte Éducative", emoji: "🎓", address: "Boulogne-Billancourt", phone: "06 00 00 00 06", desc: "Rééducation chiots et chiens adultes, méthode positive.", demoRating: 4.6, demoReviewCount: 9, species: "dog" },
  { id: "demo-7", type: "boarding", name: "Chez Mamie Chat", emoji: "🏠", address: "Vincennes", phone: "06 00 00 00 07", desc: "Pension féline à domicile, maison avec jardin, 2 chats maximum à la fois.", demoRating: 5.0, demoReviewCount: 15, species: "cat" },
  { id: "demo-8", type: "boarding", name: "Le Chenil du Bois", emoji: "🏠", address: "Saint-Mandé", phone: "01 42 00 00 08", desc: "Pension canine avec grand parc clos, promenades incluses.", demoRating: 4.7, demoReviewCount: 22, species: "dog" },
].map(p => ({ ...p, open: true, isDemo: true, source: "demo" }));

function mapProviderRow(row) {
  const url = row.affiliate_url;
  return {
    id: row.id, name: row.name, type: row.type, species: row.species, emoji: row.emoji,
    lat: row.lat, lng: row.lng, address: row.address, phone: row.phone, desc: row.description,
    open: row.open, source: row.source, affiliateUrl: (url && url.startsWith("http")) ? url : null,
    isFounder: !!row.is_founder, photos: row.photos || [],
    claimStatus: row.claim_status || null, claimedByUserId: row.claimed_by_user_id || null,
  };
}

const MIN_PROVIDERS_BEFORE_EXPANDING = 5;

async function fetchProvidersForCell(cellId, lat, lng) {
  const { data, error } = await supabase.from("spots").select("*").eq("cell_id", cellId).in("type", PROVIDER_TYPES).neq("source", "affiliate");
  if (error) { console.error("fetchProvidersForCell error:", error); return []; }
  let results = (data || []).map(mapProviderRow);

  // Zone peu dense (rurale) : si la case principale a peu de résultats, on
  // regarde aussi dans les 8 cases voisines — pas de nouvel appel Google,
  // juste ce qui a déjà été synchronisé par d'autres utilisateurs passés
  // par là, donc aucun coût supplémentaire.
  if (results.length < MIN_PROVIDERS_BEFORE_EXPANDING && lat != null && lng != null) {
    const neighborIds = neighborCellIds(lat, lng);
    const { data: neighborData, error: neighborError } = await supabase
      .from("spots").select("*").in("cell_id", neighborIds).in("type", PROVIDER_TYPES).neq("source", "affiliate");
    if (!neighborError && neighborData) {
      const existingIds = new Set(results.map(p => p.id));
      const extra = neighborData.map(mapProviderRow).filter(p => !existingIds.has(p.id));
      // Triés par vraie distance (pas juste par case), pour rester pertinent.
      extra.sort((a, b) => distanceKm(lat, lng, a.lat, a.lng) - distanceKm(lat, lng, b.lat, b.lng));
      results = [...results, ...extra];
    }
  }

  return results;
}

// Les partenaires en affiliation (assurances, grandes enseignes) ne sont pas
// des commerces locaux : ils s'affichent partout, peu importe la position.
async function fetchAffiliatePartners() {
  const { data, error } = await supabase.from("spots").select("*").eq("source", "affiliate");
  if (error || !data) { console.error("fetchAffiliatePartners error:", error); return []; }
  return data.map(row => {
    const url = row.affiliate_url;
    return {
      id: row.id, name: row.name, type: row.type, species: row.species, emoji: row.emoji,
      desc: row.description, source: row.source, affiliateUrl: (url && url.startsWith("http")) ? url : null,
    };
  });
}

async function fetchReviewsForProviders(spotIds) {
  if (!spotIds.length) return {};
  const { data, error } = await supabase.from("provider_reviews").select("*").in("spot_id", spotIds);
  if (error || !data) return {};
  const bySpot = {};
  data.forEach(r => { (bySpot[r.spot_id] = bySpot[r.spot_id] || []).push(r); });
  return bySpot;
}

async function fetchReviewsForSpot(spotId) {
  const { data, error } = await supabase.from("provider_reviews").select("*").eq("spot_id", spotId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, rating: r.rating, text: r.text, petName: r.pet_name,
    emoji: r.species === "cat" ? "🐱" : "🐕",
    time: formatRelativeTime(r.created_at),
  }));
}

async function createProviderReview(userProfile, spotId, rating, text) {
  const { error } = await supabase.from("provider_reviews").upsert({
    spot_id: spotId, user_id: userProfile.userId, pet_name: userProfile.name, species: userProfile.species,
    rating, text,
  }, { onConflict: "spot_id,user_id" });
  if (error) throw new Error(error.message);

  const { data: spot } = await supabase.from("spots").select("added_by_user_id, name").eq("id", spotId).maybeSingle();
  if (spot?.added_by_user_id && spot.added_by_user_id !== userProfile.userId) {
    sendPushNotification(
      spot.added_by_user_id,
      `Nouvel avis reçu ⭐`,
      `${userProfile.name} vous a laissé ${rating}/5${text ? ` — « ${text} »` : ""}`,
      { type: "review", spotId }
    );
  }
}

async function createCommunityProvider(userProfile, { name, type, address, phone, description, lat, lng }) {
  const { data, error } = await supabase.from("spots").insert({
    cell_id: cellIdFor(lat, lng),
    name, type, species: "both",
    emoji: PROVIDER_TYPE_INFO[type]?.emoji || "📍",
    lat, lng, address: address || null, phone: phone || null, description: description || null,
    open: true, source: "community", added_by_user_id: userProfile.userId,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

function MapScreen({ onOpenChat = () => {}, onNav = () => {}, userProfile = null }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState("urban"); // "urban" | "rural"
  const [sharing, setSharing] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [userPos, setUserPos] = useState(null); // { lat, lng }
  const [geoError, setGeoError] = useState(null);
  const [citySpots, setCitySpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);

  // Position de référence : celle captée par "Partager ma position" sur cette
  // carte (userPos) en priorité, puis celle du profil, puis un repli par
  // défaut (centre de Paris) tant qu'aucune des deux n'est disponible.
  const refLat = userPos?.lat ?? userProfile?.location?.lat ?? 48.8566;
  const refLng = userPos?.lng ?? userProfile?.location?.lng ?? 2.3522;
  const activeCity = nearestCity(refLat, refLng); // étiquette d'affichage uniquement
  const activeCellId = cellIdFor(refLat, refLng);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingSpots(true);
      await ensureSpotsForLocation(refLat, refLng, activeCity); // no-op si déjà à jour
      const result = await fetchSpotsForCell(activeCellId);
      if (active) { setCitySpots(result); setLoadingSpots(false); }
    }
    load();
    return () => { active = false; };
  }, [activeCellId]);

  function getSpotDistance(s) {
    return distanceKm(refLat, refLng, s.lat, s.lng).toFixed(1).replace(".", ",") + " km";
  }

  const spotsBySpecies = citySpots.filter(s => s.species === "both" || !userProfile?.species || s.species === userProfile.species);
  const filteredSpots = spotsBySpecies.filter(s => filter === "all" || s.type === filter).map(s => ({ ...s, distance: getSpotDistance(s) }));
  const animalsBySpecies = (mode === "rural" ? RURAL_ANIMALS : URBAN_ANIMALS).filter(a => !userProfile?.species || a.species === userProfile.species);
  const liveAnimals = animalsBySpecies.filter(a => a.live);
  const offlineAnimals = animalsBySpecies.filter(a => !a.live);


  function toggleSharing() {
    if (!sharing) setShowSharePrompt(true);
    else { setSharing(false); setUserPos(null); }
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPos({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSharing(true);
        setShowSharePrompt(false);
        setGeoError(null);
      },
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Vous avez refusé l'accès à votre position. Activez-le dans les paramètres de votre navigateur.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Position indisponible. Vérifiez votre GPS.");
            break;
          default:
            setGeoError("Impossible de récupérer votre position.");
        }
        setShowSharePrompt(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function confirmSharing() {
    requestGeolocation();
  }

  const isRural = mode === "rural";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{`.miloute-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <OnboardingHint hintKey="map" icon="📍" text="Activez votre position pour voir qui se trouve près de chez vous" position="top" />

      {/* Mode switcher + share toggle */}
      <div style={{ background: "#fff", padding: "10px 16px 8px", flexShrink: 0 }}>
        {/* Urban / Rural toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[["urban","🏙️ Urbain"],["rural","🌿 Rural"]].map(([v,l]) => (
            <button key={v} onClick={() => { setMode(v); setSelected(null); setFilter("all"); }}
              style={{ flex: 1, padding: "8px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: mode === v ? "#8B3D28" : "#FAF0EB", color: mode === v ? "#fff" : "#8B3D28", transition: "all .2s" }}>{l}</button>
          ))}
          <button onClick={() => setShowModeInfo(true)}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#FAF0EB", color: "#9CA3AF", fontSize: 16, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>ℹ️</button>
        </div>

        {/* Share position toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 14, background: sharing ? "linear-gradient(90deg,#E8F5E9,#F1F8E9)" : "#F9FAFB", border: `1.5px solid ${sharing ? "#A5D6A7" : "#E5E7EB"}`, transition: "all .3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{sharing ? "📍" : "📍"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: sharing ? "#1B5E20" : "#2D1200" }}>
                {sharing ? "Vous êtes visible sur la carte" : "Partager ma position"}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                {sharing && userPos ? `📍 ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : sharing ? "Position en cours de récupération..." : isRural ? "Essentiel en zone rurale pour se trouver" : "Visible dans un rayon de 5 km"}
              </div>
            </div>
          </div>
          <button onClick={toggleSharing}
            style={{ width: 48, height: 26, borderRadius: 13, background: sharing ? "#2E7D32" : "#D1D5DB", border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: sharing ? 25 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
          </button>
        </div>

        {/* Rural info banner */}
        {isRural && (
          <div style={{ marginTop: 8, padding: "8px 12px", background: "#FFF9E6", borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>🌿</span>
            <div style={{ fontSize: 11, color: "#854D0E", lineHeight: 1.5 }}>
              En zone rurale, <strong>la géolocalisation est la seule façon de se trouver</strong>. Partagez votre position pour apparaître sur la carte des propriétaires proches.
            </div>
          </div>
        )}

        {/* Filtres spots — uniquement en mode urbain */}
        {!isRural && (
          <div className="miloute-hide-scrollbar" style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              ["all","Tout 🗺️"],
              ["park","Parcs 🌳"],
              ["catcafe","Cafés chat ☕"],
              ["dogpark","Dog parks 🏟️"],
              ["vet","Vétérinaires 🩺"],
              ["terrace","Terrasses 🍽️"],
              ["petshop","Boutiques 🛍️"],
              ["walk","Balades 🚶"],
            ]
              .filter(([v]) => v !== "catcafe" || userProfile?.species !== "dog")
              .filter(([v]) => v !== "dogpark" || userProfile?.species !== "cat")
              .filter(([v]) => v !== "petshop" || userProfile?.species !== "dog")
              .filter(([v]) => (v !== "terrace" && v !== "walk") || userProfile?.species !== "cat")
              .map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", background: filter === v ? "#8B3D28" : "#FAF0EB", color: filter === v ? "#fff" : "#8B3D28" }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden",
        background: isRural
          ? "linear-gradient(160deg,#e8f5e9 0%,#f1f8e9 40%,#e0f2f1 70%,#f9fbe7 100%)"
          : "linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 50%,#f3e5f5 100%)" }}>

        {/* Rural texture — champs et routes */}
        {isRural && <>
          <div style={{ position: "absolute", left: "15%", right: "25%", top: "35%", height: 5, background: "rgba(180,140,80,.3)", borderRadius: 3 }} />
          <div style={{ position: "absolute", left: "45%", top: "5%", bottom: "15%", width: 5, background: "rgba(180,140,80,.3)", borderRadius: 3 }} />
          <div style={{ position: "absolute", left: "10%", right: "40%", top: "65%", height: 4, background: "rgba(180,140,80,.2)", borderRadius: 3, transform: "rotate(-8deg)" }} />
          {/* Champs */}
          <div style={{ position: "absolute", left: "5%", top: "10%", width: "35%", height: "25%", background: "rgba(139,195,74,.12)", borderRadius: 8, border: "1px solid rgba(139,195,74,.2)" }} />
          <div style={{ position: "absolute", right: "5%", top: "40%", width: "28%", height: "20%", background: "rgba(255,235,59,.08)", borderRadius: 8, border: "1px solid rgba(255,235,59,.15)" }} />
          <div style={{ position: "absolute", left: "20%", bottom: "10%", width: "40%", height: "18%", background: "rgba(139,195,74,.10)", borderRadius: 8 }} />
        </>}

        {/* Urban roads */}
        {!isRural && <>
          <div style={{ position: "absolute", left: "20%", right: "20%", top: "42%", height: 6, background: "rgba(255,255,255,.7)", borderRadius: 3 }} />
          <div style={{ position: "absolute", left: "50%", top: "10%", bottom: "20%", width: 6, background: "rgba(255,255,255,.7)", borderRadius: 3 }} />
        </>}

        {/* Ma position */}
        <div style={{ position: "absolute", left: "48%", top: "48%", transform: "translate(-50%,-50%)", zIndex: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563EB", border: "3px solid #fff", boxShadow: "0 0 0 6px rgba(37,99,235,.2)", transition: "all .3s" }} />
          {sharing && <div style={{ position: "absolute", top: -6, left: -6, width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(37,99,235,.4)", animation: "pulse 2s infinite" }} />}
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.4);opacity:0} }`}</style>

        {/* Animaux en live */}
        {liveAnimals.map(a => (
          <div key={a.id} onClick={() => setSelected(a)}
            style={{ position: "absolute", left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 2px 10px rgba(13,157,168,.4)", border: "2.5px solid #fff" }}>{a.emoji}</div>
            <div style={{ position: "absolute", top: -4, right: -4, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />
            <div style={{ position: "absolute", top: 42, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" }}>{a.name}</div>
          </div>
        ))}

        {/* Animaux hors ligne (grisés) */}
        {offlineAnimals.map(a => (
          <div key={a.id} onClick={() => setSelected(a)}
            style={{ position: "absolute", left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 7, opacity: 0.5 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "2px solid #fff" }}>{a.emoji}</div>
          </div>
        ))}

        {/* Spots — uniquement en mode urbain */}
        {!isRural && filteredSpots.map(spot => {
          // Position déterministe (basée sur l'id du spot) plutôt qu'un tableau
          // fixe — nécessaire puisque le nombre de spots varie selon la ville.
          const hash = [...String(spot.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
          const x = 15 + (hash % 71); // 15–85%
          const y = 10 + ((hash * 7) % 71); // 10–80%
          return (
            <div key={spot.id} onClick={() => setSelected(spot)}
              style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 9 }}>
              <div style={{ background: spot.open ? "#fff" : "#F3F4F6", border: `2px solid ${spot.open ? "#8B3D28" : "#D1D5DB"}`, borderRadius: 12, padding: "4px 8px", fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,.15)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                {spot.emoji}
                <span style={{ fontSize: 10, fontWeight: 700, color: spot.open ? "#8B3D28" : "#9CA3AF" }}>{spot.animals}</span>
              </div>
            </div>
          );
        })}

        {/* Légende */}
        <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "8px 12px", fontSize: 10, color: "#4B5563", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563EB" }} /> Moi
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} /> En live
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#9CA3AF" }} /> Hors ligne
          </div>
          {!isRural && <div style={{ display: "flex", gap: 8 }}>🌳 Parcs ☕ Cafés 🏟️ Dog parks</div>}
        </div>

        {/* Compteur live */}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "6px 12px", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2D1200" }}>{liveAnimals.length + (sharing ? 1 : 0)} en live</span>
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{isRural ? "dans votre zone" : "à proximité"}</div>
        </div>
      </div>

      {/* Liste en mode rural (pas de spots, que des animaux) */}
      {isRural && (
        <div style={{ background: "#fff", maxHeight: 200, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, display: "flex", justifyContent: "space-between" }}>
            <span>PROPRIÉTAIRES PROCHES</span>
            <span style={{ color: "#22C55E" }}>{liveAnimals.length} en ligne</span>
          </div>
          {animalsBySpecies.map(a => (
            <div key={a.id} onClick={() => setSelected(a)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: a.live ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{a.emoji}</div>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: a.live ? "#22C55E" : "#9CA3AF", border: "2px solid #fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{a.name} <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>· {a.breed}</span></div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{a.owner} · {a.distance}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: a.live ? "#E8F5E9" : "#F3F4F6", color: a.live ? "#2E7D32" : "#9CA3AF" }}>
                {a.live ? "En ligne" : "Hors ligne"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste spots en mode urbain */}
      {!isRural && (
        <div style={{ background: "#fff", maxHeight: 180, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>SPOTS PROCHES {loadingSpots ? "" : `· ${activeCity}`}</div>
          {loadingSpots ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><PawLogo size={24} color="#E8B89F" /></div>
          ) : filteredSpots.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>Pas encore de spot recensé à {activeCity}.</div>
          ) : filteredSpots.map(spot => (
            <div key={spot.id} onClick={() => setSelected(spot)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ fontSize: 26 }}>{spot.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{spot.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{spot.distance} · {spot.metricLabel ? spot.metricLabel : `${spot.animals} animaux maintenant`}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: spot.open ? "#E8F5E9" : "#FEE2E2", color: spot.open ? "#2E7D32" : "#DC2626" }}>{spot.open ? "Ouvert" : "Fermé"}</div>
            </div>
          ))}
        </div>
      )}


      {/* Sheet détail animal ou spot */}
      {selected && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 36px", width: "100%" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            {/* Animal */}
            {selected.name && !selected.type && (
              <>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: selected.live ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{selected.emoji}</div>
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 14, height: 14, borderRadius: "50%", background: selected.live ? "#22C55E" : "#9CA3AF", border: "2px solid #fff" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600 }}>{selected.breed} · {selected.distance}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{selected.owner}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selected.live ? "#2E7D32" : "#9CA3AF", marginTop: 2 }}>{selected.live ? "🟢 En ligne maintenant" : "⚪ Hors ligne"}</div>
                  </div>
                </div>
                {!selected.live && (
                  <div style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, fontSize: 12, color: "#9CA3AF", marginBottom: 12, textAlign: "center" }}>
                    {selected.name} n'est pas en ligne. Envoyez un message pour organiser une rencontre !
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setSelected(null); onOpenChat(1); onNav("chat"); }} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "2px solid #E5E7EB", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#8B3D28" }}>💬 Message</button>
                  <button onClick={() => { setSelected(null); onOpenChat(1); onNav("chat"); }} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display:"flex", gap:6, alignItems:"center" }}>Dire bonjour !</button>
                </div>
              </>
            )}
            {/* Spot */}
            {selected.type && (
              <>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 40 }}>{selected.emoji}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: "#8B3D28" }}>{selected.distance} · {selected.metricLabel ? selected.metricLabel : `${selected.animals} animaux maintenant`}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: selected.open ? "#E8F5E9" : "#FEE2E2", color: selected.open ? "#2E7D32" : "#DC2626" }}>{selected.open ? "Ouvert" : "Fermé"}</div>
                </div>
                <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 14 }}>{selected.desc}</p>
              </>
            )}
          </div>
        </div>
      )}


      {/* Geo error banner */}
      {geoError && (
        <div style={{ margin: "8px 16px", padding: "10px 14px", background: "#FEE2E2", borderRadius: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 2 }}>Géolocalisation impossible</div>
            <div style={{ fontSize: 12, color: "#7F1D1D" }}>{geoError}</div>
          </div>
          <button onClick={() => setGeoError(null)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Prompt partage de position */}
      {showSharePrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowSharePrompt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ textAlign: "center", fontSize: 48, marginBottom: 14 }}>📍</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8, textAlign: "center" }}>Partager ma position</div>
            <div style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>
              {isRural
                ? "En zone rurale, partager votre position est essentiel pour que les autres propriétaires proches puissent vous trouver. Vous restez visible uniquement quand l'app est ouverte."
                : "Votre position sera visible par les propriétaires dans un rayon de 5 km. Vous restez visible uniquement quand l'app est ouverte."}
            </div>
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              {["Visible uniquement pendant l'utilisation de l'app","Désactivable à tout moment","Votre adresse exacte n'est jamais partagée","Rayon minimum : 500m pour protéger votre vie privée"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12, color: "#4B5563" }}>
                  <span style={{ color: "#2E7D32", fontWeight: 700 }}>✓</span> {item}
                </div>
              ))}
            </div>
            <button onClick={confirmSharing} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              📍 Activer la géolocalisation
            </button>
            <button onClick={() => setShowSharePrompt(false)} style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", background: "#F3F4F6", color: "#6B7280", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {/* Info modal urbain/rural */}
      {showModeInfo && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowModeInfo(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#2D1200", marginBottom: 16 }}>Deux modes de carte</div>
            {[
              ["🏙️", "Mode Urbain", "Affiche les spots (parcs, cafés chats, dog parks) et les animaux à proximité. Idéal pour les grandes villes où les lieux de rencontre sont nombreux."],
              ["🌿", "Mode Rural", "Pas de spots dans votre zone ? Pas de problème. La carte affiche directement les propriétaires et animaux proches qui ont partagé leur position. La géolocalisation devient votre seul point de repère."],
            ].map(([e,t,d]) => (
              <div key={t} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{e}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200", marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowModeInfo(false)} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Compris !</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── REPRO SCREEN ──────────────────────────────────────────────────────────────
// ── PRESTATAIRES ──────────────────────────────────────────────────────────────
function ProvidersScreen({ userProfile = null, onProfileUpdated = () => {}, onNav = () => {}, onGoToProviderSetup = () => {} }) {
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [reviewsBySpot, setReviewsBySpot] = useState({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [showBecomeProviderPrompt, setShowBecomeProviderPrompt] = useState(false);

  const refLat = userProfile?.location?.lat ?? 48.8566;
  const refLng = userProfile?.location?.lng ?? 2.3522;
  const cellId = cellIdFor(refLat, refLng);

  function shareLocation() {
    if (!navigator.geolocation) { setLocationError("La géolocalisation n'est pas supportée par ce navigateur."); return; }
    setSharingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude, lng = position.coords.longitude;
        if (userProfile?.id) await updateProfileLocation(userProfile.id, lat, lng);
        onProfileUpdated({ ...userProfile, location: { lat, lng } });
        setSharingLocation(false);
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? "Position refusée — activez-la dans les paramètres de votre navigateur pour trouver des prestataires près de chez vous."
          : "Impossible de récupérer votre position.");
        setSharingLocation(false);
      }
    );
  }

  async function disableLocation() {
    setLocationError(null);
    if (userProfile?.id) await clearProfileLocation(userProfile.id);
    onProfileUpdated({ ...userProfile, location: null });
  }

  function toggleLocationSharing() {
    if (userProfile?.location) disableLocation();
    else shareLocation();
  }

  async function reload() {
    setLoading(true);
    await ensureSpotsForLocation(refLat, refLng, nearestCity(refLat, refLng));
    const [list, partners] = await Promise.all([
      fetchProvidersForCell(cellId, refLat, refLng),
      fetchAffiliatePartners(),
    ]);
    const realFiltered = list.filter(p => (!userProfile?.species || p.species === "both" || p.species === userProfile.species) && p.type !== "petshop" && p.type !== "insurance");
    const partnersFiltered = partners.filter(p => (!userProfile?.species || p.species === "both" || p.species === userProfile.species) && p.type !== "petshop" && p.type !== "insurance");
    const merged = [...partnersFiltered, ...realFiltered]; // partenaires toujours en tête — plus de prestataires fictifs, plus de boutique/assurances
    const reviews = await fetchReviewsForProviders(list.map(p => p.id));
    setProviders(merged);
    setReviewsBySpot(reviews);
    setLoading(false);
  }

  useEffect(() => { reload(); }, [cellId]);

  function ratingFor(p) {
    if (p.isDemo) return { avg: p.demoRating, count: p.demoReviewCount };
    const list = reviewsBySpot[p.id];
    if (!list || list.length === 0) return null;
    const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
    return { avg, count: list.length };
  }

  const sortedProviders = providers
    .filter(p => category === "all" || p.type === category)
    .sort((a, b) => {
      if (!!a.affiliateUrl !== !!b.affiliateUrl) return a.affiliateUrl ? -1 : 1;
      const typeDiff = PROVIDER_TYPES.indexOf(a.type) - PROVIDER_TYPES.indexOf(b.type);
      if (typeDiff !== 0) return typeDiff;
      if (!!a.isFounder !== !!b.isFounder) return a.isFounder ? -1 : 1;
      const ratingA = ratingFor(a)?.avg || 0, ratingB = ratingFor(b)?.avg || 0;
      return ratingB - ratingA;
    });

  const filtered = sortedProviders;

  async function openProvider(p) {
    setSelected(p);
    if (p.isDemo) {
      setSelectedReviews([]); // pas de fil d'avis réel pour une fiche de démo
      setSelectedServices([]);
      setLoadingReviews(false);
      setLoadingServices(false);
      return;
    }
    setLoadingReviews(true);
    setLoadingServices(true);
    setBookingError(null);
    const [reviews, services] = await Promise.all([
      fetchReviewsForSpot(p.id),
      p.source === "self" ? fetchActiveServicesForSpot(p.id) : Promise.resolve([]),
    ]);
    setSelectedReviews(reviews);
    setSelectedServices(services);
    setLoadingReviews(false);
    setLoadingServices(false);
  }

  async function bookService(service) {
    if (!userProfile?.id) return;
    setBookingError(null);
    setBookingServiceId(service.id);
    try {
      await startBookingCheckout(service, userProfile);
    } catch (err) {
      setBookingError(err.message || "La réservation a échoué, réessayez.");
      setBookingServiceId(null);
    }
  }

  async function submitReview() {
    if (!reviewRating) { setReviewError("Choisissez une note."); return; }
    setReviewError(null);
    setSubmittingReview(true);
    const modResult = await moderateText(reviewText || "");
    if (!modResult.approved) {
      setReviewError(modResult.reason || "Cet avis enfreint les règles de Miloute.");
      setSubmittingReview(false);
      return;
    }
    try {
      await createProviderReview(userProfile, selected.id, reviewRating, reviewText.trim() || null);
      const list = await fetchReviewsForSpot(selected.id);
      setSelectedReviews(list);
      const reviews = await fetchReviewsForProviders(providers.map(p => p.id));
      setReviewsBySpot(reviews);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewText("");
      if (!userProfile?.questsCompleted?.first_review) {
        claimQuest(userProfile, "first_review").then(result => {
          if (result.claimed) onProfileUpdated({ ...userProfile, giftInventory: result.giftInventory, questsCompleted: result.questsCompleted });
        }).catch(() => {});
      }
      // Un avis positif suggère souvent une bonne connaissance du secteur —
      // moment naturel pour proposer de devenir prestataire soi-même.
      if (reviewRating >= 4 && userProfile?.userId) {
        const ownSpot = await fetchSelfProviderSpot(userProfile.userId);
        if (!ownSpot) setShowBecomeProviderPrompt(true);
      }
    } catch (err) {
      setReviewError("L'avis n'a pas pu être publié, réessayez.");
    }
    setSubmittingReview(false);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ padding: "12px 16px 8px", background: "#fff" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Un annuaire de prestataires de confiance près de chez vous 🐾</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Vétérinaires, toiletteurs, pensions, éducateurs canins... tous recommandés par la communauté Miloute et triés selon votre position. Parcourez librement l'annuaire et laissez un avis après chaque prestation pour aider les autres propriétaires.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
          <button onClick={() => setShowAddForm(true)} style={{ background: "#FAF0EB", border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#8B3D28", cursor: "pointer" }}>+ Ajouter un prestataire</button>
        </div>
        <div style={{ textAlign: "right", marginBottom: 10 }}>
          <button onClick={onGoToProviderSetup} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 11, cursor: "pointer", padding: 0 }}>
            Vous êtes vous-même prestataire ? <span style={{ color: "#B25F46", fontWeight: 700 }}>Configurez vos tarifs →</span>
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
          {PROVIDER_TYPES.filter(t => t !== "petshop" && t !== "insurance").map(t => (
            <button key={t} onClick={() => setCategory(c => c === t ? "all" : t)}
              style={{ flex: "0 1 31%", padding: "8px 6px", borderRadius: 14, border: `1.5px solid ${category === t ? "#8B3D28" : "#E5E7EB"}`, background: category === t ? "#FAF0EB" : "#fff", color: category === t ? "#8B3D28" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
              {PROVIDER_TYPE_INFO[t].emoji} {PROVIDER_TYPE_INFO[t].label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 14, background: userProfile?.location ? "linear-gradient(90deg,#E8F5E9,#F1F8E9)" : "#FAF0EB", border: `1.5px solid ${userProfile?.location ? "#A5D6A7" : "#E5E7EB"}`, transition: "all .3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: userProfile?.location ? "#1B5E20" : "#B25F46" }}>
                {sharingLocation ? "Localisation en cours..." : userProfile?.location ? "Position partagée" : "Partager ma position"}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                {userProfile?.location ? "Prestataires triés selon votre position réelle" : "Pour trouver des prestataires vraiment près de chez vous"}
              </div>
            </div>
          </div>
          <button onClick={toggleLocationSharing} disabled={sharingLocation}
            style={{ width: 48, height: 26, borderRadius: 13, background: userProfile?.location ? "#2E7D32" : "#D1D5DB", border: "none", cursor: sharingLocation ? "default" : "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: userProfile?.location ? 25 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
          </button>
        </div>
        {locationError && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px" }}>{locationError}</div>
        )}
      </div>

      <PullToRefresh onRefresh={reload} style={{ padding: "8px 16px 20px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={32} color="#E8B89F" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, marginBottom: 10 }}>Aucun prestataire connu ici pour l'instant</div>
            <button onClick={() => setShowAddForm(true)} style={{ background: "none", border: "none", color: "#B25F46", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Soyez le premier à en ajouter un</button>
          </div>
        ) : filtered.map(p => {
          const r = ratingFor(p);
          return (
            <div key={p.id} onClick={() => openProvider(p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, background: photoUrl(p.photos?.[0]) ? "#000" : "transparent" }}>
                {photoUrl(p.photos?.[0]) ? <img src={photoUrl(p.photos[0])} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.emoji || PROVIDER_TYPE_INFO[p.type]?.emoji)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{p.name}</div>
                  {p.affiliateUrl && <span style={{ fontSize: 10, fontWeight: 700, color: "#8B3D28", background: "#FAF0EB", padding: "1px 7px", borderRadius: 8 }}>Partenaire</span>}
                  {p.isFounder && <span style={{ fontSize: 10, fontWeight: 700, color: "#946800", background: "#FFF3CD", padding: "1px 7px", borderRadius: 8 }}>🏅 Fondateur</span>}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {PROVIDER_TYPE_INFO[p.type]?.label}{p.address ? ` · ${p.address}` : ""}
                  {p.type === "groomer" && p.source === "google_places" && (
                    <span style={{ color: "#9CA3AF" }}> · suggéré par Google</span>
                  )}
                </div>
              </div>
              {p.affiliateUrl ? (
                <div style={{ fontSize: 13, color: "#B25F46", fontWeight: 700, flexShrink: 0 }}>Voir l'offre ›</div>
              ) : r ? (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#B25F46" }}>⭐ {r.avg.toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>{r.count} avis</div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>Pas encore noté</div>
              )}
            </div>
          );
        })}
      </PullToRefresh>

      {/* Détail d'un prestataire */}
      {selected && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200" }}>{selected.emoji} {selected.name}</div>
                  {selected.isFounder && <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "#946800", background: "#FFF3CD", padding: "2px 8px", borderRadius: 8, marginTop: 4 }}>🏅 Membre fondateur</span>}
                  {selected.claimStatus === "approved" && <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "#1565C0", background: "#E3F2FD", padding: "2px 8px", borderRadius: 8, marginTop: 4, marginLeft: 6 }}>✓ Revendiqué</span>}
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{PROVIDER_TYPE_INFO[selected.type]?.label}{selected.address ? ` · ${selected.address}` : ""}</div>
                  {selected.phone && <div style={{ fontSize: 12, color: "#8B3D28", marginTop: 4, fontWeight: 600 }}>📞 {selected.phone}</div>}
                  {selected.type === "groomer" && selected.source === "google_places" && (
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, lineHeight: 1.4 }}>ℹ️ Suggéré par Google d'après son activité — à confirmer sur place.</div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
              {selected.photos?.length > 0 && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16 }}>
                  {selected.photos.map((p, i) => (
                    <div key={i} style={{ width: 110, height: 110, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#000" }}>
                      <img src={photoUrl(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
              {selected.affiliateUrl ? (
                <>
                  {selected.desc && <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, marginBottom: 16 }}>{selected.desc}</p>}
                  <a href={selected.affiliateUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", textAlign: "center", width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", marginBottom: 12, boxSizing: "border-box" }}>
                    Voir l'offre {selected.name} ↗
                  </a>
                  <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", lineHeight: 1.5 }}>
                    Lien partenaire — Miloute peut percevoir une commission si vous souscrivez ou achetez via ce lien, sans coût supplémentaire pour vous.
                  </div>
                </>
              ) : (
                <>
                  {(loadingServices || selectedServices.length > 0) && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>PRESTATIONS</div>
                      {loadingServices ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><PawLogo size={22} color="#E8B89F" /></div>
                      ) : selectedServices.map(s => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F9FAFB" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{s.title}</div>
                            {s.description && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{s.description}</div>}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#8B3D28", flexShrink: 0 }}>{(s.priceCents / 100).toFixed(2)} €</div>
                          <button onClick={() => bookService(s)} disabled={bookingServiceId === s.id}
                            style={{ background: bookingServiceId === s.id ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", border: "none", borderRadius: 10, color: bookingServiceId === s.id ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 12, padding: "8px 12px", cursor: bookingServiceId === s.id ? "default" : "pointer", flexShrink: 0 }}>
                            {bookingServiceId === s.id ? "..." : "Réserver"}
                          </button>
                        </div>
                      ))}
                      {bookingError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginTop: 10 }}>{bookingError}</div>}
                      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 8, lineHeight: 1.5 }}>Paiement sécurisé. Les fonds sont reversés au prestataire une fois la prestation confirmée par vous deux.</div>
                    </div>
                  )}

                  {selected.isDemo ? (
                    <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#B25F46" }}>⭐ {selected.demoRating.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{selected.demoReviewCount} avis</div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setShowReviewForm(true)} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "2px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>⭐ Laisser un avis</button>

                      {loadingReviews ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><PawLogo size={24} color="#E8B89F" /></div>
                      ) : selectedReviews.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 13 }}>Aucun avis pour l'instant — soyez le premier !</div>
                      ) : selectedReviews.map(r => (
                        <div key={r.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F9FAFB" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span>{r.emoji}</span>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#2D1200" }}>{r.petName}</span>
                            <span style={{ color: "#F59E0B", fontSize: 12 }}>{"⭐".repeat(r.rating)}</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{r.time}</span>
                          </div>
                          {r.text && <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5 }}>{r.text}</div>}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'avis */}
      {showReviewForm && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 75, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => !submittingReview && setShowReviewForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 14, textAlign: "center" }}>Votre avis sur {selected?.name}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setReviewRating(s)} style={{ background: "none", border: "none", fontSize: 32, cursor: "pointer", opacity: reviewRating && s > reviewRating ? 0.3 : 1 }}>⭐</button>
              ))}
            </div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Racontez votre expérience (optionnel)..." rows={3}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", fontFamily: "inherit", resize: "none", marginBottom: 12, boxSizing: "border-box" }} />
            {reviewError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>{reviewError}</div>}
            <button onClick={submitReview} disabled={submittingReview}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: submittingReview ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: submittingReview ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 14, cursor: submittingReview ? "default" : "pointer" }}>
              {submittingReview ? "Publication..." : "Publier l'avis"}
            </button>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout de prestataire */}
      {showAddForm && (
        <AddProviderForm
          userProfile={userProfile}
          refLat={refLat}
          refLng={refLng}
          onClose={() => setShowAddForm(false)}
          onAdded={() => { setShowAddForm(false); reload(); }}
        />
      )}

      {/* Suggestion de devenir prestataire, après un avis positif */}
      {showBecomeProviderPrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 75, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowBecomeProviderPrompt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🐾</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>Vous vous y connaissez !</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5, marginBottom: 20 }}>Vous êtes vous-même prestataire ? Rejoignez l'annuaire Miloute et faites-vous connaître auprès des propriétaires près de chez vous.</div>
            <button onClick={() => { setShowBecomeProviderPrompt(false); onGoToProviderSetup(); }}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
              Devenir prestataire
            </button>
            <button onClick={() => setShowBecomeProviderPrompt(false)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", background: "none", color: "#9CA3AF", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Non merci
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddProviderForm({ userProfile, refLat, refLng, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("petsitter");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!name.trim()) { setError("Le nom est requis."); return; }
    setError(null);
    setSubmitting(true);
    if (description.trim()) {
      const modResult = await moderateText(description);
      if (!modResult.approved) {
        setError(modResult.reason || "Ce texte enfreint les règles de Miloute.");
        setSubmitting(false);
        return;
      }
    }
    try {
      await createCommunityProvider(userProfile, { name: name.trim(), type, address: address.trim(), phone: phone.trim(), description: description.trim(), lat: refLat, lng: refLng });
      onAdded();
    } catch {
      setError("L'ajout a échoué, réessayez.");
    }
    setSubmitting(false);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 80, display: "flex", alignItems: "flex-end" }} onClick={() => !submitting && onClose()}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90%", overflowY: "auto", padding: "20px 20px 32px" }}>
        <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 14 }}>Ajouter un prestataire</div>

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>CATÉGORIE</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "6px 0 14px" }}>
          {PROVIDER_TYPES.filter(t => t !== "petshop" && t !== "insurance").map(t => (
            <button key={t} onClick={() => setType(t)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${type === t ? "#B25F46" : "#E5E7EB"}`, background: type === t ? "#FAF0EB" : "#fff", color: type === t ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{PROVIDER_TYPE_INFO[t].emoji} {PROVIDER_TYPE_INFO[t].label}</button>
          ))}
        </div>

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>NOM *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Julie, pet-sitter du 15e"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 14px", fontFamily: "inherit", boxSizing: "border-box" }} />

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>ADRESSE OU QUARTIER</label>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Paris 15e"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 14px", fontFamily: "inherit", boxSizing: "border-box" }} />

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>TÉLÉPHONE (optionnel)</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 06 12 34 56 78"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 14px", fontFamily: "inherit", boxSizing: "border-box" }} />

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>DESCRIPTION (optionnel)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Ex: Garde à domicile, disponible week-ends..."
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 16px", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />

        {error && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: submitting ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: submitting ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: submitting ? "default" : "pointer" }}>
          {submitting ? "Ajout en cours..." : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

function ReproScreen({ isPremium = false, onPremium = () => {}, userProfile = null, onProfileUpdated = () => {} }) {
  const [selected, setSelected] = useState(null);
  const [requested, setRequested] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  function shareLocation() {
    if (!navigator.geolocation) { setLocationError("La géolocalisation n'est pas supportée par ce navigateur."); return; }
    setSharingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude, lng = position.coords.longitude;
        if (userProfile?.id) await updateProfileLocation(userProfile.id, lat, lng);
        onProfileUpdated({ ...userProfile, location: { lat, lng } });
        setSharingLocation(false);
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? "Position refusée — activez-la dans les paramètres de votre navigateur."
          : "Impossible de récupérer votre position.");
        setSharingLocation(false);
      }
    );
  }

  async function disableLocation() {
    setLocationError(null);
    if (userProfile?.id) await clearProfileLocation(userProfile.id);
    onProfileUpdated({ ...userProfile, location: null });
  }

  function toggleLocationSharing() {
    if (userProfile?.location) disableLocation();
    else shareLocation();
  }

  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [reproDeck, setReproDeck] = useState([]);
  const [loadingRepro, setLoadingRepro] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [respondingRequestId, setRespondingRequestId] = useState(null);

  useEffect(() => {
    if (!userProfile?.id) return;
    fetchReceivedReproRequests(userProfile).then(setReceivedRequests);
  }, [userProfile?.id]);

  async function handleSendRequest() {
    if (!selected?.userId) return; // profil de démonstration : pas de vrai destinataire
    setSendingRequest(true);
    setRequestError(null);
    try {
      await sendReproRequest(userProfile, selected);
      setRequested(selected);
    } catch (err) {
      setRequestError("La demande n'a pas pu être envoyée, réessayez.");
    }
    setSendingRequest(false);
  }

  async function handleRespondRequest(requestId, action) {
    setRespondingRequestId(requestId);
    try {
      await respondReproRequest(requestId, action, userProfile);
      setReceivedRequests(list => list.filter(r => r.id !== requestId));
      setSelectedRequest(null);
    } catch (err) {
      console.error("respondReproRequest error:", err);
    }
    setRespondingRequestId(null);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingRepro(true);
      const real = await fetchReproProfiles(userProfile);
      if (!active) return;
      // Profils de démo en renfort — utiles pour présenter l'app tant que
      // peu de vrais profils reproducteurs sont inscrits. Marqués isDemo pour
      // ne jamais toucher à Supabase (ils n'existent pas vraiment en base).
      const demo = REPRO_PROFILES
        .filter(p => !userProfile?.species || p.species === userProfile.species)
        .map(p => ({ ...p, isDemo: true }));
      setReproDeck([...real, ...(SHOW_DEMO_CONTENT ? demo : [])]);
      setLoadingRepro(false);
    }
    load();
    return () => { active = false; };
  }, [userProfile?.id, userProfile?.userId, userProfile?.species]);

  // Filtres avancés (Premium uniquement)
  const [advBreed, setAdvBreed] = useState("");
  const [advAgeRange, setAdvAgeRange] = useState("all"); // all | young | adult | senior
  const [advGender, setAdvGender] = useState("all"); // all | M | F
  const [advTemper, setAdvTemper] = useState("all");
  const [advDocs, setAdvDocs] = useState([]); // vaccinated | pedigree | testedGenes
  const [advMaxDistance, setAdvMaxDistance] = useState(100); // 10 | 25 | 50 | 100

  function ageToRange(ageStr) {
    const n = parseInt(ageStr, 10);
    if (n <= 1) return "young";
    if (n <= 5) return "adult";
    return "senior";
  }

  // Convertit le texte "2,3 km" (ou "—" si inconnu) en nombre exploitable pour trier/filtrer.
  function parseDistanceKm(p) {
    const n = parseFloat((p.distance || "").replace(",", ".").replace(/[^\d.]/g, ""));
    return isNaN(n) ? Infinity : n;
  }

  function toggleDoc(doc) {
    setAdvDocs(d => d.includes(doc) ? d.filter(x => x !== doc) : [...d, doc]);
  }

  function resetAdvanced() {
    setAdvBreed(""); setAdvAgeRange("all"); setAdvGender("all"); setAdvTemper("all"); setAdvDocs([]); setAdvMaxDistance(100);
  }

  function openAdvanced() {
    if (!isPremium) { setShowPremiumPrompt(true); return; }
    setShowAdvanced(true);
  }

  const allTempers = [...new Set(reproDeck.flatMap(p => p.temper))];

  const filtered = reproDeck
    .filter(p => {
      if (!isPremium) return true; // les filtres avancés ne s'appliquent qu'en Premium
      if (advBreed && !p.breed.toLowerCase().includes(advBreed.toLowerCase())) return false;
      if (advAgeRange !== "all" && ageToRange(p.age) !== advAgeRange) return false;
      if (advGender !== "all" && p.gender !== advGender) return false;
      if (advTemper !== "all" && !p.temper.includes(advTemper)) return false;
      if (advDocs.includes("vaccinated") && !p.vaccinated) return false;
      if (advDocs.includes("pedigree") && !p.pedigree) return false;
      if (advDocs.includes("testedGenes") && !p.testedGenes) return false;
      if (parseDistanceKm(p) > advMaxDistance) return false;
      return true;
    })
    .sort((a, b) => userProfile?.location ? parseDistanceKm(a) - parseDistanceKm(b) : 0);

  const advancedActive = isPremium && (advBreed || advAgeRange !== "all" || advGender !== "all" || advTemper !== "all" || advDocs.length > 0 || advMaxDistance !== 100);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <OnboardingHint hintKey="repro" icon="🌱" text="Tous les profils sont vérifiés (pedigree, documents sanitaires) pour des rencontres sereines" position="top" />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Texte d'intro */}
        <div style={{ margin: "16px 16px 8px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Trouvez le partenaire idéal pour la reproduction de votre animal 🐾</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Tous les profils sont vérifiés (pedigree, bilan génétique, documents sanitaires) pour des rencontres sereines. Parcourez librement les profils — la mise en relation est réservée aux membres Premium, et le montant de la saillie se négocie directement entre propriétaires.</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 16px 12px" }}>
          <button onClick={openAdvanced}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${advancedActive ? "#B25F46" : "#E5E7EB"}`, background: advancedActive ? "#FAF0EB" : "#fff", color: advancedActive ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {!isPremium && <span>👑</span>}
            🔎 Recherche {advancedActive && "•"}
          </button>
          <button onClick={() => setShowRequestsModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", position: "relative" }}>
            📥 Demandes
            {receivedRequests.length > 0 && (
              <span style={{ background: "#B25F46", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{receivedRequests.length}</span>
            )}
          </button>
        </div>

        {!isPremium && (
          <button onClick={() => setShowPremiumPrompt(true)}
            style={{ margin: "0 16px 12px", width: "calc(100% - 32px)", padding: "12px 14px", background: "linear-gradient(135deg,#8B3D28,#B25F46)", borderRadius: 12, display: "flex", gap: 10, alignItems: "center", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Recherche avancée Premium</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.8)" }}>Filtrez par race, âge, sexe, caractère et documents</div>
            </div>
          </button>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{loadingRepro ? "" : "🔍"}</div>
            {loadingRepro ? (
              <div style={{ display: "flex", justifyContent: "center" }}><PawLogo size={32} color="#E8B89F" /></div>
            ) : (
              <>
                <div style={{ fontSize: 14 }}>Aucun profil reproducteur disponible pour le moment</div>
                {(advBreed || advAgeRange !== "all" || advGender !== "all" || advTemper !== "all" || advDocs.length > 0) && (
                  <button onClick={resetAdvanced} style={{ marginTop: 10, background: "none", border: "none", color: "#B25F46", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Réinitialiser les filtres</button>
                )}
              </>
            )}
          </div>
        )}

        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelected(p)} style={{ margin: "0 16px 12px", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ background: `linear-gradient(90deg, ${p.color}44, #fff)`, padding: "16px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: photoUrl(p.photos?.[0]) ? "transparent" : `${p.color}33` }}>
                  {photoUrl(p.photos?.[0]) ? <img src={photoUrl(p.photos[0])} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#2D1200" }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{formatAge(p.age)} {p.gender === "F" ? "♀" : "♂"}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600, marginBottom: 6 }}>{p.breed} · {p.distance}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {p.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné ✓</Badge>}
                    {p.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">Pedigree ✓</Badge>}
                    {p.testedGenes && <Badge color="#E8F5E9" text="#2E7D32">Gènes testés ✓</Badge>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#B25F46" }}>{p.price}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>saillie</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#4B5563", marginTop: 10, lineHeight: 1.5 }}>{p.bio}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sheet recherche avancée (Premium) */}
      {showAdvanced && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 55, display: "flex", alignItems: "flex-end" }} onClick={() => setShowAdvanced(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "85%", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200" }}>🔎 Recherche avancée</div>
              <button onClick={resetAdvanced} style={{ background: "none", border: "none", color: "#B25F46", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Réinitialiser</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 14, background: userProfile?.location ? "linear-gradient(90deg,#E8F5E9,#F1F8E9)" : "#FAF0EB", border: `1.5px solid ${userProfile?.location ? "#A5D6A7" : "#E5E7EB"}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📍</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: userProfile?.location ? "#1B5E20" : "#B25F46" }}>
                    {sharingLocation ? "Localisation en cours..." : userProfile?.location ? "Position partagée" : "Partager ma position"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {userProfile?.location ? "Résultats triés selon votre position réelle" : "Pour trouver des reproducteurs vraiment près de chez vous"}
                  </div>
                </div>
              </div>
              <button onClick={toggleLocationSharing} disabled={sharingLocation}
                style={{ width: 48, height: 26, borderRadius: 13, background: userProfile?.location ? "#2E7D32" : "#D1D5DB", border: "none", cursor: sharingLocation ? "default" : "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: userProfile?.location ? 25 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
              </button>
            </div>
            {locationError && (
              <div style={{ marginBottom: 16, fontSize: 11, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px" }}>{locationError}</div>
            )}

            {userProfile?.location && (
              <>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>DISTANCE MAXIMALE</label>
                <div style={{ display: "flex", gap: 6, margin: "6px 0 16px" }}>
                  {[[10,"10 km"],[25,"25 km"],[50,"50 km"],[100,"100 km"]].map(([v,l]) => (
                    <button key={l} onClick={() => setAdvMaxDistance(v)} style={{ flex: 1, padding: "7px 2px", borderRadius: 9, border: `1.5px solid ${advMaxDistance === v ? "#B25F46" : "#E5E7EB"}`, background: advMaxDistance === v ? "#FAF0EB" : "#fff", color: advMaxDistance === v ? "#B25F46" : "#6B7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
              </>
            )}

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>RACE</label>
            <div style={{ margin: "6px 0 16px" }}>
              <BreedInput value={advBreed} onChange={setAdvBreed} species={userProfile?.species || "cat"}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>TRANCHE D'ÂGE</label>
            <div style={{ display: "flex", gap: 6, margin: "6px 0 16px" }}>
              {[["all","Tous"],["young","Jeune (-1 an)"],["adult","Adulte (1-5 ans)"],["senior","Senior (5+ ans)"]].map(([v,l]) => (
                <button key={v} onClick={() => setAdvAgeRange(v)} style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: `1.5px solid ${advAgeRange === v ? "#B25F46" : "#E5E7EB"}`, background: advAgeRange === v ? "#FAF0EB" : "#fff", color: advAgeRange === v ? "#B25F46" : "#6B7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>SEXE</label>
            <div style={{ display: "flex", gap: 6, margin: "6px 0 16px" }}>
              {[["all","Tous"],["M","♂ Mâle"],["F","♀ Femelle"]].map(([v,l]) => (
                <button key={v} onClick={() => setAdvGender(v)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${advGender === v ? "#B25F46" : "#E5E7EB"}`, background: advGender === v ? "#FAF0EB" : "#fff", color: advGender === v ? "#B25F46" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>COMPORTEMENT</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 16px" }}>
              <button onClick={() => setAdvTemper("all")} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${advTemper === "all" ? "#B25F46" : "#E5E7EB"}`, background: advTemper === "all" ? "#FAF0EB" : "#fff", color: advTemper === "all" ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Tous</button>
              {allTempers.map(t => (
                <button key={t} onClick={() => setAdvTemper(t)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${advTemper === t ? "#B25F46" : "#E5E7EB"}`, background: advTemper === t ? "#FAF0EB" : "#fff", color: advTemper === t ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t}</button>
              ))}
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>DOCUMENTS</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0 20px" }}>
              {[["vaccinated","Vacciné"],["pedigree","Pedigree officiel"],["testedGenes","Bilan génétique complet"]].map(([v,l]) => (
                <button key={v} onClick={() => toggleDoc(v)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${advDocs.includes(v) ? "#B25F46" : "#E5E7EB"}`, background: advDocs.includes(v) ? "#FAF0EB" : "#fff", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${advDocs.includes(v) ? "#B25F46" : "#D1D5DB"}`, background: advDocs.includes(v) ? "#B25F46" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {advDocs.includes(v) && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#2D1200" }}>{l}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setShowAdvanced(false)} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              Voir {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* Prompt Premium */}
      {showPremiumPrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowPremiumPrompt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%", position: "relative" }}>
            <button onClick={() => setShowPremiumPrompt(false)} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F3F4F6", color: "#6B7280", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ textAlign: "center", fontSize: 44, marginBottom: 12 }}>👑</div>
            <div style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Recherche avancée</div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#6B7280", marginBottom: 20, lineHeight: 1.6 }}>
              Filtrez les profils de reproduction par race, âge, sexe, comportement et documents — réservé aux membres Premium.
            </div>
            <div style={{ background: "#FAF0EB", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              {["Filtrer par race précise","Sélectionner une tranche d'âge","Choisir le sexe recherché","Filtrer par comportement","Exiger des documents spécifiques"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12, color: "#4B5563" }}>
                  <span style={{ color: "#B25F46", fontWeight: 700 }}>✓</span> {item}
                </div>
              ))}
            </div>
            <button onClick={() => { setShowPremiumPrompt(false); onPremium(); }}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              👑 Passer Premium
            </button>
            <button onClick={() => setShowPremiumPrompt(false)} style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", background: "#F3F4F6", color: "#6B7280", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {selected && !requested && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", width: "100%", maxHeight: "85%", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, background: photoUrl(selected.photos?.[0]) ? "transparent" : `${selected.color}33` }}>
                {photoUrl(selected.photos?.[0]) ? <img src={photoUrl(selected.photos[0])} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selected.emoji}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600 }}>{selected.breed} · {formatAge(selected.age)}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Propriétaire : {selected.owner}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {selected.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné ✓</Badge>}
              {selected.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">Pedigree officiel ✓</Badge>}
              {selected.testedGenes && <Badge color="#E8F5E9" text="#2E7D32">Bilan génétique complet ✓</Badge>}
            </div>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>{selected.bio}</p>
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, letterSpacing: 1 }}>DÉTAILS FINANCIERS</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "#4B5563" }}>Saillie</span><span style={{ fontWeight: 700, color: "#2D1200" }}>{selected.price}</span>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>💬 Montant à négocier directement avec {selected.owner} une fois le contact établi. Miloute ne gère pas ce paiement.</div>
            </div>

            {!isPremium ? (
              <button onClick={() => setShowPremiumPrompt(true)} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>👑 Passer Premium pour contacter</button>
            ) : !selected.userId ? (
              <div style={{ textAlign: "center", padding: "14px", background: "#F9FAFB", borderRadius: 14, fontSize: 12, color: "#9CA3AF" }}>
                🌱 Profil de démonstration — la mise en relation n'est pas disponible pour ce profil.
              </div>
            ) : (
              <>
                <button onClick={handleSendRequest} disabled={sendingRequest} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: sendingRequest ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: sendingRequest ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: sendingRequest ? "default" : "pointer" }}>
                  {sendingRequest ? "..." : "🌱 Envoyer une demande"}
                </button>
                {requestError && <div style={{ fontSize: 12, color: "#DC2626", textAlign: "center", marginTop: 8 }}>{requestError}</div>}
              </>
            )}
          </div>
        </div>
      )}


      {requested && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#8B3D28,#1B5E3B)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🌱</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8, textAlign: "center" }}>Demande envoyée !</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,.8)", textAlign: "center", marginBottom: 32, lineHeight: 1.6 }}>{selected.owner} recevra votre demande dans son onglet Reproduction et pourra l'accepter ou la refuser.</div>
          <button onClick={() => { setRequested(null); setSelected(null); }} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#fff", color: "#8B3D28", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Retour à la liste</button>
        </div>
      )}

      {/* Demandes de reproduction reçues */}
      {showRequestsModal && !selectedRequest && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 65, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button onClick={() => setShowRequestsModal(false)} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>📥 Demandes de reproduction reçues</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {receivedRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📥</div>
                <div style={{ fontSize: 14 }}>Aucune demande en attente pour l'instant</div>
              </div>
            ) : receivedRequests.map(r => (
              <div key={r.id} onClick={() => setSelectedRequest(r)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 6px", borderBottom: "1px solid #F9FAFB", cursor: "pointer" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: r.profile.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{r.profile.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{r.profile.name} souhaite une mise en relation</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{r.profile.breed} · {r.time}</div>
                </div>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détail d'une demande reçue — profil complet avant de répondre */}
      {selectedRequest && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 70, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button onClick={() => setSelectedRequest(null)} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>Profil de {selectedRequest.profile.name}</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: selectedRequest.profile.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, margin: "0 auto 16px" }}>{selectedRequest.profile.emoji}</div>
            <div style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: "#2D1200" }}>{selectedRequest.profile.name}, {formatAge(selectedRequest.profile.age)} {selectedRequest.profile.gender === "F" ? "♀" : "♂"}</div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#9CA3AF", marginBottom: 6 }}>{selectedRequest.profile.breed} · {selectedRequest.profile.distance}</div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>Propriétaire : {selectedRequest.profile.owner}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
              {selectedRequest.profile.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné ✓</Badge>}
              {selectedRequest.profile.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">Pedigree officiel ✓</Badge>}
              {selectedRequest.profile.testedGenes && <Badge color="#E8F5E9" text="#2E7D32">Bilan génétique complet ✓</Badge>}
            </div>
            {selectedRequest.profile.temper.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                {selectedRequest.profile.temper.map(t => <Badge key={t} color="#FAF0EB" text="#B25F46">{t}</Badge>)}
              </div>
            )}
            {selectedRequest.profile.bio && <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 20 }}>{selectedRequest.profile.bio}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleRespondRequest(selectedRequest.id, "declined")} disabled={respondingRequestId === selectedRequest.id}
                style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Refuser
              </button>
              <button onClick={() => handleRespondRequest(selectedRequest.id, "accepted")} disabled={respondingRequestId === selectedRequest.id}
                style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: respondingRequestId === selectedRequest.id ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: respondingRequestId === selectedRequest.id ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                {respondingRequestId === selectedRequest.id ? "..." : "🌱 Accepter"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 10 }}>Accepter crée un match : vous pourrez discuter dans Messages, comme avec un match classique.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AGENDA SCREEN ─────────────────────────────────────────────────────────────
function AgendaScreen() {
  const [agenda, setAgenda] = useState(AGENDA);
  const [rating, setRating] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);

  function submitRating(id, stars) {
    setAgenda(a => a.map(ev => ev.id === id ? { ...ev, rating: stars } : ev));
    setRatingFor(null); setRating(null);
  }

  const upcoming = agenda.filter(e => e.status !== "done");
  const past = agenda.filter(e => e.status === "done");

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, letterSpacing: 1 }}>À VENIR</div>
        {upcoming.map(ev => (
          <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            <div style={{ background: ev.status === "confirmed" ? "linear-gradient(90deg,#FAF0EB,#fff)" : "linear-gradient(90deg,#FFF9E6,#fff)", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#B25F46,#C97A5E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200" }}>{ev.type} avec {ev.with}</div>
                  <div style={{ fontSize: 12, color: "#8B3D28" }}>{ev.owner}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>📅 {ev.date} à {ev.time} · 📍 {ev.place}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: ev.status === "confirmed" ? "#E8F5E9" : "#FEF9C3", color: ev.status === "confirmed" ? "#2E7D32" : "#854D0E" }}>{ev.status === "confirmed" ? "Confirmé ✓" : "En attente"}</div>
              </div>
            </div>
            {ev.status === "confirmed" && (
              <div style={{ display: "flex", borderTop: "1px solid #F3F4F6" }}>
                <button onClick={() => setAgendaData(a => a.map(e => e.id === ev.id ? { ...e, status: "cancelled" } : e))} style={{ width: "100%", padding: "10px", background: "#fff", border: "none", fontSize: 13, color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>Annuler la rencontre</button>
              </div>
            )}
          </div>
        ))}

        <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", margin: "16px 0 10px", letterSpacing: 1 }}>PASSÉES</div>
        {past.map(ev => (
          <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", opacity: 0.85 }}>
            <div style={{ padding: "14px 16px", background: "#F9FAFB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#6B7280" }}>{ev.type} avec {ev.with}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{ev.date} · {ev.place}</div>
                  {ev.rating ? (
                    <div style={{ fontSize: 14, marginTop: 4 }}>{"⭐".repeat(ev.rating)}</div>
                  ) : (
                    <button onClick={() => setRatingFor(ev.id)} style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#B25F46", background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Laisser un avis</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {ratingFor && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setRatingFor(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8, textAlign: "center" }}>Comment s'est passée la rencontre ?</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", marginBottom: 20 }}>Votre avis aide les autres propriétaires</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 36, background: "none", border: "none", cursor: "pointer", opacity: rating && s > rating ? 0.3 : 1, transition: "opacity .15s" }}>⭐</button>
              ))}
            </div>
            <button onClick={() => rating && submitRating(ratingFor, rating)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: rating ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB", color: rating ? "#fff" : "#9CA3AF", fontWeight: 800, fontSize: 15, cursor: rating ? "pointer" : "default" }}>Envoyer mon avis</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMMUNITY SCREEN ──────────────────────────────────────────────────────────
const INIT_COMMENTS = {
  1: [
    { id: 1, author: "Marie L.", pet: "Caramel", emoji: "🐕", photo: "/photos/caramel-1.jpg", text: "Super ! Rocky est trop mignon, ça ferait une belle équipe", time: "Il y a 1h", likes: 5 },
    { id: 2, author: "Jean P.", pet: "Max", emoji: "🐕", photo: "/photos/max-1.jpg", text: "Vous trouvez des dog parks accessibles dans votre coin ?", time: "Il y a 45 min", likes: 2 },
  ],
  2: [
    { id: 1, author: "Sophie M.", pet: "Luna", emoji: "🐱", photo: "/photos/luna-community-1.jpg", text: "Ça peut être un signe de stress ou juste un caprice ! Essayez de changer de gamelle 😊", time: "Il y a 3h", likes: 8 },
    { id: 2, author: "Paul D.", pet: "Tiger", emoji: "🐱", photo: "/photos/tiger-1.jpg", text: "Même chose chez nous, c'est passé au bout de 3 jours.", time: "Il y a 2h", likes: 3 },
    { id: 3, author: "Véto Conseil", pet: "🩺", emoji: "🩺", text: "Si ça dure plus de 48h, consultez un vétérinaire. Pensez à vérifier que l'eau est fraîche.", time: "Il y a 1h", likes: 12 },
  ],
  3: [
    { id: 1, author: "Thomas D.", pet: "Rocky", emoji: "🐕", photo: "/photos/rocky-1.jpg", text: "Joyeux anniversaire Mochi ! 🎂🐱", time: "Hier", likes: 15 },
    { id: 2, author: "Léa P.", pet: "Pixel", emoji: "🐱", photo: "/photos/pixel-1.jpg", text: "5 ans déjà ! Il est magnifique 😍", time: "Hier", likes: 9 },
  ],
  4: [
    { id: 1, author: "Clara B.", pet: "Mochi", emoji: "🐱", photo: "/photos/mochi-1.jpg", text: "Bella a l'air adorable ! Vous êtes en quelle région ?", time: "Hier", likes: 3 },
  ],
};

function CommunityScreen({ onPremium, isPremium, userProfile = null, onProfileUpdated = () => {}, onNav = () => {}, onGoToShop = () => {} }) {
  const [breedFilter, setBreedFilter] = useState("all");
  const [showBreedMenu, setShowBreedMenu] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState(100); // km, 100 = illimité
  const [showRadiusSheet, setShowRadiusSheet] = useState(false);
  const [selectedPostAuthor, setSelectedPostAuthor] = useState(null); // le post dont on regarde l'auteur
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loadingAuthorProfile, setLoadingAuthorProfile] = useState(false);
  const [authorPhotoIdx, setAuthorPhotoIdx] = useState(0);
  const [likingAuthorId, setLikingAuthorId] = useState(null);
  const [justMatchedWithAuthor, setJustMatchedWithAuthor] = useState(null);
  const [showAuthorGiftPicker, setShowAuthorGiftPicker] = useState(false);
  const [sendingAuthorGift, setSendingAuthorGift] = useState(false);
  const [authorGiftMessage, setAuthorGiftMessage] = useState("");
  const [authorGiftToast, setAuthorGiftToast] = useState(null);

  function openPostAuthorProfile(post) {
    if (post.isDemo) return; // profils de démo : rien de réel à afficher/liker
    setAuthorPhotoIdx(0);
    setSelectedPostAuthor(post);
  }

  useEffect(() => {
    if (!selectedPostAuthor) { setAuthorProfile(null); return; }
    let active = true;
    setLoadingAuthorProfile(true);
    fetchProfileForUser(selectedPostAuthor.userId).then(profile => {
      if (active) { setAuthorProfile(profile); setLoadingAuthorProfile(false); }
    });
    return () => { active = false; };
  }, [selectedPostAuthor]);

  async function handleLikeAuthor() {
    if (!authorProfile) return;
    setLikingAuthorId(authorProfile.id);
    try {
      const { matched, questResult } = await likeProfileAndCheckMatch(userProfile, authorProfile);
      if (questResult) onProfileUpdated({ ...userProfile, giftInventory: questResult.giftInventory, questsCompleted: questResult.questsCompleted });
      setSelectedPostAuthor(null);
      if (matched) setJustMatchedWithAuthor(authorProfile);
    } catch (err) {
      console.error("handleLikeAuthor error:", err);
    }
    setLikingAuthorId(null);
  }

  async function handleDeclineAuthor() {
    if (!authorProfile) return;
    setLikingAuthorId(authorProfile.id);
    try {
      await declineProfile(userProfile, authorProfile);
      setSelectedPostAuthor(null);
    } catch (err) {
      console.error("handleDeclineAuthor error:", err);
    }
    setLikingAuthorId(null);
  }

  async function sendGiftToAuthor(giftId, emoji) {
    if (!authorProfile) return;
    if (!(userProfile?.giftInventory?.[giftId] > 0)) {
      setShowAuthorGiftPicker(false);
      onGoToShop();
      return;
    }
    setSendingAuthorGift(true);
    const result = await spendGift(userProfile, giftId);
    if (result.success) {
      onProfileUpdated({ ...userProfile, giftInventory: result.giftInventory });
      const giftInfo = GIFT_CATALOG.find(g => g.id === giftId);
      setAuthorGiftToast({
        name: authorProfile.name,
        emoji: giftInfo?.emoji || emoji,
        label: giftInfo?.label || "Cadeau",
        article: giftInfo?.gender === "f" ? "Une" : "Un",
      });
      setTimeout(() => setAuthorGiftToast(null), 2600);
      sendTreatToProfile(userProfile, authorProfile, giftId, authorGiftMessage.trim() || null).catch(err => console.error("sendTreat error:", err));
      setAuthorGiftMessage("");
      if (!userProfile?.questsCompleted?.first_gift_sent) {
        claimQuest(userProfile, "first_gift_sent").then(r => {
          if (r.claimed) onProfileUpdated({ ...userProfile, giftInventory: r.giftInventory, questsCompleted: r.questsCompleted });
        }).catch(() => {});
      }
    }
    setSendingAuthorGift(false);
    setShowAuthorGiftPicker(false);
  }
  const [showPremium, setShowPremium] = useState(false);
  const [previewPlan, setPreviewPlan] = useState("yearly");
  const [openComments, setOpenComments] = useState(null); // post id
  const [comments, setComments] = useState({}); // { [postId]: [...] }
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // { postId, commentId, authorName }
  const commentsEndRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [composerPhoto, setComposerPhoto] = useState(null); // { file, previewUrl }
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const composerPhotoRef = useRef(null);

  async function reloadPosts() {
    setLoadingPosts(true);
    const real = await fetchCommunityPosts(userProfile);
    // Posts de démo en renfort — utiles pour présenter l'app tant que peu de
    // vrais posts existent. Marqués isDemo pour ne jamais toucher à Supabase
    // (comptes de likes/commentaires gérés localement uniquement pour eux).
    const demo = COMMUNITY_POSTS
      .filter(p => !userProfile?.species || p.species === userProfile.species)
      .map(p => ({ ...p, likedByMe: false, commentCount: (INIT_COMMENTS[p.id] || []).length, isDemo: true }));
    setPosts([...real, ...(SHOW_DEMO_CONTENT ? demo : [])]);
    setLoadingPosts(false);
  }

  useEffect(() => {
    reloadPosts();
  }, [userProfile?.id, userProfile?.species]);

  const availableBreeds = userProfile?.species === "cat" ? CAT_BREEDS : DOG_BREEDS;
  const filtered = posts.filter(p => {
    if (breedFilter !== "all" && p.breed !== breedFilter) return false;
    if (radiusFilter < 100 && userProfile?.location && p.authorLocation) {
      const d = distanceKm(userProfile.location.lat, userProfile.location.lng, p.authorLocation.lat, p.authorLocation.lng);
      if (d > radiusFilter) return false;
    }
    return true;
  });

  const TAG_COLORS = {
    "Événement": ["#E3F2FD","#1565C0"],
    "Conseil": ["#FFF9E6","#854D0E"],
    "Anniversaire": ["#FAF0EB","#8B3D28"],
    "Reproduction": ["#E8F5E9","#2E7D32"],
    "Rencontre": ["#FCE4EC","#AD1457"],
  };

  const [moderatingComment, setModeratingComment] = useState({}); // { [postId]: bool }
  const [commentModerationError, setCommentModerationError] = useState({}); // { [postId]: string }
  const [commentLikes, setCommentLikes] = useState({}); // cosmétique uniquement, non persisté

  function toggleCommentLike(postId, commentId) {
    const key = `${postId}-${commentId}`;
    setCommentLikes(l => ({ ...l, [key]: !l[key] }));
  }

  async function openPostComments(postId) {
    setOpenComments(postId);
    const post = posts.find(p => p.id === postId);
    if (post?.isDemo) {
      setComments(c => ({ ...c, [postId]: INIT_COMMENTS[postId] || [] }));
      return;
    }
    setLoadingComments(true);
    const result = await fetchCommentsForPost(postId);
    setComments(c => ({ ...c, [postId]: result }));
    setLoadingComments(false);
  }

  async function submitComment(postId) {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    setCommentModerationError(e => ({ ...e, [postId]: null }));
    setModeratingComment(m => ({ ...m, [postId]: true }));
    const result = await moderateText(text);
    if (!result.approved) {
      setModeratingComment(m => ({ ...m, [postId]: false }));
      setCommentModerationError(e => ({ ...e, [postId]: result.reason || "Ce message enfreint les règles de la communauté et n'a pas été publié." }));
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (post?.isDemo) {
      const newComment = { id: Date.now(), author: userProfile?.ownerName || "Vous", pet: userProfile?.name || "", emoji: userProfile?.species === "cat" ? "🐱" : "🐕", photo: userProfile?.photos?.[0]?.url || null, text, time: "À l'instant", likes: 0, parentCommentId: replyingTo?.commentId || null, parentPet: replyingTo?.authorName || null };
      const updatedList = [...(comments[postId] || []), newComment];
      setComments(c => ({ ...c, [postId]: updatedList }));
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, commentCount: updatedList.length } : p));
      setCommentInputs(i => ({ ...i, [postId]: "" }));
      setReplyingTo(null);
      setModeratingComment(m => ({ ...m, [postId]: false }));
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      return;
    }

    try {
      await createCommunityComment(userProfile, postId, text, replyingTo?.commentId || null);
      const fresh = await fetchCommentsForPost(postId);
      setComments(c => ({ ...c, [postId]: fresh }));
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, commentCount: fresh.length } : p));
      setCommentInputs(i => ({ ...i, [postId]: "" }));
      setReplyingTo(null);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setCommentModerationError(e => ({ ...e, [postId]: "Le commentaire n'a pas pu être publié, réessayez." }));
    }
    setModeratingComment(m => ({ ...m, [postId]: false }));
  }

  async function toggleLike(post) {
    // Optimiste : on met à jour l'affichage tout de suite, avant la confirmation serveur.
    setPosts(ps => ps.map(p => p.id === post.id
      ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
      : p));
    if (post.isDemo) return; // jamais écrit dans Supabase, purement cosmétique
    try {
      await toggleCommunityLike(userProfile, post.id, post.likedByMe);
    } catch (err) {
      console.error("toggleLike error:", err);
    }
  }

  async function handleComposerPhoto(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setPostError(null);
    try {
      const base64 = await fileToBase64(f);
      const result = await moderateImage(base64, f.type || "image/jpeg");
      if (!result.approved) {
        setPostError(result.reason || "Photo refusée : seules les photos de chats et chiens, au contenu approprié, sont autorisées.");
        return;
      }
      setComposerPhoto({ file: f, previewUrl: URL.createObjectURL(f) });
    } catch {
      setPostError("Impossible de vérifier cette photo, réessayez.");
    }
  }

  async function submitPost() {
    const text = composerText.trim();
    if (!text && !composerPhoto) return;
    setPostError(null);
    setPosting(true);
    try {
      if (text) {
        const modResult = await moderateText(text);
        if (!modResult.approved) {
          setPostError(modResult.reason || "Ce texte enfreint les règles de la communauté et n'a pas été publié.");
          setPosting(false);
          return;
        }
      }
      let photoUrl = null;
      if (composerPhoto) {
        photoUrl = await uploadPhotoToStorage(composerPhoto.file, userProfile.userId);
      }
      await createCommunityPost(userProfile, { text, photoUrl, tag: null });
      setComposerText(""); setComposerPhoto(null); setShowComposer(false);
      await reloadPosts();
      if (!userProfile?.questsCompleted?.first_post) {
        claimQuest(userProfile, "first_post").then(result => {
          if (result.claimed) onProfileUpdated({ ...userProfile, giftInventory: result.giftInventory, questsCompleted: result.questsCompleted });
        }).catch(() => {});
      }
    } catch (err) {
      setPostError(err.message || "La publication a échoué, réessayez.");
    }
    setPosting(false);
  }

  const activePost = posts.find(p => p.id === openComments);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Filtres — race et distance */}
      <div style={{ position: "relative", padding: "10px 16px", background: "#fff", flexShrink: 0, borderBottom: "1px solid #F3F4F6", display: "flex", gap: 8 }}>
        <button onClick={() => setShowBreedMenu(m => !m)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 14,
            border: `2px solid ${breedFilter !== "all" ? "#8B3D28" : "#E5E7EB"}`,
            background: breedFilter !== "all" ? "#FAF0EB" : "#fff", cursor: "pointer" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: breedFilter !== "all" ? "#8B3D28" : "#2D1200" }}>
            {breedFilter === "all" ? "Toutes les races" : breedFilter}
          </span>
          <span style={{ fontSize: 12, color: "#9CA3AF", transform: showBreedMenu ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
        </button>
        <button onClick={() => setShowRadiusSheet(true)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 14, flexShrink: 0,
            border: `2px solid ${radiusFilter < 100 ? "#8B3D28" : "#E5E7EB"}`,
            background: radiusFilter < 100 ? "#FAF0EB" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: radiusFilter < 100 ? "#8B3D28" : "#2D1200", whiteSpace: "nowrap" }}>
          📍 {radiusFilter >= 100 ? "Illimité" : `${radiusFilter} km`}
        </button>

        {showBreedMenu && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 16, right: 16, background: "#fff", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,.15)", border: "1px solid #F3F4F6", zIndex: 30, overflow: "hidden" }}>
            {/* Liste des races scrollable */}
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              <button onClick={() => { setBreedFilter("all"); setShowBreedMenu(false); }}
                style={{ width: "100%", padding: "11px 14px", border: "none", background: breedFilter === "all" ? "#FAF0EB" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#8B3D28", textAlign: "left", borderBottom: "1px solid #F9FAFB" }}>
                Toutes les races
              </button>
              {availableBreeds.map(b => (
                <button key={b} onClick={() => { setBreedFilter(b); setShowBreedMenu(false); }}
                  style={{ width: "100%", padding: "11px 14px", border: "none", background: breedFilter === b ? "#FAF0EB" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: breedFilter === b ? 700 : 500, color: breedFilter === b ? "#8B3D28" : "#374151", textAlign: "left", borderBottom: "1px solid #F9FAFB" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rayon de recherche pour la communauté */}
      {showRadiusSheet && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowRadiusSheet(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#2D1200", marginBottom: 4, textAlign: "center" }}>Rayon de la communauté</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 24 }}>Affichez les publications des membres dans cette distance</div>
            <div style={{ textAlign: "center", fontSize: 36, fontWeight: 900, color: "#B25F46", marginBottom: 16 }}>{radiusFilter >= 100 ? "Illimité" : `${radiusFilter} km`}</div>
            <input type="range" min="1" max="100" value={radiusFilter}
              onChange={e => setRadiusFilter(Number(e.target.value))}
              style={{ width: "100%", marginBottom: 8, accentColor: "#B25F46" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>
              <span>1 km</span><span>100 km +</span>
            </div>
            {!userProfile?.location && (
              <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
                Activez votre position dans Profil pour filtrer par distance réelle.
              </div>
            )}
            <button onClick={() => setShowRadiusSheet(false)}
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              Appliquer
            </button>
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={reloadPosts}>
        {/* New post */}
        <div style={{ margin: "12px 16px", padding: "12px 14px", background: "#F9FAFB", borderRadius: 14, display: "flex", gap: 10, alignItems: "center", border: "1px solid #E5E7EB" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {photoUrl(userProfile?.photos?.[0]) ? <img src={photoUrl(userProfile.photos[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (userProfile?.species === "cat" ? "🐱" : "🐕")}
          </div>
          <div onClick={() => isPremium ? setShowComposer(true) : setShowPremium(true)} style={{ flex: 1, fontSize: 14, color: "#9CA3AF", cursor: "pointer" }}>Partager un moment avec {userProfile?.name || "votre animal"}...</div>
          <button onClick={() => isPremium ? setShowComposer(true) : setShowPremium(true)} style={{ background: "linear-gradient(135deg,#B25F46,#C97A5E)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 12px", cursor: "pointer" }}>📸</button>
        </div>

        {loadingPosts ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={32} color="#E8B89F" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 32px", color: "#9CA3AF", fontSize: 14 }}>Aucune publication pour le moment. Soyez le premier à partager un moment ! 🐾</div>
        ) : filtered.map(post => {
          const [bgTag, textTag] = TAG_COLORS[post.tag] || ["#FAF0EB","#8B3D28"];
          const postComments = comments[post.id];

          return (
            <div key={post.id} style={{ margin: "0 16px 12px", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", background: "#fff" }}>
              <div style={{ padding: "14px 14px 10px" }}>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div onClick={() => openPostAuthorProfile(post)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: post.isDemo ? "default" : "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${post.emoji === "🐱" ? "#B25F46,#C97A5E" : "#8B3D28,#8B3510"})`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {post.photo ? <img src={post.photo} alt={post.pet} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : post.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{post.pet} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>· {post.author}</span></div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{post.breed} · {post.time}</div>
                    </div>
                  </div>
                  {post.tag && <span style={{ background: bgTag, color: textTag, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>{post.tag}</span>}
                </div>

                {/* Content */}
                {post.text && <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: "0 0 12px" }}>{post.text}</p>}

                {/* Actions — sans bouton Partager */}
                <div style={{ display: "flex", gap: 16, borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                  <button onClick={() => toggleLike(post)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: post.likedByMe ? "#B25F46" : "#9CA3AF" }}>
                    {post.likedByMe ? "🧡" : "🤍"} {post.likes}
                  </button>
                  <button onClick={() => openPostComments(post.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: openComments === post.id ? "#B25F46" : "#9CA3AF" }}>
                    💬 {post.commentCount}
                  </button>
                </div>

                {/* Aperçu du dernier commentaire (si déjà chargé) */}
                {postComments && postComments.length > 0 && openComments !== post.id && (
                  <button onClick={() => openPostComments(post.id)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, background: "#F9FAFB", borderRadius: 10, padding: "8px 10px", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{postComments[postComments.length - 1].emoji}</span>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#8B3D28" }}>{postComments[postComments.length - 1].author} </span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{postComments[postComments.length - 1].text}</span>
                    </div>
                  </button>
                )}
                {(post.commentCount > 1 && (!postComments || postComments.length < post.commentCount)) && openComments !== post.id && (
                  <button onClick={() => openPostComments(post.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: "4px 0 0", display: "block" }}>
                    Voir les {post.commentCount} commentaires →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </PullToRefresh>

      {/* Composeur de publication */}
      {showComposer && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 55, display: "flex", alignItems: "flex-end" }} onClick={() => !posting && setShowComposer(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 14 }}>Partager un moment avec {userProfile?.name}</div>
            <textarea value={composerText} onChange={e => setComposerText(e.target.value)} placeholder="Racontez quelque chose sur votre compagnon..." rows={4}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", fontFamily: "inherit", resize: "none", marginBottom: 12, boxSizing: "border-box" }} />
            {composerPhoto ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={composerPhoto.previewUrl} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 14 }} />
                <button onClick={() => setComposerPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ) : (
              <button onClick={() => composerPhotoRef.current?.click()}
                style={{ width: "100%", padding: "12px", borderRadius: 14, border: "2px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 12 }}>
                📸 Ajouter une photo
              </button>
            )}
            <input ref={composerPhotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleComposerPhoto} />
            {postError && (
              <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>{postError}</div>
            )}
            <button onClick={submitPost} disabled={posting || (!composerText.trim() && !composerPhoto)}
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: (posting || (!composerText.trim() && !composerPhoto)) ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: (posting || (!composerText.trim() && !composerPhoto)) ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: (posting || (!composerText.trim() && !composerPhoto)) ? "default" : "pointer" }}>
              {posting ? "Publication en cours..." : "Publier"}
            </button>
          </div>
        </div>
      )}

      {/* Premium popup */}
      {showPremium && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setShowPremium(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 20px 40px", width: "100%", position: "relative" }}>
            <button onClick={() => setShowPremium(false)} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F3F4F6", color: "#6B7280", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ textAlign: "center", fontSize: 44, marginBottom: 12 }}>👑</div>
            <div style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Fonction Premium</div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>Publiez dans la communauté, accédez à toutes les races et bien plus encore.</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div onClick={() => setPreviewPlan("monthly")}
                style={{ flex: 1, padding: "14px", borderRadius: 14, cursor: "pointer", textAlign: "center", border: `2px solid ${previewPlan === "monthly" ? "#B25F46" : "#E5E7EB"}`, background: previewPlan === "monthly" ? "#FAF0EB" : "#fff" }}>
                <div style={{ fontWeight: 800, color: previewPlan === "monthly" ? "#B25F46" : "#2D1200", fontSize: 16 }}>4,99 €</div>
                <div style={{ fontSize: 12, color: previewPlan === "monthly" ? "#B25F46" : "#9CA3AF" }}>par mois</div>
              </div>
              <div onClick={() => setPreviewPlan("yearly")}
                style={{ flex: 1, padding: "14px", borderRadius: 14, cursor: "pointer", textAlign: "center", border: `2px solid ${previewPlan === "yearly" ? "#B25F46" : "#E5E7EB"}`, background: previewPlan === "yearly" ? "#FAF0EB" : "#fff" }}>
                <div style={{ fontWeight: 800, color: previewPlan === "yearly" ? "#B25F46" : "#2D1200", fontSize: 16 }}>39,99 €</div>
                <div style={{ fontSize: 12, color: previewPlan === "yearly" ? "#B25F46" : "#9CA3AF" }}>par an · -33%</div>
              </div>
            </div>
            <button onClick={() => { setShowPremium(false); onPremium(previewPlan); }}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              👑 Passer Premium
            </button>
          </div>
        </div>
      )}

      {/* Comments sheet */}
      {openComments && activePost && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setOpenComments(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", height: "78%", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#2D1200" }}>Commentaires <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: 14 }}>({(comments[openComments] || []).length})</span></div>
                <button onClick={() => setOpenComments(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
              {/* Post résumé */}
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8B3D28" }}>{activePost.pet} · {activePost.author}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>{activePost.text}</div>
              </div>
            </div>

            {/* Comments list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {loadingComments ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={28} color="#E8B89F" /></div>
              ) : (comments[openComments] || []).length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 14 }}>Soyez le premier à commenter !</div>
                </div>
              )}
              {(comments[openComments] || []).map(c => {
                const likeKey = `${openComments}-${c.id}`;
                const isCommentLiked = commentLikes[likeKey];
                const isReply = !!c.parentCommentId;
                return (
                  <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16, marginLeft: isReply ? 30 : 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: c.emoji === "🩺" ? "#E3F2FD" : "linear-gradient(135deg,#B25F46,#C97A5E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {photoUrl(c.photo) ? <img src={photoUrl(c.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : c.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: "#F9FAFB", borderRadius: "4px 14px 14px 14px", padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#8B3D28", marginBottom: 3 }}>{c.author} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>· {c.pet}</span></div>
                        {isReply && c.parentPet && <div style={{ fontSize: 11, color: "#B25F46", marginBottom: 3 }}>↳ en réponse à {c.parentPet}</div>}
                        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, paddingLeft: 4 }}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{c.time}</span>
                        <button onClick={() => toggleCommentLike(openComments, c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: isCommentLiked ? "#B25F46" : "#9CA3AF", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                          {isCommentLiked ? "🧡" : "🤍"} {c.likes + (isCommentLiked ? 1 : 0)}
                        </button>
                        <button onClick={() => setReplyingTo({ postId: openComments, commentId: c.id, authorName: c.pet })}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0, fontWeight: 600 }}>Répondre</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            {commentModerationError[openComments] && (
              <div style={{ margin: "0 16px", padding: "8px 12px", background: "#FEF2F2", borderRadius: 10, fontSize: 12, color: "#DC2626" }}>{commentModerationError[openComments]}</div>
            )}
            {replyingTo?.postId === openComments && (
              <div style={{ margin: "0 16px", padding: "6px 12px", background: "#FAF0EB", borderRadius: 10, fontSize: 12, color: "#B25F46", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>En réponse à {replyingTo.authorName}</span>
                <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", color: "#B25F46", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕</button>
              </div>
            )}
            <div style={{ padding: "10px 16px 28px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {photoUrl(userProfile?.photos?.[0]) ? <img src={photoUrl(userProfile.photos[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (userProfile?.species === "dog" ? "🐕" : "🐱")}
              </div>
              <input
                value={commentInputs[openComments] || ""}
                onChange={e => setCommentInputs(i => ({ ...i, [openComments]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitComment(openComments)}
                placeholder={moderatingComment[openComments] ? "Vérification en cours..." : (replyingTo?.postId === openComments ? `Répondre à ${replyingTo.authorName}...` : "Ajouter un commentaire...")}
                disabled={!!moderatingComment[openComments]}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", fontFamily: "inherit" }}
              />
              <button onClick={() => submitComment(openComments)} disabled={!!moderatingComment[openComments]}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: (commentInputs[openComments] || "").trim() ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB", cursor: (commentInputs[openComments] || "").trim() ? "pointer" : "default", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s" }}><PawLogo size={18} color={(commentInputs[openComments] || "").trim() ? "#fff" : "#9CA3AF"} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Fiche complète de l'auteur d'un post */}
      {selectedPostAuthor && (() => {
        const fullProfile = authorProfile;
        return (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "flex-end" }} onClick={() => setSelectedPostAuthor(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", boxSizing: "border-box" }}>
              <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />
              {loadingAuthorProfile ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><PawLogo size={32} color="#E8B89F" /></div>
              ) : !fullProfile ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>Profil introuvable.</div>
              ) : (
                <>
                  <div style={{ width: "100%", aspectRatio: "1", background: "#FAF0EB", position: "relative", marginTop: 12 }}>
                    {photoUrl(fullProfile.photos?.[authorPhotoIdx]) ? (
                      <img src={photoUrl(fullProfile.photos[authorPhotoIdx])} alt={selectedPostAuthor.author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{selectedPostAuthor.emoji}</div>
                    )}
                    {fullProfile.photos?.length > 1 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, position: "absolute", top: 12, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}>
                          {fullProfile.photos.map((_, i) => (
                            <div key={i} style={{ width: i === authorPhotoIdx ? 24 : 16, height: 4, borderRadius: 2, background: i === authorPhotoIdx ? "#B25F46" : "rgba(255,255,255,.6)", transition: "width .2s" }} />
                          ))}
                        </div>
                        <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setAuthorPhotoIdx(i => Math.max(0, i - 1))} />
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setAuthorPhotoIdx(i => Math.min(fullProfile.photos.length - 1, i + 1))} />
                        </div>
                      </>
                    )}
                    <button onClick={() => setSelectedPostAuthor(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", zIndex: 3 }}>✕</button>
                  </div>
                  <div style={{ padding: "18px 20px 32px" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>
                      {selectedPostAuthor.pet}{fullProfile.age ? ` · ${formatAge(fullProfile.age)}` : ""}{fullProfile.gender ? ` ${fullProfile.gender === "F" ? "♀" : "♂"}` : ""}
                    </div>
                    <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600 }}>{selectedPostAuthor.breed} · {selectedPostAuthor.author}</div>

                    {(fullProfile.vaccinated || fullProfile.sterilized) && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, marginBottom: 10 }}>
                        {fullProfile.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné·e ✓</Badge>}
                        {fullProfile.sterilized && <Badge color="#F3E5F5" text="#7B1FA2">Stérilisé·e</Badge>}
                      </div>
                    )}

                    {fullProfile.temper?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                        {fullProfile.temper.map(t => <Badge key={t} color="#FAF0EB" text="#8B3D28">{t}</Badge>)}
                      </div>
                    )}

                    {fullProfile.bio && (
                      <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>{fullProfile.bio}</p>
                    )}

                    {fullProfile.seeking?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>CHERCHE</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {fullProfile.seeking.map(s => <Badge key={s} color="#FAF0EB" text="#8B3D28">{s}</Badge>)}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", gap: 22 }}>
                      <button onClick={handleDeclineAuthor} disabled={likingAuthorId === fullProfile.id}
                        style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "1.5px solid #F3F4F6", cursor: likingAuthorId === fullProfile.id ? "default" : "pointer", fontSize: 22, color: "#B25F46", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
                        ✕
                      </button>
                      <button onClick={() => setShowAuthorGiftPicker(true)} disabled={likingAuthorId === fullProfile.id}
                        style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "1.5px solid #F3F4F6", cursor: likingAuthorId === fullProfile.id ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
                        🎁
                      </button>
                      <button onClick={handleLikeAuthor} disabled={likingAuthorId === fullProfile.id}
                        style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "1.5px solid #F3F4F6", cursor: likingAuthorId === fullProfile.id ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
                        <PawLogo size={26} color="#B25F46" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Sélecteur de cadeau pour l'auteur d'un post */}
      {showAuthorGiftPicker && authorProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 90, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowAuthorGiftPicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", width: "100%", maxHeight: "70vh", overflowY: "auto", boxSizing: "border-box" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 10 }}>🎁 Envoyer à {authorProfile.name}</div>
            <input value={authorGiftMessage} onChange={e => setAuthorGiftMessage(e.target.value.slice(0, 120))} onClick={e => e.stopPropagation()}
              placeholder="Ajouter un mot (optionnel)..."
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px", borderRadius: 20, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", marginBottom: 14 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {GIFT_CATALOG.filter(g => g.species === "both" || g.species === authorProfile.species).map(g => {
                const owned = userProfile?.giftInventory?.[g.id] || 0;
                return (
                  <button key={g.id} onClick={() => sendGiftToAuthor(g.id, g.emoji)} disabled={sendingAuthorGift}
                    style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 4px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: sendingAuthorGift ? "default" : "pointer", opacity: owned > 0 ? 1 : .65 }}>
                    {owned > 0 && (
                      <span style={{ position: "absolute", top: 2, right: 2, background: "#B25F46", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>{owned}</span>
                    )}
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>{g.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>Un article grisé n'est plus en stock — tapez dessus pour l'acheter dans la Boutique.</div>
          </div>
        </div>
      )}

      {/* Confirmation d'envoi de cadeau */}
      {authorGiftToast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 95, background: "#2D1200", color: "#fff", padding: "12px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(0,0,0,.25)", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 18 }}>{authorGiftToast.emoji}</span>
          {authorGiftToast.article} {authorGiftToast.label} envoyé à {authorGiftToast.name} !
        </div>
      )}

      {/* Célébration après un match déclenché depuis Communauté */}
      {justMatchedWithAuthor && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,18,0,.92)", zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4, textAlign: "center" }}>C'est un match !</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,.85)", marginBottom: 28, textAlign: "center", lineHeight: 1.5, maxWidth: 320 }}>{generateMatchMessage(userProfile, justMatchedWithAuthor)}</div>
          <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", background: "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 28, border: "3px solid #fff" }}>
            {photoUrl(justMatchedWithAuthor.photos?.[0]) ? <img src={photoUrl(justMatchedWithAuthor.photos[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (justMatchedWithAuthor.species === "cat" ? "🐱" : "🐕")}
          </div>
          <button onClick={() => { setJustMatchedWithAuthor(null); onNav("messages"); }}
            style={{ width: "100%", maxWidth: 320, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>
            💬 Voir la conversation
          </button>
          <button onClick={() => setJustMatchedWithAuthor(null)}
            style={{ width: "100%", maxWidth: 320, padding: "14px", borderRadius: 14, border: "none", background: "none", color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}

// ── MATCHES / CHAT ────────────────────────────────────────────────────────────
function MatchesScreen({ onOpenChat, userProfile = null }) {
  const [tab, setTab] = useState("messages");
  const [agendaData, setAgendaData] = useState([]);
  const [rating, setRating] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [confirmUnmatch, setConfirmUnmatch] = useState(null); // match en attente de confirmation
  const [unmatching, setUnmatching] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingMatches(true);
      const result = await fetchMatchesForUser(userProfile);
      if (active) { setMatches(result); setLoadingMatches(false); }
    }
    load();
    return () => { active = false; };
  }, [userProfile?.id, userProfile?.userId]);

  async function handleUnmatch(matchId) {
    setUnmatching(true);
    try {
      await unmatchUser(matchId);
      setMatches(m => m.filter(x => x.id !== matchId));
    } catch (err) {
      console.error("unmatch error:", err);
    }
    setUnmatching(false);
    setConfirmUnmatch(null);
  }

  function submitRating(id, stars) {
    setAgendaData(a => a.map(ev => ev.id === id ? { ...ev, rating: stars } : ev));
    setRatingFor(null); setRating(null);
  }

  const agendaBySpecies = agendaData.filter(e => !userProfile?.species || e.species === userProfile.species);
  const upcoming = agendaBySpecies.filter(e => e.status !== "done" && e.status !== "cancelled");
  const past = agendaBySpecies.filter(e => e.status === "done");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#fff", flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        {[["messages","💬 Messages"],["agenda","📅 Agenda"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: tab === v ? "#B25F46" : "#9CA3AF", borderBottom: `3px solid ${tab === v ? "#B25F46" : "transparent"}`, transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      {tab === "messages" && (
        <>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "14px 16px 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Vos matchs</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>{matches.length} connexion{matches.length !== 1 ? "s" : ""}</div>
          </div>

          {loadingMatches ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={32} color="#E8B89F" /></div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 32px", color: "#9CA3AF", fontSize: 14 }}>
              Pas encore de match. Direction l'onglet Découvrir pour swiper des profils ! 🐾
            </div>
          ) : (
            <>
          <div style={{ overflowX: "auto", display: "flex", gap: 12, padding: "8px 16px 16px" }}>
            {matches.map(m => (
              <div key={m.id} onClick={() => onOpenChat(m.id)} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                <div style={{ width: 64, height: 64, position: "relative" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 4px 12px rgba(242,100,25,.25)" }}>
                    {m.photo ? <img src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.emoji}
                  </div>
                  {m.unread > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#B25F46", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{m.unread}</div>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2D1200", marginTop: 6 }}>{m.name}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{ height: 1, background: "#F3F4F6" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginTop: 12, marginBottom: 8, letterSpacing: 1 }}>MESSAGES</div>
          </div>
          {matches.map(m => (
            <div key={m.id} onClick={() => onOpenChat(m.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer", background: m.unread ? "#FAF0EB" : "#fff", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {m.photo ? <img src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: "#2D1200", fontSize: 15 }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13, color: m.lastMsgIsGift ? "#B25F46" : (m.unread ? "#8B3D28" : "#6B7280"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: m.lastMsgIsGift || m.unread ? 700 : 400 }}>{m.lastMsg}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{m.owner}</div>
              </div>
              {m.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#B25F46", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.unread}</div>}
              <button onClick={e => { e.stopPropagation(); setConfirmUnmatch(m); }}
                style={{ background: "none", border: "none", color: "#D1D5DB", fontSize: 16, cursor: "pointer", flexShrink: 0, padding: 4 }}>✕</button>
            </div>
          ))}
            </>
          )}
        </div>

        {/* Confirmation d'annulation de match */}
        {confirmUnmatch && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => !unmatching && setConfirmUnmatch(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💔</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>Annuler le match avec {confirmUnmatch.name} ?</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}>Votre conversation sera définitivement supprimée pour vous deux. Cette action est irréversible.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmUnmatch(null)} disabled={unmatching}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Annuler
                </button>
                <button onClick={() => handleUnmatch(confirmUnmatch.id)} disabled={unmatching}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: unmatching ? "#E5E7EB" : "#DC2626", color: unmatching ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: unmatching ? "default" : "pointer" }}>
                  {unmatching ? "..." : "Oui, annuler"}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {/* ── AGENDA ── */}
      {tab === "agenda" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, letterSpacing: 1 }}>À VENIR</div>
          {upcoming.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0 16px", color: "#9CA3AF" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 14 }}>Aucune rencontre planifiée</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Organisez-en une depuis vos Messages !</div>
            </div>
          )}
          {upcoming.map(ev => (
            <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ background: ev.status === "confirmed" ? "linear-gradient(90deg,#FAF0EB,#fff)" : "linear-gradient(90deg,#FFF9E6,#fff)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#B25F46,#C97A5E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200" }}>{ev.type} avec {ev.with}</div>
                    <div style={{ fontSize: 12, color: "#8B3D28" }}>{ev.owner}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>📅 {ev.date} à {ev.time} · 📍 {ev.place}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: ev.status === "confirmed" ? "#E8F5E9" : "#FEF9C3", color: ev.status === "confirmed" ? "#2E7D32" : "#854D0E" }}>
                    {ev.status === "confirmed" ? "Confirmé ✓" : "En attente"}
                  </div>
                </div>
              </div>
              {ev.status === "confirmed" && (
                <div style={{ display: "flex", borderTop: "1px solid #F3F4F6" }}>
                  <button onClick={() => setAgendaData(a => a.map(e => e.id === ev.id ? { ...e, status: "cancelled" } : e))} style={{ width: "100%", padding: "10px", background: "#fff", border: "none", fontSize: 13, color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>Annuler la rencontre</button>
                </div>
              )}
            </div>
          ))}

          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", margin: "16px 0 10px", letterSpacing: 1 }}>PASSÉES</div>
          {past.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 0 24px", color: "#9CA3AF" }}>
              <div style={{ fontSize: 12 }}>Aucune rencontre passée pour l'instant</div>
            </div>
          )}
          {past.map(ev => (
            <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", opacity: 0.85 }}>
              <div style={{ padding: "14px 16px", background: "#F9FAFB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#6B7280" }}>{ev.type} avec {ev.with}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{ev.date} · {ev.place}</div>
                    {ev.rating
                      ? <div style={{ fontSize: 14, marginTop: 4 }}>{"⭐".repeat(ev.rating)}</div>
                      : <button onClick={() => setRatingFor(ev.id)} style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#B25F46", background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Laisser un avis</button>
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating modal */}
      {ratingFor && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setRatingFor(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8, textAlign: "center" }}>Comment s'est passée la rencontre ?</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", marginBottom: 20 }}>Votre avis aide les autres propriétaires</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 36, background: "none", border: "none", cursor: "pointer", opacity: rating && s > rating ? 0.3 : 1, transition: "opacity .15s" }}>⭐</button>
              ))}
            </div>
            <button onClick={() => rating && submitRating(ratingFor, rating)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: rating ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB", color: rating ? "#fff" : "#9CA3AF", fontWeight: 800, fontSize: 15, cursor: rating ? "pointer" : "default" }}>
              Envoyer mon avis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatScreen({ matchId, onBack, userProfile = null, onMessagesRead = () => {}, onProfileUpdated = () => {}, onGoToShop = () => {} }) {
  const [match, setMatch] = useState(null); // { name, emoji, photo, owner }
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState(null);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [showMatchProfile, setShowMatchProfile] = useState(false);
  const [matchProfile, setMatchProfile] = useState(null);
  const [loadingMatchProfile, setLoadingMatchProfile] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({ online: false, lastActiveAt: null });

  // Rafraîchit le statut en ligne du match toutes les 30s pendant que la
  // conversation est ouverte.
  useEffect(() => {
    if (!match?.otherUserId) return;
    let active = true;
    async function refresh() {
      const status = await fetchOnlineStatus(match.otherUserId);
      if (active) setOnlineStatus(status);
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [match?.otherUserId]);

  async function openMatchProfile() {
    if (!match?.otherUserId) return;
    setShowMatchProfile(true);
    setLoadingMatchProfile(true);
    const profile = await fetchProfileForUser(match.otherUserId);
    setMatchProfile(profile);
    setLoadingMatchProfile(false);
  }
  const [sendingGift, setSendingGift] = useState(false);
  const [sentGiftToast, setSentGiftToast] = useState(null);
  const [chatGiftMessage, setChatGiftMessage] = useState("");
  const seenGiftIdsRef = useRef(loadSeenGiftIds());
  const [giftError, setGiftError] = useState(null);
  const [suggestedSpot, setSuggestedSpot] = useState(null);
  const [loadingSpot, setLoadingSpot] = useState(true);
  const [proposing, setProposing] = useState(false);
  const bottomRef = useRef(null);
  const photoInputRef = useRef(null);

  // Cherche un spot réel à proximité (parc en priorité, sinon n'importe
  // lequel) pour suggérer un lieu de rencontre concret dans la conversation.
  useEffect(() => {
    let active = true;
    async function loadSpot() {
      setLoadingSpot(true);
      const lat = userProfile?.location?.lat ?? 48.8566;
      const lng = userProfile?.location?.lng ?? 2.3522;
      await ensureSpotsForLocation(lat, lng, nearestCity(lat, lng));
      const spots = await fetchSpotsForCell(cellIdFor(lat, lng));
      if (!active) return;
      const best = spots.find(s => s.type === "park") || spots[0] || null;
      setSuggestedSpot(best ? { ...best, distance: distanceKm(lat, lng, best.lat, best.lng).toFixed(1).replace(".", ",") + " km" } : null);
      setLoadingSpot(false);
    }
    loadSpot();
    return () => { active = false; };
  }, [userProfile?.location?.lat, userProfile?.location?.lng]);

  async function proposeSpot() {
    if (!suggestedSpot || proposing) return;
    setProposing(true);
    const text = `📍 Et si on se retrouvait à ${suggestedSpot.name} (${suggestedSpot.distance}) ?`;
    await supabase.from("messages").insert({
      match_id: matchId,
      sender_user_id: userProfile.userId,
      text,
    });
    setProposing(false);
  }

  // Charge le match (profil en face) + l'historique des messages, marque les
  // messages reçus comme lus, puis reste à l'écoute en temps réel des
  // nouveaux messages de cette conversation.
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const matches = await fetchMatchesForUser(userProfile);
      const found = matches.find(m => m.id === matchId);
      if (active) setMatch(found || null);

      const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (active) {
        setMsgs((history || []).map(m => ({
          id: m.id,
          from: m.sender_user_id === userProfile.userId ? "me" : "them",
          text: m.text,
          imageUrl: m.image_url,
          giftEmoji: m.gift_emoji,
          time: formatRelativeTime(m.created_at),
        })));
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
      }
      // Marque comme lus les messages reçus dans cette conversation, et
      // rafraîchit le badge de la barre de navigation en conséquence.
      await markMessagesRead(matchId, userProfile.userId);
      onMessagesRead();
    }
    load();

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` }, (payload) => {
        setMsgs(m => [...m, {
          id: payload.new.id,
          from: payload.new.sender_user_id === userProfile.userId ? "me" : "them",
          text: payload.new.text,
          imageUrl: payload.new.image_url,
          giftEmoji: payload.new.gift_emoji,
          time: formatRelativeTime(payload.new.created_at),
        }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        // La conversation est ouverte : ce nouveau message est vu tout de suite.
        if (payload.new.sender_user_id !== userProfile.userId) {
          markMessagesRead(matchId, userProfile.userId).then(onMessagesRead);
        }
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [matchId, userProfile?.userId]);

  // Marque les cadeaux actuellement affichés comme "déjà vus" — l'animation
  // complète ne se rejouera plus pour eux la prochaine fois, seulement pour
  // un cadeau réellement nouveau.
  useEffect(() => {
    let changed = false;
    msgs.forEach(m => {
      if (m.giftEmoji && m.id && !seenGiftIdsRef.current.has(m.id)) {
        seenGiftIdsRef.current.add(m.id);
        changed = true;
      }
    });
    if (changed) saveSeenGiftIds(seenGiftIdsRef.current);
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setModerationError(null);
    setModerating(true);
    const result = await moderateText(text);
    setModerating(false);
    if (!result.approved) {
      setModerationError(result.reason || "Ce message enfreint les règles de Miloute et n'a pas été envoyé.");
      return;
    }
    setInput("");
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_user_id: userProfile.userId,
      text,
    });
    // Pas besoin de mettre à jour msgs manuellement : le message revient via
    // l'abonnement temps réel ci-dessus, pour soi comme pour l'autre personne.
    if (error) setModerationError("Le message n'a pas pu être envoyé, réessayez.");
    else if (match?.otherUserId) sendPushNotification(match.otherUserId, userProfile.name, text, { type: "message", matchId });
  }

  async function sendPhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setModerationError(null);
    setSendingPhoto(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await moderateImage(base64, file.type || "image/jpeg");
      if (!result.approved) {
        setModerationError(result.reason || "Photo refusée : contenu non approprié.");
        setSendingPhoto(false);
        return;
      }
      const imageUrl = await uploadPhotoToStorage(file, userProfile.userId);
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_user_id: userProfile.userId,
        image_url: imageUrl,
      });
      if (error) setModerationError("La photo n'a pas pu être envoyée, réessayez.");
    } catch {
      setModerationError("Impossible d'envoyer cette photo, réessayez.");
    }
    setSendingPhoto(false);
  }

  async function sendGift(giftId, emoji) {
    if (!(userProfile?.giftInventory?.[giftId] > 0)) {
      setGiftError("Vous n'avez plus ce cadeau — achetez-le dans la Boutique Miloute.");
      return;
    }
    setSendingGift(true);
    setGiftError(null);
    const result = await spendGift(userProfile, giftId);
    if (!result.success) {
      setGiftError(result.error || "Impossible d'envoyer ce cadeau, réessayez.");
      setSendingGift(false);
      return;
    }
    onProfileUpdated({ ...userProfile, giftInventory: result.giftInventory });
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_user_id: userProfile.userId,
      gift_emoji: emoji,
      text: chatGiftMessage.trim() || null,
    });
    if (error) setGiftError("Le cadeau n'a pas pu être envoyé, réessayez.");
    else {
      setShowGiftPicker(false);
      // Enregistré aussi dans "treats" pour apparaître dans Ma Boîte à
      // Souvenirs, comme les cadeaux envoyés depuis Découvrir.
      if (match?.otherProfileId) {
        supabase.from("treats").insert({
          sender_user_id: userProfile.userId,
          sender_profile_id: userProfile.id,
          target_user_id: match.otherUserId,
          target_profile_id: match.otherProfileId,
          gift_id: giftId,
          message: chatGiftMessage.trim() || null,
        }).then(({ error: treatError }) => { if (treatError) console.error("treats insert error:", treatError); });
      }
      setChatGiftMessage("");
      const giftInfo = GIFT_CATALOG.find(g => g.id === giftId);
      setSentGiftToast({ emoji: giftInfo?.emoji || emoji, label: giftInfo?.label || "Cadeau", article: giftInfo?.gender === "f" ? "une" : "un" });
      setTimeout(() => setSentGiftToast(null), 2200);
      if (!userProfile?.questsCompleted?.first_gift_sent) {
        claimQuest(userProfile, "first_gift_sent").then(r => {
          if (r.claimed) onProfileUpdated({ ...userProfile, giftInventory: r.giftInventory, questsCompleted: r.questsCompleted });
        }).catch(() => {});
      }
    }
    setSendingGift(false);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #F3F4F6", background: "#fff" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>←</button>
        <button onClick={openMatchProfile} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {match?.photo ? <img src={match.photo} alt={match.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : match?.emoji}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200" }}>{match?.name}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>
              {match?.owner}
              {onlineStatus.online && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#22C55E", fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  En ligne
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Confirmation d'envoi de cadeau — même animation que dans Découvrir */}
      {sentGiftToast && (
        <>
          <style>{`
            @keyframes chatGiftBoxShake { 0%,100% { transform: scale(1) rotate(0deg); } 25% { transform: scale(0.94) rotate(-4deg); } 75% { transform: scale(0.94) rotate(4deg); } }
            @keyframes chatGiftItemPop { 0% { transform: translate(-50%, 6px) scale(0); opacity: 0; } 55% { transform: translate(-50%, -20px) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -16px) scale(1); opacity: 1; } }
            @keyframes chatToastTextIn { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
          `}</style>
          <div style={{ position: "fixed", top: 90, left: "50%", transform: "translateX(-50%)", zIndex: 250, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
            <div style={{ position: "relative", width: 46, height: 46, marginBottom: 6 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, animation: "chatGiftBoxShake .5s ease-out" }}>🎁</div>
              <div style={{ position: "absolute", left: "50%", top: 0, fontSize: 26, animation: "chatGiftItemPop .6s cubic-bezier(.34,1.56,.64,1) .15s both" }}>{sentGiftToast.emoji}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 20, whiteSpace: "nowrap", animation: "chatToastTextIn .3s ease-out .3s both" }}>
              {sentGiftToast.article} {sentGiftToast.label} envoyé à {match?.name} !
            </div>
          </div>
        </>
      )}

      <div style={{ margin: "10px 14px 0", padding: "10px 14px", background: "#FAF0EB", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span>📍</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B25F46" }}>LIEU SUGGÉRÉ</div>
          <div style={{ fontSize: 13, color: "#4B5563" }}>
            {loadingSpot ? "Recherche d'un lieu à proximité..." : suggestedSpot ? `${suggestedSpot.name} · ${suggestedSpot.distance} · ${suggestedSpot.open ? "Ouvert" : "Fermé"}` : "Aucun spot connu à proximité pour l'instant"}
          </div>
        </div>
        <button onClick={proposeSpot} disabled={!suggestedSpot || proposing}
          style={{ background: suggestedSpot ? "#B25F46" : "#E5E7EB", border: "none", borderRadius: 8, color: suggestedSpot ? "#fff" : "#9CA3AF", fontSize: 11, fontWeight: 700, padding: "5px 9px", cursor: suggestedSpot ? "pointer" : "default" }}>
          {proposing ? "..." : "Proposer"}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={28} color="#E8B89F" /></div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: 24 }}>Vous avez matché ! Dites bonjour 👋</div>
        ) : msgs.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
            {msg.giftEmoji ? (() => {
              const isFirstView = !msg.id || !seenGiftIdsRef.current.has(msg.id);
              return (
              <div style={{ position: "relative", maxWidth: "75%", padding: "22px 26px", borderRadius: msg.from === "me" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: "linear-gradient(135deg,#FFF3D6,#FFE29A,#FFD966,#FFE29A)", backgroundSize: "300% 100%", textAlign: "center", overflow: "visible", boxShadow: "0 6px 22px rgba(230,168,0,.35)", border: "1.5px solid rgba(230,168,0,.4)" }}>
                {isFirstView && (
                  <style>{`
                    @keyframes giftPopWow { 0% { transform: scale(0) rotate(-18deg); opacity: 0; } 50% { transform: scale(1.4) rotate(10deg); opacity: 1; } 70% { transform: scale(0.9) rotate(-5deg); } 85% { transform: scale(1.08) rotate(2deg); } 100% { transform: scale(1) rotate(0deg); } }
                    @keyframes giftGlowPulse { 0% { transform: scale(0.5); opacity: .9; } 100% { transform: scale(2.6); opacity: 0; } }
                    @keyframes sparkleFly { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(180deg); opacity: 0; } }
                  `}</style>
                )}
                {isFirstView && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "radial-gradient(circle, rgba(255,215,0,.55) 0%, transparent 70%)", animation: "giftGlowPulse .9s ease-out", pointerEvents: "none" }} />
                )}
                {isFirstView && [["-42px","-32px"], ["46px","-26px"], ["-46px","22px"], ["42px","32px"], ["4px","-46px"], ["-6px","42px"]].map(([tx, ty], idx) => (
                  <span key={idx} style={{ position: "absolute", left: "50%", top: "40%", fontSize: 13, "--tx": tx, "--ty": ty, animation: `sparkleFly .9s ease-out ${0.1 + idx * 0.07}s both`, pointerEvents: "none" }}>✨</span>
                ))}
                <div style={{ position: "relative", fontSize: 52, marginBottom: 6, animation: isFirstView ? "giftPopWow .7s cubic-bezier(.34,1.56,.64,1)" : "none" }}>{msg.giftEmoji}</div>
                <div style={{ position: "relative", fontSize: 12, fontWeight: 800, color: "#7A4A00" }}>
                  {(() => {
                    const candidates = GIFT_CATALOG.filter(x => x.emoji === msg.giftEmoji);
                    const g = candidates.find(x => x.species === match?.species) || candidates.find(x => x.species === "both") || candidates[0];
                    const label = g?.label || "un cadeau";
                    const article = g?.gender === "f" ? "une" : "un";
                    return msg.from === "me" ? `Vous avez envoyé ${article} ${label}` : `${match?.name || "Il/Elle"} vous a envoyé ${article} ${label}`;
                  })()}
                </div>
                {msg.text && (
                  <div style={{ position: "relative", fontSize: 12, color: "#5C3A00", marginTop: 6, padding: "6px 10px", background: "rgba(255,255,255,.5)", borderRadius: 10, fontStyle: "italic" }}>
                    « {msg.text} »
                  </div>
                )}
                <div style={{ position: "relative", fontSize: 10, opacity: .65, marginTop: 4, color: "#7A4A00" }}>{msg.time}</div>
              </div>
              );
            })() : (
              <div style={{ maxWidth: "75%", padding: msg.imageUrl ? 4 : "10px 14px", borderRadius: msg.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.from === "me" ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#F3F4F6", color: msg.from === "me" ? "#fff" : "#2D1200", fontSize: 14, lineHeight: 1.5 }}>
                {msg.imageUrl && <img src={msg.imageUrl} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 14, display: "block" }} />}
                {msg.text && <div style={{ padding: msg.imageUrl ? "8px 8px 2px" : 0 }}>{msg.text}</div>}
                <div style={{ fontSize: 10, opacity: .6, marginTop: 4, textAlign: msg.from === "me" ? "right" : "left", padding: msg.imageUrl ? "0 8px 4px" : 0 }}>{msg.time}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {moderationError && (
        <div style={{ margin: "0 16px 8px", padding: "8px 12px", background: "#FEF2F2", borderRadius: 10, fontSize: 12, color: "#DC2626" }}>{moderationError}</div>
      )}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid #F3F4F6", background: "#fff", boxSizing: "border-box" }}>
        <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={sendPhoto} />
        <button onClick={() => photoInputRef.current?.click()} disabled={sendingPhoto} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: sendingPhoto ? "default" : "pointer", flexShrink: 0, opacity: sendingPhoto ? .5 : 1 }}>📷</button>
        <button onClick={() => setShowGiftPicker(true)} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>🎁</button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={moderating ? "Vérification en cours..." : sendingPhoto ? "Envoi de la photo..." : "Écrire un message..."} disabled={moderating || sendingPhoto} style={{ flex: 1, minWidth: 0, padding: "9px 14px", borderRadius: 20, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", boxSizing: "border-box" }} />
        <button onClick={send} disabled={moderating || sendingPhoto} style={{ background: input.trim() ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: input.trim() ? "pointer" : "default", flexShrink: 0, transition: "background .2s", display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={18} color={input.trim() ? "#fff" : "#9CA3AF"} /></button>
      </div>

      {/* Sélecteur de cadeau */}
      {showGiftPicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowGiftPicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "70vh", overflowY: "auto", boxSizing: "border-box" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200", marginBottom: 12 }}>🎁 Offrir un cadeau</div>
            <input value={chatGiftMessage} onChange={e => setChatGiftMessage(e.target.value.slice(0, 120))}
              placeholder="Ajouter un mot (optionnel)..."
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px", borderRadius: 20, border: "1.5px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", marginBottom: 16 }} />
            {giftError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>{giftError}</div>}
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>Adaptés à {match?.name || "votre match"} {match?.emoji}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {GIFT_CATALOG.filter(g => g.species === "both" || g.species === match?.species).map(g => {
                const owned = userProfile?.giftInventory?.[g.id] || 0;
                return (
                  <button key={g.id} onClick={() => owned > 0 ? sendGift(g.id, g.emoji) : (setShowGiftPicker(false), onGoToShop())} disabled={sendingGift}
                    style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "16px 8px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: sendingGift ? "default" : "pointer", opacity: owned > 0 ? 1 : .7 }}>
                    {owned > 0 && (
                      <span style={{ position: "absolute", top: 6, right: 6, background: "#B25F46", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{owned}</span>
                    )}
                    <span style={{ fontSize: 32 }}>{g.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>{g.label}</span>
                    {owned === 0 && <span style={{ fontSize: 10, color: "#B25F46", fontWeight: 700 }}>{g.price}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 14 }}>Un cadeau grisé n'est plus en stock — tapez dessus pour l'acheter dans la Boutique.</div>
          </div>
        </div>
      )}

      {/* Profil complet du match */}
      {showMatchProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setShowMatchProfile(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />
            {loadingMatchProfile ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><PawLogo size={32} color="#E8B89F" /></div>
            ) : !matchProfile ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>Profil introuvable.</div>
            ) : (
              <>
                <div style={{ width: "100%", aspectRatio: "1", background: "#FAF0EB", position: "relative" }}>
                  {photoUrl(matchProfile.photos?.[0]) ? (
                    <img src={photoUrl(matchProfile.photos[0])} alt={matchProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{matchProfile.species === "cat" ? "🐱" : "🐕"}</div>
                  )}
                  <button onClick={() => setShowMatchProfile(false)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ padding: "18px 20px 32px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#2D1200" }}>{matchProfile.name}, {formatAge(matchProfile.age)} {matchProfile.gender === "F" ? "♀" : "♂"}</div>
                  <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 12 }}>{matchProfile.breed}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {(matchProfile.temper || []).map(t => (
                      <span key={t} style={{ background: "#FAF0EB", color: "#B25F46", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>{t}</span>
                    ))}
                    {matchProfile.vaccinated && <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>Vacciné·e ✓</span>}
                  </div>
                  {matchProfile.bio && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>À PROPOS</div>
                      <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 14 }}>{matchProfile.bio}</div>
                    </>
                  )}
                  {(matchProfile.seeking || []).length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>RECHERCHE</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {matchProfile.seeking.map(s => (
                          <span key={s} style={{ background: "#F3F4F6", color: "#4B5563", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>{s}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
const ALL_TEMPER = ["Joueur", "Affectueux", "Curieux", "Câlin", "Calme", "Énergique", "Indépendant", "Sociable", "Timide", "Gourmand"];
const ALL_SEEKING = [
  { id: "Play date",        icon: "🎾", label: "Play date",          desc: "Rencontre ponctuelle de jeu" },
  { id: "Compagnon de vie", icon: "🏠", label: "Compagnon de vie",   desc: "Un ami pour la maison, au quotidien" },
  { id: "Balade",           icon: "🦮", label: "Balade",             desc: "Partenaire de sortie régulier" },
  { id: "Dog date",         icon: "🐕", label: "Dog date",           desc: "Sortie sociale détendue entre chiens" },
  { id: "Cat date",         icon: "🐱", label: "Cat date",           desc: "Rencontre tranquille entre chats" },
  { id: "Reproduction",     icon: "🌱", label: "Reproduction",       desc: "Saillie sérieuse et vérifiée" },
];

const INIT_PET = {
  name: "Caramel", breed: "Européen", age: "4 ans", gender: "M", energy: 3,
  vaccinated: true, sterilized: false,
  temper: ["Joueur", "Affectueux", "Curieux"],
  seeking: ["Play date", "Compagnon de vie"],
  bio: "Caramel est un chat doux et curieux qui adore explorer et se faire câliner après ses aventures.",
  photos: [], video: null,
  photoCaptions: [], showMainCaption: true,
  repro: {
    active: false, price: "", priceNegotiable: false,
    availableFrom: "", availableTo: "",
    pedigree: false, geneticTest: false,
    reproDesc: "", docs: []
  }
};

// ── À PROPOS / AIDE ──────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Comment fonctionne le matching sur Miloute ?", a: "Vous créez le profil de votre animal (race, caractère, ce qu'il recherche), puis vous parcourez les profils d'autres animaux à proximité. Si vous likez un profil et que son propriétaire vous like en retour, c'est un match ! Vous pouvez alors échanger des messages pour organiser une rencontre." },
  { q: "L'application est-elle gratuite ?", a: "Oui, l'essentiel de Miloute est gratuit : créer un profil, swiper, matcher, discuter. L'abonnement Premium (4,99€/mois ou 39,99€/an) débloque des fonctionnalités de confort comme voir qui craque pour votre animal, un rayon de recherche illimité, une Boîte à Souvenirs pour retrouver tous les cadeaux reçus, des articles exclusifs de la Boutique, et des statistiques avancées." },
  { q: "Comment personnaliser les photos de mon animal ?", a: "En créant ou modifiant le profil de votre animal, vous pouvez ajouter une petite phrase d'accroche sous chaque photo — à partir de suggestions ou librement écrite, avec une aide à la génération si vous manquez d'inspiration. La phrase sur la photo principale est visible dans Découvrir ; les autres apparaissent sous les photos secondaires du profil." },
  { q: "Comment savoir si un match est en ligne ?", a: "Un point vert « En ligne » s'affiche à côté du nom dans une conversation, ou sur une fiche dans Découvrir, lorsque la personne a utilisé l'application dans les deux dernières minutes. Cet indicateur se met à jour automatiquement." },
  { q: "Comment fonctionne le module Reproduction ?", a: "C'est un espace dédié aux éleveurs et particuliers souhaitant faire reproduire leur animal. Chaque profil reproducteur peut afficher pedigree, bilan génétique et documents sanitaires. La mise en relation est réservée aux membres Premium ; le prix de la saillie se négocie ensuite directement entre les deux propriétaires, en dehors de l'application." },
  { q: "Comment fonctionne l'annuaire de prestataires et les réservations ?", a: "L'onglet Prestataires réunit toiletteurs, pet-sitters, éducateurs, pensions, vétérinaires et boutiques près de chez vous, notés par la communauté. Si un prestataire propose une réservation en ligne, le paiement est sécurisé par carte et retenu par Miloute jusqu'à ce que le client et le prestataire confirment tous les deux que la prestation s'est bien passée — les fonds sont alors reversés au prestataire, moins une commission (15% en temps normal ; des offres de lancement peuvent temporairement la réduire, le taux affiché dans votre profil prestataire fait foi)." },
  { q: "Comment devenir prestataire sur Miloute ?", a: "Depuis votre profil, choisissez « Devenir prestataire », renseignez le nom de votre activité et votre catégorie, puis configurez vos prestations et vos coordonnées de paiement. Une fois validé, votre fiche apparaît automatiquement dans l'annuaire de votre zone. Les tout premiers prestataires inscrits reçoivent un badge « Membre fondateur », mis en avant dans les résultats." },
  { q: "À quoi servent les friandises et cadeaux, et la Boutique Miloute ?", a: "Vous pouvez offrir une friandise ou un cadeau à un animal qui vous plaît, dans Découvrir ou dans une conversation — un vrai geste qui se remarque, un peu comme un super like. Chaque article de la Boutique a un prix réel en euros, sans monnaie virtuelle intermédiaire. Certains sont aussi à gagner gratuitement en accomplissant des étapes de votre parcours (profil complet, premier match...), et certains articles exclusifs sont réservés aux membres Premium." },
  { q: "Mes données sont-elles partagées avec d'autres utilisateurs ?", a: "Seules les informations que vous choisissez de rendre publiques (profil de votre animal, photos, distance approximative) sont visibles par les autres utilisateurs. Votre position exacte, votre email et vos données de paiement ne sont jamais partagés. Voir notre politique de confidentialité pour plus de détails." },
  { q: "Comment supprimer mon compte ?", a: "Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment en nous contactant à l'adresse indiquée dans la section Contact. Nous traitons les demandes sous 30 jours maximum, conformément au RGPD." },
  { q: "L'app est-elle disponible partout en France ?", a: "Miloute est lancée en priorité à Paris et en Île-de-France pour garantir une bonne densité d'utilisateurs. L'application reste accessible partout, mais le nombre de profils peut être plus limité en dehors de cette zone pour le moment." },
  { q: "Comment fonctionne la géolocalisation ?", a: "Vous pouvez activer le partage de votre position dès l'inscription, ou plus tard depuis votre Profil (ainsi que depuis Prestataires et la recherche avancée en Reproduction) pour affiner les résultats selon votre distance réelle. Seule une distance approximative est visible par les autres utilisateurs — jamais votre adresse exacte. Vous pouvez désactiver le partage à tout moment, à l'endroit même où vous l'avez activé." },
];

function AboutScreen({ onBack }) {
  const [page, setPage] = useState("menu"); // menu | why | faq | privacy | terms | contact
  const [openFaq, setOpenFaq] = useState(null);

  const PAGES = {
    why: { title: "Pourquoi Miloute ?", icon: "💛" },
    faq: { title: "Questions fréquentes", icon: "❓" },
    privacy: { title: "Politique de confidentialité", icon: "🔒" },
    terms: { title: "Conditions Générales d'Utilisation", icon: "📄" },
    contact: { title: "Nous contacter", icon: "✉️" },
  };

  if (page !== "menu") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <button onClick={() => setPage("menu")} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200" }}>{PAGES[page].icon} {PAGES[page].title}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>

          {page === "why" && (
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
              <p style={{ marginBottom: 16 }}>Nos animaux occupent une place immense dans notre vie quotidienne, mais on leur offre rarement l'occasion de vivre la leur — rencontrer d'autres animaux, jouer, se balader avec un copain, ou simplement exister socialement au-delà des murs de la maison.</p>
              <p style={{ marginBottom: 16 }}><strong>Miloute</strong> est née de cette idée simple : et si trouver un compagnon de jeu, une amitié canine ou féline, ou un partenaire de reproduction sérieux pouvait être aussi simple que quelques gestes sur un téléphone ?</p>
              <p style={{ marginBottom: 16 }}>Que vous cherchiez une rencontre ponctuelle pour votre chat curieux, un partenaire de balade fiable pour votre chien plein d'énergie, ou un éleveur vérifié pour une saillie sérieuse, Miloute a été pensée pour répondre à des besoins réels de propriétaires d'animaux, avec un vrai souci de sécurité et de transparence.</p>
              <p>Nous lançons l'application à Paris en priorité, avec l'ambition de créer une vraie communauté locale avant de grandir. Merci de faire partie des premiers à nous faire confiance. 🐾</p>
            </div>
          )}

          {page === "faq" && (
            <div>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} style={{ marginBottom: 10, borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: openFaq === i ? "#FAF0EB" : "#fff", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2D1200", paddingRight: 10 }}>{item.q}</span>
                    <span style={{ fontSize: 14, color: "#8B3D28", flexShrink: 0, transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: "0 16px 16px", fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {page === "privacy" && (
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 20 }}>Dernière mise à jour : juin 2026</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>1. Qui sommes-nous ?</h3>
              <p style={{ marginBottom: 12 }}>Miloute est une application de mise en relation entre propriétaires d'animaux, éditée par une entreprise basée en France. Pour toute question relative à vos données, contactez-nous via la section Contact.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>2. Données collectées</h3>
              <p style={{ marginBottom: 12 }}>Nous collectons : votre nom, votre email, les informations du profil de votre animal (race, âge, photos, caractère), votre position géographique approximative si vous l'activez, votre dernière activité dans l'application (pour afficher un statut « en ligne » aux autres utilisateurs), et les données de paiement (traitées exclusivement par Stripe, jamais stockées par nos soins).</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>3. Finalité du traitement</h3>
              <p style={{ marginBottom: 12 }}>Ces données servent uniquement à : permettre le matching entre profils, afficher les distances approximatives, gérer votre abonnement Premium, et vous contacter en cas de besoin lié à votre compte.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>4. Base légale</h3>
              <p style={{ marginBottom: 12 }}>Le traitement de vos données repose sur votre consentement (création de compte, activation de la géolocalisation) et sur l'exécution du contrat qui nous lie (fourniture du service Miloute).</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>5. Partage des données</h3>
              <p style={{ marginBottom: 12 }}>Vos données ne sont jamais vendues à des tiers. Seules les informations que vous rendez publiques sur votre profil sont visibles par les autres utilisateurs. Les paiements sont traités par Stripe, soumis à sa propre politique de confidentialité. Certains contenus (messages, commentaires, photos, phrases d'accroche générées par IA) sont transmis à Anthropic, notre prestataire de modération automatique et de génération de texte, uniquement pour le traitement demandé, sans conservation par leurs soins au-delà de ce traitement.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>6. Durée de conservation</h3>
              <p style={{ marginBottom: 12 }}>Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, elles sont effacées sous 30 jours, sauf obligation légale de conservation plus longue.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>7. Vos droits</h3>
              <p style={{ marginBottom: 12 }}>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition concernant vos données. Pour exercer ces droits, contactez-nous via la section Contact de l'application.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>8. Cookies et stockage local</h3>
              <p style={{ marginBottom: 12 }}>L'application utilise le stockage local de votre navigateur pour mémoriser votre session et vos préférences, sans recourir à des cookies publicitaires tiers.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>9. Sécurité</h3>
              <p style={{ marginBottom: 12 }}>Nous mettons en œuvre des mesures techniques raisonnables pour protéger vos données. Aucun système n'étant infaillible, nous vous invitons à utiliser un mot de passe robuste et à nous signaler toute activité suspecte.</p>

              <p style={{ marginTop: 24, padding: 14, background: "#FFF9E6", borderRadius: 12, fontSize: 12, color: "#854D0E" }}>
                ⚠️ Ce document est une version préliminaire en cours de rédaction. Il sera révisé par un professionnel du droit avant le lancement public de l'application.
              </p>
            </div>
          )}

          {page === "terms" && (
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 20 }}>Dernière mise à jour : juin 2026</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>1. Objet</h3>
              <p style={{ marginBottom: 12 }}>Les présentes CGU régissent l'utilisation de l'application Miloute, plateforme de mise en relation entre propriétaires d'animaux de compagnie à des fins sociales ou de reproduction.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>2. Inscription</h3>
              <p style={{ marginBottom: 12 }}>L'utilisation de Miloute nécessite la création d'un compte. Vous garantissez l'exactitude des informations fournies, tant sur votre identité que sur le profil de votre animal.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>3. Rôle de la plateforme</h3>
              <p style={{ marginBottom: 12 }}>Miloute agit uniquement en tant qu'intermédiaire de mise en relation. Nous ne sommes pas responsables des interactions, rencontres ou transactions entre utilisateurs, y compris dans le cadre du module Reproduction. Chaque utilisateur reste seul responsable des accords qu'il conclut avec un autre utilisateur.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>4. Obligations de l'utilisateur</h3>
              <p style={{ marginBottom: 12 }}>Vous vous engagez à : fournir des informations exactes, ne publier aucun contenu illicite, trompeur ou portant atteinte aux droits d'autrui, et respecter la réglementation applicable en matière de reproduction animale (notamment l'obligation de déclaration d'activité pour les éleveurs réalisant plusieurs portées par an).</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>5. Abonnement Premium</h3>
              <p style={{ marginBottom: 12 }}>L'abonnement Premium est facturé mensuellement ou annuellement via Stripe. Il est résiliable à tout moment ; la résiliation prend effet à la fin de la période en cours, sans remboursement au prorata.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>6. Paiements et commissions</h3>
              <p style={{ marginBottom: 12 }}>Trois types de paiements existent sur Miloute, tous traités de façon sécurisée par Stripe : l'abonnement Premium ; les réservations de prestations via l'annuaire Prestataires, dont les fonds sont retenus jusqu'à confirmation des deux parties puis reversés au prestataire moins une commission perçue par Miloute (15% en temps normal ; ce taux peut être temporairement réduit dans le cadre d'offres de lancement, le taux affiché au moment de la réservation faisant foi) ; et les achats de la Boutique (friandises, cadeaux, accessoires), facturés à l'unité en euros, sans monnaie virtuelle intermédiaire. Le montant d'une éventuelle saillie, dans le cadre du module Reproduction, reste en revanche négocié et réglé directement entre les utilisateurs concernés, en dehors de l'application ; Miloute ne perçoit aucune commission sur ces transactions et n'y intervient pas.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>7. Modération et suspension</h3>
              <p style={{ marginBottom: 12 }}>Nous nous réservons le droit de suspendre ou supprimer tout compte ne respectant pas les présentes CGU, sans préavis en cas de manquement grave.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>8. Responsabilité</h3>
              <p style={{ marginBottom: 12 }}>Miloute ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation de l'application, des rencontres organisées entre utilisateurs, ou de l'état de santé des animaux mis en relation.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>9. Modification des CGU</h3>
              <p style={{ marginBottom: 12 }}>Ces CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute modification substantielle.</p>

              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#2D1200", marginTop: 20, marginBottom: 8 }}>10. Droit applicable</h3>
              <p style={{ marginBottom: 12 }}>Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des tribunaux français.</p>

              <p style={{ marginTop: 24, padding: 14, background: "#FFF9E6", borderRadius: 12, fontSize: 12, color: "#854D0E" }}>
                ⚠️ Ce document est une version préliminaire en cours de rédaction. Il sera révisé par un professionnel du droit avant le lancement public de l'application.
              </p>
            </div>
          )}

          {page === "contact" && (
            <div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 24 }}>
                Une question, un problème technique, ou besoin d'exercer vos droits sur vos données ? Nous sommes là pour vous aider.
              </p>
              <div style={{ background: "#FAF0EB", borderRadius: 16, padding: 18, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>✉️</span>
                <div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>contact@miloute.app</div>
                </div>
              </div>
              <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>⏱️</span>
                <div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>DÉLAI DE RÉPONSE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>Sous 48h en moyenne</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200" }}>ℹ️ À propos & Aide</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {Object.entries(PAGES).map(([key, { title, icon }]) => (
          <button key={key} onClick={() => setPage(key)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 16, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", marginBottom: 10, textAlign: "left" }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{title}</span>
            <span style={{ fontSize: 14, color: "#9CA3AF" }}>→</span>
          </button>
        ))}
        <div style={{ textAlign: "center", fontSize: 11, color: "#C9B5A8", marginTop: 24 }}>Miloute · Version 1.0</div>
      </div>
    </div>
  );
}

function ProfileScreen({ onPremium = () => {}, isPremium = false, initialData = null, onProfileUpdated = () => {}, onLogout = () => {}, onTreatsSeen = () => {}, onLikesSeen = () => {}, onNav = () => {}, autoOpenProviderScreen = false, onProviderScreenOpened = () => {}, autoOpenShop = false, onShopOpened = () => {} }) {
  const [pet, setPet] = useState(() => (initialData ? { ...INIT_PET, ...initialData } : INIT_PET));
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationErrorProfile, setLocationErrorProfile] = useState(null);

  function shareLocationProfile() {
    if (!navigator.geolocation) { setLocationErrorProfile("La géolocalisation n'est pas supportée par ce navigateur."); return; }
    setSharingLocation(true);
    setLocationErrorProfile(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude, lng = position.coords.longitude;
        if (initialData?.id) await updateProfileLocation(initialData.id, lat, lng);
        onProfileUpdated({ ...initialData, location: { lat, lng } });
        setSharingLocation(false);
      },
      (error) => {
        setLocationErrorProfile(error.code === error.PERMISSION_DENIED
          ? "Position refusée — activez-la dans les paramètres de votre navigateur."
          : "Impossible de récupérer votre position.");
        setSharingLocation(false);
      }
    );
  }

  async function disableLocationProfile() {
    setLocationErrorProfile(null);
    if (initialData?.id) await clearProfileLocation(initialData.id);
    onProfileUpdated({ ...initialData, location: null });
  }
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet);
  const [saved, setSaved] = useState(false);
  const [editTab, setEditTab] = useState("profil"); // "profil" | "repro"
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedLike, setSelectedLike] = useState(null);
  const [selectedLikeProfile, setSelectedLikeProfile] = useState(null);
  const [loadingSelectedLikeProfile, setLoadingSelectedLikeProfile] = useState(false);
  const [likesReceived, setLikesReceived] = useState([]);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    if (!initialData) return;
    fetchMatchesForUser(initialData).then(list => setMatchesCount(list.length));
  }, [initialData?.id]);
  const [decliningLikeId, setDecliningLikeId] = useState(null);

  const [selectedLikeTreats, setSelectedLikeTreats] = useState([]);
  const [selectedLikePhotoIdx, setSelectedLikePhotoIdx] = useState(0);
  const [likingBackId, setLikingBackId] = useState(null);
  const [justMatchedWith, setJustMatchedWith] = useState(null);

  useEffect(() => {
    setSelectedLikePhotoIdx(0);
    if (!selectedLike) { setSelectedLikeProfile(null); setSelectedLikeTreats([]); return; }
    if (selectedLike.isDemo) {
      setSelectedLikeProfile(PROFILES.find(p => p.name === selectedLike.name) || REPRO_PROFILES.find(p => p.name === selectedLike.name) || null);
      setSelectedLikeTreats([]);
      return;
    }
    let active = true;
    setLoadingSelectedLikeProfile(true);
    Promise.all([
      fetchProfileForUser(selectedLike.userId),
      fetchTreatsFromSender(initialData, selectedLike.profileId),
    ]).then(([profile, treats]) => {
      if (active) { setSelectedLikeProfile(profile); setSelectedLikeTreats(treats); setLoadingSelectedLikeProfile(false); }
    });
    return () => { active = false; };
  }, [selectedLike]);

  async function handleDeclineLike(like) {
    setDecliningLikeId(like.profileId);
    try {
      await declineLike(initialData, like);
      setLikesReceived(l => l.filter(x => x.profileId !== like.profileId));
      if (selectedLike?.profileId === like.profileId) setSelectedLike(null);
    } catch (err) {
      console.error("declineLike error:", err);
    }
    setDecliningLikeId(null);
  }

  async function handleLikeBack(like) {
    setLikingBackId(like.profileId);
    try {
      const questResult = await likeBackAndMatch(initialData, like);
      if (questResult) onProfileUpdated({ ...initialData, giftInventory: questResult.giftInventory, questsCompleted: questResult.questsCompleted });
      setLikesReceived(l => l.filter(x => x.profileId !== like.profileId));
      setMatchesCount(c => c + 1);
      setSelectedLike(null);
      setJustMatchedWith(like);
      playMatchFeedback(loadSoundMode(), loadSoundPalette(), initialData?.species);
    } catch (err) {
      console.error("likeBackAndMatch error:", err);
    }
    setLikingBackId(null);
  }

  const [loadingLikes, setLoadingLikes] = useState(true);
  const [showProviderScreen, setShowProviderScreen] = useState(false);

  useEffect(() => {
    if (autoOpenProviderScreen) {
      setShowProviderScreen(true);
      onProviderScreenOpened();
    }
  }, [autoOpenProviderScreen]);

  useEffect(() => {
    if (autoOpenShop) {
      setShowShopModal(true);
      onShopOpened();
    }
  }, [autoOpenShop]);

  const [questToast, setQuestToast] = useState(null);
  async function tryClaimQuest(questId) {
    if (initialData?.questsCompleted?.[questId]) return;
    const result = await claimQuest(initialData, questId);
    if (result.claimed) {
      onProfileUpdated({ ...initialData, giftInventory: result.giftInventory, questsCompleted: result.questsCompleted });
      const rewardInfo = GIFT_CATALOG.find(g => g.id === result.rewardItemId);
      setQuestToast(rewardInfo ? `🎉 Quête accomplie ! +1 ${rewardInfo.label} ${rewardInfo.emoji}` : "🎉 Quête accomplie !");
      setTimeout(() => setQuestToast(null), 3500);
    }
  }
  useEffect(() => {
    const completeness = (pet.photos.length > 0 ? 25 : 0) + (pet.video ? 20 : 0) + (pet.bio ? 20 : 0) + (pet.temper.length > 0 ? 15 : 0) + (pet.vaccinated ? 10 : 0) + (pet.repro.active && pet.repro.price ? 10 : 0);
    if (completeness >= 100) tryClaimQuest("profile_complete");
    if (pet.video) tryClaimQuest("first_video");
  }, [pet.photos.length, pet.video, pet.bio, pet.temper.length, pet.vaccinated, pet.repro.active, pet.repro.price]);
  const [providerServices, setProviderServices] = useState([]);
  const [commissionRate, setCommissionRate] = useState(15);
  const [commissionPromoUntil, setCommissionPromoUntil] = useState(null);
  const [connectOnboarded, setConnectOnboarded] = useState(false);
  const [checkingConnect, setCheckingConnect] = useState(false);
  const [startingOnboarding, setStartingOnboarding] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState(null);
  const [shopError, setShopError] = useState(null);

  const [selfSpotId, setSelfSpotId] = useState(null);
  const [loadingSelfSpot, setLoadingSelfSpot] = useState(true);
  const [spotPhotos, setSpotPhotos] = useState([]);
  const [uploadingSpotPhoto, setUploadingSpotPhoto] = useState(false);
  const [spotPhotoError, setSpotPhotoError] = useState(null);
  const spotPhotoRef = useRef(null);

  const [newSpotName, setNewSpotName] = useState("");
  const [newSpotCategory, setNewSpotCategory] = useState("petsitter");
  const [creatingSpot, setCreatingSpot] = useState(false);
  const [createSpotError, setCreateSpotError] = useState(null);
  const [pendingClaim, setPendingClaim] = useState(null);
  const [similarSpots, setSimilarSpots] = useState(null); // null = pas encore cherché, [] = cherché et rien trouvé
  const [searchingSimilar, setSearchingSimilar] = useState(false);
  const [claimingSpotId, setClaimingSpotId] = useState(null);

  const [selfSpotInfo, setSelfSpotInfo] = useState(null);
  const [showEditSpot, setShowEditSpot] = useState(false);
  const [editSpotName, setEditSpotName] = useState("");
  const [editSpotCategory, setEditSpotCategory] = useState("petsitter");
  const [editSpotDescription, setEditSpotDescription] = useState("");
  const [savingSpotEdit, setSavingSpotEdit] = useState(false);
  const [editSpotError, setEditSpotError] = useState(null);
  const [confirmDeleteSpot, setConfirmDeleteSpot] = useState(false);
  const [deletingSpot, setDeletingSpot] = useState(false);
  const [deleteSpotError, setDeleteSpotError] = useState(null);

  function openEditSpot() {
    setEditSpotName(selfSpotInfo?.name || "");
    setEditSpotCategory(selfSpotInfo?.type || "petsitter");
    setEditSpotDescription(selfSpotInfo?.description || "");
    setEditSpotError(null);
    setShowEditSpot(true);
  }

  async function saveSpotEdit() {
    if (!editSpotName.trim()) { setEditSpotError("Le nom de votre activité est requis."); return; }
    setEditSpotError(null);
    setSavingSpotEdit(true);
    try {
      await updateSpotInfo(selfSpotId, { name: editSpotName.trim(), type: editSpotCategory, description: editSpotDescription.trim() });
      setSelfSpotInfo({ name: editSpotName.trim(), type: editSpotCategory, description: editSpotDescription.trim() });
      setShowEditSpot(false);
    } catch {
      setEditSpotError("L'enregistrement a échoué, réessayez.");
    }
    setSavingSpotEdit(false);
  }

  async function handleDeleteSpot() {
    setDeleteSpotError(null);
    setDeletingSpot(true);
    try {
      const hasPending = await hasPendingBookingsAsProvider(initialData.userId);
      if (hasPending) {
        setDeleteSpotError("Impossible de supprimer : vous avez des réservations payées en attente de confirmation. Confirmez-les ou annulez-les d'abord.");
        setDeletingSpot(false);
        return;
      }
      await deleteProviderSpot(selfSpotId);
      setSelfSpotId(null);
      setSelfSpotInfo(null);
      setSpotPhotos([]);
      setProviderServices([]);
      setShowEditSpot(false);
      setConfirmDeleteSpot(false);
    } catch {
      setDeleteSpotError("La suppression a échoué, réessayez.");
    }
    setDeletingSpot(false);
  }

  async function searchForMySpot() {
    if (!newSpotName.trim()) { setCreateSpotError("Le nom de votre activité est requis."); return; }
    setCreateSpotError(null);
    setSearchingSimilar(true);
    const lat = initialData?.location?.lat ?? 48.8566;
    const lng = initialData?.location?.lng ?? 2.3522;
    const matches = await findSimilarSpots(newSpotName, newSpotCategory, lat, lng);
    setSimilarSpots(matches);
    setSearchingSimilar(false);
  }

  async function claimExistingSpot(spotId) {
    setClaimingSpotId(spotId);
    try {
      await requestSpotClaim(spotId, initialData.userId);
      const claim = await fetchPendingClaim(initialData.userId);
      setPendingClaim(claim);
    } catch {
      setCreateSpotError("La demande a échoué, réessayez.");
    }
    setClaimingSpotId(null);
  }

  async function createMySpot() {
    setCreateSpotError(null);
    setCreatingSpot(true);
    try {
      const spotId = await ensureProviderSpot(initialData, newSpotCategory, newSpotName.trim());
      setSelfSpotId(spotId);
      setSpotPhotos([]);
    } catch {
      setCreateSpotError("La création a échoué, réessayez.");
    }
    setCreatingSpot(false);
  }

  async function handleSpotPhotoAdd(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de resélectionner le même fichier ensuite
    if (!file || !selfSpotId) return;
    if (spotPhotos.length >= 6) { setSpotPhotoError("Maximum 6 photos."); return; }
    setSpotPhotoError(null);
    setUploadingSpotPhoto(true);
    try {
      const base64 = await fileToBase64(file);
      const modResult = await moderateImage(base64, file.type, "prestataire");
      if (!modResult.approved) {
        setSpotPhotoError(modResult.reason || "Cette photo ne respecte pas les règles de Miloute.");
        setUploadingSpotPhoto(false);
        return;
      }
      const url = await uploadPhotoToStorage(file, initialData.userId);
      const next = [...spotPhotos, { url, name: file.name }];
      await updateSpotPhotos(selfSpotId, next);
      setSpotPhotos(next);
    } catch (err) {
      console.error("handleSpotPhotoAdd error:", err);
      setSpotPhotoError("L'envoi a échoué, réessayez.");
    }
    setUploadingSpotPhoto(false);
  }

  async function removeSpotPhoto(index) {
    if (!selfSpotId) return;
    const next = spotPhotos.filter((_, i) => i !== index);
    setSpotPhotos(next);
    try { await updateSpotPhotos(selfSpotId, next); } catch (err) { console.error("removeSpotPhoto error:", err); }
  }

  async function buyItem(itemId, bundleId) {
    setBuyingItemId(bundleId || itemId);
    setShopError(null);
    try {
      await startShopCheckout({ itemId, bundleId }, initialData);
    } catch (err) {
      setShopError(err.message || "L'achat a échoué, réessayez.");
      setBuyingItemId(null);
    }
  }
  const [myBookingsAsClient, setMyBookingsAsClient] = useState([]);
  const [myBookingsAsProvider, setMyBookingsAsProvider] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState(null);
  const [bookingConfirmError, setBookingConfirmError] = useState(null);

  async function reloadBookings() {
    setLoadingBookings(true);
    const [asClient, asProvider] = await Promise.all([
      fetchMyBookingsAsClient(initialData),
      fetchMyBookingsAsProvider(initialData),
    ]);
    setMyBookingsAsClient(asClient);
    setMyBookingsAsProvider(asProvider);
    setLoadingBookings(false);
  }

  async function handleConfirmBooking(bookingId) {
    setConfirmingBookingId(bookingId);
    setBookingConfirmError(null);
    const result = await confirmBooking(bookingId, initialData.userId);
    if (result.error) {
      setBookingConfirmError(result.error);
    }
    await reloadBookings();
    setConfirmingBookingId(null);
  }

  async function handleCancelBooking() {
    if (!confirmCancelBooking) return;
    setCancellingBookingId(confirmCancelBooking);
    setBookingConfirmError(null);
    const result = await cancelBooking(confirmCancelBooking, initialData.userId);
    if (result.error) {
      setBookingConfirmError(result.error);
    }
    await reloadBookings();
    setCancellingBookingId(null);
    setConfirmCancelBooking(null);
  }

  useEffect(() => {
    if (!initialData?.id) return;
    fetchProviderServices(initialData.id).then(setProviderServices);
    fetchCommissionRate().then(({ rate, promoUntil }) => { setCommissionRate(rate); setCommissionPromoUntil(promoUntil); });
    setConnectOnboarded(!!initialData.stripeConnectOnboarded);
    fetchSelfProviderSpot(initialData.userId).then(spot => {
      setSelfSpotId(spot?.id || null);
      setSpotPhotos(spot?.photos || []);
      setSelfSpotInfo(spot ? { name: spot.name, type: spot.type, description: spot.description || "" } : null);
      setLoadingSelfSpot(false);
      if (!spot) fetchPendingClaim(initialData.userId).then(setPendingClaim);
    });
  }, [initialData?.id, initialData?.stripeConnectOnboarded]);

  // Au retour de l'onboarding Stripe Connect, revérifie le statut réel.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "return" && initialData?.id) {
      setCheckingConnect(true);
      checkConnectStatus(initialData.id).then(onboarded => {
        setConnectOnboarded(onboarded);
        setCheckingConnect(false);
        setShowProviderScreen(true);
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [initialData?.id]);

  useEffect(() => {
    let active = true;
    async function loadLikes() {
      setLoadingLikes(true);
      const [real, unseenCount] = await Promise.all([
        fetchLikesReceived(initialData),
        fetchUnseenLikesCount(initialData),
      ]);
      if (!active) return;
      setLikesReceived(real);
      setUnseenLikesCount(unseenCount);
      setLoadingLikes(false);
    }
    loadLikes();
    return () => { active = false; };
  }, [initialData?.id, initialData?.userId, initialData?.species]);
  const [unseenLikesCount, setUnseenLikesCount] = useState(0);

  function openLikesModal() {
    setShowLikesModal(true);
    if (unseenLikesCount > 0) {
      markLikesSeen(initialData).then(() => { setUnseenLikesCount(0); onLikesSeen(); });
    }
  }
  const [treatsReceived, setTreatsReceived] = useState([]);
  const [encounterPhotos, setEncounterPhotos] = useState([]);

  const [showAddEncounter, setShowAddEncounter] = useState(false);
  const [encounterStep, setEncounterStep] = useState(1);
  const [encounterFile, setEncounterFile] = useState(null);
  const [encounterPreview, setEncounterPreview] = useState(null);
  const [encounterMatches, setEncounterMatches] = useState([]);
  const [loadingEncounterMatches, setLoadingEncounterMatches] = useState(false);
  const [encounterSelectedMatch, setEncounterSelectedMatch] = useState(null);
  const [encounterCaption, setEncounterCaption] = useState("");
  const [encounterDate, setEncounterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [encounterLocation, setEncounterLocation] = useState("");
  const [encounterShare, setEncounterShare] = useState("private"); // "private" | "community"
  const [savingEncounter, setSavingEncounter] = useState(false);
  const [encounterError, setEncounterError] = useState(null);
  const [encounterSuccessMsg, setEncounterSuccessMsg] = useState(null);
  const encounterFileRef = useRef(null);
  const encounterCameraRef = useRef(null);

  function openAddEncounter() {
    setEncounterStep(1);
    setEncounterFile(null);
    setEncounterPreview(null);
    setEncounterSelectedMatch(null);
    setEncounterCaption("");
    setEncounterDate(new Date().toISOString().slice(0, 10));
    setEncounterLocation("");
    setEncounterShare("private");
    setEncounterError(null);
    setShowAddEncounter(true);
  }

  function handleEncounterFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEncounterFile(file);
    setEncounterPreview(URL.createObjectURL(file));
    setLoadingEncounterMatches(true);
    fetchMatchesForUser(initialData).then(matches => {
      setEncounterMatches(matches);
      setLoadingEncounterMatches(false);
    });
    setEncounterStep(2);
  }

  async function saveEncounterPhoto() {
    if (!encounterFile) return;
    setSavingEncounter(true);
    setEncounterError(null);
    try {
      const photoUrl = await uploadPhotoToStorage(encounterFile, initialData.userId);
      const created = await createEncounterPhoto(initialData, {
        photoUrl,
        matchId: encounterSelectedMatch?.id || null,
        otherProfileId: encounterSelectedMatch?.otherProfileId || null,
        caption: encounterCaption.trim() || null,
        encounterDate: encounterDate || null,
        location: encounterLocation.trim() || null,
        shareToCommunity: encounterShare === "community",
      });
      setEncounterPhotos(list => [{
        id: created.id, photo: photoUrl, caption: created.caption, encounterDate: created.encounter_date,
        location: created.location, otherName: encounterSelectedMatch?.name || null,
        sharedToCommunity: created.shared_to_community, createdAt: created.created_at,
      }, ...list]);
      const successText = encounterShare === "community"
        ? "Souvenir ajouté et partagé dans la Communauté"
        : `Souvenir ajouté à la Boîte de ${initialData.name}`;
      setEncounterSuccessMsg(successText);
      setTimeout(() => setEncounterSuccessMsg(null), 3000);
      setShowAddEncounter(false);
    } catch (err) {
      console.error("saveEncounterPhoto error:", err);
      setEncounterError("L'enregistrement a échoué. Réessayez.");
    }
    setSavingEncounter(false);
  }

  const [treatsFilterCategory, setTreatsFilterCategory] = useState("all");
  const [showGiftBrowser, setShowGiftBrowser] = useState(false);
  const [memoryViewMode, setMemoryViewMode] = useState("grid"); // "grid" | "timeline"
  const [confirmDeleteTreat, setConfirmDeleteTreat] = useState(null);
  const [deletingTreat, setDeletingTreat] = useState(false);
  const [confirmDeleteEncounter, setConfirmDeleteEncounter] = useState(null);
  const [deletingEncounter, setDeletingEncounter] = useState(false);
  const [editingNoteFor, setEditingNoteFor] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [showMagicBook, setShowMagicBook] = useState(false);
  const [bookPages, setBookPages] = useState([]);
  const [bookPageIndex, setBookPageIndex] = useState(0);
  const [bookTouchStartX, setBookTouchStartX] = useState(null);
  const [exportingBookPdf, setExportingBookPdf] = useState(false);
  const [bookExportProgress, setBookExportProgress] = useState(null);
  const [bookError, setBookError] = useState(null);

  const [bookCustom, setBookCustom] = useState({});
  const [showBookSettings, setShowBookSettings] = useState(false);
  const [bookOpening, setBookOpening] = useState(false);
  const [bookFlip, setBookFlip] = useState(null); // "next" | "prev" | null, pendant l'animation de tournage
  const [bookFlippingFrom, setBookFlippingFrom] = useState(null); // page affichée pendant le tournage (avant de basculer sur la nouvelle)
  const [bookPageSparkle, setBookPageSparkle] = useState(false);
  const [bookTitleDraft, setBookTitleDraft] = useState("");
  const [bookIntroDraft, setBookIntroDraft] = useState("");
  const [bookConclusionDraft, setBookConclusionDraft] = useState("");

  function rebuildBook(custom) {
    const pages = buildBookPages(pet, treatsReceived, encounterPhotos, custom);
    setBookPages(pages);
    setBookPageIndex(i => Math.min(i, pages.length - 1));
  }

  function openMagicBook() {
    const saved = loadBookCustomization(initialData.id);
    setBookCustom(saved);
    setBookTitleDraft(saved.title || "");
    setBookIntroDraft(saved.introText || "");
    setBookConclusionDraft(saved.conclusionText || "");
    setBookPageIndex(0);
    setBookPages(buildBookPages(pet, treatsReceived, encounterPhotos, saved));
    setShowMagicBook(true);
    setBookOpening(true);
    playGiftFeedback(loadSoundMode(), loadSoundPalette(), initialData?.species);
    setTimeout(() => setBookOpening(false), 900);
  }

  function applyBookCustomization(patch) {
    const next = { ...bookCustom, ...patch };
    setBookCustom(next);
    saveBookCustomization(initialData.id, next);
    rebuildBook(next);
  }

  function moveContentPage(pageId, direction) {
    const contentIds = buildAllContentItems(treatsReceived, encounterPhotos, bookCustom).map(item => item.id);
    const idx = contentIds.indexOf(pageId);
    const swapWith = idx + direction;
    if (idx === -1 || swapWith < 0 || swapWith >= contentIds.length) return;
    [contentIds[idx], contentIds[swapWith]] = [contentIds[swapWith], contentIds[idx]];
    applyBookCustomization({ order: contentIds });
  }

  function toggleHiddenPage(pageId) {
    const hidden = bookCustom.hiddenIds || [];
    const next = hidden.includes(pageId) ? hidden.filter(id => id !== pageId) : [...hidden, pageId];
    applyBookCustomization({ hiddenIds: next });
  }

  function bookNextPage() {
    if (bookFlip || bookPageIndex >= bookPages.length - 1) return;
    setBookFlippingFrom(bookPageIndex);
    setBookFlip("next");
    playPageTurnSound();
    setBookPageSparkle(true);
    setTimeout(() => setBookPageSparkle(false), 500);
    setTimeout(() => {
      setBookPageIndex(i => Math.min(i + 1, bookPages.length - 1));
      setBookFlip(null);
      setBookFlippingFrom(null);
    }, 420);
  }
  function bookPrevPage() {
    if (bookFlip || bookPageIndex <= 0) return;
    setBookFlippingFrom(bookPageIndex);
    setBookFlip("prev");
    playPageTurnSound();
    setBookPageSparkle(true);
    setTimeout(() => setBookPageSparkle(false), 500);
    setTimeout(() => {
      setBookPageIndex(i => Math.max(i - 1, 0));
      setBookFlip(null);
      setBookFlippingFrom(null);
    }, 420);
  }

  async function handleExportBookPdf() {
    setExportingBookPdf(true);
    setBookError(null);
    setBookExportProgress({ done: 0, total: bookPages.length });
    try {
      await exportBookToPdf(bookPages, (done, total) => setBookExportProgress({ done, total }), BOOK_THEMES[bookCustom.theme] || BOOK_THEMES.miloute);
    } catch (err) {
      console.error("exportBookToPdf error:", err);
      setBookError("L'export a échoué. Vérifiez que la bibliothèque jsPDF est bien installée (npm install jspdf).");
    }
    setExportingBookPdf(false);
    setBookExportProgress(null);
  }

  function openNoteEditor(treat) {
    setEditingNoteFor(treat);
    setNoteDraft(treat.ownerNote || "");
  }

  async function saveNote() {
    if (!editingNoteFor) return;
    setSavingNote(true);
    try {
      await updateTreatNote(editingNoteFor.id, noteDraft.trim());
      setTreatsReceived(list => list.map(t => t.id === editingNoteFor.id ? { ...t, ownerNote: noteDraft.trim() || null } : t));
      setEditingNoteFor(null);
    } catch (err) {
      console.error("saveNote error:", err);
    }
    setSavingNote(false);
  }

  async function handleDeleteEncounter() {
    if (!confirmDeleteEncounter) return;
    setDeletingEncounter(true);
    try {
      await deleteEncounterPhoto(confirmDeleteEncounter.id);
      setEncounterPhotos(list => list.filter(e => e.id !== confirmDeleteEncounter.id));
    } catch (err) {
      console.error("deleteEncounterPhoto error:", err);
    }
    setDeletingEncounter(false);
    setConfirmDeleteEncounter(null);
  }

  async function handleDeleteTreat() {
    if (!confirmDeleteTreat) return;
    setDeletingTreat(true);
    try {
      await deleteTreatMemory(confirmDeleteTreat.id);
      setTreatsReceived(list => list.filter(t => t.id !== confirmDeleteTreat.id));
    } catch (err) {
      console.error("deleteTreatMemory error:", err);
    }
    setDeletingTreat(false);
    setConfirmDeleteTreat(null);
  }
  const [unseenTreatsCount, setUnseenTreatsCount] = useState(0);
  const [showTreatsModal, setShowTreatsModal] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadTreats() {
      const [list, count] = await Promise.all([
        fetchReceivedTreats(initialData),
        fetchUnseenTreatsCount(initialData),
      ]);
      if (active) { setTreatsReceived(list); setUnseenTreatsCount(count); }
    }
    if (initialData?.userId) loadTreats();
    return () => { active = false; };
  }, [initialData?.userId]);

  function openTreatsModal() {
    setShowTreatsModal(true);
    setShowGiftBrowser(false);
    fetchEncounterPhotos(initialData).then(setEncounterPhotos);
  }

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournal, setLoadingJournal] = useState(false);

  function openJournal() {
    setShowJournalModal(true);
    setLoadingJournal(true);
    fetchJournalEntries(initialData).then(entries => {
      setJournalEntries(entries);
      setLoadingJournal(false);
    });
  }

  const [advancedStats, setAdvancedStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  useEffect(() => {
    if (!isPremium || !initialData?.id) { setLoadingStats(false); return; }
    setLoadingStats(true);
    fetchAdvancedStats(initialData).then(stats => {
      setAdvancedStats(stats);
      setLoadingStats(false);
    });
  }, [isPremium, initialData?.id]);
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const docRef = useRef(null);

  function openEdit() { setDraft({ ...pet, photoCaptions: pet.photoCaptions || [], showMainCaption: pet.showMainCaption !== false, repro: { ...pet.repro } }); setEditing(true); setEditTab("profil"); }

  const [captionEditorIndex, setCaptionEditorIndex] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [savingCaption, setSavingCaption] = useState(false);
  const [captionError, setCaptionError] = useState(null);

  function openCaptionEditor(i) {
    setCaptionDraft(draft.photoCaptions?.[i] || "");
    setCaptionError(null);
    setCaptionEditorIndex(i);
  }

  async function saveCaptionDraft() {
    const trimmed = captionDraft.trim().slice(0, PHOTO_CAPTION_MAX_LENGTH);
    if (!trimmed) {
      setDraft(d => {
        const next = [...(d.photoCaptions || [])];
        next[captionEditorIndex] = "";
        return { ...d, photoCaptions: next };
      });
      setCaptionEditorIndex(null);
      return;
    }
    setSavingCaption(true);
    setCaptionError(null);
    const { approved, reason } = await moderateText(trimmed);
    setSavingCaption(false);
    if (!approved) {
      setCaptionError(reason || "Cette phrase n'est pas autorisée, essayez une autre formulation.");
      return;
    }
    setDraft(d => {
      const next = [...(d.photoCaptions || [])];
      next[captionEditorIndex] = trimmed;
      return { ...d, photoCaptions: next };
    });
    setCaptionEditorIndex(null);
  }

  async function generateCaptionForDraft() {
    setGeneratingCaption(true);
    const caption = await generatePhotoCaption(draft.species || pet.species, draft.breed, draft.temper, draft.name);
    if (caption) setCaptionDraft(caption);
    setGeneratingCaption(false);
  }
  const [saveError, setSaveError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  async function save() {
    const updated = { ...draft, repro: { ...draft.repro } };

    if (!initialData?.id) {
      // Pas de compte associé (ne devrait pas arriver) — on garde l'ancien
      // comportement local uniquement, par sécurité.
      setPet(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setSaveError(null);
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      pet_name: updated.name,
      breed: updated.breed,
      age: updated.age,
      gender: updated.gender,
      energy: updated.energy,
      vaccinated: updated.vaccinated,
      sterilized: updated.sterilized,
      temper: updated.temper,
      seeking: updated.seeking,
      bio: updated.bio,
      photos: updated.photos,
      video: updated.video,
      repro: updated.repro,
      photo_captions: updated.photoCaptions || [],
      show_main_caption: updated.showMainCaption !== false,
    }).eq("id", initialData.id);
    setSavingProfile(false);

    if (error) {
      console.error("update profile error:", error);
      setSaveError("L'enregistrement a échoué (" + error.message + "). Réessayez.");
      return; // on reste en mode édition, rien n'est perdu, l'utilisateur peut réessayer
    }

    setPet(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onProfileUpdated({ ...initialData, ...updated, petName: updated.name });
  }
  function toggleTemper(t) { setDraft(d => ({ ...d, temper: d.temper.includes(t) ? d.temper.filter(x => x !== t) : d.temper.length < 4 ? [...d.temper, t] : d.temper })); }
  function toggleSeeking(s) { setDraft(d => ({ ...d, seeking: d.seeking.includes(s) ? d.seeking.filter(x => x !== s) : [...d.seeking, s] })); }
  function setRepro(k, v) { setDraft(d => ({ ...d, repro: { ...d.repro, [k]: v } })); }

  const [moderatingMedia, setModeratingMedia] = useState(false);
  const [mediaModerationError, setMediaModerationError] = useState(null);

  async function handlePhotoAdd(e) {
    const files = Array.from(e.target.files).slice(0, 6 - draft.photos.length);
    e.target.value = "";
    if (files.length === 0) return;
    setMediaModerationError(null);
    setModeratingMedia(true);
    const approved = [];
    for (const f of files) {
      try {
        const base64 = await fileToBase64(f);
        const result = await moderateImage(base64, f.type || "image/jpeg");
        if (result.approved) {
          try {
            const url = initialData?.userId ? await uploadPhotoToStorage(f, initialData.userId) : URL.createObjectURL(f);
            approved.push({ url, name: f.name });
          } catch (uploadErr) {
            console.error("uploadPhotoToStorage error:", uploadErr);
            setMediaModerationError("Photo vérifiée, mais l'envoi a échoué. Réessayez.");
          }
        } else {
          setMediaModerationError(result.reason || "Photo refusée : seules les photos de chats et chiens, au contenu approprié, sont autorisées.");
        }
      } catch {
        setMediaModerationError("Impossible de vérifier cette photo, réessayez.");
      }
    }
    if (approved.length) setDraft(d => ({ ...d, photos: [...d.photos, ...approved] }));
    setModeratingMedia(false);
  }
  async function handleVideoAdd(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setMediaModerationError(null);
    setModeratingMedia(true);
    try {
      const base64 = await extractVideoFrameBase64(f);
      const result = await moderateImage(base64, "image/jpeg");
      if (result.approved) {
        const url = initialData?.userId ? await uploadPhotoToStorage(f, initialData.userId) : URL.createObjectURL(f);
        setDraft(d => ({ ...d, video: { url, name: f.name } }));
      } else {
        setMediaModerationError(result.reason || "Vidéo refusée : seules les vidéos de chats et chiens, au contenu approprié, sont autorisées.");
      }
    } catch {
      setMediaModerationError("Impossible de vérifier cette vidéo, réessayez.");
    }
    setModeratingMedia(false);
  }
  function handleDocAdd(e) {
    const files = Array.from(e.target.files);
    const toAdd = files.map(f => ({ name: f.name, type: f.type }));
    setRepro("docs", [...draft.repro.docs, ...toAdd]);
    e.target.value = "";
  }
  function removePhoto(i) { setDraft(d => ({ ...d, photos: d.photos.filter((_, j) => j !== i), photoCaptions: (d.photoCaptions || []).filter((_, j) => j !== i) })); }
  function removeDoc(i) { setRepro("docs", draft.repro.docs.filter((_, j) => j !== i)); }

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8, display: "block", marginTop: 4 };
  const photoSlots = [...draft.photos, ...Array(Math.max(0, 6 - draft.photos.length)).fill(null)];

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (editing) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F3F4F6", background: "#fff", flexShrink: 0 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", fontSize: 14, color: "#9CA3AF", cursor: "pointer", fontWeight: 600 }}>Annuler</button>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#2D1200" }}>Modifier le profil</span>
        <button onClick={save} disabled={savingProfile} style={{ background: savingProfile ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", border: "none", borderRadius: 10, color: savingProfile ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 14, padding: "6px 14px", cursor: savingProfile ? "default" : "pointer" }}>{savingProfile ? "..." : "Sauver"}</button>
      </div>

      {saveError && (
        <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", padding: "10px 16px", flexShrink: 0 }}>{saveError}</div>
      )}

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#F9FAFB", padding: "8px 16px", gap: 8, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        {[["profil","Profil"],["repro","🌱 Reproduction"]].map(([v,l]) => (
          <button key={v} onClick={() => setEditTab(v)} style={{ flex: 1, padding: "9px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: editTab === v ? "#fff" : "transparent", color: editTab === v ? "#8B3D28" : "#9CA3AF", boxShadow: editTab === v ? "0 1px 6px rgba(0,0,0,.08)" : "none", transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>

        {/* ══ TAB PROFIL ══ */}
        {editTab === "profil" && <>
          {/* Photos */}
          <label style={labelStyle}>PHOTOS ({draft.photos.length}/6)</label>
          {moderatingMedia && (
            <div style={{ fontSize: 12, color: "#B25F46", marginBottom: 8 }}>🔎 Vérification du contenu en cours...</div>
          )}
          {mediaModerationError && (
            <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>{mediaModerationError}</div>
          )}
          {/* Photo principale — agrandie et centrée */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div onClick={() => !photoSlots[0] && photoRef.current?.click()}
              style={{ width: 160, height: 160, borderRadius: 20, overflow: "hidden", position: "relative", background: photoSlots[0] ? "#000" : "#F3F4F6", border: photoSlots[0] ? "none" : "2px dashed #D1D5DB", cursor: photoSlots[0] ? "default" : "pointer" }}>
              {photoSlots[0] ? (
                <>
                  <img src={photoSlots[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 8, left: 8, background: "#B25F46", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 8 }}>PRINCIPALE</div>
                  <button onClick={e => { e.stopPropagation(); removePhoto(0); }} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                </>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <span style={{ fontSize: 32, color: "#E8B89F" }}>+</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textAlign: "center" }}>Photo principale</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {photoSlots.slice(1).map((p, idx) => {
              const i = idx + 1;
              return (
              <div key={i} onClick={() => !p && photoRef.current?.click()}
                style={{ aspectRatio: "1", borderRadius: 14, overflow: "hidden", position: "relative", background: p ? "#000" : "#F3F4F6", border: p ? "none" : "2px dashed #D1D5DB", cursor: p ? "default" : "pointer" }}>
                {p ? (
                  <>
                    <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button onClick={e => { e.stopPropagation(); removePhoto(i); }} style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 24, color: "#E8B89F" }}>+</span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
          <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoAdd} />
          {draft.photos.length < 6 && (
            <button onClick={() => photoRef.current?.click()} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "2px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 18 }}>📷 Ajouter des photos</button>
          )}

          {draft.photos.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>🏷️ PHRASES D'ACCROCHE (optionnel)</label>
              {draft.photos.map((p, i) => (
                <button key={i} onClick={() => openCaptionEditor(i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                    <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>Photo {i + 1}{i === 0 ? " (principale)" : ""}</div>
                    <div style={{ fontSize: 12.5, color: draft.photoCaptions?.[i] ? "#2D1200" : "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {draft.photoCaptions?.[i] || "+ Ajouter une phrase"}
                    </div>
                  </div>
                </button>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#4B5563", marginTop: 4, cursor: "pointer" }}>
                <input type="checkbox" checked={draft.showMainCaption !== false} onChange={e => setDraft(d => ({ ...d, showMainCaption: e.target.checked }))} />
                Afficher la phrase sur la photo principale dans Découvrir
              </label>
            </div>
          )}

          {/* Vidéo */}
          <label style={labelStyle}>VIDÉO DE PRÉSENTATION (optionnelle)</label>
          {draft.video ? (
            <div style={{ borderRadius: 14, overflow: "hidden", position: "relative", background: "#000", marginBottom: 8 }}>
              <video src={draft.video.url} controls style={{ width: "100%", maxHeight: 160, display: "block", objectFit: "cover" }} />
              <button onClick={() => setDraft(d => ({ ...d, video: null }))} style={{ position: "absolute", top: 7, right: 7, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.65)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => videoRef.current?.click()} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>🎬</span>
              <div style={{ textAlign: "left" }}><div>Ajouter une vidéo</div><div style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>30 sec max · augmente les matchs de 3×</div></div>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoAdd} />

          <div style={{ height: 1, background: "#F3F4F6", margin: "18px 0" }} />

          {/* Infos */}
          <label style={labelStyle}>NOM</label>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={{ ...inputStyle, marginBottom: 14 }} placeholder="Prénom de votre animal" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>RACE</label><BreedInput value={draft.breed} onChange={v => setDraft(d => ({ ...d, breed: v }))} species={draft.species} style={inputStyle} /></div>
            <div><label style={labelStyle}>ÂGE</label><input value={draft.age} onChange={e => setDraft(d => ({ ...d, age: e.target.value }))} style={inputStyle} placeholder="Ex: 3 ans" /></div>
          </div>

          <label style={labelStyle}>SEXE</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[["M","♂ Mâle"],["F","♀ Femelle"]].map(([v,l]) => (
              <button key={v} onClick={() => setDraft(d => ({ ...d, gender: v }))} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `2px solid ${draft.gender === v ? "#B25F46" : "#E5E7EB"}`, background: draft.gender === v ? "#FAF0EB" : "#F9FAFB", color: draft.gender === v ? "#B25F46" : "#6B7280", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          <label style={labelStyle}>NIVEAU D'ÉNERGIE</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setDraft(d => ({ ...d, energy: i }))} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `2px solid ${draft.energy >= i ? "#B25F46" : "#E5E7EB"}`, background: draft.energy >= i ? "#FAF0EB" : "#F9FAFB", fontSize: 14, cursor: "pointer", color: draft.energy >= i ? "#B25F46" : "#9CA3AF", fontWeight: 700 }}>{i}</button>
            ))}
          </div>

          <label style={labelStyle}>SANTÉ</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[["vaccinated","Vacciné·e ✓"],["sterilized","Stérilisé·e"]].map(([k,l]) => (
              <button key={k} onClick={() => setDraft(d => ({ ...d, [k]: !d[k] }))} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `2px solid ${draft[k] ? "#2E7D32" : "#E5E7EB"}`, background: draft[k] ? "#E8F5E9" : "#F9FAFB", color: draft[k] ? "#2E7D32" : "#9CA3AF", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          <label style={labelStyle}>CARACTÈRE (max 4)</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {ALL_TEMPER.map(t => (
              <button key={t} onClick={() => toggleTemper(t)} style={{ padding: "5px 12px", borderRadius: 20, border: `2px solid ${draft.temper.includes(t) ? "#8B3D28" : "#E5E7EB"}`, background: draft.temper.includes(t) ? "#FAF0EB" : "#F9FAFB", color: draft.temper.includes(t) ? "#8B3D28" : "#9CA3AF", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t}</button>
            ))}
          </div>

          <label style={labelStyle}>CHERCHE</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {ALL_SEEKING.filter(s => draft.species !== "cat" || !["Balade","Dog date"].includes(s.id))
              .filter(s => draft.species !== "dog" || !["Cat date"].includes(s.id))
              .map(s => (
              <button key={s.id} onClick={() => toggleSeeking(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `2px solid ${draft.seeking.includes(s.id) ? "#B25F46" : "#E5E7EB"}`, background: draft.seeking.includes(s.id) ? "#FAF0EB" : "#F9FAFB", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${draft.seeking.includes(s.id) ? "#B25F46" : "#D1D5DB"}`, background: draft.seeking.includes(s.id) ? "#B25F46" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {draft.seeking.includes(s.id) && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: draft.seeking.includes(s.id) ? "#B25F46" : "#2D1200" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <label style={labelStyle}>BIO</label>
          <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} style={{ ...inputStyle, minHeight: 90, resize: "none" }} placeholder="Décrivez votre animal..." />
        </>}

        {/* ══ TAB REPRODUCTION ══ */}
        {editTab === "repro" && <>
          {draft.sterilized ? (
            <div style={{ margin: "20px 0", padding: "20px", background: "#F9FAFB", borderRadius: 16, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✂️</div>
              <div style={{ fontWeight: 700, color: "#6B7280", fontSize: 15, marginBottom: 6 }}>Animal stérilisé</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>La section reproduction n'est disponible que pour les animaux non stérilisés. Modifiez le statut dans l'onglet Profil.</div>
            </div>
          ) : <>
            {/* Activer la reproduction */}
            <div style={{ background: draft.repro.active ? "linear-gradient(135deg,#E8F5E9,#F1F8E9)" : "#F9FAFB", borderRadius: 16, padding: "16px", marginBottom: 16, border: `2px solid ${draft.repro.active ? "#2E7D32" : "#E5E7EB"}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: draft.repro.active ? "#1B5E20" : "#2D1200" }}>🌱 Disponible pour reproduction</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>Votre animal apparaîtra dans la section Reproduction</div>
                </div>
                <button onClick={() => setRepro("active", !draft.repro.active)} style={{ width: 48, height: 26, borderRadius: 13, background: draft.repro.active ? "#2E7D32" : "#D1D5DB", border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: draft.repro.active ? 25 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
                </button>
              </div>
            </div>

            {draft.repro.active && <>
              {/* Prix */}
              <label style={labelStyle}>PRIX DE LA SAILLIE</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    value={draft.repro.priceNegotiable ? "" : draft.repro.price}
                    onChange={e => setRepro("price", e.target.value)}
                    disabled={draft.repro.priceNegotiable}
                    placeholder={draft.repro.priceNegotiable ? "À discuter" : "Ex: 500"}
                    style={{ ...inputStyle, paddingRight: 36, opacity: draft.repro.priceNegotiable ? 0.5 : 1 }}
                  />
                  {!draft.repro.priceNegotiable && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", fontWeight: 600 }}>€</span>}
                </div>
              </div>
              <button onClick={() => setRepro("priceNegotiable", !draft.repro.priceNegotiable)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "0 0 14px", fontSize: 13, color: draft.repro.priceNegotiable ? "#B25F46" : "#9CA3AF", fontWeight: 600 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${draft.repro.priceNegotiable ? "#B25F46" : "#D1D5DB"}`, background: draft.repro.priceNegotiable ? "#B25F46" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {draft.repro.priceNegotiable && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                </div>
                Prix à discuter
              </button>

              {/* Rappel : le prix de la saillie se négocie et se paie directement entre
                  propriétaires, en dehors de l'app — aucune activation de paiement requise ici. */}
              <div style={{ marginBottom: 16, padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2D1200", marginBottom: 4 }}>💬 Paiement hors app</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>Le montant de la saillie est à convenir directement avec l'autre propriétaire une fois le contact établi. Miloute ne gère aucun paiement pour cette étape.</div>
              </div>

              {/* Disponibilité */}
              <label style={labelStyle}>PÉRIODE DE DISPONIBILITÉ</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Du</div>
                  <input type="date" value={draft.repro.availableFrom} onChange={e => setRepro("availableFrom", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Au</div>
                  <input type="date" value={draft.repro.availableTo} onChange={e => setRepro("availableTo", e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Certifications */}
              <label style={labelStyle}>CERTIFICATIONS</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[["pedigree","📜 Pedigree officiel (LOOF / SCC)"],["geneticTest","🧬 Bilan génétique complet"]].map(([k,l]) => (
                  <button key={k} onClick={() => setRepro(k, !draft.repro[k])} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `2px solid ${draft.repro[k] ? "#8B3D28" : "#E5E7EB"}`, background: draft.repro[k] ? "#FAF0EB" : "#F9FAFB", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${draft.repro[k] ? "#8B3D28" : "#D1D5DB"}`, background: draft.repro[k] ? "#8B3D28" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {draft.repro[k] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: draft.repro[k] ? "#8B3D28" : "#6B7280" }}>{l}</span>
                  </button>
                ))}
              </div>

              {/* Documents */}
              <label style={labelStyle}>DOCUMENTS SANITAIRES</label>
              <div style={{ marginBottom: 10 }}>
                {draft.repro.docs.map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FAF0EB", borderRadius: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{doc.type?.includes("pdf") ? "📄" : "🖼️"}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#8B3D28", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                    <button onClick={() => removeDoc(i)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => docRef.current?.click()} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "2px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  📎 Ajouter un document (PDF, image)
                </button>
                <input ref={docRef} type="file" accept=".pdf,image/*" multiple style={{ display: "none" }} onChange={handleDocAdd} />
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Carnet de santé, résultats génétiques, certificat de pedigree...</div>
              </div>

              {/* Description reproduction */}
              <label style={labelStyle}>DESCRIPTION POUR LA REPRODUCTION</label>
              <textarea
                value={draft.repro.reproDesc}
                onChange={e => setRepro("reproDesc", e.target.value)}
                style={{ ...inputStyle, minHeight: 90, resize: "none" }}
                placeholder="Décrivez les conditions de la saillie, votre expérience d'éleveur, ce que vous recherchez chez le partenaire..."
              />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Cette description est distincte de la bio générale et visible uniquement dans la section Reproduction.</div>
            </>}
          </>}
        </>}
      </div>

      {/* Éditeur de phrase d'accroche pour une photo */}
      {captionEditorIndex !== null && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "flex-end" }} onClick={() => setCaptionEditorIndex(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", padding: "20px 20px 32px" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200", marginBottom: 14 }}>Phrase d'accroche — Photo {captionEditorIndex + 1}</div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {getPhotoCaptionPrompts(draft.species || pet.species).map(p => (
                <button key={p} onClick={() => setCaptionDraft(p + " ")}
                  style={{ padding: "7px 12px", borderRadius: 20, border: "1.5px solid #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>

            <textarea value={captionDraft} onChange={e => { setCaptionDraft(e.target.value.slice(0, PHOTO_CAPTION_MAX_LENGTH)); setCaptionError(null); }}
              placeholder="Écrivez votre propre phrase, ou complétez un des prompts ci-dessus…"
              style={{ ...inputStyle, minHeight: 80, resize: "none", lineHeight: 1.6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 6, marginBottom: 14 }}>
              <span>{countEmojis(captionDraft) > PHOTO_CAPTION_MAX_EMOJIS ? `Max ${PHOTO_CAPTION_MAX_EMOJIS} emojis` : ""}</span>
              <span>{captionDraft.length}/{PHOTO_CAPTION_MAX_LENGTH}</span>
            </div>

            {captionError && (
              <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>{captionError}</div>
            )}

            <button onClick={generateCaptionForDraft} disabled={generatingCaption}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: generatingCaption ? "default" : "pointer", marginBottom: 12 }}>
              ✨ {generatingCaption ? "Génération..." : "Générer une phrase avec l'IA"}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              {draft.photoCaptions?.[captionEditorIndex] && (
                <button onClick={() => { setCaptionDraft(""); saveCaptionDraft(); }} disabled={savingCaption}
                  style={{ padding: "14px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", color: "#9CA3AF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Retirer
                </button>
              )}
              <button onClick={saveCaptionDraft} disabled={savingCaption}
                style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: savingCaption ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: savingCaption ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 14, cursor: savingCaption ? "default" : "pointer" }}>
                {savingCaption ? "Vérification..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── VUE PROFIL ─────────────────────────────────────────────────────────────
  const mainPhoto = pet.photos[0];
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {saved && (
        <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#1B5E3B", color: "#fff", padding: "10px 20px", borderRadius: 20, fontWeight: 700, fontSize: 14, zIndex: 99, boxShadow: "0 4px 16px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>✅ Profil mis à jour !</div>
      )}

      {questToast && (
        <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#B25F46", color: "#fff", padding: "10px 20px", borderRadius: 20, fontWeight: 700, fontSize: 14, zIndex: 99, boxShadow: "0 4px 16px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>{questToast}</div>
      )}

      {/* Cover */}
      <div style={{ height: 180, background: mainPhoto ? "#000" : "linear-gradient(135deg,#8B3D28,#B25F46)", position: "relative", overflow: "hidden" }}>
        {mainPhoto && <img src={mainPhoto.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .85 }} />}
        {!mainPhoto && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={80} color="rgba(255,255,255,.6)" /></div>}
        <button onClick={openEdit} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.35)", border: "none", borderRadius: 10, color: "#fff", padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✏️ Modifier</button>
        {pet.video && <div style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>🎬 Vidéo disponible</div>}
        {pet.repro.active && <div style={{ position: "absolute", bottom: 10, right: 12, background: "#2E7D32", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>🌱 Disponible reproduction</div>}
      </div>

      {pet.photos.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto" }}>
          {pet.photos.slice(1).map((p, i) => (
            <div key={i} style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
          {pet.video && (
            <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative", background: "#000" }}>
              <video src={pet.video.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>▶️</div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "14px 20px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#2D1200" }}>{pet.name} <span style={{ fontSize: 16, color: "#6B7280", fontWeight: 400 }}>{formatAge(pet.age)} {pet.gender === "M" ? "♂" : "♀"}</span></div>
        <div style={{ fontSize: 14, color: "#8B3D28", fontWeight: 600, marginBottom: 8 }}>{pet.breed}</div>

        {/* Heartbeat de l'animal — un signal affectif doux, jamais pénalisant */}
        {(() => {
          const tier = getHeartbeatTier(initialData?.lastActiveAt);
          const hb = HEARTBEAT_INFO[tier];
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FAF0EB", borderRadius: 14, padding: "10px 14px", marginBottom: 14 }}>
              <style>{`@keyframes heartbeatPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.22); } }`}</style>
              <span style={{ fontSize: 24, display: "inline-block", animation: `heartbeatPulse ${hb.speed} ease-in-out infinite` }}>{hb.icon}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: hb.color }}>{hb.label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{hb.text}</div>
              </div>
            </div>
          );
        })()}

        {pet.bio && <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, marginBottom: 12 }}>{pet.bio}</p>}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {pet.temper.map(t => <Badge key={t}>{t}</Badge>)}
          {pet.sterilized && <Badge color="#E8F5E9" text="#2E7D32">Stérilisé·e ✓</Badge>}
          {pet.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné·e ✓</Badge>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 5, letterSpacing: 1 }}>ÉNERGIE</div>
          <EnergyPaws level={pet.energy} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 5, letterSpacing: 1 }}>CHERCHE</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{pet.seeking.map(s => { const opt = ALL_SEEKING.find(o => o.id === s); return <Badge key={s} color="#FAF0EB" text="#B25F46">{opt ? opt.icon + " " + opt.label : s}</Badge>; })}</div>
        </div>

        {/* Bloc reproduction visible si actif */}
        {pet.repro.active && (
          <div style={{ background: "linear-gradient(135deg,#E8F5E9,#F1F8E9)", borderRadius: 16, padding: "14px 16px", marginBottom: 14, border: "1.5px solid #A5D6A7" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32", marginBottom: 8, letterSpacing: 1 }}>🌱 DISPONIBLE POUR REPRODUCTION</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#4B5563" }}>Prix :</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#1B5E20" }}>{pet.repro.priceNegotiable ? "À discuter" : pet.repro.price ? `${pet.repro.price} €` : "Non défini"}</span>
            </div>
            {(pet.repro.availableFrom || pet.repro.availableTo) && (
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>📅 {pet.repro.availableFrom || "?"} → {pet.repro.availableTo || "?"}</div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pet.repro.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">📜 Pedigree ✓</Badge>}
              {pet.repro.geneticTest && <Badge color="#E8F5E9" text="#2E7D32">🧬 Bilan génétique ✓</Badge>}
              {pet.repro.docs.length > 0 && <Badge color="#E3F2FD" text="#1565C0">📎 {pet.repro.docs.length} document{pet.repro.docs.length > 1 ? "s" : ""}</Badge>}
            </div>
            {pet.repro.reproDesc ? <p style={{ fontSize: 12, color: "#4B5563", marginTop: 8, lineHeight: 1.6, marginBottom: 0 }}>{pet.repro.reproDesc}</p> : null}
          </div>
        )}

        {/* Completeness */}
        <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "12px 14px", marginBottom: 14, border: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2D1200" }}>Complétude du profil</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#B25F46" }}>
              {(pet.photos.length > 0 ? 25 : 0) + (pet.video ? 20 : 0) + (pet.bio ? 20 : 0) + (pet.temper.length > 0 ? 15 : 0) + (pet.vaccinated ? 10 : 0) + (pet.repro.active && pet.repro.price ? 10 : 0)}%
            </span>
          </div>
          <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#B25F46,#C97A5E)", width: `${(pet.photos.length > 0 ? 25 : 0) + (pet.video ? 20 : 0) + (pet.bio ? 20 : 0) + (pet.temper.length > 0 ? 15 : 0) + (pet.vaccinated ? 10 : 0) + (pet.repro.active && pet.repro.price ? 10 : 0)}%`, transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
            {pet.photos.length === 0 ? "📷 Ajoute des photos pour +25%" : !pet.video ? "🎬 Ajoute une vidéo pour +20%" : !pet.repro.active ? "🌱 Active la reproduction pour +10%" : "Super profil !"}
          </div>
        </div>

        {isPremium ? (
          <div style={{ background: "linear-gradient(135deg,#2E7D32,#43A047)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>👑</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Membre Premium</div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>Toutes les fonctionnalités sont actives ✓</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 11, padding: "6px 10px" }}>Actif ✓</div>
          </div>
        ) : (
          <button onClick={() => onPremium()} style={{ width: "100%", background: "linear-gradient(135deg,#8B3D28,#B25F46)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>👑</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Miloute Premium</div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>Qui a craqué · Articles exclusifs · Stats avancées</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, color: "#8B3D28", fontWeight: 800, fontSize: 12, padding: "7px 12px", whiteSpace: "nowrap" }}>4,99 €/mois</div>
          </button>
        )}

        <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "14px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, letterSpacing: 1 }}>STATISTIQUES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[
              [String(likesReceived.length || "0"), "Likes reçus", openLikesModal],
              [String(matchesCount), "Matchs", () => onNav("messages")],
            ].map(([n, l, onClickAction]) => (
              <div key={l} onClick={onClickAction}
                style={{ textAlign: "center", cursor: "pointer", position: "relative" }}>
                {l === "Likes reçus" && unseenLikesCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: "28%", background: "#B25F46", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #F9FAFB" }}>{unseenLikesCount}</span>
                )}
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8B3D28" }}>{n}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{l} 👁️</div>
              </div>
            ))}
          </div>

          {/* Friandises reçues */}
          {isPremium && (
            <button onClick={openTreatsModal}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 12, padding: "12px", marginBottom: 14, border: "none", cursor: "pointer", textAlign: "left", position: "relative" }}>
              <span style={{ fontSize: 22 }}>💝</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1200" }}>Ma Boîte à Souvenirs</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{treatsReceived.length} au total</div>
              </div>
              {unseenTreatsCount > 0 && (
                <span style={{ background: "#B25F46", color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>{unseenTreatsCount}</span>
              )}
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>›</span>
            </button>
          )}

          {/* Journal de Bord */}
          <button onClick={openJournal}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 12, padding: "12px", marginBottom: 14, border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 22 }}>📖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1200" }}>Mon Journal de Bord</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Vos matchs, cadeaux et moments partagés</div>
            </div>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>›</span>
          </button>

          <div style={{ height: 1, background: "#E5E7EB", marginBottom: 14 }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>STATISTIQUES AVANCÉES</div>
              {!isPremium && <span style={{ fontSize: 11 }}>👑</span>}
            </div>
            <div style={{ filter: isPremium ? "none" : "blur(5px)", pointerEvents: isPremium ? "auto" : "none" }}>
              {loadingStats ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><PawLogo size={24} color="#E8B89F" /></div>
              ) : !advancedStats || !advancedStats.hasAnyData ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1200", marginBottom: 4 }}>Pas encore assez de données</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Vos statistiques apparaîtront ici dès vos premiers swipes, matchs et cadeaux.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#8B3D28" }}>{advancedStats.matchRate !== null ? `${advancedStats.matchRate}%` : "—"}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>Taux de match</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#8B3D28" }}>{advancedStats.likesReceived}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>Likes reçus au total</div>
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Race la plus fréquente parmi vos matchs</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{advancedStats.topBreed ? `${pet.species === "cat" ? "🐱" : "🐕"} ${advancedStats.topBreed}` : "Pas encore de match"}</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Article le plus offert</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{advancedStats.topGiftSent || "Pas encore de cadeau envoyé"}</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Membre depuis</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>🐾 {advancedStats.memberSince || "—"}</div>
                  </div>
                </>
              )}
            </div>
            {!isPremium && (
              <button onClick={() => onPremium()}
                style={{ position: "absolute", inset: 0, background: "rgba(249,250,251,.3)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ background: "linear-gradient(135deg,#8B3D28,#B25F46)", color: "#fff", fontWeight: 800, fontSize: 12, padding: "8px 16px", borderRadius: 20, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>
                  👑 Débloquer
                </span>
              </button>
            )}
          </div>
        </div>

        <button onClick={openEdit} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>✏️ Modifier le profil de {pet.name}</button>

        <button onClick={() => setShowShopModal(true)}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛍️</span>
          <span>Boutique Miloute{(() => {
            const totalGifts = Object.values(initialData?.giftInventory || {}).reduce((s, n) => s + n, 0);
            return totalGifts > 0 ? ` (${totalGifts})` : "";
          })()}</span>
        </button>

        <button onClick={() => setShowProviderScreen(true)}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏥</span>
          <span>Devenir prestataire{providerServices.length > 0 ? ` (${providerServices.length})` : ""}</span>
        </button>

        <button onClick={() => { setShowBookingsModal(true); reloadBookings(); }}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <span>Mes réservations</span>
        </button>


        <button onClick={() => { if (initialData?.location) disableLocationProfile(); else shareLocationProfile(); }} disabled={sharingLocation}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: sharingLocation ? "default" : "pointer", marginBottom: locationErrorProfile ? 4 : 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <span>
            {sharingLocation ? "Localisation en cours..." : initialData?.location ? "Position activée — désactiver" : "Activer ma position"}
          </span>
        </button>
        {locationErrorProfile && (
          <div style={{ fontSize: 11, color: "#DC2626", marginBottom: 12, textAlign: "center" }}>{locationErrorProfile}</div>
        )}

        <button onClick={onLogout} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "none", color: "#9CA3AF", fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 20 }}>
          Se déconnecter
        </button>
      </div>

      {/* Modale "Qui a liké votre animal" */}
      {showLikesModal && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowLikesModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>👁️ Qui craque pour {pet.name}</div>
                <button onClick={() => setShowLikesModal(false)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer" }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {loadingLikes ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={28} color="#E8B89F" /></div>
              ) : likesReceived.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👁️</div>
                  <div style={{ fontSize: 14 }}>Pas encore de like reçu</div>
                </div>
              ) : likesReceived.map((like, i) => {
                return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 6px", borderBottom: "1px solid #F9FAFB", position: "relative" }}>
                  <div onClick={() => isPremium ? setSelectedLike(like) : onPremium()} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, filter: isPremium ? "none" : "blur(6px)" }}>
                      {photoUrl(like.photo) ? <img src={photoUrl(like.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : like.emoji}
                    </div>
                    <div style={{ flex: 1, filter: isPremium ? "none" : "blur(4px)" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200", display: "flex", alignItems: "center", gap: 6 }}>
                        {isPremium ? like.name : "???"}
                        {isPremium && like.viaGift && (
                          <span title={like.viaLike ? "A aussi envoyé un cadeau" : "A envoyé un cadeau"} style={{ fontSize: 12 }}>🎁</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{like.breed} · {like.time}</div>
                    </div>
                  </div>
                  {!isPremium && <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>}
                  {isPremium && !like.isDemo && (
                    <button onClick={() => handleDeclineLike(like)} disabled={decliningLikeId === like.profileId}
                      style={{ background: "none", border: "none", color: "#D1D5DB", fontSize: 15, cursor: "pointer", flexShrink: 0, padding: 4 }}>
                      {decliningLikeId === like.profileId ? "..." : "✕"}
                    </button>
                  )}
                  {isPremium && <span onClick={() => setSelectedLike(like)} style={{ fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>›</span>}
                </div>
              );})}
            </div>

            {!isPremium && (
              <div style={{ padding: "16px 20px 28px", flexShrink: 0, borderTop: "1px solid #F3F4F6" }}>
                <button onClick={() => { setShowLikesModal(false); onPremium(); }}
                  style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#8B3D28,#B25F46)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 20px rgba(139,61,40,.3)" }}>
                  👑 Débloquer avec Premium
                </button>
                <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 10 }}>
                  Découvrez qui s'intéresse déjà à {pet.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Détail d'un profil ayant liké — profil complet affiché directement */}
      {selectedLike && (() => {
        const fullProfile = selectedLikeProfile;
        return (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "flex-end" }} onClick={() => setSelectedLike(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", boxSizing: "border-box" }}>
              <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "12px auto 0" }} />
              {loadingSelectedLikeProfile ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><PawLogo size={32} color="#E8B89F" /></div>
              ) : !fullProfile ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>Profil introuvable.</div>
              ) : (
                <>
                  <div style={{ width: "100%", aspectRatio: "1", background: "#FAF0EB", position: "relative", marginTop: 12 }}>
                    {photoUrl(fullProfile.photos?.[selectedLikePhotoIdx]) ? (
                      <img src={photoUrl(fullProfile.photos[selectedLikePhotoIdx])} alt={selectedLike.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{selectedLike.emoji}</div>
                    )}
                    {fullProfile.photos?.length > 1 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, position: "absolute", top: 12, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}>
                          {fullProfile.photos.map((_, i) => (
                            <div key={i} style={{ width: i === selectedLikePhotoIdx ? 24 : 16, height: 4, borderRadius: 2, background: i === selectedLikePhotoIdx ? "#B25F46" : "rgba(255,255,255,.6)", transition: "width .2s" }} />
                          ))}
                        </div>
                        <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelectedLikePhotoIdx(i => Math.max(0, i - 1))} />
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelectedLikePhotoIdx(i => Math.min(fullProfile.photos.length - 1, i + 1))} />
                        </div>
                      </>
                    )}
                    <button onClick={() => setSelectedLike(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", zIndex: 3 }}>✕</button>
                  </div>
                  <div style={{ padding: "18px 20px 32px" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>
                      {selectedLike.name}{fullProfile.age ? ` · ${formatAge(fullProfile.age)}` : ""}{fullProfile.gender ? ` ${fullProfile.gender === "F" ? "♀" : "♂"}` : ""}
                    </div>
                    <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600 }}>{selectedLike.breed}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>A liké {pet.name} · {selectedLike.time}</div>

                    {selectedLikeTreats.length > 0 && (
                      <div style={{ background: "#FFF8E7", border: "1.5px solid #F3E0BE", borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#946800", marginBottom: 4 }}>
                          🎁 {selectedLike.name} vous {selectedLikeTreats.length > 1 ? "a envoyé ces cadeaux" : "a envoyé un cadeau"} :
                        </div>
                        {selectedLikeTreats.map((t, i) => (
                          <div key={i} style={{ fontSize: 13, color: "#8B3D28" }}>
                            {t.emoji} {t.label}{t.message && <span style={{ color: "#9CA3AF", fontStyle: "italic" }}> — « {t.message} »</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {(fullProfile.vaccinated || fullProfile.sterilized) && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {fullProfile.vaccinated && <Badge color="#E3F2FD" text="#1565C0">Vacciné ✓</Badge>}
                        {fullProfile.sterilized && <Badge color="#F3E5F5" text="#7B1FA2">Stérilisé ✓</Badge>}
                      </div>
                    )}

                    {fullProfile.temper?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                        {fullProfile.temper.map(t => <Badge key={t} color="#FAF0EB" text="#8B3D28">{t}</Badge>)}
                      </div>
                    )}

                    {typeof fullProfile.energy === "number" && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 4 }}>ÉNERGIE</div>
                        <EnergyPaws level={fullProfile.energy} />
                      </div>
                    )}

                    {fullProfile.bio && (
                      <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>{fullProfile.bio}</p>
                    )}

                    {fullProfile.seeking?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>CHERCHE</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {fullProfile.seeking.map(s => <Badge key={s} color="#FAF0EB" text="#8B3D28">{s}</Badge>)}
                        </div>
                      </div>
                    )}

                    {!selectedLike.isDemo && (
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => handleDeclineLike(selectedLike)} disabled={decliningLikeId === selectedLike.profileId || likingBackId === selectedLike.profileId}
                          style={{ flex: 1, padding: "15px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", color: "#9CA3AF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                          {decliningLikeId === selectedLike.profileId ? "..." : "✕ Passer"}
                        </button>
                        <button onClick={() => handleLikeBack(selectedLike)} disabled={decliningLikeId === selectedLike.profileId || likingBackId === selectedLike.profileId}
                          style={{ flex: 1, padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                          {likingBackId === selectedLike.profileId ? "..." : "💕 Matcher"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Célébration après un match déclenché depuis "Qui craque pour vous" */}
      {justMatchedWith && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,18,0,.92)", zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4, textAlign: "center" }}>C'est un match !</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,.85)", marginBottom: 28, textAlign: "center", lineHeight: 1.5, maxWidth: 320 }}>{generateMatchMessage(pet, justMatchedWith)}</div>
          <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", background: "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 28, border: "3px solid #fff" }}>
            {photoUrl(justMatchedWith.photo) ? <img src={photoUrl(justMatchedWith.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : justMatchedWith.emoji}
          </div>
          <button onClick={() => { setJustMatchedWith(null); onNav("messages"); }}
            style={{ width: "100%", maxWidth: 320, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>
            💬 Voir la conversation
          </button>
          <button onClick={() => setJustMatchedWith(null)}
            style={{ width: "100%", maxWidth: 320, padding: "14px", borderRadius: 14, border: "none", background: "none", color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Continuer
          </button>
        </div>
      )}

      {/* Modale Boîte à Souvenirs */}
      {showTreatsModal && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowTreatsModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>💝 Ma Boîte à Souvenirs</div>
                <button onClick={() => setShowTreatsModal(false)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer", flexShrink: 0, marginLeft: 10 }}>✕</button>
              </div>

              <button onClick={() => {
                  setShowGiftBrowser(true);
                  setTreatsFilterCategory("all");
                  if (unseenTreatsCount > 0) {
                    playGiftFeedback(loadSoundMode(), loadSoundPalette(), initialData?.species);
                    markTreatsSeen(initialData).then(() => { setUnseenTreatsCount(0); onTreatsSeen(); });
                  }
                }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 8 }}>
                🎁 Voir tous mes cadeaux et photos
              </button>

              <button onClick={openAddEncounter}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 12, border: "1.5px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 8 }}>
                📸 Ajouter une photo de rencontre
              </button>

              {(treatsReceived.length + encounterPhotos.length) > 0 && (
                <button onClick={openMagicBook}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: showGiftBrowser ? 12 : 8 }}>
                  ✨ Ouvrir le Livre Magique
                </button>
              )}

              {showGiftBrowser && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {[["all", "Tous"], ["food", "Friandises"], ["gift", "Cadeaux"], ["comfort", "Confort"], ["encounter", "Rencontres"]].map(([v, l]) => (
                    <button key={v} onClick={() => setTreatsFilterCategory(v)}
                      style={{ padding: "8px 6px", borderRadius: 12, border: `1.5px solid ${treatsFilterCategory === v ? "#B25F46" : "#E5E7EB"}`, background: treatsFilterCategory === v ? "#FAF0EB" : "#fff", color: treatsFilterCategory === v ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                      {l}
                    </button>
                  ))}
                  <button onClick={() => setMemoryViewMode(m => m === "grid" ? "timeline" : "grid")}
                    style={{ padding: "8px 6px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <span style={{ fontSize: 13 }}>{memoryViewMode === "grid" ? "📋" : "▦"}</span>
                    {memoryViewMode === "grid" ? "Chronologie" : "Grille"}
                  </button>
                </div>
              )}
            </div>
            {showGiftBrowser && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
              {(() => {
                const showTreats = treatsFilterCategory === "all" || treatsFilterCategory === "food" || treatsFilterCategory === "gift" || treatsFilterCategory === "comfort";
                const showEncounters = treatsFilterCategory === "all" || treatsFilterCategory === "encounter";
                const filteredTreats = !showTreats ? [] : (treatsFilterCategory === "all" ? treatsReceived : treatsReceived.filter(t => t.giftCategory === treatsFilterCategory));
                const filteredEncounters = treatsFilterCategory === "encounter" ? encounterPhotos : (treatsFilterCategory === "all" ? encounterPhotos : []);
                const nothingAtAll = treatsReceived.length === 0 && encounterPhotos.length === 0;
                const nothingInFilter = filteredTreats.length === 0 && filteredEncounters.length === 0;

                if (nothingInFilter) {
                  const emptyCopy = {
                    all: ["Ici se collectionneront tous les cadeaux et moments magiques que", "recevra.", "Découvrir les cadeaux"],
                    food: ["Aucune friandise pour le moment", "Les gourmandises reçues par", "apparaîtront ici.", null],
                    gift: ["Aucun cadeau pour le moment", "Les cadeaux reçus par", "apparaîtront ici.", null],
                    comfort: ["Aucun accessoire pour le moment", "Les accessoires reçus par", "apparaîtront ici.", null],
                    encounter: ["Aucune rencontre pour le moment", "Ajoutez vos plus belles photos de play dates avec", ".", null],
                  };
                  return (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>{treatsFilterCategory === "encounter" ? "📸" : "💝"}</div>
                      {nothingAtAll && treatsFilterCategory === "all" ? (
                        <>
                          <div style={{ fontSize: 14, marginBottom: 16 }}>Ici se collectionneront tous les cadeaux et moments magiques que {pet.name} recevra.</div>
                          <button onClick={() => { setShowTreatsModal(false); onGoToShop(); }}
                            style={{ padding: "12px 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            Découvrir les cadeaux
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 14 }}>
                          {treatsFilterCategory === "food" && `Les gourmandises reçues par ${pet.name} apparaîtront ici.`}
                          {treatsFilterCategory === "gift" && `Les cadeaux reçus par ${pet.name} apparaîtront ici.`}
                          {treatsFilterCategory === "comfort" && `Les accessoires reçus par ${pet.name} apparaîtront ici.`}
                          {treatsFilterCategory === "encounter" && `Ajoutez vos plus belles photos de play dates avec ${pet.name}.`}
                        </div>
                      )}
                    </div>
                  );
                }

                if (memoryViewMode === "timeline") {
                  const combined = [
                    ...filteredTreats.map(t => ({ kind: "treat", date: t.createdAt, data: t })),
                    ...filteredEncounters.map(e => ({ kind: "encounter", date: e.createdAt, data: e })),
                  ].sort((a, b) => new Date(b.date) - new Date(a.date));
                  return (
                    <div style={{ position: "relative", paddingLeft: 22 }}>
                      <div style={{ position: "absolute", left: 9, top: 6, bottom: 6, width: 2, background: "#F3E0D3" }} />
                      {combined.map(item => (
                        <div key={`${item.kind}-${item.data.id}`} style={{ position: "relative", marginBottom: 16, display: "flex", gap: 10 }}>
                          <div style={{ position: "absolute", left: -22, top: 0, width: 20, height: 20, borderRadius: "50%", background: "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "2px solid #fff", boxShadow: "0 0 0 2px #F3E0D3", flexShrink: 0 }}>
                            {item.kind === "treat" ? item.data.giftEmoji : "📸"}
                          </div>
                          <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", background: "#FAF0EB", flexShrink: 0 }}>
                            {item.data.photo && <img src={item.data.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1200" }}>
                              {item.kind === "treat" ? `${item.data.giftLabel} de ${item.data.name}` : (item.data.otherName ? `Rencontre avec ${item.data.otherName}` : "Photo de rencontre")}
                            </div>
                            {(item.kind === "treat" ? item.data.message : item.data.caption) && (
                              <div style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>« {item.kind === "treat" ? item.data.message : item.data.caption} »</div>
                            )}
                            <div style={{ fontSize: 10.5, color: "#9CA3AF" }}>{formatRelativeTime(item.date)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {filteredEncounters.map(enc => (
                      <div key={`enc-${enc.id}`} style={{ position: "relative", borderRadius: 18, overflow: "hidden", boxShadow: "0 3px 12px rgba(0,0,0,.1)" }}>
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: "#FAF0EB" }}>
                          <img src={enc.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 45%, transparent 70%)" }} />
                          <div style={{ position: "absolute", top: 8, left: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
                            📸
                          </div>
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteEncounter(enc); }}
                            style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.4)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            ✕
                          </button>
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
                            {enc.otherName && <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>Avec {enc.otherName}</div>}
                            {enc.caption && <div style={{ color: "rgba(255,255,255,.9)", fontSize: 10, fontStyle: "italic", marginTop: 2, lineHeight: 1.3 }}>« {enc.caption} »</div>}
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,.65)", fontSize: 9.5, marginTop: 2 }}>
                              <span>♡</span>
                              <span>{formatRelativeTime(enc.createdAt)}{enc.location ? ` · ${enc.location}` : ""}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredTreats.map(t => (
                      <div key={`treat-${t.id}`} style={{ position: "relative", borderRadius: 18, overflow: "visible", boxShadow: "0 3px 12px rgba(0,0,0,.1)" }}>
                        {!t.seen && (
                          <style>{`
                            @keyframes boxRevealPop { 0% { transform: scale(0) rotate(-18deg); opacity: 0; } 55% { transform: scale(1.15) rotate(6deg); opacity: 1; } 75% { transform: scale(0.95) rotate(-3deg); } 100% { transform: scale(1) rotate(0deg); } }
                            @keyframes boxSparkleFly { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(160deg); opacity: 0; } }
                          `}</style>
                        )}
                        {!t.seen && [["-24px","-20px"], ["26px","-18px"], ["-22px","20px"]].map(([tx, ty], idx) => (
                          <span key={idx} style={{ position: "absolute", left: "50%", top: "30%", fontSize: 13, zIndex: 3, "--tx": tx, "--ty": ty, animation: `boxSparkleFly .8s ease-out ${0.1 + idx * 0.08}s both`, pointerEvents: "none" }}>✨</span>
                        ))}
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 18, overflow: "hidden", background: "#FAF0EB", animation: !t.seen ? "boxRevealPop .6s cubic-bezier(.34,1.56,.64,1)" : "none" }}>
                          {t.photo ? (
                            <img src={t.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{t.emoji}</div>
                          )}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 45%, transparent 70%)" }} />
                          <div style={{ position: "absolute", top: 8, left: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
                            {t.giftEmoji}
                          </div>
                          {!t.seen && (
                            <div style={{ position: "absolute", top: 44, left: 8, background: "#B25F46", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 10, letterSpacing: 0.5 }}>NOUVEAU</div>
                          )}
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteTreat(t); }}
                            style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.4)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            ✕
                          </button>
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
                            <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{t.giftLabel}</div>
                            <div style={{ color: "rgba(255,255,255,.85)", fontSize: 10.5 }}>de {t.name}</div>
                            {t.message ? (
                              <div style={{ color: "rgba(255,255,255,.9)", fontSize: 10, fontStyle: "italic", marginTop: 2, lineHeight: 1.3 }}>« {t.message} »</div>
                            ) : (
                              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 10, fontStyle: "italic", marginTop: 2, lineHeight: 1.3 }}>{getMemoryNarrative(t.id, t.name)}</div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,.65)", fontSize: 9.5 }}>
                                <span>♡</span><span>{t.time}</span>
                              </div>
                              <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={e => { e.stopPropagation(); openNoteEditor(t); }}
                                  style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "3px 8px", cursor: "pointer" }}>
                                  {t.ownerNote ? "📝" : "+ Note"}
                                </button>
                                <button onClick={e => { e.stopPropagation(); setShowTreatsModal(false); onNav("messages"); }}
                                  style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "3px 8px", cursor: "pointer" }}>
                                  Répondre
                                </button>
                              </div>
                            </div>
                            {t.ownerNote && (
                              <div style={{ color: "#FFE8A3", fontSize: 9.5, marginTop: 3, lineHeight: 1.3 }}>📝 {t.ownerNote}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Modale Journal de Bord */}
      {showJournalModal && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowJournalModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", padding: "20px 20px 32px" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200", marginBottom: 4 }}>📖 Mon Journal de Bord</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 18 }}>Tous vos moments sur Miloute, dans l'ordre</div>

            {loadingJournal ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={28} color="#E8B89F" /></div>
            ) : journalEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
                <div style={{ fontSize: 14 }}>Votre histoire commence tout juste — revenez ici au fil de vos matchs et de vos moments partagés.</div>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 26 }}>
                <div style={{ position: "absolute", left: 12, top: 6, bottom: 6, width: 2, background: "#F3E0D3" }} />
                {journalEntries.map(entry => (
                  <div key={entry.id} style={{ position: "relative", marginBottom: 18 }}>
                    <div style={{ position: "absolute", left: -26, top: 0, width: 26, height: 26, borderRadius: "50%", overflow: "hidden", background: entry.special ? "#FFF3CD" : "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, border: "2px solid #fff", boxShadow: entry.special ? "0 0 0 2px #E8C468" : "0 0 0 2px #F3E0D3" }}>
                      {entry.photo ? <img src={entry.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : entry.icon}
                    </div>
                    {entry.photo && (
                      <div style={{ position: "absolute", left: -8, top: 16, width: 15, height: 15, borderRadius: "50%", background: "#fff", border: "1.5px solid #fff", boxShadow: "0 0 0 1px #F3E0D3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{entry.icon}</div>
                    )}
                    {entry.special && (
                      <div style={{ display: "inline-block", fontSize: 10, fontWeight: 800, color: "#946800", background: "#FFF3CD", padding: "2px 8px", borderRadius: 8, marginBottom: 3 }}>{entry.special}</div>
                    )}
                    <div style={{ fontSize: 13.5, color: "#2D1200", fontWeight: 600 }}>{entry.text}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{formatRelativeTime(entry.date)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation de suppression d'un souvenir */}
      {confirmDeleteTreat && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => !deletingTreat && setConfirmDeleteTreat(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>Supprimer ce souvenir ?</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}>Le {confirmDeleteTreat.giftLabel} de {confirmDeleteTreat.name} sera définitivement retiré de votre Boîte à Souvenirs. Cette action est irréversible.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeleteTreat(null)} disabled={deletingTreat}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleDeleteTreat} disabled={deletingTreat}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: deletingTreat ? "#E5E7EB" : "#DC2626", color: deletingTreat ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: deletingTreat ? "default" : "pointer" }}>
                {deletingTreat ? "..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note personnelle sur un cadeau reçu */}
      {editingNoteFor && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => !savingNote && setEditingNoteFor(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>📝 Votre note personnelle</div>
            <div style={{ fontSize: 11.5, color: "#9CA3AF", marginBottom: 14 }}>Visible par vous seul — sur le {editingNoteFor.giftLabel} de {editingNoteFor.name}</div>
            <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value.slice(0, 200))}
              placeholder="Ce que ce moment représente pour vous..."
              style={{ width: "100%", boxSizing: "border-box", minHeight: 80, resize: "none", padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, marginBottom: 16, fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditingNoteFor(null)} disabled={savingNote}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={saveNote} disabled={savingNote}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: savingNote ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: savingNote ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: savingNote ? "default" : "pointer" }}>
                {savingNote ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression d'une photo de rencontre */}
      {confirmDeleteEncounter && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => !deletingEncounter && setConfirmDeleteEncounter(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>Supprimer cette photo de rencontre ?</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}>Cette photo sera définitivement retirée de votre Boîte à Souvenirs{confirmDeleteEncounter.sharedToCommunity ? " (le post associé dans la Communauté restera visible)" : ""}. Cette action est irréversible.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeleteEncounter(null)} disabled={deletingEncounter}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleDeleteEncounter} disabled={deletingEncounter}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: deletingEncounter ? "#E5E7EB" : "#DC2626", color: deletingEncounter ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: deletingEncounter ? "default" : "pointer" }}>
                {deletingEncounter ? "..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ouverture du Livre Magique — lumière et particules, en or */}
      {bookOpening && (
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, #FAF0EB 0%, #B25F46 75%)", zIndex: 98, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <style>{`
            @keyframes bookGlowPulse { 0% { transform: scale(.2); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(2.6); opacity: 0; } }
            @keyframes bookOpenParticle { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(var(--px), var(--py)) scale(1) rotate(160deg); opacity: 0; } }
          `}</style>
          <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.95), transparent 70%)", animation: "bookGlowPulse .9s ease-out" }} />
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const dist = 140 + (i % 3) * 30;
            return (
              <span key={i} style={{
                position: "absolute", fontSize: 12, color: "#E8C468", "--px": `${Math.cos(angle) * dist}px`, "--py": `${Math.sin(angle) * dist}px`,
                animation: `bookOpenParticle .9s ease-out ${i * 0.02}s both`, pointerEvents: "none",
              }}>★</span>
            );
          })}
          <div style={{ position: "relative", fontSize: 40, filter: "drop-shadow(0 0 10px rgba(212,175,55,.8))" }}>📖</div>
        </div>
      )}

      {/* Le Livre Magique de Souvenirs — feuilletable */}
      {showMagicBook && bookPages.length > 0 && !bookOpening && (() => {
        const theme = BOOK_THEMES[bookCustom.theme] || BOOK_THEMES.miloute;

        const renderBookPage = (page) => (
          <>
            {/* petits éléments magiques discrets */}
            <span style={{ position: "absolute", top: 16, right: 20, fontSize: 14, animation: "bookSparkleTwinkle 2.4s ease-in-out infinite", pointerEvents: "none" }}>✨</span>
            <span style={{ position: "absolute", bottom: 70, left: 18, fontSize: 11, animation: "bookSparkleTwinkle 3.1s ease-in-out infinite .6s", pointerEvents: "none" }}>✨</span>

            {page.type === "cover" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
                <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", background: "rgba(0,0,0,.06)", marginBottom: 22, border: "4px solid rgba(255,255,255,.5)", boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                  {page.petPhoto && <img src={page.petPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: theme.accent, lineHeight: 1.3, marginBottom: 8 }}>{page.title || "Le Livre de Souvenirs"}<br />de {page.petName}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: theme.accentDark, marginBottom: 20 }}>Ses plus beaux moments</div>
                <div style={{ fontSize: 11, color: theme.subtext }}>Depuis le {new Date(page.startDate).toLocaleDateString("fr-FR")}</div>
              </div>
            )}

            {page.type === "intro" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 30px", textAlign: "center" }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  {theme.useLogo ? <PawLogo size={34} color={theme.accent} /> : <span style={{ fontSize: 30 }}>🐾</span>}
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: theme.text, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                  {page.text || (
                    <>Depuis son arrivée sur Miloute, <strong>{page.petName}</strong> a vécu de belles rencontres et reçu de jolies attentions.<br /><br />Voici son histoire, jour après jour.</>
                  )}
                </div>
              </div>
            )}

            {(page.type === "gift" || page.type === "encounter") && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", aspectRatio: "1", background: "rgba(0,0,0,.06)", flexShrink: 0, overflow: "hidden" }}>
                  {page.photo && <img key={page.id} src={page.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", animation: "bookPhotoReveal .5s ease-out" }} />}
                </div>
                <div style={{ flex: 1, padding: "18px 22px", textAlign: "center", overflowY: "auto" }}>
                  {page.special && (
                    <div style={{ display: "inline-block", fontSize: 10, fontWeight: 800, color: "#946800", background: "#FFF3CD", padding: "3px 10px", borderRadius: 10, marginBottom: 8, animation: "bookSpecialPop .5s cubic-bezier(.34,1.56,.64,1) .15s both" }}>{page.special}</div>
                  )}
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{page.emoji} {page.title}</div>
                  {page.subtitle && <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 8 }}>{page.subtitle}</div>}
                  {page.quote && <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: theme.accentDark }}>« {page.quote} »</div>}
                </div>
              </div>
            )}

            {page.type === "conclusion" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 30px", textAlign: "center" }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  {theme.useLogo ? <PawLogo size={34} color={theme.accent} /> : <span style={{ fontSize: 30 }}>🐾</span>}
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic", color: theme.accent, whiteSpace: "pre-line" }}>{page.text || "L'histoire continue…"}</div>
              </div>
            )}
          </>
        );

        const targetIdx = bookFlip === "next" ? Math.min(bookPageIndex + 1, bookPages.length - 1) : bookFlip === "prev" ? Math.max(bookPageIndex - 1, 0) : bookPageIndex;
        const currentIdx = bookFlippingFrom !== null ? bookFlippingFrom : bookPageIndex;

        return (
        <div style={{ position: "absolute", inset: 0, background: theme.frameBg, zIndex: 97, display: "flex", flexDirection: "column" }}>
          <style>{`
            @keyframes bookSparkleTwinkle { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
            @keyframes bookPageSparkleFly { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--px), var(--py)) scale(1) rotate(140deg); opacity: 0; } }
            @keyframes bookPhotoReveal { 0% { opacity: 0; transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
            @keyframes bookSpecialPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
          `}</style>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", flexShrink: 0 }}>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12, fontWeight: 700 }}>{bookPageIndex + 1} / {bookPages.length}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowBookSettings(true)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", fontSize: 13, cursor: "pointer" }}>⚙️</button>
              <button onClick={() => setShowMagicBook(false)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", fontSize: 14, cursor: "pointer" }}>✕</button>
            </div>
          </div>

          <div
            onTouchStart={e => setBookTouchStartX(e.touches[0].clientX)}
            onTouchEnd={e => {
              if (bookTouchStartX === null) return;
              const delta = e.changedTouches[0].clientX - bookTouchStartX;
              if (delta < -40) bookNextPage();
              else if (delta > 40) bookPrevPage();
              setBookTouchStartX(null);
            }}
            style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", perspective: 1400 }}>

            {/* Zones de tap gauche/droite pour naviguer, en plus du swipe */}
            <div onClick={bookPrevPage} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", zIndex: 3, cursor: bookPageIndex > 0 ? "pointer" : "default" }} />
            <div onClick={bookNextPage} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%", zIndex: 3, cursor: bookPageIndex < bookPages.length - 1 ? "pointer" : "default" }} />

            {/* Page de destination, dessous — se révèle au fur et à mesure que la page du dessus se tourne */}
            {bookFlip && (
              <div style={{ position: "absolute", inset: "0 16px 16px", borderRadius: 20, background: theme.pageBg, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {renderBookPage(bookPages[targetIdx])}
              </div>
            )}

            {/* Page courante — se tourne comme une vraie page pendant la navigation */}
            <div style={{
              position: bookFlip ? "absolute" : "relative", inset: bookFlip ? "0 16px 16px" : undefined,
              flex: bookFlip ? undefined : 1, margin: bookFlip ? undefined : "0 16px 16px",
              borderRadius: 20, background: theme.pageBg, overflow: "hidden", display: "flex", flexDirection: "column",
              transformOrigin: bookFlip === "next" ? "right center" : "left center",
              transform: bookFlip ? `rotateY(${bookFlip === "next" ? -130 : 130}deg)` : "rotateY(0deg)",
              transition: bookFlip ? "transform .42s cubic-bezier(.45,0,.55,1)" : "none",
              boxShadow: bookFlip ? "0 0 30px rgba(0,0,0,.35)" : "none",
              backfaceVisibility: "hidden",
            }}>
              {renderBookPage(bookPages[currentIdx])}
            </div>

            {/* Éclat d'étincelles au bord qui tourne */}
            {bookPageSparkle && (
              <div style={{ position: "absolute", top: "50%", [bookFlip === "prev" ? "left" : "right"]: 16, zIndex: 4, pointerEvents: "none" }}>
                {[["-10px", "-30px"], ["12px", "-22px"], ["-4px", "10px"], ["10px", "24px"]].map(([tx, ty], idx) => (
                  <span key={idx} style={{ position: "absolute", fontSize: 11, color: theme.accent, "--px": tx, "--py": ty, animation: `bookPageSparkleFly .5s ease-out ${idx * 0.03}s both` }}>★</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "10px 20px 22px", flexShrink: 0 }}>
            {bookError && (
              <div style={{ fontSize: 11, color: "#FCA5A5", textAlign: "center", marginBottom: 10 }}>{bookError}</div>
            )}
            <button onClick={handleExportBookPdf} disabled={exportingBookPdf}
              style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: exportingBookPdf ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.92)", color: exportingBookPdf ? "rgba(255,255,255,.6)" : theme.accentDark, fontWeight: 800, fontSize: 13, cursor: exportingBookPdf ? "default" : "pointer" }}>
              {exportingBookPdf ? `Export en cours... (${bookExportProgress?.done || 0}/${bookExportProgress?.total || 0})` : "📥 Exporter en PDF"}
            </button>
          </div>
        </div>
        );
      })()}

      {/* Personnalisation du Livre Magique */}
      {showBookSettings && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 99, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowBookSettings(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", padding: "20px 20px 32px" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 18 }}>⚙️ Personnaliser le livre</div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>THÈME</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
              {Object.entries(BOOK_THEMES).map(([key, th]) => (
                <button key={key} onClick={() => applyBookCustomization({ theme: key })}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 12, border: (bookCustom.theme || "miloute") === key ? "1.5px solid #B25F46" : "1.5px solid #E5E7EB", background: th.pageBg, cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {th.useLogo ? <PawLogo size={18} color={th.accent} /> : <span style={{ fontSize: 18, lineHeight: 1 }}>{th.icon}</span>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: th.text }}>{th.label}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>TITRE DE LA COUVERTURE</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input value={bookTitleDraft} onChange={e => setBookTitleDraft(e.target.value.slice(0, 60))}
                placeholder="Le Livre de Souvenirs"
                style={{ flex: 1, boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13 }} />
              <button onClick={() => applyBookCustomization({ title: bookTitleDraft.trim() || null })}
                style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#B25F46", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                OK
              </button>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>TEXTE D'INTRODUCTION (page 2)</div>
            <div style={{ marginBottom: 20 }}>
              <textarea value={bookIntroDraft} onChange={e => setBookIntroDraft(e.target.value.slice(0, 300))}
                placeholder="Depuis son arrivée sur Miloute, [nom] a vécu de belles rencontres..."
                style={{ width: "100%", boxSizing: "border-box", minHeight: 70, resize: "none", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", marginBottom: 6 }} />
              <button onClick={() => applyBookCustomization({ introText: bookIntroDraft.trim() || null })}
                style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: "#B25F46", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Enregistrer ce texte
              </button>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>TEXTE DE CONCLUSION (dernière page)</div>
            <div style={{ marginBottom: 20 }}>
              <textarea value={bookConclusionDraft} onChange={e => setBookConclusionDraft(e.target.value.slice(0, 200))}
                placeholder="L'histoire continue…"
                style={{ width: "100%", boxSizing: "border-box", minHeight: 50, resize: "none", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", marginBottom: 6 }} />
              <button onClick={() => applyBookCustomization({ conclusionText: bookConclusionDraft.trim() || null })}
                style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: "#B25F46", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Enregistrer ce texte
              </button>
            </div>

            {pet.photos?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>PHOTO DE COUVERTURE</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20 }}>
                  {pet.photos.map((p, i) => (
                    <button key={i} onClick={() => applyBookCustomization({ coverPhoto: photoUrl(p) })}
                      style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", border: (bookCustom.coverPhoto || pet.photos[0]?.url) === photoUrl(p) ? "2.5px solid #B25F46" : "1.5px solid #E5E7EB", padding: 0, cursor: "pointer", flexShrink: 0 }}>
                      <img src={photoUrl(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>PAGES (réorganiser / masquer)</div>
            {buildAllContentItems(treatsReceived, encounterPhotos, bookCustom).map((page, i, arr) => {
              const isHidden = (bookCustom.hiddenIds || []).includes(page.id);
              return (
                <div key={page.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "#F9FAFB", marginBottom: 6, opacity: isHidden ? 0.5 : 1 }}>
                  <span style={{ fontSize: 16 }}>{page.emoji}</span>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "#2D1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</span>
                  <button onClick={() => moveContentPage(page.id, -1)} disabled={i === 0} style={{ background: "none", border: "none", fontSize: 14, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1, padding: "2px 4px" }}>↑</button>
                  <button onClick={() => moveContentPage(page.id, 1)} disabled={i === arr.length - 1} style={{ background: "none", border: "none", fontSize: 14, cursor: i === arr.length - 1 ? "default" : "pointer", opacity: i === arr.length - 1 ? 0.3 : 1, padding: "2px 4px" }}>↓</button>
                  <button onClick={() => toggleHiddenPage(page.id)} style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", padding: "2px 4px" }}>{isHidden ? "🙈" : "👁️"}</button>
                </div>
              );
            })}

            <button onClick={() => setShowBookSettings(false)}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 16 }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Flow d'ajout d'une photo de rencontre (4 écrans) */}
      {showAddEncounter && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 95, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button onClick={() => { if (encounterStep === 1) setShowAddEncounter(false); else setEncounterStep(s => s - 1); }}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#2D1200", padding: 4 }}>←</button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#9CA3AF" }}>Étape {encounterStep} / 4</div>
            <div style={{ width: 28 }} />
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
            {encounterStep === 1 && (
              <div style={{ textAlign: "center", paddingTop: 30 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📸</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Immortaliser une rencontre</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 32, lineHeight: 1.5 }}>Garde précieusement les plus beaux moments de ton animal.</div>
                <input ref={encounterFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleEncounterFileChosen} />
                <input ref={encounterCameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleEncounterFileChosen} />
                <button onClick={() => encounterFileRef.current?.click()}
                  style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>
                  🖼️ Choisir une photo
                </button>
                <button onClick={() => encounterCameraRef.current?.click()}
                  style={{ width: "100%", padding: "15px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", color: "#8B3D28", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  📷 Prendre une photo
                </button>
              </div>
            )}

            {encounterStep === 2 && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 16, textAlign: "center" }}>Cette rencontre était avec…</div>
                {loadingEncounterMatches ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><PawLogo size={26} color="#E8B89F" /></div>
                ) : encounterMatches.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9CA3AF", padding: "20px 0", fontSize: 13 }}>Aucun match pour l'instant — vous pourrez quand même enregistrer cette photo sans l'associer à personne.</div>
                ) : (
                  encounterMatches.map(m => (
                    <button key={m.id} onClick={() => { setEncounterSelectedMatch(m); setEncounterStep(3); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, border: encounterSelectedMatch?.id === m.id ? "1.5px solid #B25F46" : "1.5px solid #E5E7EB", background: encounterSelectedMatch?.id === m.id ? "#FAF0EB" : "#fff", cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {m.photo ? <img src={m.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.emoji}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{m.name}</span>
                    </button>
                  ))
                )}
                <button onClick={() => { setEncounterSelectedMatch(null); setEncounterStep(3); }}
                  style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>
                  Ne pas associer à un match
                </button>
              </div>
            )}

            {encounterStep === 3 && (
              <div>
                {encounterPreview && (
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: 16, overflow: "hidden", marginBottom: 18, background: "#FAF0EB" }}>
                    <img src={encounterPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>LÉGENDE (OPTIONNEL)</label>
                <textarea value={encounterCaption} onChange={e => setEncounterCaption(e.target.value.slice(0, 200))}
                  placeholder="Écris un petit mot..."
                  style={{ width: "100%", boxSizing: "border-box", minHeight: 70, resize: "none", padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, marginTop: 6, marginBottom: 16, fontFamily: "inherit" }} />
                <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>DATE DE LA RENCONTRE</label>
                <input type="date" value={encounterDate} onChange={e => setEncounterDate(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, marginTop: 6, marginBottom: 16 }} />
                <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>LIEU (OPTIONNEL)</label>
                <input value={encounterLocation} onChange={e => setEncounterLocation(e.target.value.slice(0, 80))}
                  placeholder="Parc des Buttes-Chaumont..."
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, marginTop: 6, marginBottom: 20 }} />
                <button onClick={() => setEncounterStep(4)}
                  style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                  Suivant
                </button>
              </div>
            )}

            {encounterStep === 4 && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 18, textAlign: "center" }}>Souhaites-tu partager cette photo ?</div>
                <button onClick={() => setEncounterShare("private")}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: 14, border: encounterShare === "private" ? "1.5px solid #B25F46" : "1.5px solid #E5E7EB", background: encounterShare === "private" ? "#FAF0EB" : "#fff", cursor: "pointer", marginBottom: 10, textAlign: "left" }}>
                  <span style={{ fontSize: 20 }}>💝</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2D1200" }}>Uniquement dans ma Boîte à Souvenirs</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>Reste privé, visible par vous seul</div>
                  </div>
                  {encounterShare === "private" && <span style={{ color: "#B25F46", fontSize: 16 }}>✓</span>}
                </button>
                <button onClick={() => setEncounterShare("community")}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: 14, border: encounterShare === "community" ? "1.5px solid #B25F46" : "1.5px solid #E5E7EB", background: encounterShare === "community" ? "#FAF0EB" : "#fff", cursor: "pointer", marginBottom: 20, textAlign: "left" }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2D1200" }}>Partager dans la Communauté</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>Visible par tous, avec l'étiquette "Rencontre"</div>
                  </div>
                  {encounterShare === "community" && <span style={{ color: "#B25F46", fontSize: 16 }}>✓</span>}
                </button>

                {encounterError && (
                  <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>{encounterError}</div>
                )}

                <button onClick={saveEncounterPhoto} disabled={savingEncounter}
                  style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: savingEncounter ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: savingEncounter ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: savingEncounter ? "default" : "pointer" }}>
                  {savingEncounter ? "Enregistrement..." : "Enregistrer le souvenir"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation d'ajout réussi d'une photo de rencontre */}
      {encounterSuccessMsg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 98, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <style>{`
            @keyframes memoryToastPop { 0% { transform: scale(.7); opacity: 0; } 55% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
            @keyframes memoryToastSparkle { 0% { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(160deg); opacity: 0; } }
          `}</style>
          <div style={{ position: "relative", background: "#2D1200", color: "#fff", padding: "12px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,.25)", maxWidth: "88%", textAlign: "center", animation: "memoryToastPop .4s cubic-bezier(.34,1.56,.64,1)" }}>
            {[["-22px", "-16px"], ["24px", "-14px"], ["0px", "-22px"]].map(([tx, ty], idx) => (
              <span key={idx} style={{ position: "absolute", left: "50%", top: 0, fontSize: 12, "--tx": tx, "--ty": ty, animation: `memoryToastSparkle .7s ease-out ${0.1 + idx * 0.07}s both`, pointerEvents: "none" }}>✨</span>
            ))}
            {encounterSuccessMsg}
          </div>
        </div>
      )}

      {/* Espace prestataire */}
      {showProviderScreen && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 65, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button onClick={() => setShowProviderScreen(false)} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>🏥 Espace prestataire</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>
            {loadingSelfSpot ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><PawLogo size={32} color="#E8B89F" /></div>
            ) : pendingClaim ? (
              <div style={{ textAlign: "center", padding: "40px 10px" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Demande en cours de vérification</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 4 }}>Vous avez demandé à revendiquer la fiche <strong>{pendingClaim.name}</strong>. On vous confirme dès que c'est validé de notre côté — généralement sous 24 à 48h.</div>
              </div>
            ) : !selfSpotId ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Créez votre fiche prestataire</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5, marginBottom: 20 }}>Toiletteur, éducateur, pet-sitter, pension... commencez par donner un nom à votre activité. Vous pourrez ensuite ajouter des photos, vos prestations et vos tarifs à votre rythme.</div>

                <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>NOM DE VOTRE ACTIVITÉ *</label>
                <div style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 8px" }}>Le nom affiché dans l'annuaire — celui de votre salon, entreprise, ou simplement le vôtre.</div>
                <input value={newSpotName} onChange={e => { setNewSpotName(e.target.value); setSimilarSpots(null); }} placeholder="Ex: Léa, pet-sitter du 15e"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, marginBottom: 16, fontFamily: "inherit", boxSizing: "border-box" }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>VOTRE CATÉGORIE</label>
                <div style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 8px" }}>Détermine où vous apparaissez dans l'annuaire Prestataires.</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
                  {PROVIDER_TYPES.filter(t => t !== "petshop" && t !== "insurance").map(t => (
                    <button key={t} onClick={() => { setNewSpotCategory(t); setSimilarSpots(null); }} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${newSpotCategory === t ? "#B25F46" : "#E5E7EB"}`, background: newSpotCategory === t ? "#FAF0EB" : "#fff", color: newSpotCategory === t ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{PROVIDER_TYPE_INFO[t].emoji} {PROVIDER_TYPE_INFO[t].label}</button>
                  ))}
                </div>

                {createSpotError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>{createSpotError}</div>}

                {similarSpots === null && (
                  <button onClick={searchForMySpot} disabled={searchingSimilar}
                    style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: searchingSimilar ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: searchingSimilar ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: searchingSimilar ? "default" : "pointer" }}>
                    {searchingSimilar ? "Recherche..." : "Continuer"}
                  </button>
                )}

                {similarSpots !== null && similarSpots.length === 0 && (
                  <button onClick={createMySpot} disabled={creatingSpot}
                    style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: creatingSpot ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: creatingSpot ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: creatingSpot ? "default" : "pointer" }}>
                    {creatingSpot ? "Création..." : "Créer ma fiche"}
                  </button>
                )}

                {similarSpots !== null && similarSpots.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Nous avons trouvé une fiche qui pourrait être la vôtre</div>
                    <div style={{ fontSize: 12.5, color: "#9CA3AF", marginBottom: 16 }}>Est-ce que c'est votre activité ?</div>

                    {similarSpots.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 14, border: "1.5px solid #E5E7EB", marginBottom: 10 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#FAF0EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                          {photoUrl(s.photos?.[0]) ? <img src={photoUrl(s.photos[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : s.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#2D1200" }}>{s.name}</div>
                          <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>{s.address || PROVIDER_TYPE_INFO[s.type]?.label}</div>
                        </div>
                        <button onClick={() => claimExistingSpot(s.id)} disabled={claimingSpotId === s.id}
                          style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "#B25F46", color: "#fff", fontWeight: 700, fontSize: 12, cursor: claimingSpotId === s.id ? "default" : "pointer", flexShrink: 0 }}>
                          {claimingSpotId === s.id ? "..." : "Oui, c'est moi"}
                        </button>
                      </div>
                    ))}

                    <button onClick={createMySpot} disabled={creatingSpot}
                      style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: creatingSpot ? "default" : "pointer", marginTop: 6 }}>
                      {creatingSpot ? "Création..." : "Non, ce n'est pas moi — créer une nouvelle fiche"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Bienvenue dans votre Espace prestataire !</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Toiletteur, éducateur, pet-sitter, pension... proposez vos services aux propriétaires d'animaux près de chez vous. Ajoutez votre première prestation pour apparaître dans l'annuaire, et recevez vos paiements directement une fois la prestation confirmée par les deux parties !</div>
            </div>

            {selfSpotInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#FAF0EB", borderRadius: 16, padding: 14, marginBottom: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {photoUrl(spotPhotos?.[0]) ? <img src={photoUrl(spotPhotos[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (PROVIDER_TYPE_INFO[selfSpotInfo.type]?.emoji || "📍")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: "#2D1200" }}>{selfSpotInfo.name}</div>
                  <div style={{ fontSize: 12, color: "#8B3D28", fontWeight: 600 }}>{PROVIDER_TYPE_INFO[selfSpotInfo.type]?.emoji} {PROVIDER_TYPE_INFO[selfSpotInfo.type]?.label}</div>
                  {selfSpotInfo.description && <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selfSpotInfo.description}</div>}
                </div>
              </div>
            )}

            <button onClick={openEditSpot}
              style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginBottom: 20 }}>
              ✏️ Modifier ma fiche
            </button>

            {/* Statut des paiements */}
            <div style={{ background: connectOnboarded ? "#E8F5E9" : "#FAF0EB", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
              {checkingConnect ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><PawLogo size={22} color="#E8B89F" /><span style={{ fontSize: 13, color: "#6B7280" }}>Vérification en cours...</span></div>
              ) : connectOnboarded ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1B5E20" }}>Paiements activés</div>
                    <div style={{ fontSize: 12, color: "#2E7D32" }}>Vous pouvez proposer des prestations payantes</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#8B3D28", marginBottom: 4 }}>💳 Paiements non activés</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 1.5 }}>Pour recevoir l'argent de vos prestations, activez un compte de paiement sécurisé (5 min, via Stripe) — obligatoire avant de fixer vos tarifs.</div>
                  <button disabled={startingOnboarding} onClick={async () => {
                      setStartingOnboarding(true);
                      try { await startConnectOnboarding(initialData); }
                      catch { setStartingOnboarding(false); }
                    }}
                    style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: startingOnboarding ? "#E5E7EB" : "linear-gradient(135deg,#635BFF,#4338CA)", color: startingOnboarding ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: startingOnboarding ? "default" : "pointer" }}>
                    {startingOnboarding ? "Redirection..." : "⚡ Activer les paiements avec Stripe"}
                  </button>
                </>
              )}
            </div>

            {/* Galerie photo du profil prestataire */}
            {selfSpotId && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 }}>PHOTOS ({spotPhotos.length}/6)</div>
                <div style={{ fontSize: 11.5, color: "#9CA3AF", marginBottom: 10, lineHeight: 1.5 }}>Salon, équipements, animaux toilettés, photo de vous ou de l'équipe... — pas besoin qu'un animal soit visible sur chaque photo.</div>
                <input ref={spotPhotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSpotPhotoAdd} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: spotPhotoError ? 8 : 0 }}>
                  {spotPhotos.map((p, i) => (
                    <div key={i} style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", position: "relative", background: "#000" }}>
                      <img src={photoUrl(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => removeSpotPhoto(i)} style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                    </div>
                  ))}
                  {spotPhotos.length < 6 && (
                    <div onClick={() => !uploadingSpotPhoto && spotPhotoRef.current?.click()}
                      style={{ aspectRatio: "1", borderRadius: 12, background: "#F3F4F6", border: "2px dashed #D1D5DB", cursor: uploadingSpotPhoto ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {uploadingSpotPhoto ? <PawLogo size={20} color="#E8B89F" /> : <span style={{ fontSize: 24, color: "#E8B89F" }}>+</span>}
                    </div>
                  )}
                </div>
                {spotPhotoError && <div style={{ fontSize: 11.5, color: "#DC2626" }}>{spotPhotoError}</div>}
              </div>
            )}

            {/* Transparence commission */}
            <div style={{ display: "flex", gap: 10, background: commissionPromoUntil ? "#FFF8E7" : "#F9FAFB", border: commissionPromoUntil ? "1.5px solid #E8C468" : "none", borderRadius: 12, padding: "12px 14px", marginBottom: 20, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>{commissionPromoUntil ? "🎉" : "ℹ️"}</span>
              <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6 }}>
                {commissionPromoUntil ? (
                  <>
                    <strong style={{ color: "#946800" }}>Offre de lancement : 0% de commission</strong> jusqu'au {new Date(commissionPromoUntil).toLocaleDateString("fr-FR")} ! Le client paie à la réservation ; les fonds sont retenus par Stripe et vous sont intégralement reversés une fois la prestation validée par vous et le client.
                  </>
                ) : (
                  <>Miloute prélève une commission de <strong>{commissionRate}%</strong> sur chaque prestation payée via l'app. Le client paie à la réservation ; les fonds sont retenus par Stripe et vous sont reversés (moins la commission) une fois la prestation validée par vous et le client.</>
                )}
              </div>
            </div>

            {/* Liste des prestations */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>MES PRESTATIONS</div>
              <button onClick={() => connectOnboarded ? setShowAddService(true) : null}
                style={{ background: "none", border: "none", color: connectOnboarded ? "#B25F46" : "#D1D5DB", fontWeight: 700, fontSize: 13, cursor: connectOnboarded ? "pointer" : "default" }}>+ Ajouter</button>
            </div>

            {providerServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>
                {connectOnboarded ? "Aucune prestation pour l'instant." : "Activez les paiements pour ajouter vos prestations."}
              </div>
            ) : providerServices.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: "1px solid #F3F4F6", opacity: s.active ? 1 : 0.5 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{s.title}</div>
                  {s.description && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{s.description}</div>}
                  <div style={{ fontSize: 12, color: "#8B3D28", marginTop: 2 }}>
                    {(s.priceCents / 100).toFixed(2)} € · vous touchez {((s.priceCents / 100) * (1 - commissionRate / 100)).toFixed(2)} €
                  </div>
                </div>
                <button onClick={async () => { await updateProviderService(s.id, { active: !s.active }); setProviderServices(await fetchProviderServices(initialData.id)); }}
                  style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>
                  {s.active ? "Désactiver" : "Réactiver"}
                </button>
                <button onClick={async () => { await deleteProviderService(s.id); setProviderServices(await fetchProviderServices(initialData.id)); }}
                  style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#DC2626" }}>🗑️</button>
              </div>
            ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modification / suppression de la fiche prestataire */}
      {showEditSpot && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 82, display: "flex", alignItems: "flex-end" }} onClick={() => !savingSpotEdit && !deletingSpot && setShowEditSpot(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90%", overflowY: "auto", padding: "20px 20px 32px" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 14 }}>Modifier ma fiche</div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>NOM DE VOTRE ACTIVITÉ *</label>
            <input value={editSpotName} onChange={e => setEditSpotName(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 16px", fontFamily: "inherit", boxSizing: "border-box" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>CATÉGORIE</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", margin: "6px 0 16px" }}>
              {PROVIDER_TYPES.filter(t => t !== "petshop" && t !== "insurance").map(t => (
                <button key={t} onClick={() => setEditSpotCategory(t)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${editSpotCategory === t ? "#B25F46" : "#E5E7EB"}`, background: editSpotCategory === t ? "#FAF0EB" : "#fff", color: editSpotCategory === t ? "#B25F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{PROVIDER_TYPE_INFO[t].emoji} {PROVIDER_TYPE_INFO[t].label}</button>
              ))}
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>DESCRIPTION (optionnel)</label>
            <textarea value={editSpotDescription} onChange={e => setEditSpotDescription(e.target.value)} rows={3} placeholder="Présentez votre activité..."
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 16px", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />

            {editSpotError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>{editSpotError}</div>}

            <button onClick={saveSpotEdit} disabled={savingSpotEdit}
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: savingSpotEdit ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: savingSpotEdit ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: savingSpotEdit ? "default" : "pointer", marginBottom: 24 }}>
              {savingSpotEdit ? "Enregistrement..." : "Enregistrer"}
            </button>

            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", letterSpacing: 1, marginBottom: 8 }}>ZONE DE DANGER</div>
              {deleteSpotError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>{deleteSpotError}</div>}
              {!confirmDeleteSpot ? (
                <button onClick={() => setConfirmDeleteSpot(true)}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1.5px solid #FCA5A5", background: "#fff", color: "#DC2626", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  🗑️ Supprimer ma fiche
                </button>
              ) : (
                <div style={{ background: "#FEF2F2", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.5, marginBottom: 14 }}>Supprimer votre fiche retirera aussi vos photos et vos prestations de l'annuaire. Cette action est irréversible. Confirmez-vous ?</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setConfirmDeleteSpot(false)} disabled={deletingSpot}
                      style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Annuler
                    </button>
                    <button onClick={handleDeleteSpot} disabled={deletingSpot}
                      style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: deletingSpot ? "#E5E7EB" : "#DC2626", color: deletingSpot ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: deletingSpot ? "default" : "pointer" }}>
                      {deletingSpot ? "..." : "Oui, supprimer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout de prestation */}
      {showAddService && (
        <AddServiceForm
          userProfile={initialData}
          spotId={selfSpotId}
          onClose={() => setShowAddService(false)}
          onAdded={async () => {
            setShowAddService(false);
            setProviderServices(await fetchProviderServices(initialData.id));
            if (!initialData?.questsCompleted?.become_provider) {
              claimQuest(initialData, "become_provider").then(result => {
                if (result.claimed) onProfileUpdated({ ...initialData, giftInventory: result.giftInventory, questsCompleted: result.questsCompleted });
              }).catch(() => {});
            }
          }}
        />
      )}

      {/* Mes réservations */}
      {showBookingsModal && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 65, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button onClick={() => setShowBookingsModal(false)} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>📅 Mes réservations</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Suivez toutes vos réservations en un coup d'œil</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Que vous soyez client ou prestataire, retrouvez ici l'historique de vos prestations réservées et reçues, leur statut, et confirmez-les une fois la prestation terminée pour libérer le paiement.</div>
            </div>

            {bookingConfirmError && (
              <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>{bookingConfirmError}</div>
            )}
            {loadingBookings ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><PawLogo size={32} color="#E8B89F" /></div>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 }}>EN TANT QUE CLIENT</div>
                {myBookingsAsClient.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Aucune réservation pour l'instant.</div>
                ) : myBookingsAsClient.map(b => (
                  <BookingRow key={b.id} booking={b} onConfirm={handleConfirmBooking} confirming={confirmingBookingId === b.id} onCancel={id => setConfirmCancelBooking(id)} cancelling={cancellingBookingId === b.id} />
                ))}

                <div style={{ height: 1, background: "#F3F4F6", margin: "20px 0" }} />

                <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 }}>REÇUES EN TANT QUE PRESTATAIRE</div>
                {myBookingsAsProvider.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9CA3AF" }}>Aucune réservation reçue pour l'instant.</div>
                ) : myBookingsAsProvider.map(b => (
                  <BookingRow key={b.id} booking={b} onConfirm={handleConfirmBooking} confirming={confirmingBookingId === b.id} onCancel={id => setConfirmCancelBooking(id)} cancelling={cancellingBookingId === b.id} isProvider />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation d'annulation de réservation */}
      {confirmCancelBooking && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 95, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => !cancellingBookingId && setConfirmCancelBooking(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>↩️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>Annuler cette réservation ?</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}>Le client sera intégralement remboursé. Cette action est irréversible et n'est possible que si personne n'a encore confirmé la prestation.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCancelBooking(null)} disabled={!!cancellingBookingId}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Garder la réservation
              </button>
              <button onClick={handleCancelBooking} disabled={!!cancellingBookingId}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: cancellingBookingId ? "#E5E7EB" : "#DC2626", color: cancellingBookingId ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 13, cursor: cancellingBookingId ? "default" : "pointer" }}>
                {cancellingBookingId ? "..." : "Oui, annuler et rembourser"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boutique Miloute */}
      {showShopModal && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 65, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button onClick={() => setShowShopModal(false)} style={{ background: "#FAF0EB", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 16, cursor: "pointer", color: "#8B3D28" }}>←</button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#2D1200" }}>🛍️ Boutique Miloute</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Offrez une friandise ou un cadeau à celui ou celle qui compte 🐾</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Un geste qui se remarque — dans Découvrir pour attirer l'attention, ou directement dans vos conversations pour faire plaisir à un match.</div>
            </div>

            {/* Récapitulatif de l'inventaire possédé */}
            {(() => {
              const owned = GIFT_CATALOG.filter(g => (initialData?.giftInventory?.[g.id] || 0) > 0);
              if (owned.length === 0) return null;
              return (
                <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "12px 14px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 }}>MON INVENTAIRE</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {owned.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: "5px 10px 5px 6px" }}>
                        <span style={{ fontSize: 16 }}>{g.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#2D1200" }}>{initialData.giftInventory[g.id]}</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 }}>PACKS (prix réduit)</div>
            {GIFT_BUNDLES.filter(b => b.species === "both" || b.species === initialData?.species).map(b => {
              const locked = b.premiumOnly && !isPremium;
              return (
              <div key={b.id} onClick={() => { if (buyingItemId === b.id) return; locked ? onPremium() : buyItem(null, b.id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: b.premiumOnly ? "linear-gradient(135deg,#FFF8E7,#FFEFC7)" : "linear-gradient(135deg,#FAF0EB,#F3E0D3)", borderRadius: 14, marginBottom: 10, border: b.premiumOnly ? "1.5px solid #E8C468" : "1.5px solid #E8B89F", cursor: buyingItemId === b.id ? "default" : "pointer" }}>
                <span style={{ fontSize: 24, opacity: locked ? 0.5 : 1 }}>{b.items.map(id => GIFT_CATALOG.find(g => g.id === id)?.emoji).join("")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200", display: "flex", alignItems: "center", gap: 5 }}>
                    {b.label}
                    {b.premiumOnly && <span style={{ fontSize: 9, fontWeight: 800, color: "#946800", background: "rgba(148,104,0,.12)", padding: "2px 6px", borderRadius: 8 }}>👑 PREMIUM</span>}
                  </div>
                  {b.premiumOnly && (
                    <div style={{ fontSize: 10.5, color: "#946800", marginTop: 2, marginBottom: 2 }}>Réservé aux membres Premium — à prix réduit une fois débloqué</div>
                  )}
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                    <span style={{ textDecoration: "line-through" }}>{b.originalPrice}</span> → <span style={{ color: "#B25F46", fontWeight: 700 }}>{b.price}</span>
                  </div>
                </div>
                <button disabled={buyingItemId === b.id}
                  style={{ background: buyingItemId === b.id ? "#E5E7EB" : locked ? "#fff" : "linear-gradient(135deg,#B25F46,#C97A5E)", border: locked ? "1.5px solid #E8C468" : "none", borderRadius: 10, color: buyingItemId === b.id ? "#9CA3AF" : locked ? "#946800" : "#fff", fontWeight: 700, fontSize: 13, padding: "8px 14px", cursor: buyingItemId === b.id ? "default" : "pointer" }}>
                  {buyingItemId === b.id ? "..." : locked ? "🔒" : b.price}
                </button>
              </div>
              );
            })}

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, margin: "16px 0 10px" }}>FRIANDISES</div>
            {GIFT_CATALOG.filter(g => g.category === "food" && (g.species === "both" || g.species === initialData?.species)).sort((a, b) => parseGiftPrice(a.price) - parseGiftPrice(b.price)).map(g => {
              const owned = initialData?.giftInventory?.[g.id] || 0;
              const locked = g.premiumOnly && !isPremium;
              return (
                <div key={g.id} onClick={() => { if (buyingItemId === g.id) return; locked ? onPremium() : buyItem(g.id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: g.premiumOnly ? "linear-gradient(135deg,#FFF8E7,#FFEFC7)" : "#F9FAFB", borderRadius: 14, marginBottom: 10, border: g.premiumOnly ? "1.5px solid #E8C468" : "none", cursor: buyingItemId === g.id ? "default" : "pointer" }}>
                  <span style={{ fontSize: 24, opacity: locked ? 0.5 : 1 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200", display: "flex", alignItems: "center", gap: 5 }}>
                      {g.label}
                      {g.premiumOnly && <span style={{ fontSize: 9, fontWeight: 800, color: "#946800", background: "rgba(148,104,0,.12)", padding: "2px 6px", borderRadius: 8 }}>👑 PREMIUM</span>}
                    </div>
                    {owned > 0 && <div style={{ fontSize: 11, color: "#8B3D28" }}>Vous en avez {owned}</div>}
                  </div>
                  <button disabled={buyingItemId === g.id}
                    style={{ background: buyingItemId === g.id ? "#E5E7EB" : locked ? "#fff" : "linear-gradient(135deg,#B25F46,#C97A5E)", border: locked ? "1.5px solid #E8C468" : "none", borderRadius: 10, color: buyingItemId === g.id ? "#9CA3AF" : locked ? "#946800" : "#fff", fontWeight: 700, fontSize: 13, padding: "8px 14px", cursor: buyingItemId === g.id ? "default" : "pointer" }}>
                    {buyingItemId === g.id ? "..." : locked ? "🔒" : g.price}
                  </button>
                </div>
              );
            })}

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, margin: "16px 0 10px" }}>CADEAUX</div>
            {GIFT_CATALOG.filter(g => g.category === "gift" && (g.species === "both" || g.species === initialData?.species)).sort((a, b) => parseGiftPrice(a.price) - parseGiftPrice(b.price)).map(g => {
              const owned = initialData?.giftInventory?.[g.id] || 0;
              const locked = g.premiumOnly && !isPremium;
              return (
                <div key={g.id} onClick={() => { if (buyingItemId === g.id) return; locked ? onPremium() : buyItem(g.id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: g.premiumOnly ? "linear-gradient(135deg,#FFF8E7,#FFEFC7)" : "#F9FAFB", borderRadius: 14, marginBottom: 10, border: g.premiumOnly ? "1.5px solid #E8C468" : "none", cursor: buyingItemId === g.id ? "default" : "pointer" }}>
                  <span style={{ fontSize: 24, opacity: locked ? 0.5 : 1 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200", display: "flex", alignItems: "center", gap: 5 }}>
                      {g.label}
                      {g.premiumOnly && <span style={{ fontSize: 9, fontWeight: 800, color: "#946800", background: "rgba(148,104,0,.12)", padding: "2px 6px", borderRadius: 8 }}>👑 PREMIUM</span>}
                    </div>
                    {owned > 0 && <div style={{ fontSize: 11, color: "#8B3D28" }}>Vous en avez {owned}</div>}
                  </div>
                  <button disabled={buyingItemId === g.id}
                    style={{ background: buyingItemId === g.id ? "#E5E7EB" : locked ? "#fff" : "linear-gradient(135deg,#B25F46,#C97A5E)", border: locked ? "1.5px solid #E8C468" : "none", borderRadius: 10, color: buyingItemId === g.id ? "#9CA3AF" : locked ? "#946800" : "#fff", fontWeight: 700, fontSize: 13, padding: "8px 14px", cursor: buyingItemId === g.id ? "default" : "pointer" }}>
                    {buyingItemId === g.id ? "..." : locked ? "🔒" : g.price}
                  </button>
                </div>
              );
            })}

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, margin: "16px 0 10px" }}>CONFORT & ACCESSOIRES</div>
            {GIFT_CATALOG.filter(g => g.category === "comfort" && (g.species === "both" || g.species === initialData?.species)).sort((a, b) => parseGiftPrice(a.price) - parseGiftPrice(b.price)).map(g => {
              const owned = initialData?.giftInventory?.[g.id] || 0;
              const locked = g.premiumOnly && !isPremium;
              return (
                <div key={g.id} onClick={() => { if (buyingItemId === g.id) return; locked ? onPremium() : buyItem(g.id); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: g.premiumOnly ? "linear-gradient(135deg,#FFF8E7,#FFEFC7)" : "#F9FAFB", borderRadius: 14, marginBottom: 10, border: g.premiumOnly ? "1.5px solid #E8C468" : "none", cursor: buyingItemId === g.id ? "default" : "pointer" }}>
                  <span style={{ fontSize: 24, opacity: locked ? 0.5 : 1 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200", display: "flex", alignItems: "center", gap: 5 }}>
                      {g.label}
                      {g.premiumOnly && <span style={{ fontSize: 9, fontWeight: 800, color: "#946800", background: "rgba(148,104,0,.12)", padding: "2px 6px", borderRadius: 8 }}>👑 PREMIUM</span>}
                    </div>
                    {owned > 0 && <div style={{ fontSize: 11, color: "#8B3D28" }}>Vous en avez {owned}</div>}
                  </div>
                  <button disabled={buyingItemId === g.id}
                    style={{ background: buyingItemId === g.id ? "#E5E7EB" : locked ? "#fff" : "linear-gradient(135deg,#B25F46,#C97A5E)", border: locked ? "1.5px solid #E8C468" : "none", borderRadius: 10, color: buyingItemId === g.id ? "#9CA3AF" : locked ? "#946800" : "#fff", fontWeight: 700, fontSize: 13, padding: "8px 14px", cursor: buyingItemId === g.id ? "default" : "pointer" }}>
                    {buyingItemId === g.id ? "..." : locked ? "🔒" : g.price}
                  </button>
                </div>
              );
            })}

            {/* Quêtes ponctuelles — gagner gratuitement, sous les articles pour ne pas surcharger l'ouverture */}
            <div style={{ background: "#FAF0EB", borderRadius: 14, padding: "12px 14px", marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8B3D28", letterSpacing: 1, marginBottom: 10 }}>🎯 QUÊTES — À GAGNER GRATUITEMENT</div>
              {QUEST_LIST.map(q => {
                const done = !!initialData?.questsCompleted?.[q.id];
                return (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <span style={{ fontSize: 18, opacity: done ? 0.5 : 1 }}>{done ? "✅" : q.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#9CA3AF" : "#2D1200", textDecoration: done ? "line-through" : "none" }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{q.rewardLabel(initialData?.species)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {shopError && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>{shopError}</div>}
          </div>
        </div>
      )}

    </div>
  );
}

function BookingRow({ booking: b, onConfirm, confirming, onCancel, cancelling, isProvider = false }) {
  const canCancel = b.status === "paid_held" && !b.clientConfirmed && !b.providerConfirmed;
  return (
    <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{b.serviceTitle}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{isProvider ? "Client" : "Prestataire"} : {b.counterpartName} · {b.time}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#8B3D28" }}>{(b.priceCents / 100).toFixed(2)} €</div>
          {isProvider && <div style={{ fontSize: 10, color: "#9CA3AF" }}>vous touchez {(b.payoutCents / 100).toFixed(2)} €</div>}
        </div>
      </div>

      {b.status === "released" ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32" }}>✅ Terminée — fonds reversés</div>
      ) : b.status === "cancelled" ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>↩️ Annulée — remboursée</div>
      ) : b.myConfirmed ? (
        <div style={{ fontSize: 12, color: "#B25F46" }}>✓ Vous avez confirmé — en attente de {isProvider ? "l'avis du client" : "l'avis du prestataire"}</div>
      ) : (
        <>
          <button onClick={() => onConfirm(b.id)} disabled={confirming || cancelling}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: confirming ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: confirming ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 12, cursor: confirming ? "default" : "pointer", marginBottom: canCancel ? 8 : 0 }}>
            {confirming ? "..." : "✅ Confirmer la prestation terminée"}
          </button>
          {canCancel && (
            <button onClick={() => onCancel(b.id)} disabled={confirming || cancelling}
              style={{ width: "100%", padding: "8px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", color: cancelling ? "#9CA3AF" : "#6B7280", fontWeight: 600, fontSize: 12, cursor: cancelling ? "default" : "pointer" }}>
              {cancelling ? "..." : "Annuler et rembourser"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AddServiceForm({ userProfile, spotId, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    const priceNum = parseFloat(price.replace(",", "."));
    if (!title.trim()) { setError("Le titre est requis."); return; }
    if (!priceNum || priceNum <= 0) { setError("Indiquez un prix valide."); return; }
    setError(null);
    setSubmitting(true);
    if (description.trim()) {
      const modResult = await moderateText(description, "service_description");
      if (!modResult.approved) {
        setError(modResult.reason || "Ce texte enfreint les règles de Miloute.");
        setSubmitting(false);
        return;
      }
    }
    try {
      await createProviderService(userProfile, { title: title.trim(), description: description.trim(), priceCents: Math.round(priceNum * 100), spotId });
      onAdded();
    } catch {
      setError("L'ajout a échoué, réessayez.");
    }
    setSubmitting(false);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 80, display: "flex", alignItems: "flex-end" }} onClick={() => !submitting && onClose()}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "90%", overflowY: "auto", padding: "20px 20px 32px" }}>
        <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 14 }}>Ajouter une prestation</div>

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>TITRE *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Garde à domicile (journée)"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 14px", fontFamily: "inherit", boxSizing: "border-box" }} />

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>PRIX (€) *</label>
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex: 25" inputMode="decimal"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 14px", fontFamily: "inherit", boxSizing: "border-box" }} />

        <label style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>DESCRIPTION (optionnel)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Détails de la prestation..."
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, margin: "6px 0 16px", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />

        {error && <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: submitting ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: submitting ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 15, cursor: submitting ? "default" : "pointer" }}>
          {submitting ? "Ajout en cours..." : "Ajouter la prestation"}
        </button>
      </div>
    </div>
  );
}



// ── PREMIUM PAYMENT TUNNEL ────────────────────────────────────────────────────
const PLANS = [
  { id: "monthly", label: "Mensuel", price: "4,99", period: "mois", badge: null, savings: null },
  { id: "yearly",  label: "Annuel",  price: "39,99", period: "an", badge: "POPULAIRE", savings: "Économisez 20 €" },
];

const FEATURES = [
  ["🎁", "Articles exclusifs de la Boutique"],
  ["💝", "Boîte à Souvenirs de vos cadeaux"],
  ["🌱", "Accès reproduction complète"],
  ["🏆", "Publier dans la communauté"],
  ["📊", "Statistiques avancées"],
];

function PremiumTunnel({ onClose, onSuccess, initialPlan = "yearly", userProfile = null }) {
  const [step, setStep] = useState("plans"); // plans | payment | success
  const [plan, setPlan] = useState(initialPlan);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const selectedPlan = PLANS.find(p => p.id === plan);

  async function goToStripeCheckout() {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch(apiUrl("/api/create-checkout-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, profileId: userProfile?.id, userId: userProfile?.userId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckoutError(data.error || "Erreur inconnue");
        setCheckoutLoading(false);
      }
    } catch (err) {
      setCheckoutError("Impossible de contacter le serveur de paiement.");
      setCheckoutLoading(false);
    }
  }

  function formatCardNumber(v) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0,2) + "/" + d.slice(2) : d;
  }

  function validate() {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Numéro invalide";
    if (card.expiry.length < 5) e.expiry = "Date invalide";
    if (card.cvc.length < 3) e.cvc = "CVC invalide";
    if (!card.name.trim()) e.name = "Nom requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function pay() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("success"); }, 2200);
  }

  const inputBase = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border .15s" };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 80, display: "flex", alignItems: "flex-end" }}
      onClick={step !== "success" ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "28px 28px 0 0", width: "100%", maxHeight: "92%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Handle */}
        <div style={{ flexShrink: 0, padding: "12px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: 28 }} />
          <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2 }} />
          {step !== "success" ? (
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F3F4F6", color: "#6B7280", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          ) : <div style={{ width: 28 }} />}
        </div>

        {/* ── STEP 1 : Plans ── */}
        {step === "plans" && (
          <div style={{ overflowY: "auto", padding: "8px 20px 36px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>👑</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#2D1200", marginBottom: 6 }}>Miloute Premium</div>
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6 }}>Donnez à votre animal les meilleures chances de trouver son partenaire idéal.</div>
            </div>

            {/* Features */}
            <div style={{ background: "#FAF0EB", borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>👁️</span>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Voir qui craque pour {userProfile?.name || "votre animal"}</span>
                <span style={{ marginLeft: "auto", fontSize: 14, color: "#2E7D32" }}>✓</span>
              </div>
              {FEATURES.map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 14, color: "#2E7D32" }}>✓</span>
                </div>
              ))}
            </div>

            {/* Plan selector */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {PLANS.map(p => (
                <div key={p.id} onClick={() => setPlan(p.id)}
                  style={{ flex: 1, padding: "14px 10px", borderRadius: 16, border: `2px solid ${plan === p.id ? "#B25F46" : "#E5E7EB"}`, background: plan === p.id ? "#FAF0EB" : "#F9FAFB", cursor: "pointer", textAlign: "center", position: "relative", transition: "all .2s" }}>
                  {p.badge && (
                    <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 10, whiteSpace: "nowrap" }}>{p.badge}</div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan === p.id ? "#B25F46" : "#6B7280", marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#2D1200" }}>{p.price} €</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>par {p.period}</div>
                  {p.savings && <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D32", marginTop: 4 }}>{p.savings}</div>}
                </div>
              ))}
            </div>

            {plan === "yearly" && (
              <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>
                Soit <strong style={{ color: "#B25F46" }}>3,33 € / mois</strong> — 2 mois offerts 🎁
              </div>
            )}

            <button onClick={goToStripeCheckout} disabled={checkoutLoading}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: checkoutLoading ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: checkoutLoading ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 16, cursor: checkoutLoading ? "default" : "pointer", boxShadow: checkoutLoading ? "none" : "0 6px 20px rgba(178,95,70,.35)" }}>
              {checkoutLoading ? "Redirection vers Stripe..." : `Continuer → ${selectedPlan.price} € / ${selectedPlan.period}`}
            </button>

            {checkoutError && (
              <div style={{ textAlign: "center", fontSize: 12, color: "#DC2626", marginTop: 10 }}>{checkoutError}</div>
            )}

            <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 12, lineHeight: 1.6 }}>
              Résiliation à tout moment · Paiement sécurisé via Stripe 🔒<br/>En continuant vous acceptez nos CGU et politique de confidentialité.
            </div>
          </div>
        )}

        {/* ── STEP 2 : Paiement ── */}
        {step === "payment" && (
          <div style={{ overflowY: "auto", padding: "8px 20px 36px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 20px" }}>
              <button onClick={() => setStep("plans")} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200" }}>Informations de paiement</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Plan {selectedPlan.label} · {selectedPlan.price} € / {selectedPlan.period}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 20 }}>🔒</div>
            </div>

            {/* Card brand icons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["💳 Visa","💳 Mastercard","💳 Amex"].map(b => (
                <div key={b} style={{ flex: 1, padding: "6px 0", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", textAlign: "center", fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{b}</div>
              ))}
            </div>

            {/* Card number */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>NUMÉRO DE CARTE</div>
              <div style={{ position: "relative" }}>
                <input
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  style={{ ...inputBase, border: `1.5px solid ${errors.number ? "#EF4444" : card.number ? "#8B3D28" : "#E5E7EB"}`, paddingRight: 44 }}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>💳</span>
              </div>
              {errors.number && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{errors.number}</div>}
            </div>

            {/* Expiry + CVC */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>DATE D'EXPIRATION</div>
                <input
                  value={card.expiry}
                  onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  placeholder="MM/AA"
                  maxLength={5}
                  style={{ ...inputBase, border: `1.5px solid ${errors.expiry ? "#EF4444" : card.expiry ? "#8B3D28" : "#E5E7EB"}` }}
                />
                {errors.expiry && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{errors.expiry}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>CVC</div>
                <input
                  value={card.cvc}
                  onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g,"").slice(0,3) }))}
                  placeholder="123"
                  maxLength={3}
                  type="password"
                  style={{ ...inputBase, border: `1.5px solid ${errors.cvc ? "#EF4444" : card.cvc ? "#8B3D28" : "#E5E7EB"}` }}
                />
                {errors.cvc && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{errors.cvc}</div>}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>NOM SUR LA CARTE</div>
              <input
                value={card.name}
                onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                placeholder="Jean Dupont"
                style={{ ...inputBase, border: `1.5px solid ${errors.name ? "#EF4444" : card.name ? "#8B3D28" : "#E5E7EB"}` }}
              />
              {errors.name && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{errors.name}</div>}
            </div>

            {/* Order summary */}
            <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: "#4B5563" }}>Miloute Premium {selectedPlan.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{selectedPlan.price} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>TVA (20%)</span>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>incluse</span>
              </div>
              <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#2D1200" }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#B25F46" }}>{selectedPlan.price} €</span>
              </div>
            </div>

            <button onClick={pay} disabled={loading}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: loading ? "#D1D5DB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 6px 20px rgba(178,95,70,.35)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? (
                <>
                  <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Traitement en cours...
                </>
              ) : `🔒 Payer ${selectedPlan.price} €`}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 12 }}>
              Paiement sécurisé par Stripe · Données chiffrées SSL
            </div>
          </div>
        )}

        {/* ── STEP 3 : Succès ── */}
        {step === "success" && (
          <div style={{ padding: "24px 24px 48px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#B25F46,#C97A5E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20, boxShadow: "0 8px 24px rgba(178,95,70,.35)" }}>👑</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 8 }}>Bienvenue Premium !</div>
            <div style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
              Votre abonnement {selectedPlan.label} est activé.<br/>
              <strong style={{ color: "#B25F46" }}>Toutes les fonctionnalités Premium</strong> sont maintenant disponibles pour votre animal
            </div>

            <div style={{ width: "100%", background: "#FAF0EB", borderRadius: 16, padding: "16px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                <span style={{ fontSize: 18 }}>👁️</span>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Voir qui craque pour {userProfile?.name || "votre animal"}</span>
                <span style={{ marginLeft: "auto", color: "#2E7D32", fontWeight: 700 }}>✓</span>
              </div>
              {FEATURES.map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{label}</span>
                  <span style={{ marginLeft: "auto", color: "#2E7D32", fontWeight: 700 }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 24 }}>
              Prochain renouvellement : {plan === "yearly" ? "dans 1 an" : "dans 1 mois"}<br/>
              Résiliation possible à tout moment dans les paramètres.
            </div>

            <button onClick={onSuccess}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              C'est parti !
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
const OB_TEMPER = ["Joueur","Affectueux","Curieux","Câlin","Calme","Énergique","Indépendant","Sociable","Timide","Gourmand"];
const OB_SEEKING = [
  { id: "Play date",        icon: "🎾", label: "Play date",          desc: "Rencontre ponctuelle de jeu" },
  { id: "Compagnon de vie", icon: "🏠", label: "Compagnon de vie",   desc: "Un ami pour la maison, au quotidien" },
  { id: "Balade",           icon: "🦮", label: "Balade",             desc: "Partenaire de sortie régulier" },
  { id: "Dog date",         icon: "🐕", label: "Dog date",           desc: "Sortie sociale détendue entre chiens" },
  { id: "Cat date",         icon: "🐱", label: "Cat date",           desc: "Rencontre tranquille entre chats" },
  { id: "Reproduction",     icon: "🌱", label: "Reproduction",       desc: "Saillie sérieuse et vérifiée" },
];

function Onboarding({ onComplete, initialOwner = null, onBack = null }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward -1=back
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const photoRef = useRef(null);

  const [form, setForm] = useState({
    ownerName: initialOwner?.name || "", ownerEmail: initialOwner?.email || "", ownerPassword: "",
    petName: "", species: "", breed: "", age: "", gender: "",
    energy: 3, vaccinated: false, sterilized: false,
    temper: [], seeking: [],
    bio: "", photos: [],
    providerInterest: null, // "provider" | "interested" | "no" | null
    location: null, // { lat, lng } — optionnellement rempli à l'étape "location" de l'onboarding
    photoCaptions: [], // phrases d'accroche, un index par photo (chaîne vide = aucune)
    showMainCaption: true, // affichage de la phrase sur la photo principale (optionnel, activé par défaut)
  });

  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [captionEditorIndex, setCaptionEditorIndex] = useState(null); // index de la photo en cours d'édition, ou null
  const [captionDraft, setCaptionDraft] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const [savingCaption, setSavingCaption] = useState(false);
  const [captionError, setCaptionError] = useState(null);

  function openCaptionEditor(i) {
    setCaptionDraft(form.photoCaptions[i] || "");
    setCaptionError(null);
    setCaptionEditorIndex(i);
  }

  async function saveCaptionDraft() {
    const trimmed = captionDraft.trim().slice(0, PHOTO_CAPTION_MAX_LENGTH);
    if (!trimmed) {
      setForm(f => {
        const next = [...f.photoCaptions];
        next[captionEditorIndex] = "";
        return { ...f, photoCaptions: next };
      });
      setCaptionEditorIndex(null);
      return;
    }
    setSavingCaption(true);
    setCaptionError(null);
    const { approved, reason } = await moderateText(trimmed);
    setSavingCaption(false);
    if (!approved) {
      setCaptionError(reason || "Cette phrase n'est pas autorisée, essayez une autre formulation.");
      return;
    }
    setForm(f => {
      const next = [...f.photoCaptions];
      next[captionEditorIndex] = trimmed;
      return { ...f, photoCaptions: next };
    });
    setCaptionEditorIndex(null);
  }

  async function generateCaptionForDraft() {
    setGeneratingCaption(true);
    const caption = await generatePhotoCaption(form.species, form.breed, form.temper, form.petName);
    if (caption) setCaptionDraft(caption);
    setGeneratingCaption(false);
  }

  function shareLocationOnboarding() {
    if (!navigator.geolocation) { setLocationError("La géolocalisation n'est pas supportée par ce navigateur."); return; }
    setSharingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set("location", { lat: position.coords.latitude, lng: position.coords.longitude });
        setSharingLocation(false);
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? "Position refusée — vous pourrez l'activer plus tard dans votre profil."
          : "Impossible de récupérer votre position.");
        setSharingLocation(false);
      }
    );
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail);
  // Avec Google, le compte est déjà authentifié : pas besoin de mot de passe ni de re-vérifier l'email.
  const canSubmitOwner = initialOwner
    ? form.ownerName.trim()
    : form.ownerName.trim() && isValidEmail && form.ownerPassword.length >= 6;
  function toggleArr(k, v) { setForm(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v] })); }
  function toggleTemper(t) { setForm(f => ({ ...f, temper: f.temper.includes(t) ? f.temper.filter(x => x !== t) : f.temper.length < 4 ? [...f.temper, t] : f.temper })); }

  const [moderatingMedia, setModeratingMedia] = useState(false);
  const [mediaModerationError, setMediaModerationError] = useState(null);

  async function handlePhotoAdd(e) {
    const files = Array.from(e.target.files).slice(0, 6 - form.photos.length);
    e.target.value = "";
    if (files.length === 0) return;
    setMediaModerationError(null);
    setModeratingMedia(true);
    const approved = [];
    for (const f of files) {
      try {
        const base64 = await fileToBase64(f);
        const result = await moderateImage(base64, f.type || "image/jpeg");
        if (result.approved) {
          // On garde le fichier brut (pas encore de compte = pas encore de dossier
          // Storage) : l'upload réel se fait à la toute fin, dans completeOnboarding.
          approved.push({ url: URL.createObjectURL(f), name: f.name, file: f });
        } else {
          setMediaModerationError(result.reason || "Photo refusée : seules les photos de chats et chiens, au contenu approprié, sont autorisées.");
        }
      } catch {
        setMediaModerationError("Impossible de vérifier cette photo, réessayez.");
      }
    }
    if (approved.length) setForm(f => ({ ...f, photos: [...f.photos, ...approved] }));
    setModeratingMedia(false);
  }

  function next() { setDirection(1); setStep(s => s + 1); }
  function back() { setDirection(-1); setStep(s => s - 1); }

  const STEPS = [
    "owner", "species", "identity", "health",
    "character", "seeking", "photos", "bio", "provider", "location", "recap"
  ];
  const current = STEPS[step];
  const progress = step / (STEPS.length - 1);

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", fontSize: 15, outline: "none", background: "#F9FAFB", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8, display: "block" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

      {/* Progress bar */}
      <div style={{ padding: "14px 20px 0", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {step > 0 ? (
            <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF", padding: 0, flexShrink: 0 }}>←</button>
          ) : onBack ? (
            <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF", padding: 0, flexShrink: 0 }}>←</button>
          ) : null}
          <div style={{ flex: 1, height: 5, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#B25F46,#C97A5E)", width: `${progress * 100}%`, transition: "width .4s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, flexShrink: 0 }}>{step}/{STEPS.length - 1}</span>
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 16px" }}>

        {/* ── OWNER ── */}
        {current === "owner" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Parlez-nous de vous 👤</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 16, lineHeight: 1.6 }}>Ces informations restent privées et ne sont pas visibles sur le profil de votre animal.</div>
            {initialOwner && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534", fontWeight: 600 }}>
                ✅ Connecté avec Google ({initialOwner.email})
              </div>
            )}
            <label style={labelStyle}>VOTRE PRÉNOM</label>
            <input value={form.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="Ex: Marie" style={{ ...inputStyle, marginBottom: 16 }} />
            {!initialOwner && (
              <>
                <label style={labelStyle}>VOTRE EMAIL</label>
                <input value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} placeholder="marie@email.com" type="email" style={{ ...inputStyle, marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>Pour recevoir vos matchs et notifications.</div>
                <label style={labelStyle}>MOT DE PASSE</label>
                <input value={form.ownerPassword} onChange={e => set("ownerPassword", e.target.value)} placeholder="6 caractères minimum" type="password" style={{ ...inputStyle, marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 24 }}>Pour retrouver votre compte sur un autre appareil.</div>
              </>
            )}
            <button onClick={next} disabled={!canSubmitOwner}
              style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: canSubmitOwner ? "pointer" : "default",
                background: canSubmitOwner ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB",
                color: canSubmitOwner ? "#fff" : "#9CA3AF" }}>
              Continuer →
            </button>
          </div>
        )}

        {/* ── LOCATION ── */}
        {/* ── SPECIES ── */}
        {current === "species" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Quel est votre animal ?</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 28 }}>Le profil sera adapté à son espèce.</div>
            <div style={{ display: "flex", gap: 14, marginBottom: 40 }}>
              {[["cat","🐱","Chat"],["dog","🐕","Chien"]].map(([v,e,l]) => (
                <div key={v} onClick={() => set("species", v)}
                  style={{ flex: 1, padding: "28px 16px", borderRadius: 20, border: `3px solid ${form.species === v ? "#B25F46" : "#E5E7EB"}`, background: form.species === v ? "#FAF0EB" : "#F9FAFB", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                  <div style={{ fontSize: 56, marginBottom: 10 }}>{e}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: form.species === v ? "#B25F46" : "#2D1200" }}>{l}</div>
                </div>
              ))}
            </div>
          <div style={{ marginTop: 24 }}>
              <button onClick={next} disabled={!form.species}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: form.species ? "pointer" : "default",
                  background: form.species ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB",
                  color: form.species ? "#fff" : "#9CA3AF" }}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── IDENTITY ── */}
        {current === "identity" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Son identité {form.species === "cat" ? "🐱" : "🐕"}</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Ces infos apparaîtront sur son profil public.</div>

            <label style={labelStyle}>PRÉNOM</label>
            <input value={form.petName} onChange={e => set("petName", e.target.value)} placeholder={form.species === "cat" ? "Ex: Luna, Mochi..." : "Ex: Rocky, Bella..."} style={{ ...inputStyle, marginBottom: 16 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>RACE</label>
                <BreedInput value={form.breed} onChange={v => set("breed", v)} species={form.species} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ÂGE</label>
                <input value={form.age} onChange={e => set("age", e.target.value)} placeholder="Ex: 3 ans" style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>SEXE</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {[["M","♂ Mâle"],["F","♀ Femelle"]].map(([v,l]) => (
                <button key={v} onClick={() => set("gender", v)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${form.gender === v ? "#B25F46" : "#E5E7EB"}`, background: form.gender === v ? "#FAF0EB" : "#F9FAFB", color: form.gender === v ? "#B25F46" : "#6B7280", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
            <button onClick={next} disabled={!form.petName || !form.gender}
              style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: (form.petName && form.gender) ? "pointer" : "default",
                background: (form.petName && form.gender) ? "linear-gradient(135deg,#B25F46,#C97A5E)" : "#E5E7EB",
                color: (form.petName && form.gender) ? "#fff" : "#9CA3AF" }}>
              Continuer →
            </button>
          </div>
        )}

        {/* ── HEALTH ── */}
        {current === "health" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Sa santé 🏥</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 28 }}>Ces informations rassurent les autres propriétaires.</div>

            <label style={labelStyle}>NIVEAU D'ÉNERGIE</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => set("energy", i)}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `2px solid ${form.energy >= i ? "#B25F46" : "#E5E7EB"}`, background: form.energy >= i ? "#FAF0EB" : "#F9FAFB", fontSize: 16, cursor: "pointer", color: form.energy >= i ? "#B25F46" : "#9CA3AF", fontWeight: 800 }}>{i}</button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: 28 }}>
              <span>Très calme 😴</span><span>Ultra énergique ⚡</span>
            </div>

            <label style={labelStyle}>STATUT SANITAIRE</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["vaccinated","💉 Vacciné·e"],["sterilized","✂️ Stérilisé·e"]].map(([k,l]) => (
                <button key={k} onClick={() => set(k, !form[k])}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `2px solid ${form[k] ? "#2E7D32" : "#E5E7EB"}`, background: form[k] ? "#E8F5E9" : "#F9FAFB", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${form[k] ? "#2E7D32" : "#D1D5DB"}`, background: form[k] ? "#2E7D32" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form[k] && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: form[k] ? "#1B5E20" : "#6B7280" }}>{l}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
            </div>
          </div>
        )}

        {/* ── CHARACTER ── */}
        {current === "character" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Son caractère ✨</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Choisissez jusqu'à 4 traits qui le décrivent le mieux.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {OB_TEMPER.map(t => (
                <button key={t} onClick={() => toggleTemper(t)}
                  style={{ padding: "10px 16px", borderRadius: 20, border: `2px solid ${form.temper.includes(t) ? "#8B3D28" : "#E5E7EB"}`, background: form.temper.includes(t) ? "#FAF0EB" : "#F9FAFB", color: form.temper.includes(t) ? "#8B3D28" : "#6B7280", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{t}</button>
              ))}
            </div>
            {form.temper.length === 4 && (
              <div style={{ fontSize: 12, color: "#B25F46", marginTop: 14, fontWeight: 600 }}>Maximum atteint — désélectionnez un trait pour en choisir un autre.</div>
            )}
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
            </div>
          </div>
        )}

        {/* ── SEEKING ── */}
        {current === "seeking" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Que cherche-t-il ? 🎯</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Plusieurs choix possibles. Cela guidera les matchs proposés.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OB_SEEKING.filter(s => form.species !== "cat" || !["Balade","Dog date"].includes(s.id))
                .filter(s => form.species !== "dog" || !["Cat date"].includes(s.id))
                .map(s => (
                <button key={s.id} onClick={() => toggleArr("seeking", s.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `2px solid ${form.seeking.includes(s.id) ? "#B25F46" : "#E5E7EB"}`, background: form.seeking.includes(s.id) ? "#FAF0EB" : "#F9FAFB", cursor: "pointer" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${form.seeking.includes(s.id) ? "#B25F46" : "#D1D5DB"}`, background: form.seeking.includes(s.id) ? "#B25F46" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.seeking.includes(s.id) && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: form.seeking.includes(s.id) ? "#B25F46" : "#2D1200" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
            </div>
          </div>
        )}

        {/* ── PHOTOS ── */}
        {current === "photos" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Ses plus belles photos 📸</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Ajoutez jusqu'à 6 photos. Les profils avec photos ont 5× plus de matchs !</div>
            {moderatingMedia && (
              <div style={{ fontSize: 12, color: "#B25F46", marginBottom: 10 }}>🔎 Vérification du contenu en cours...</div>
            )}
            {mediaModerationError && (
              <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>{mediaModerationError}</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[...form.photos, ...Array(Math.max(0, 6 - form.photos.length)).fill(null)].map((p, i) => (
                <div key={i} onClick={() => !p && photoRef.current?.click()}
                  style={{ aspectRatio: "1", borderRadius: 14, overflow: "hidden", position: "relative", background: p ? "#000" : "#F3F4F6", border: p ? "none" : "2px dashed #D1D5DB", cursor: p ? "default" : "pointer" }}>
                  {p ? (
                    <>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && <div style={{ position: "absolute", bottom: 4, left: 4, background: "#B25F46", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6 }}>PRINCIPALE</div>}
                      <button onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i), photoCaptions: f.photoCaptions.filter((_, j) => j !== i) })); }}
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                    </>
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 24, color: "#E8B89F" }}>+</span>
                      {i === 0 && <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>Principale</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoAdd} />
            {form.photos.length < 6 && (
              <button onClick={() => photoRef.current?.click()}
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: "2px dashed #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
                📷 Ajouter des photos ({form.photos.length}/6)
              </button>
            )}
            <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 6 }}>Vous pouvez continuer sans photo et en ajouter plus tard.</div>

            {form.photos.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1200", marginBottom: 4 }}>🏷️ Phrases d'accroche (optionnel)</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10, lineHeight: 1.5 }}>Une petite phrase sous une photo donne tout de suite du caractère — comme sur Hinge.</div>
                {form.photos.map((p, i) => (
                  <button key={i} onClick={() => openCaptionEditor(i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>Photo {i + 1}{i === 0 ? " (principale)" : ""}</div>
                      <div style={{ fontSize: 12.5, color: form.photoCaptions[i] ? "#2D1200" : "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {form.photoCaptions[i] || "+ Ajouter une phrase"}
                      </div>
                    </div>
                  </button>
                ))}
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#4B5563", marginTop: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.showMainCaption} onChange={e => set("showMainCaption", e.target.checked)} />
                  Afficher la phrase sur la photo principale dans Découvrir
                </label>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
            </div>
          </div>
        )}

        {/* ── BIO ── */}
        {current === "bio" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Sa petite bio ✍️</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>En quelques mots, qui est-il vraiment ? (optionnel)</div>
            <textarea
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
              placeholder={form.species === "cat"
                ? `Ex: ${form.petName || "Luna"} est une exploratrice curieuse qui adore se blottir sur le canapé après ses aventures. Elle cherche un ami doux avec qui partager ses siestes...`
                : `Ex: ${form.petName || "Rocky"} est un joueur infatigable qui adore courir dans les parcs. Il cherche un compagnon de balade pour partager ses aventures quotidiennes...`}
              style={{ ...inputStyle, minHeight: 140, resize: "none", lineHeight: 1.7 }}
            />
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>{form.bio.length}/300 caractères</div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
            </div>
          </div>
        )}

        {/* ── PRESTATAIRE ── */}
        {current === "provider" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Une dernière chose 🐾</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
              Miloute propose aussi un annuaire de prestataires pour animaux (vétérinaires, toiletteurs, pet-sitters...). Et vous, dans tout ça ?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
              {[
                ["provider", "🏥 Je suis moi-même prestataire", "Vétérinaire, toiletteur, éducateur, pet-sitter..."],
                ["interested", "🙋 Non, mais ça m'intéresse", "Je serais partant pour proposer mes services plus tard"],
                ["no", "🙅 Non, pas concerné", "Je suis juste ici pour mon compagnon"],
              ].map(([v, label, desc]) => (
                <button key={v} onClick={() => set("providerInterest", v)}
                  style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 14, border: `2px solid ${form.providerInterest === v ? "#B25F46" : "#E5E7EB"}`, background: form.providerInterest === v ? "#FAF0EB" : "#fff", cursor: "pointer" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: form.providerInterest === v ? "#B25F46" : "#2D1200" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              {!form.providerInterest && (
                <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
              )}
            </div>
          </div>
        )}

        {/* ── LOCALISATION (optionnelle) ── */}
        {current === "location" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Trouvez ce qui est près de vous 📍</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
              Activez votre position pour des distances précises dès le départ : profils à swiper, prestataires et reproduction près de chez vous. Vous pourrez la désactiver à tout moment dans votre profil.
            </div>

            {form.location ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FAF0EB", borderRadius: 14, padding: "14px 16px", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#8B3D28" }}>Position activée</div>
              </div>
            ) : (
              <button onClick={shareLocationOnboarding} disabled={sharingLocation}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", cursor: sharingLocation ? "default" : "pointer", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1200" }}>{sharingLocation ? "Localisation en cours..." : "Activer ma position"}</div>
              </button>
            )}

            {locationError && (
              <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>{locationError}</div>
            )}

            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff" }}>
                Continuer →
              </button>
              {!form.location && (
                <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette étape</button>
              )}
            </div>
          </div>
        )}

        {/* ── RECAP ── */}
        {current === "recap" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 4, marginTop: 8 }}>Voilà {form.petName || "votre animal"} ! 🎉</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Vérifiez et confirmez votre profil.</div>

            {/* Mini profile card */}
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #E5E7EB", marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)" }}>
              <div style={{ height: 120, background: "linear-gradient(135deg,#8B3D28,#B25F46)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {form.photos[0]
                  ? <img src={form.photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 60 }}>{form.species === "cat" ? "🐱" : form.species === "dog" ? "🐕" : "🐱"}</span>}
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>
                  {form.petName || "—"} <span style={{ fontSize: 15, color: "#6B7280", fontWeight: 400 }}>{formatAge(form.age)} {form.gender === "M" ? "♂" : form.gender === "F" ? "♀" : ""}</span>
                </div>
                <div style={{ fontSize: 13, color: "#8B3D28", fontWeight: 600, marginBottom: 10 }}>{form.breed || "Race non précisée"}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {form.temper.map(t => (
                    <span key={t} style={{ background: "#FAF0EB", color: "#8B3D28", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>{t}</span>
                  ))}
                  {form.vaccinated && <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>Vacciné·e ✓</span>}
                  {form.sterilized && <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>Stérilisé·e</span>}
                </div>
                {form.bio ? <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>{form.bio.slice(0, 100)}{form.bio.length > 100 ? "..." : ""}</p> : null}
              </div>
            </div>

            {/* Summary checklist */}
            <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px 16px", marginBottom: 24 }}>
              {[
                [!!form.ownerName, `Propriétaire : ${form.ownerName || "—"}`],
                [!!form.species, `Espèce : ${form.species === "cat" ? "Chat 🐱" : form.species === "dog" ? "Chien 🐕" : "—"}`],
                [!!form.petName, `Prénom : ${form.petName || "—"}`],
                [form.photos.length > 0, `Photos : ${form.photos.length}/6`],
                [form.seeking.length > 0, `Cherche : ${form.seeking.map(id => { const o = OB_SEEKING.find(x => x.id === id); return o ? o.icon + " " + o.label : id; }).join(", ") || "—"}`],
              ].map(([ok, label], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? "1px solid #F3F4F6" : "none" }}>
                  <span style={{ fontSize: 16 }}>{ok ? "✅" : "⚪"}</span>
                  <span style={{ fontSize: 13, color: ok ? "#2D1200" : "#9CA3AF", fontWeight: ok ? 500 : 400 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 24px 32px", background: "#fff", flexShrink: 0, display: ["owner","health","character","seeking","photos","bio","identity","species","provider"].includes(current) ? "none" : "block" }}>
        {current === "recap" ? (
          <>
            {submitError && (
              <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>{submitError}</div>
            )}
            <button onClick={async () => {
                setSubmitError(null);
                setSubmitting(true);
                try {
                  await onComplete(form);
                } catch (err) {
                  setSubmitError(err.message || "Une erreur est survenue, réessayez.");
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", background: submitting ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: submitting ? "#9CA3AF" : "#fff", fontSize: 17, fontWeight: 900, cursor: submitting ? "default" : "pointer", boxShadow: submitting ? "none" : "0 6px 20px rgba(178,95,70,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {submitting ? "Création de votre compte..." : <><PawLogo size={24} color="#fff" /> Découvrir les profils !</>}
            </button>
          </>
        ) : current === "owner" ? null : (
          <button onClick={next}
            disabled={
              (current === "species" && !form.species) ||
              (current === "identity" && (!form.petName || !form.gender))
            }
            style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "all .2s",
              background: (current === "species" && !form.species) || (current === "identity" && (!form.petName || !form.gender))
                ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)",
              color: (current === "species" && !form.species) || (current === "identity" && (!form.petName || !form.gender))
                ? "#9CA3AF" : "#fff",
              boxShadow: "0 6px 20px rgba(178,95,70,.2)" }}>
            Continuer →
          </button>
        )}
        {["health","character","seeking","photos","bio"].includes(current) && (
          <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>
            Passer cette étape
          </button>
        )}
      </div>

      {/* Éditeur de phrase d'accroche pour une photo */}
      {captionEditorIndex !== null && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 70, display: "flex", alignItems: "flex-end" }} onClick={() => setCaptionEditorIndex(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", padding: "20px 20px 32px" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200", marginBottom: 14 }}>Phrase d'accroche — Photo {captionEditorIndex + 1}</div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {getPhotoCaptionPrompts(form.species).map(p => (
                <button key={p} onClick={() => setCaptionDraft(p + " ")}
                  style={{ padding: "7px 12px", borderRadius: 20, border: "1.5px solid #E8B89F", background: "#FAF0EB", color: "#8B3D28", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>

            <textarea value={captionDraft} onChange={e => { setCaptionDraft(e.target.value.slice(0, PHOTO_CAPTION_MAX_LENGTH)); setCaptionError(null); }}
              placeholder="Écrivez votre propre phrase, ou complétez un des prompts ci-dessus…"
              style={{ ...inputStyle, minHeight: 80, resize: "none", lineHeight: 1.6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 6, marginBottom: 14 }}>
              <span>{countEmojis(captionDraft) > PHOTO_CAPTION_MAX_EMOJIS ? `Max ${PHOTO_CAPTION_MAX_EMOJIS} emojis` : ""}</span>
              <span>{captionDraft.length}/{PHOTO_CAPTION_MAX_LENGTH}</span>
            </div>

            {captionError && (
              <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>{captionError}</div>
            )}

            <button onClick={generateCaptionForDraft} disabled={generatingCaption}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#8B3D28", fontWeight: 700, fontSize: 13, cursor: generatingCaption ? "default" : "pointer", marginBottom: 12 }}>
              ✨ {generatingCaption ? "Génération..." : "Générer une phrase avec l'IA"}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              {form.photoCaptions[captionEditorIndex] && (
                <button onClick={() => { setCaptionDraft(""); saveCaptionDraft(); }} disabled={savingCaption}
                  style={{ padding: "14px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", color: "#9CA3AF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Retirer
                </button>
              )}
              <button onClick={saveCaptionDraft} disabled={savingCaption}
                style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: savingCaption ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: savingCaption ? "#9CA3AF" : "#fff", fontWeight: 800, fontSize: 14, cursor: savingCaption ? "default" : "pointer" }}>
                {savingCaption ? "Vérification..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STOCKAGE LOCAL (à remplacer par de vrais appels API quand le backend sera prêt) ──
function loadProfile() {
  try {
    const raw = localStorage.getItem("miloute_user_profile");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveProfile(profile) {
  try { localStorage.setItem("miloute_user_profile", JSON.stringify(profile)); } catch {}
}
// Convertit une ligne de la table Supabase `profiles` (snake_case) vers le
// format utilisé partout ailleurs dans l'app (camelCase, comme le form d'onboarding).
function profileFromRow(row) {
  return {
    id: row.id, userId: row.user_id,
    ownerName: row.owner_name, ownerEmail: row.owner_email,
    petName: row.pet_name, name: row.pet_name,
    species: row.species, breed: row.breed, age: row.age, gender: row.gender,
    energy: row.energy, vaccinated: row.vaccinated, sterilized: row.sterilized,
    temper: row.temper || [], seeking: row.seeking || [],
    bio: row.bio, photos: row.photos || [], video: row.video || null,
    photoCaptions: row.photo_captions || [], showMainCaption: row.show_main_caption !== false,
    location: (row.lat && row.lng) ? { lat: row.lat, lng: row.lng } : null,
    lastActiveAt: row.last_active_at || null,
    repro: row.repro || { active: false, price: "", priceNegotiable: false, availableFrom: "", availableTo: "", pedigree: false, geneticTest: false, reproDesc: "", docs: [] },
    isPremium: row.is_premium || false,
    providerInterest: row.provider_interest || null,
    stripeConnectAccountId: row.stripe_connect_account_id || null,
    stripeConnectOnboarded: row.stripe_connect_onboarded || false,
    boostCredits: row.boost_credits || 0,
    giftInventory: row.gift_inventory || {},
    questsCompleted: row.quests_completed || {},
  };
}
// ── MARKETPLACE PRESTATAIRES ──────────────────────────────────────────────────
async function fetchCommissionRate() {
  const { data, error } = await supabase.from("platform_settings").select("key, value").in("key", ["commission_rate_percent", "commission_promo_until"]);
  if (error || !data) return { rate: 15, promoUntil: null };
  const rateRow = data.find(r => r.key === "commission_rate_percent");
  const promoRow = data.find(r => r.key === "commission_promo_until");
  const baseRate = rateRow ? parseFloat(rateRow.value) : 15;
  const promoUntil = promoRow?.value || null;
  const promoActive = promoUntil ? new Date() < new Date(promoUntil) : false;
  return { rate: promoActive ? 0 : baseRate, promoUntil: promoActive ? promoUntil : null };
}

async function fetchProviderServices(profileId) {
  const { data, error } = await supabase.from("provider_services").select("*").eq("profile_id", profileId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(s => ({ id: s.id, title: s.title, description: s.description, priceCents: s.price_cents, active: s.active }));
}

async function createProviderService(userProfile, { title, description, priceCents, spotId }) {
  const { error } = await supabase.from("provider_services").insert({
    profile_id: userProfile.id, user_id: userProfile.userId, spot_id: spotId || null,
    title, description: description || null, price_cents: priceCents,
  });
  if (error) throw new Error(error.message);
}

async function updateProviderService(id, fields) {
  const { error } = await supabase.from("provider_services").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

async function deleteProviderService(id) {
  const { error } = await supabase.from("provider_services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function startConnectOnboarding(userProfile) {
  const res = await fetch(apiUrl("/api/create-connect-onboarding"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profileId: userProfile.id,
      email: userProfile.ownerEmail,
      returnUrl: window.location.origin + "?connect=return",
      refreshUrl: window.location.origin + "?connect=refresh",
    }),
  });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
  else throw new Error(data.error || "Erreur inconnue");
}

async function checkConnectStatus(profileId) {
  const res = await fetch(apiUrl("/api/check-connect-status"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId }),
  });
  const data = await res.json();
  return !!data.onboarded;
}

// ── RÉSERVATIONS ──────────────────────────────────────────────────────────────
async function startBookingCheckout(service, userProfile) {
  const res = await fetch(apiUrl("/api/create-booking-checkout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: service.id,
      clientProfileId: userProfile.id,
      clientUserId: userProfile.userId,
      successUrl: window.location.origin + "?booking=success&session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: window.location.origin + "?booking=cancel",
    }),
  });
  const data = await res.json();
  if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  else throw new Error(data.error || "Erreur inconnue");
}

async function verifyBookingSession(sessionId) {
  const res = await fetch(apiUrl("/api/verify-booking-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  return res.json();
}

async function confirmBooking(bookingId, userId) {
  const res = await fetch(apiUrl("/api/confirm-booking"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, userId }),
  });
  const data = await res.json();
  if (data.booking) {
    const otherUserId = data.booking.client_user_id === userId ? data.booking.provider_user_id : data.booking.client_user_id;
    if (data.booking.status === "released") {
      sendPushNotification(otherUserId, "Réservation finalisée ✅", `"${data.booking.service_title}" a été confirmée par les deux parties.`, { type: "booking" });
    } else {
      sendPushNotification(otherUserId, "Confirmation de réservation", `Une confirmation a été faite pour "${data.booking.service_title}".`, { type: "booking" });
    }
  }
  return data;
}

async function cancelBooking(bookingId, userId) {
  const res = await fetch(apiUrl("/api/confirm-booking"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, userId, action: "cancel" }),
  });
  const data = await res.json();
  if (data.booking) {
    const otherUserId = data.booking.client_user_id === userId ? data.booking.provider_user_id : data.booking.client_user_id;
    sendPushNotification(otherUserId, "Réservation annulée ❌", `"${data.booking.service_title}" a été annulée.`, { type: "booking" });
  }
  return data;
}

function mapBookingRow(row, isProvider) {
  return {
    id: row.id, serviceTitle: row.service_title,
    priceCents: row.price_cents, payoutCents: row.provider_payout_cents, commissionCents: row.commission_cents,
    status: row.status,
    clientConfirmed: !!row.client_confirmed_at, providerConfirmed: !!row.provider_confirmed_at,
    myConfirmed: isProvider ? !!row.provider_confirmed_at : !!row.client_confirmed_at,
    otherConfirmed: isProvider ? !!row.client_confirmed_at : !!row.provider_confirmed_at,
    counterpartProfileId: isProvider ? row.client_profile_id : row.provider_profile_id,
    time: formatRelativeTime(row.created_at),
  };
}

async function fetchSelfProviderSpot(userId) {
  // Une fiche "à moi" peut venir de deux origines : créée directement par
  // moi (source "self"), ou revendiquée puis validée manuellement sur une
  // fiche préexistante (ajoutée par la communauté ou suggérée par Google).
  const { data } = await supabase.from("spots").select("*")
    .or(`and(added_by_user_id.eq.${userId},source.eq.self),and(claimed_by_user_id.eq.${userId},claim_status.eq.approved)`)
    .maybeSingle();
  return data || null;
}

// Demande de revendication en attente, si l'utilisateur en a une (pour
// afficher "en cours de vérification" plutôt que le formulaire de création).
async function fetchPendingClaim(userId) {
  const { data } = await supabase.from("spots").select("*").eq("claimed_by_user_id", userId).eq("claim_status", "pending").maybeSingle();
  return data ? mapProviderRow(data) : null;
}

// Recherche de fiches déjà existantes qui pourraient correspondre — même
// type, nom proche, et dans la case géographique ou ses voisines — pour
// éviter les doublons avant de proposer de créer une nouvelle fiche.
async function findSimilarSpots(name, type, lat, lng) {
  if (!name?.trim()) return [];
  const cellId = cellIdFor(lat, lng);
  const cellIds = [cellId, ...neighborCellIds(lat, lng)];
  const { data, error } = await supabase.from("spots").select("*")
    .in("cell_id", cellIds).eq("type", type).ilike("name", `%${name.trim()}%`)
    .is("claimed_by_user_id", null); // une fiche déjà revendiquée par quelqu'un d'autre ne doit pas ressortir ici
  if (error || !data) return [];
  return data.map(mapProviderRow);
}

// Enregistre une demande de revendication — passe en attente de validation
// manuelle, ne donne pas encore le contrôle de la fiche.
async function requestSpotClaim(spotId, userId) {
  const { error } = await supabase.from("spots").update({
    claim_status: "pending", claimed_by_user_id: userId, claim_requested_at: new Date().toISOString(),
  }).eq("id", spotId);
  if (error) throw new Error(error.message);
}

async function updateSpotPhotos(spotId, photos) {
  const { error } = await supabase.from("spots").update({ photos }).eq("id", spotId);
  if (error) throw new Error(error.message);
}

async function updateSpotInfo(spotId, { name, type, description }) {
  const { error } = await supabase.from("spots").update({
    name, type, description: description || null,
    emoji: PROVIDER_TYPE_INFO[type]?.emoji || "📍",
  }).eq("id", spotId);
  if (error) throw new Error(error.message);
}

// Une fiche ne peut pas être supprimée tant qu'il reste des réservations
// payées en attente de confirmation — l'argent est retenu par Miloute et
// doit d'abord être confirmé ou annulé, pas laissé sans prestataire en face.
async function hasPendingBookingsAsProvider(userId) {
  const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("provider_user_id", userId).eq("status", "paid_held");
  return (count || 0) > 0;
}

async function deleteProviderSpot(spotId) {
  await supabase.from("provider_services").delete().eq("spot_id", spotId);
  const { error } = await supabase.from("spots").delete().eq("id", spotId);
  if (error) throw new Error(error.message);
}

async function ensureProviderSpot(userProfile, category, businessName) {
  const existing = await fetchSelfProviderSpot(userProfile.userId);
  if (existing) return existing.id;
  const lat = userProfile?.location?.lat ?? 48.8566;
  const lng = userProfile?.location?.lng ?? 2.3522;
  const { data, error } = await supabase.from("spots").insert({
    cell_id: cellIdFor(lat, lng), city: nearestCity(lat, lng),
    name: businessName || userProfile.name, type: category, species: "both",
    emoji: PROVIDER_TYPE_INFO[category]?.emoji || "📍",
    lat, lng, open: true, source: "self", added_by_user_id: userProfile.userId,
  }).select().single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function fetchActiveServicesForSpot(spotId) {
  const { data, error } = await supabase.from("provider_services").select("*").eq("spot_id", spotId).eq("active", true);
  if (error || !data) return [];
  return data.map(s => ({ id: s.id, title: s.title, description: s.description, priceCents: s.price_cents, profileId: s.profile_id }));
}

async function fetchProviderOnboardingStatus(profileId) {
  const { data } = await supabase.from("profiles").select("stripe_connect_onboarded").eq("id", profileId).maybeSingle();
  return !!data?.stripe_connect_onboarded;
}

async function fetchMyBookingsAsClient(userProfile) {
  if (!userProfile?.userId) return [];
  const { data, error } = await supabase.from("bookings").select("*").eq("client_user_id", userProfile.userId).order("created_at", { ascending: false });
  if (error || !data) return [];
  const counterpartIds = [...new Set(data.map(r => r.provider_profile_id))];
  const { data: profs } = await supabase.from("profiles").select("id, pet_name, species").in("id", counterpartIds);
  const byId = Object.fromEntries((profs || []).map(p => [p.id, p]));
  return data.map(r => ({ ...mapBookingRow(r, false), counterpartName: byId[r.provider_profile_id]?.pet_name || "Prestataire" }));
}

async function fetchMyBookingsAsProvider(userProfile) {
  if (!userProfile?.userId) return [];
  const { data, error } = await supabase.from("bookings").select("*").eq("provider_user_id", userProfile.userId).order("created_at", { ascending: false });
  if (error || !data) return [];
  const counterpartIds = [...new Set(data.map(r => r.client_profile_id))];
  const { data: profs } = await supabase.from("profiles").select("id, pet_name, species").in("id", counterpartIds);
  const byId = Object.fromEntries((profs || []).map(p => [p.id, p]));
  return data.map(r => ({ ...mapBookingRow(r, true), counterpartName: byId[r.client_profile_id]?.pet_name || "Client" }));
}

async function updateProfileLocation(profileId, lat, lng) {
  const { error } = await supabase.from("profiles").update({ lat, lng }).eq("id", profileId);
  if (error) console.error("updateProfileLocation error:", error);
}

async function clearProfileLocation(profileId) {
  const { error } = await supabase.from("profiles").update({ lat: null, lng: null }).eq("id", profileId);
  if (error) console.error("clearProfileLocation error:", error);
}

// ── BOUTIQUE (boosts et friandises à l'unité) ────────────────────────────────
// Vrai catalogue de cadeaux — chacun a son propre prix et son propre stock
// (profiles.gift_inventory), au lieu d'un crédit générique indifférencié.
// Sert à la fois au bouton friandise du swipe (🦴/🐟 selon l'espèce) et au
// choix complet proposé dans le chat une fois matché.
// Petits textes narratifs pour les cartes de la Boîte à Souvenirs — variés,
// choisis de façon stable (toujours le même pour un souvenir donné, basé sur
// son id) plutôt qu'aléatoire à chaque rendu.
const MEMORY_NARRATIVES = [
  "{name} a pensé à vous aujourd'hui",
  "Un petit geste de {name}, plein de douceur",
  "{name} vous a fait une belle surprise",
  "Comme quoi, {name} ne vous oublie pas",
  "Un moment tout doux offert par {name}",
];
function getMemoryNarrative(id, name) {
  if (!name) return null;
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) hash = (hash * 31 + String(id).charCodeAt(i)) >>> 0;
  const template = MEMORY_NARRATIVES[hash % MEMORY_NARRATIVES.length];
  return template.replace("{name}", name);
}

const GIFT_CATALOG = [
  // Nourriture chien
  { id: "bone", emoji: "🦴", label: "Os du Chef", price: "1,99 €", category: "food", species: "dog", gender: "m" },
  { id: "chicken", emoji: "🍗", label: "Cuisse Dorée", price: "1,99 €", category: "food", species: "dog", gender: "f" },
  { id: "steak", emoji: "🥩", label: "Steak Royal", price: "2,99 €", category: "food", species: "dog", gender: "m", premiumOnly: true },
  { id: "bacon", emoji: "🥓", label: "Bacon Croustillant", price: "0,99 €", category: "food", species: "dog", gender: "m" },
  { id: "broccoli", emoji: "🥦", label: "Veggie Bro", price: "0,99 €", category: "food", species: "dog", gender: "m" },
  { id: "meatbone", emoji: "🍖", label: "Viande Tendresse", price: "1,99 €", category: "food", species: "dog", gender: "f" },
  { id: "croc_dog", emoji: "🍪", label: "Croc'Miloute", price: "0,99 €", category: "food", species: "dog", gender: "f" },
  // Nourriture chat
  { id: "milk", emoji: "🥛", label: "Douceur Lactée", price: "0,99 €", category: "food", species: "cat", gender: "f" },
  { id: "croc_cat", emoji: "🍪", label: "Croc'Miloute", price: "0,99 €", category: "food", species: "cat", gender: "m" },
  { id: "tunapate", emoji: "🥫", label: "Dindo Carotte", price: "0,99 €", category: "food", species: "cat", gender: "f" },
  { id: "sushi", emoji: "🍣", label: "Sushi d'Amour", price: "1,99 €", category: "food", species: "cat", gender: "m" },
  { id: "shrimp", emoji: "🍤", label: "Crevette Coquine", price: "1,99 €", category: "food", species: "cat", gender: "f" },
  { id: "fish", emoji: "🐟", label: "Poisson du Chef", price: "1,99 €", category: "food", species: "cat", gender: "m" },
  { id: "gourmetplatter", emoji: "🍱", label: "Plateau Gourmet", price: "2,99 €", category: "food", species: "cat", gender: "m", premiumOnly: true },
  // Cadeaux chien
  { id: "tennisball", emoji: "🥎", label: "Balle Rebelle", price: "1,99 €", category: "gift", species: "dog", gender: "f" },
  { id: "frisbee", emoji: "🥏", label: "Frisbee Fou", price: "1,99 €", category: "gift", species: "dog", gender: "m" },
  { id: "chewrope", emoji: "🪢", label: "Corde à Mâchouiller", price: "1,99 €", category: "gift", species: "dog", gender: "f" },
  // Cadeaux chat
  { id: "yarn", emoji: "🧶", label: "Pelote Magique", price: "1,99 €", category: "gift", species: "cat", gender: "f" },
  { id: "mouse", emoji: "🐭", label: "Souris Fuyante", price: "1,99 €", category: "gift", species: "cat", gender: "f" },
  { id: "feather", emoji: "🪶", label: "Plume Chatouille", price: "1,99 €", category: "gift", species: "cat", gender: "f" },
  // Cadeaux universels
  { id: "bouquet", emoji: "💐", label: "Bouquet des Amoureux", price: "1,99 €", category: "gift", species: "both", gender: "m" },
  { id: "cake", emoji: "🎂", label: "Gâteau Fiesta", price: "1,99 €", category: "gift", species: "both", gender: "m" },
  { id: "rose", emoji: "🌹", label: "Rose des Amoureux", price: "1,99 €", category: "gift", species: "both", gender: "f" },
  { id: "coeur_dog", emoji: "💕", label: "Cœur de Toutou", price: "1,99 €", category: "gift", species: "dog", gender: "m" },
  { id: "coeur_cat", emoji: "💕", label: "Cœur de Miaouw", price: "1,99 €", category: "gift", species: "cat", gender: "m" },
  { id: "plush", emoji: "🧸", label: "Doudou Câlin", price: "1,99 €", category: "gift", species: "both", gender: "m" },
  // Confort & Accessoires
  { id: "bed", emoji: "☁️", label: "Panier Douillet", price: "1,99 €", category: "comfort", species: "both", gender: "m" },
  { id: "doghouse", emoji: "🏠", label: "Niche Royale", price: "2,99 €", category: "comfort", species: "dog", gender: "f", premiumOnly: true },
  { id: "cattree", emoji: "🌳", label: "Arbre Royal", price: "2,99 €", category: "comfort", species: "cat", gender: "m", premiumOnly: true },
  { id: "collar", emoji: "📿", label: "Collier Élégance", price: "1,99 €", category: "comfort", species: "both", gender: "m" },
  { id: "ribbon", emoji: "🎀", label: "Ruban Chic", price: "1,99 €", category: "comfort", species: "both", gender: "m" },
  // Exclusifs Premium — achetables uniquement en étant abonné
  { id: "crown", emoji: "👑", label: "Couronne Miloute", price: "2,99 €", category: "gift", species: "both", gender: "f", premiumOnly: true },
  { id: "medal", emoji: "🏅", label: "Médaille Miloute", price: "2,99 €", category: "gift", species: "both", gender: "f", premiumOnly: true },
  { id: "trophy", emoji: "🏆", label: "Trophée Miloute", price: "2,99 €", category: "gift", species: "both", gender: "m", premiumOnly: true },
  { id: "diamond", emoji: "💎", label: "Diamant Miloute", price: "3,99 €", category: "gift", species: "both", gender: "m", premiumOnly: true },
];

// Packs groupés — quelques articles réunis à prix légèrement réduit, sans
// monnaie intermédiaire : un simple achat direct comme le reste de la boutique.
// Convertit "1,99 €" en nombre exploitable pour trier par prix croissant.
function parseGiftPrice(priceStr) {
  return parseFloat(priceStr.replace("€", "").replace(",", ".").trim());
}

const GIFT_BUNDLES = [
  // Pack Gourmand — différent selon l'espèce, même nom affiché
  { id: "gourmet_dog_pack", label: "Pack Gourmand", items: ["chicken", "meatbone", "bone"], price: "4,99 €", originalPrice: "5,97 €", species: "dog", category: "food" },
  { id: "gourmet_cat_pack", label: "Pack Gourmand", items: ["sushi", "shrimp", "fish"], price: "4,99 €", originalPrice: "5,97 €", species: "cat", category: "food" },
  // Pack Joueur — différent selon l'espèce, même nom affiché
  { id: "player_dog_pack", label: "Pack Joueur", items: ["tennisball", "frisbee", "chewrope"], price: "4,99 €", originalPrice: "5,97 €", species: "dog", category: "gift" },
  { id: "player_cat_pack", label: "Pack Joueur", items: ["yarn", "mouse", "feather"], price: "4,99 €", originalPrice: "5,97 €", species: "cat", category: "gift" },
  // Pack Romantique — universel, identique pour tous
  { id: "romance_dog_pack", label: "Pack Romantique", items: ["bouquet", "rose", "coeur_dog"], price: "4,99 €", originalPrice: "5,97 €", species: "dog", category: "gift" },
  { id: "romance_cat_pack", label: "Pack Romantique", items: ["bouquet", "rose", "coeur_cat"], price: "4,99 €", originalPrice: "5,97 €", species: "cat", category: "gift" },
];

// Quêtes ponctuelles — chacune ne se débloque qu'une fois, sans série
// quotidienne ni rappel. La récompense "profil complet" dépend de l'espèce
// (résolue à l'affichage), les autres sont fixes.
const QUEST_LIST = [
  { id: "profile_complete", emoji: "📋", title: "Compléter son profil à 100%", rewardLabel: (species) => `1 ${species === "cat" ? "Poisson du Chef 🐟" : "Os du Chef 🦴"}` },
  { id: "first_match", emoji: "💕", title: "Obtenir son premier match", rewardLabel: () => "1 Bouquet des Amoureux 💐" },
  { id: "first_video", emoji: "🎬", title: "Ajouter une vidéo à son profil", rewardLabel: () => "1 Collier Élégance 📿" },
  { id: "first_review", emoji: "⭐", title: "Laisser son premier avis prestataire", rewardLabel: () => "1 Rose des Amoureux 🌹" },
  { id: "first_post", emoji: "📢", title: "Publier son premier post dans la Communauté", rewardLabel: () => "1 Doudou Câlin 🧸" },
  { id: "become_provider", emoji: "🏥", title: "Devenir prestataire (configuration terminée)", rewardLabel: () => "1 Médaille Miloute 🏅" },
  { id: "first_booking", emoji: "📅", title: "Effectuer sa première réservation", rewardLabel: () => "1 Gâteau Fiesta 🎂" },
  { id: "first_gift_sent", emoji: "🎁", title: "Envoyer son premier cadeau", rewardLabel: (species) => `1 ${species === "cat" ? "Cœur de Miaouw" : "Cœur de Toutou"} 💕` },
];

// ── PRÉPARATION CONFORMITÉ GOOGLE PLAY (facturation alternative UE) ─────────
// Détecte si l'app tourne dans le conteneur Android natif (Capacitor) plutôt
// que dans un navigateur web classique. Aujourd'hui ça ne change rien au
// comportement (Stripe reste utilisé dans les deux cas) — c'est le point
// d'accroche unique où brancher soit le SDK Play Billing natif (Option B),
// soit l'écran de consentement + le reporting Play Developer API (Option A),
// une fois la décision prise et le code natif Android en place.
function isNativeAndroid() {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.getPlatform() === "android");
  } catch {
    return false;
  }
}

// Sur le web, les appels relatifs ("/api/xxx") fonctionnent car l'app est
// servie depuis le même domaine que les fonctions serverless (miloute.app).
// Dans l'app Android native, l'app tourne depuis un contexte local embarqué
// (pas de server.url dans capacitor.config.json) — "/api/xxx" ne pointe donc
// vers rien, et Capacitor renvoie la page HTML de secours de l'app au lieu
// d'une vraie réponse JSON. On préfixe donc avec le vrai domaine uniquement
// en contexte natif.
const API_ORIGIN = "https://miloute.app";
function apiUrl(path) {
  return isNativeAndroid() ? `${API_ORIGIN}${path}` : path;
}

// ── NOTIFICATIONS PUSH RÉELLES (hors app) ─────────────────────────────────
// ⚠️ Nécessite `npm install @capacitor/push-notifications` — cet import
// casse le build web tant que le paquet n'est pas installé, même s'il n'est
// jamais réellement exécuté sur le web (isNativeAndroid() le désactive à
// l'exécution, mais Webpack le résout quand même à la compilation).

// Demande la permission et enregistre le token de l'appareil auprès du
// serveur — à appeler une fois, après connexion, uniquement sur Android natif.
async function registerPushNotifications(userProfile) {
  if (!isNativeAndroid() || !userProfile?.userId) return;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;
    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      try {
        await fetch(apiUrl("/api/shop"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register-token", userId: userProfile.userId, token: token.value, platform: "android" }),
        });
      } catch (err) {
        console.error("register-token error:", err);
      }
    });
    PushNotifications.addListener("registrationError", (err) => {
      console.error("Erreur enregistrement push:", err);
    });
  } catch (err) {
    console.error("registerPushNotifications error:", err);
  }
}

// Demande au serveur d'envoyer une notification push à un utilisateur —
// silencieux en cas d'échec (ne bloque jamais l'action principale du client,
// comme un like ou un message, si la notification elle-même échoue).
async function sendPushNotification(targetUserId, title, body, data) {
  try {
    await fetch(apiUrl("/api/shop"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-push", targetUserId, title, body, data: data || {} }),
    });
  } catch (err) {
    console.error("sendPushNotification error:", err);
  }
}

// Texte de consentement EXIGÉ par Google si vous choisissez l'Option A
// (facturation alternative). Ne suffit PAS à lui seul à être conforme : il
// faut aussi faire remonter chaque transaction à Google via la Play
// Developer API (reporting côté serveur, pas encore implémenté). Cette
// chaîne est prête à être branchée dans une modale de consentement affichée
// juste avant le paiement Stripe, uniquement sur Android natif.
const GOOGLE_ALTERNATIVE_BILLING_DISCLOSURE =
  "Ce paiement ne passe pas par le système de facturation de Google Play. Il est traité par Stripe. " +
  "Google Play n'a pas connaissance de cet achat et ne peut pas vous assister en cas de litige : " +
  "contactez Miloute directement pour toute question ou remboursement.";

async function startShopCheckout({ itemId, bundleId }, userProfile) {
  const res = await fetch(apiUrl("/api/shop"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create-checkout",
      itemId, bundleId, profileId: userProfile.id, userId: userProfile.userId,
      successUrl: window.location.origin + "?shop=success&session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: window.location.origin + "?shop=cancel",
    }),
  });
  const data = await res.json();
  if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  else throw new Error(data.error || "Erreur inconnue");
}

async function verifyShopSession(sessionId) {
  const res = await fetch(apiUrl("/api/shop"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify-session", sessionId }),
  });
  return res.json();
}

async function spendGift(userProfile, giftId) {
  const res = await fetch(apiUrl("/api/shop"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "spend-gift", profileId: userProfile.id, userId: userProfile.userId, giftId }),
  });
  return res.json();
}

async function claimQuest(userProfile, questId) {
  const res = await fetch(apiUrl("/api/shop"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "claim-quest", profileId: userProfile.id, userId: userProfile.userId, questId }),
  });
  return res.json();
}

async function fetchProfileForUser(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) { console.error("fetchProfileForUser error:", error); return null; }
  return data ? profileFromRow(data) : null;
}

// ── STATUT EN LIGNE ───────────────────────────────────────────────────────
// "En ligne" = dernière activité il y a moins de 2 minutes. Pas un vrai
// système de présence temps réel (pas de websocket dédié) — juste un
// horodatage rafraîchi régulièrement pendant que l'app est ouverte, ce qui
// suffit largement pour l'usage attendu ici.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

async function touchLastActive(userProfile) {
  if (!userProfile?.id) return;
  await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userProfile.id);
}

async function fetchOnlineStatus(userId) {
  const { data, error } = await supabase.from("profiles").select("last_active_at").eq("user_id", userId).maybeSingle();
  if (error || !data?.last_active_at) return { online: false, lastActiveAt: null };
  const online = (Date.now() - new Date(data.last_active_at).getTime()) < ONLINE_THRESHOLD_MS;
  return { online, lastActiveAt: data.last_active_at };
}

// Version synchrone, sans appel réseau, pour les profils déjà chargés en
// mémoire (deck de Découvrir) — la donnée est déjà là via profileFromRow.
function isProfileOnline(profile) {
  return !!profile?.lastActiveAt && (Date.now() - new Date(profile.lastActiveAt).getTime()) < ONLINE_THRESHOLD_MS;
}

// ── HEARTBEAT DE L'ANIMAL ─────────────────────────────────────────────────
// Réutilise last_active_at (déjà suivi pour le statut en ligne) plutôt que
// de créer un nouveau système : un simple signal affectif basé sur la
// dernière fois où le propriétaire est venu sur l'app. Jamais pénalisant —
// juste un petit rappel tendre, pas de dégradation réelle du profil.
function getHeartbeatTier(lastActiveAt) {
  if (!lastActiveAt) return "sleepy";
  const days = (Date.now() - new Date(lastActiveAt).getTime()) / (24 * 60 * 60 * 1000);
  if (days < 1) return "vibrant";
  if (days < 3) return "lonely";
  return "sleepy";
}
const HEARTBEAT_INFO = {
  vibrant: { icon: "💓", label: "En pleine forme", color: "#DC2626", speed: "1s", text: "Votre compagnon est ravi de vous voir aujourd'hui !" },
  lonely: { icon: "💛", label: "Un peu esseulé", color: "#D4A017", speed: "2s", text: "Ça fait un petit moment... il commence à s'ennuyer un peu." },
  sleepy: { icon: "💤", label: "Il s'ennuie de vous", color: "#9CA3AF", speed: "3.2s", text: "Il serait tellement content d'une petite visite." },
};

// ── MOMENTS MAGIQUES ──────────────────────────────────────────────────────
// Petite récompense surprise, gratuite, jamais liée à un achat réel.
// Garde-fous volontaires : jamais plus d'une fois tous les 3 jours (écart
// mini côté serveur, impossible à contourner en local), et une chance
// modeste par jour au-delà de cet écart — en moyenne 1 à 2 fois par
// semaine, jamais plus. Toujours un vrai article gratuit à la clé, jamais
// un mécanisme de pure chance sans contrepartie.
const MAGIC_MOMENT_MIN_GAP_DAYS = 3;
const MAGIC_MOMENT_DAILY_CHANCE = 0.25;
const MAGIC_MOMENT_POOL = ["bone", "fish", "croc_dog", "croc_cat", "milk", "tunapate", "bouquet", "plush", "collar", "bacon", "broccoli", "chicken"];

async function checkMagicMoment(userProfile) {
  if (!userProfile?.id) return null;

  // Un seul tirage par jour et par appareil, même si l'app est relancée
  // plusieurs fois dans la journée.
  const todayKey = new Date().toISOString().slice(0, 10);
  const localKey = `miloute_magic_checked_${userProfile.id}_${todayKey}`;
  try { if (localStorage.getItem(localKey)) return null; } catch {}
  try { localStorage.setItem(localKey, "1"); } catch {}

  const { data, error } = await supabase.from("profiles").select("last_magic_moment_at, gift_inventory").eq("id", userProfile.id).maybeSingle();
  if (error || !data) return null;

  const lastAt = data.last_magic_moment_at ? new Date(data.last_magic_moment_at).getTime() : null;
  const daysSince = lastAt ? (Date.now() - lastAt) / (24 * 60 * 60 * 1000) : Infinity;
  if (daysSince < MAGIC_MOMENT_MIN_GAP_DAYS) return null;
  if (Math.random() > MAGIC_MOMENT_DAILY_CHANCE) return null;

  // Le pool mélange des articles chien/chat/mixtes — on ne tire que parmi
  // ceux compatibles avec l'espèce du compte, sinon l'article gagné pourrait
  // atterrir dans l'inventaire sans jamais apparaître dans le sélecteur de
  // cadeaux (filtré par espèce), le rendant invisible et inutilisable.
  const eligiblePool = MAGIC_MOMENT_POOL.filter(id => {
    const info = GIFT_CATALOG.find(g => g.id === id);
    return info && (info.species === "both" || info.species === userProfile.species);
  });
  if (eligiblePool.length === 0) return null;
  const giftId = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
  const giftInfo = GIFT_CATALOG.find(g => g.id === giftId);
  const currentInventory = data.gift_inventory || {};
  const newInventory = { ...currentInventory, [giftId]: (currentInventory[giftId] || 0) + 1 };

  const { error: updateError } = await supabase.from("profiles").update({
    gift_inventory: newInventory,
    last_magic_moment_at: new Date().toISOString(),
  }).eq("id", userProfile.id);
  if (updateError) return null;

  return { giftId, emoji: giftInfo?.emoji || "🎁", label: giftInfo?.label || "Cadeau", gender: giftInfo?.gender || "m", giftInventory: newInventory };
}

// Formatage relatif simple ("À l'instant", "12:34", "Hier", "Lun.")
// Ajoute automatiquement "ans" si seul un chiffre a été saisi pour l'âge
// (ex: "3" → "3 ans"), sans toucher aux saisies déjà formulées ("3 mois", "2 ans et demi"...).
function formatAge(age) {
  if (!age) return age;
  const trimmed = String(age).trim();
  return /^\d+([.,]\d+)?$/.test(trimmed) ? `${trimmed} ans` : trimmed;
}

function formatRelativeTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = diffMs / 60000;
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60 * 24 && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { weekday: "short" });
}

// Récupère les matchs réels de l'utilisateur, avec le profil du match et le
// dernier message échangé (pour l'aperçu affiché dans la liste).
const REPRO_CARD_COLORS = ["#E8B89F", "#C9C4A9", "#B7D3C9", "#D7B8DA", "#F0C9A0"];
function reproProfileFromRow(row, userProfile) {
  const colorIdx = Math.abs([...String(row.id || "")].reduce((a, c) => a + c.charCodeAt(0), 0)) % REPRO_CARD_COLORS.length;
  let distance = "—";
  if (userProfile?.location && row.lat && row.lng) {
    distance = distanceKm(userProfile.location.lat, userProfile.location.lng, row.lat, row.lng).toFixed(1).replace(".", ",") + " km";
  }
  return {
    id: row.id, userId: row.user_id,
    name: row.pet_name, species: row.species, breed: row.breed, age: row.age, gender: row.gender,
    emoji: row.species === "cat" ? "🐱" : "🐕", color: REPRO_CARD_COLORS[colorIdx],
    owner: row.owner_name, distance,
    vaccinated: row.vaccinated, pedigree: row.repro?.pedigree, testedGenes: row.repro?.geneticTest,
    price: row.repro?.price || "À négocier",
    bio: row.repro?.reproDesc || row.bio || "",
    temper: row.temper || [],
    photos: row.photos || [],
  };
}
// Un "profil reproduction" est simplement un profil de la table `profiles`
// qui a activé repro.active — pas besoin de table séparée.
async function fetchReproProfiles(userProfile) {
  if (!userProfile?.species || !userProfile?.userId) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("species", userProfile.species)
    .neq("user_id", userProfile.userId);
  if (error || !data) { console.error("fetchReproProfiles error:", error); return []; }
  return data.filter(row => row.repro?.active).map(row => reproProfileFromRow(row, userProfile));
}

async function sendReproRequest(userProfile, targetProfile) {
  const { error } = await supabase.from("repro_requests").insert({
    requester_user_id: userProfile.userId,
    requester_profile_id: userProfile.id,
    recipient_user_id: targetProfile.userId,
    recipient_profile_id: targetProfile.id,
  });
  if (error) {
    // Une demande existe déjà envers ce profil (contrainte unique) : ce
    // n'est pas une vraie erreur pour l'utilisateur, juste un doublon évité.
    if (error.code === "23505") return { alreadySent: true };
    throw new Error(error.message);
  }
  return { success: true };
}

// Demandes reçues, avec le profil complet de la personne qui a envoyé la
// demande — pour pouvoir juger en connaissance de cause avant de répondre.
async function fetchReceivedReproRequests(userProfile) {
  if (!userProfile?.id) return [];
  const { data: requests, error } = await supabase
    .from("repro_requests")
    .select("*")
    .eq("recipient_profile_id", userProfile.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !requests || requests.length === 0) return [];

  const requesterIds = requests.map(r => r.requester_profile_id);
  const { data: requesterProfiles } = await supabase.from("profiles").select("*").in("id", requesterIds);
  const byId = Object.fromEntries((requesterProfiles || []).map(p => [p.id, p]));

  return requests.map(r => ({
    id: r.id,
    time: formatRelativeTime(r.created_at),
    requesterUserId: r.requester_user_id,
    requesterProfileId: r.requester_profile_id,
    profile: byId[r.requester_profile_id] ? reproProfileFromRow(byId[r.requester_profile_id], userProfile) : null,
  })).filter(r => r.profile);
}

async function respondReproRequest(requestId, action, userProfile) {
  const { data: request, error: fetchError } = await supabase
    .from("repro_requests").select("*").eq("id", requestId).single();
  if (fetchError || !request) throw new Error(fetchError?.message || "Demande introuvable");

  const { error: updateError } = await supabase
    .from("repro_requests")
    .update({ status: action, responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updateError) throw new Error(updateError.message);

  // En cas d'acceptation, on crée un vrai match — ainsi les deux
  // propriétaires peuvent simplement se parler dans Messages, sans
  // construire un système de discussion séparé pour la reproduction.
  if (action === "accepted") {
    await supabase.from("matches").insert({
      user_a: request.requester_user_id, user_b: request.recipient_user_id,
      profile_a: request.requester_profile_id, profile_b: request.recipient_profile_id,
    });
  }
  return { success: true };
}

async function fetchCommunityPosts(userProfile) {
  if (!userProfile?.species) return [];
  const { data: posts, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("species", userProfile.species)
    .order("created_at", { ascending: false });
  if (error || !posts || posts.length === 0) return [];

  const postIds = posts.map(p => p.id);
  const authorProfileIds = [...new Set(posts.map(p => p.profile_id).filter(Boolean))];
  const [{ data: likeRows }, { data: commentRows }, { data: authorRows }] = await Promise.all([
    supabase.from("community_likes").select("post_id, user_id").in("post_id", postIds),
    supabase.from("community_comments").select("post_id").in("post_id", postIds),
    authorProfileIds.length > 0 ? supabase.from("profiles").select("id, lat, lng").in("id", authorProfileIds) : Promise.resolve({ data: [] }),
  ]);
  const likeCounts = {}, myLikes = new Set(), commentCounts = {};
  (likeRows || []).forEach(l => {
    likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
    if (l.user_id === userProfile.userId) myLikes.add(l.post_id);
  });
  (commentRows || []).forEach(c => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });
  const authorLocationById = {};
  (authorRows || []).forEach(r => { if (r.lat && r.lng) authorLocationById[r.id] = { lat: r.lat, lng: r.lng }; });

  return posts.map(row => ({
    id: row.id, userId: row.user_id, profileId: row.profile_id,
    species: row.species, breed: row.breed,
    pet: row.pet_name, author: row.owner_name || "",
    emoji: row.species === "cat" ? "🐱" : "🐕",
    photo: row.photo_url, text: row.text, tag: row.tag,
    time: formatRelativeTime(row.created_at),
    likes: likeCounts[row.id] || 0,
    likedByMe: myLikes.has(row.id),
    commentCount: commentCounts[row.id] || 0,
    authorLocation: row.profile_id ? (authorLocationById[row.profile_id] || null) : null,
  }));
}

async function fetchCommentsForPost(postId) {
  const { data, error } = await supabase.from("community_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error || !data) return [];
  const byId = Object.fromEntries(data.map(c => [c.id, c]));
  return data.map(c => ({
    id: c.id, author: c.owner_name || "", pet: c.pet_name,
    emoji: c.species === "cat" ? "🐱" : "🐕",
    photo: c.photo_url || null,
    text: c.text, time: formatRelativeTime(c.created_at), likes: 0,
    parentCommentId: c.parent_comment_id || null,
    parentPet: c.parent_comment_id ? (byId[c.parent_comment_id]?.pet_name || null) : null,
  }));
}

// ── PHOTOS DE RENCONTRE (Boîte à Souvenirs) ──────────────────────────────
async function createEncounterPhoto(userProfile, { photoUrl, matchId, otherProfileId, caption, encounterDate, location, shareToCommunity }) {
  let communityPostId = null;
  if (shareToCommunity) {
    const post = await createCommunityPost(userProfile, { text: caption || "", photoUrl, tag: "Rencontre" });
    communityPostId = post.id;
  }
  const { data, error } = await supabase.from("encounter_photos").insert({
    user_id: userProfile.userId,
    profile_id: userProfile.id,
    match_id: matchId || null,
    other_profile_id: otherProfileId || null,
    photo_url: photoUrl,
    caption: caption || null,
    encounter_date: encounterDate || null,
    location: location || null,
    shared_to_community: !!shareToCommunity,
    community_post_id: communityPostId,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchEncounterPhotos(userProfile) {
  if (!userProfile?.id) return [];
  const { data, error } = await supabase.from("encounter_photos").select("*").eq("profile_id", userProfile.id).order("created_at", { ascending: false });
  if (error || !data) return [];

  const otherIds = [...new Set(data.map(e => e.other_profile_id).filter(Boolean))];
  const { data: otherProfiles } = otherIds.length > 0
    ? await supabase.from("profiles").select("id, pet_name").in("id", otherIds)
    : { data: [] };
  const nameById = Object.fromEntries((otherProfiles || []).map(p => [p.id, p.pet_name]));

  return data.map(e => ({
    id: e.id,
    photo: e.photo_url,
    caption: e.caption,
    encounterDate: e.encounter_date,
    location: e.location,
    otherName: e.other_profile_id ? nameById[e.other_profile_id] : null,
    sharedToCommunity: e.shared_to_community,
    createdAt: e.created_at,
  }));
}

async function deleteEncounterPhoto(encounterId) {
  const { error } = await supabase.from("encounter_photos").delete().eq("id", encounterId);
  if (error) throw new Error(error.message);
}

async function createCommunityPost(userProfile, { text, photoUrl, tag }) {
  const { data, error } = await supabase.from("community_posts").insert({
    user_id: userProfile.userId,
    profile_id: userProfile.id,
    species: userProfile.species,
    breed: userProfile.breed,
    pet_name: userProfile.name,
    owner_name: userProfile.ownerName,
    text, photo_url: photoUrl || null, tag: tag || null,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function createCommunityComment(userProfile, postId, text, parentCommentId = null) {
  const { error } = await supabase.from("community_comments").insert({
    post_id: postId,
    user_id: userProfile.userId,
    pet_name: userProfile.name,
    owner_name: userProfile.ownerName,
    species: userProfile.species,
    photo_url: userProfile.photos?.[0]?.url || null,
    text,
    parent_comment_id: parentCommentId,
  });
  if (error) throw new Error(error.message);

  const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", postId).maybeSingle();
  if (post?.user_id && post.user_id !== userProfile.userId) {
    sendPushNotification(
      post.user_id,
      `${userProfile.name} a commenté votre post 💬`,
      text,
      { type: "comment", postId }
    );
  }
}

async function toggleCommunityLike(userProfile, postId, currentlyLiked) {
  if (currentlyLiked) {
    await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", userProfile.userId);
  } else {
    await supabase.from("community_likes").insert({ post_id: postId, user_id: userProfile.userId });
  }
}

async function sendTreatToProfile(userProfile, targetProfile, giftId, message = null) {
  const { error } = await supabase.from("treats").insert({
    sender_user_id: userProfile.userId,
    sender_profile_id: userProfile.id,
    target_user_id: targetProfile.userId,
    target_profile_id: targetProfile.id,
    gift_id: giftId || null,
    message: message || null,
  });
  if (error) throw new Error(error.message);

  const giftInfo = GIFT_CATALOG.find(g => g.id === giftId);
  const giftLabel = giftInfo ? `${giftInfo.emoji} ${giftInfo.label}` : "un cadeau";
  sendPushNotification(
    targetProfile.userId,
    `${userProfile.name} vous a envoyé un cadeau ! 🎁`,
    `${giftLabel}${message ? ` — « ${message} »` : ""}`,
    { type: "gift" }
  );
}

async function fetchUnreadMessagesCount(userProfile) {
  if (!userProfile?.userId) return 0;
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_user_id", userProfile.userId)
    .eq("read", false);
  if (error) { console.error("fetchUnreadMessagesCount error:", error); return 0; }
  return count || 0;
}

async function markMessagesRead(matchId, userId) {
  await supabase.from("messages").update({ read: true }).eq("match_id", matchId).neq("sender_user_id", userId).eq("read", false);
}

// Les likes déjà transformés en match sont exclus : ils sont déjà visibles
// dans Messages, inutile de les faire apparaître deux fois.
async function fetchLikesReceived(userProfile) {
  if (!userProfile?.id || !userProfile?.userId) return [];

  const [{ data: likeRows }, { data: treatRows }] = await Promise.all([
    supabase.from("swipes").select("swiper_user_id, created_at").eq("target_profile_id", userProfile.id).eq("direction", "like"),
    supabase.from("treats").select("sender_user_id, created_at").eq("target_profile_id", userProfile.id),
  ]);

  // Un cadeau agit comme un signal au moins aussi fort qu'un like — on
  // fusionne les deux : quelqu'un peut apparaître ici en n'ayant *que*
  // envoyé un cadeau, sans avoir swipé à droite.
  const byUser = {};
  (likeRows || []).forEach(l => {
    byUser[l.swiper_user_id] = byUser[l.swiper_user_id] || {};
    byUser[l.swiper_user_id].likedAt = l.created_at;
  });
  (treatRows || []).forEach(t => {
    byUser[t.sender_user_id] = byUser[t.sender_user_id] || {};
    const existing = byUser[t.sender_user_id].giftedAt;
    if (!existing || t.created_at > existing) byUser[t.sender_user_id].giftedAt = t.created_at;
  });

  const allUserIds = Object.keys(byUser);
  if (allUserIds.length === 0) return [];

  const { data: matchRows } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .or(`user_a.eq.${userProfile.userId},user_b.eq.${userProfile.userId}`);
  const matchedUserIds = new Set((matchRows || []).flatMap(m => [m.user_a, m.user_b]));
  const pendingUserIds = allUserIds.filter(id => !matchedUserIds.has(id));
  if (pendingUserIds.length === 0) return [];

  const { data: senderProfiles } = await supabase.from("profiles").select("*").in("user_id", pendingUserIds);
  const byUserId = Object.fromEntries((senderProfiles || []).map(p => [p.user_id, p]));

  // Exclut les profils déjà rejetés (swipe "nope" de ma part) — sinon ils
  // réapparaîtraient dans cette liste malgré le rejet.
  const senderProfileIds = Object.values(byUserId).map(p => p.id);
  const { data: myNopes } = await supabase
    .from("swipes").select("target_profile_id")
    .eq("swiper_user_id", userProfile.userId).eq("direction", "nope").in("target_profile_id", senderProfileIds);
  const declinedIds = new Set((myNopes || []).map(s => s.target_profile_id));

  return pendingUserIds.map(userId => {
    const p = byUserId[userId];
    if (!p || declinedIds.has(p.id)) return null;
    const { likedAt, giftedAt } = byUser[userId];
    const mostRecent = [likedAt, giftedAt].filter(Boolean).sort().reverse()[0];
    return {
      profileId: p.id, userId: p.user_id,
      name: p.pet_name, species: p.species, breed: p.breed, age: p.age, gender: p.gender,
      emoji: p.species === "cat" ? "🐱" : "🐕",
      photo: p.photos?.[0]?.url || null,
      bio: p.bio, temper: p.temper || [], seeking: p.seeking || [],
      energy: p.energy, vaccinated: p.vaccinated, sterilized: p.sterilized,
      time: formatRelativeTime(mostRecent),
      viaLike: !!likedAt, viaGift: !!giftedAt,
      isDemo: false,
    };
  }).filter(Boolean);
}

async function declineLike(userProfile, targetProfile) {
  const { error } = await supabase.from("swipes").insert({
    swiper_user_id: userProfile.userId,
    target_profile_id: targetProfile.profileId,
    direction: "nope",
  });
  if (error) throw new Error(error.message);
}

// Badge de notification "likes non vus" — même logique de dédoublonnage
// (par utilisateur, hors déjà matchés) que fetchLikesReceived, mais en
// comptage simple pour ne pas re-télécharger les profils complets.
async function fetchUnseenLikesCount(userProfile) {
  if (!userProfile?.id || !userProfile?.userId) return 0;
  const { data: likeRows } = await supabase
    .from("swipes")
    .select("swiper_user_id")
    .eq("target_profile_id", userProfile.id)
    .eq("direction", "like")
    .eq("seen", false);
  if (!likeRows || likeRows.length === 0) return 0;

  const swiperIds = [...new Set(likeRows.map(l => l.swiper_user_id))];
  const { data: matchRows } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .or(`user_a.eq.${userProfile.userId},user_b.eq.${userProfile.userId}`);
  const matchedUserIds = new Set((matchRows || []).flatMap(m => [m.user_a, m.user_b]));
  return swiperIds.filter(id => !matchedUserIds.has(id)).length;
}

async function markLikesSeen(userProfile) {
  if (!userProfile?.id) return;
  await supabase.from("swipes").update({ seen: true }).eq("target_profile_id", userProfile.id).eq("direction", "like").eq("seen", false);
}

// Cadeaux/friandises reçus d'une personne précise — utilisé pour les
// mentionner dans la fiche détaillée d'un like reçu.
async function fetchTreatsFromSender(userProfile, senderProfileId) {
  if (!userProfile?.id || !senderProfileId) return [];
  const { data, error } = await supabase
    .from("treats")
    .select("gift_id, message, created_at")
    .eq("target_profile_id", userProfile.id)
    .eq("sender_profile_id", senderProfileId)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchTreatsFromSender error:", error); return []; }
  return (data || []).map(t => {
    const giftInfo = GIFT_CATALOG.find(g => g.id === t.gift_id);
    return { giftId: t.gift_id, label: giftInfo?.label || "Cadeau", emoji: giftInfo?.emoji || "🎁", message: t.message || null };
  });
}

// "Matcher" en retour depuis "Qui craque pour vous" : la personne nous a
// déjà liké, donc notre like crée forcément un match immédiat.
// Like générique avec détection de match réciproque — utilisé partout où on
// peut liker un profil sans certitude qu'il nous a déjà liké en retour
// (contrairement à likeBackAndMatch, réservé à "Qui a craqué pour vous").
async function declineProfile(userProfile, targetProfile) {
  const { error } = await supabase.from("swipes").insert({
    swiper_user_id: userProfile.userId,
    target_profile_id: targetProfile.id,
    direction: "nope",
  });
  if (error) throw new Error(error.message);
}

async function likeProfileAndCheckMatch(userProfile, targetProfile) {
  await supabase.from("swipes").insert({
    swiper_user_id: userProfile.userId,
    target_profile_id: targetProfile.id,
    direction: "like",
  });
  const { data: reciprocal } = await supabase
    .from("swipes")
    .select("id")
    .eq("swiper_user_id", targetProfile.userId)
    .eq("target_profile_id", userProfile.id)
    .eq("direction", "like")
    .maybeSingle();
  if (!reciprocal) return { matched: false, questResult: null };

  await supabase.from("matches").insert({
    user_a: userProfile.userId, user_b: targetProfile.userId,
    profile_a: userProfile.id, profile_b: targetProfile.id,
  });
  sendPushNotification(targetProfile.userId, "C'est un match ! 🎉", `${userProfile.name} et ${targetProfile.name} se sont likés mutuellement.`, { type: "match" });
  let questResult = null;
  if (!userProfile?.questsCompleted?.first_match) {
    try {
      const result = await claimQuest(userProfile, "first_match");
      if (result?.claimed) questResult = result;
    } catch {}
  }
  return { matched: true, questResult };
}

async function likeBackAndMatch(userProfile, like) {
  await supabase.from("swipes").insert({
    swiper_user_id: userProfile.userId,
    target_profile_id: like.profileId,
    direction: "like",
  });
  await supabase.from("matches").insert({
    user_a: userProfile.userId, user_b: like.userId,
    profile_a: userProfile.id, profile_b: like.profileId,
  });
  sendPushNotification(like.userId, "C'est un match ! 🎉", `${userProfile.name} et ${like.name} se sont likés mutuellement.`, { type: "match" });
  if (!userProfile?.questsCompleted?.first_match) {
    try {
      const result = await claimQuest(userProfile, "first_match");
      return result?.claimed ? result : null;
    } catch { return null; }
  }
  return null;
}

async function fetchUnseenTreatsCount(userProfile) {
  if (!userProfile?.userId) return 0;
  const { count, error } = await supabase
    .from("treats")
    .select("id", { count: "exact", head: true })
    .eq("target_user_id", userProfile.userId)
    .eq("seen", false);
  if (error) { console.error("fetchUnseenTreatsCount error:", error); return 0; }
  return count || 0;
}

async function fetchReceivedTreats(userProfile) {
  if (!userProfile?.userId) return [];
  const { data: treatRows, error } = await supabase
    .from("treats")
    .select("*")
    .eq("target_user_id", userProfile.userId)
    .order("created_at", { ascending: false });
  if (error || !treatRows || treatRows.length === 0) return [];

  const senderIds = [...new Set(treatRows.map(t => t.sender_profile_id))];
  const { data: senderProfiles } = await supabase.from("profiles").select("*").in("id", senderIds);
  const byId = Object.fromEntries((senderProfiles || []).map(p => [p.id, p]));

  return treatRows.map(t => {
    const sender = byId[t.sender_profile_id];
    const giftInfo = GIFT_CATALOG.find(g => g.id === t.gift_id);
    return {
      id: t.id,
      seen: t.seen,
      time: formatRelativeTime(t.created_at),
      createdAt: t.created_at,
      name: sender?.pet_name || "Un animal",
      breed: sender?.breed || "",
      photo: sender?.photos?.[0]?.url || null,
      emoji: sender?.species === "cat" ? "🐱" : "🐕",
      senderProfileId: t.sender_profile_id,
      senderUserId: sender?.userId || null,
      giftId: t.gift_id || null,
      giftLabel: giftInfo?.label || "Cadeau",
      giftEmoji: giftInfo?.emoji || "🎁",
      giftCategory: giftInfo?.category || null,
      message: t.message || null,
      ownerNote: t.owner_note || null,
    };
  });
}

async function updateTreatNote(treatId, note) {
  const { error } = await supabase.from("treats").update({ owner_note: note || null }).eq("id", treatId);
  if (error) throw new Error(error.message);
}

// ── LE LIVRE MAGIQUE DE SOUVENIRS ─────────────────────────────────────────
// Construit la structure complète du livre : couverture, introduction,
// pages de contenu (cadeaux + rencontres, triées chronologiquement, avec
// les moments spéciaux repérés — premier de chaque type + jalons ronds),
// et conclusion. Consultable dans l'app ET exportable en PDF depuis la
// même structure, pour que les deux restent toujours cohérents.
// `custom` (optionnel) permet la personnalisation : titre, photo de
// couverture, pages masquées, ordre personnalisé des pages de contenu.
// Construit la liste de TOUS les souvenirs (cadeaux + rencontres), triés et
// réordonnés selon la personnalisation — sans appliquer le masquage. Sert de
// base à la fois à buildBookPages (qui applique le masquage) et au panneau
// de gestion des pages (qui doit lister aussi les pages masquées, pour
// pouvoir les démasquer).
function buildAllContentItems(treatsReceived, encounterPhotos, custom = {}) {
  let contentItems = [
    ...treatsReceived.map(t => ({ id: `gift-${t.id}`, kind: "gift", date: t.createdAt, photo: t.photo, emoji: t.giftEmoji, title: t.giftLabel, subtitle: `de ${t.name}`, quote: t.message })),
    ...encounterPhotos.map(e => ({ id: `encounter-${e.id}`, kind: "encounter", date: e.createdAt, photo: e.photo, emoji: "📸", title: e.otherName ? `Rencontre avec ${e.otherName}` : "Une belle rencontre", subtitle: e.location || "", quote: e.caption })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const seenKinds = new Set();
  contentItems.forEach((item, i) => {
    if (!seenKinds.has(item.kind)) {
      seenKinds.add(item.kind);
      item.special = item.kind === "gift" ? "Premier cadeau ✨" : "Première rencontre ✨";
    } else if ([10, 25, 50].includes(i + 1)) {
      item.special = `${i + 1}ᵉ souvenir ✨`;
    }
  });

  // Ordre personnalisé, si fourni (les pages non listées gardent l'ordre chronologique, à la suite)
  if (custom.order?.length > 0) {
    const byId = Object.fromEntries(contentItems.map(item => [item.id, item]));
    const ordered = custom.order.map(id => byId[id]).filter(Boolean);
    const remaining = contentItems.filter(item => !custom.order.includes(item.id));
    contentItems = [...ordered, ...remaining];
  }

  return contentItems;
}

function buildBookPages(pet, treatsReceived, encounterPhotos, custom = {}) {
  const allItems = buildAllContentItems(treatsReceived, encounterPhotos, custom);
  const contentItems = custom.hiddenIds?.length > 0
    ? allItems.filter(item => !custom.hiddenIds.includes(item.id))
    : allItems;

  const startDate = contentItems.length > 0 ? [...contentItems].sort((a, b) => new Date(a.date) - new Date(b.date))[0].date : new Date().toISOString();

  return [
    { type: "cover", petPhoto: custom.coverPhoto || pet.photos?.[0]?.url || null, petName: pet.name, title: custom.title || null, startDate },
    { type: "intro", petName: pet.name, text: custom.introText || null },
    ...contentItems.map(item => ({ type: item.kind, ...item })),
    { type: "conclusion", petName: pet.name, text: custom.conclusionText || null },
  ];
}

// Thèmes visuels — chacun définit les couleurs de fond/texte/accent utilisées
// à la fois par la vue in-app et par l'export PDF, pour rester cohérents.
const BOOK_THEMES = {
  miloute: { label: "Miloute", icon: "🐾", useLogo: true, pageBg: "#FAF0EB", accent: "#B25F46", accentDark: "#8B3D28", text: "#2D1200", subtext: "#9CA3AF", frameBg: "#8B3D28", pdfBg: [250, 240, 235] },
  doux: { label: "Doux", icon: "🌸", pageBg: "#FBE0EA", accent: "#C4527A", accentDark: "#9A3D5E", text: "#4A2534", subtext: "#C494A8", frameBg: "#7A3450", pdfBg: [251, 224, 234] },
  nuit: { label: "Nuit étoilée", icon: "🌙", pageBg: "#1B2340", accent: "#E8C468", accentDark: "#C9A94E", text: "#F5F0E6", subtext: "#9CA3C4", frameBg: "#0E1226", pdfBg: [27, 35, 64] },
  nature: { label: "Nature", icon: "🌿", pageBg: "#CDEBCD", accent: "#3F7D3F", accentDark: "#2C5C2C", text: "#1D3A1D", subtext: "#7FAA7F", frameBg: "#2C5C2C", pdfBg: [205, 235, 205] },
  pastel: { label: "Pastel", icon: "💜", pageBg: "#F3F0FB", accent: "#8B7BC7", accentDark: "#6C5AA8", text: "#332B4D", subtext: "#A79FC4", frameBg: "#2A2440", pdfBg: [243, 240, 251] },
  ocean: { label: "Océan", icon: "🌊", pageBg: "#CDEBFA", accent: "#1D6E8F", accentDark: "#154F67", text: "#123240", subtext: "#79A9BE", frameBg: "#154F67", pdfBg: [205, 235, 250] },
  automne: { label: "Automne", icon: "🍂", pageBg: "#FCF0E4", accent: "#C2703D", accentDark: "#94502A", text: "#4A2A16", subtext: "#C9A385", frameBg: "#3D2416", pdfBg: [252, 240, 228] },
  dore: { label: "Doré", icon: "✨", pageBg: "#F9DE8B", accent: "#8B6A16", accentDark: "#6B4F0F", text: "#3D2E08", subtext: "#B49A4E", frameBg: "#6B4F0F", pdfBg: [249, 222, 139] },
};

function loadBookCustomization(petId) {
  try {
    const raw = localStorage.getItem(`miloute_book_custom_${petId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveBookCustomization(petId, custom) {
  try { localStorage.setItem(`miloute_book_custom_${petId}`, JSON.stringify(custom)); } catch {}
}

async function imageUrlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Nécessite la bibliothèque jsPDF (npm install jspdf).
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function exportBookToPdf(pages, onProgress, theme = BOOK_THEMES.doux) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const [accentR, accentG, accentB] = hexToRgb(theme.accent);
  const [accentDR, accentDG, accentDB] = hexToRgb(theme.accentDark);
  const [textR, textG, textB] = hexToRgb(theme.text);
  const [subR, subG, subB] = hexToRgb(theme.subtext);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (onProgress) onProgress(i + 1, pages.length);
    if (i > 0) doc.addPage();

    doc.setFillColor(theme.pdfBg[0], theme.pdfBg[1], theme.pdfBg[2]);
    doc.rect(0, 0, 148, 210, "F");

    if (page.type === "cover") {
      doc.setTextColor(accentR, accentG, accentB);
      doc.setFontSize(24);
      doc.text(page.title || "Le Livre de Souvenirs", 74, 80, { align: "center", maxWidth: 120 });
      doc.setFontSize(18);
      doc.text(`de ${page.petName}`, 74, 96, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(accentDR, accentDG, accentDB);
      doc.text("Ses plus beaux moments", 74, 110, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(subR, subG, subB);
      doc.text(`Depuis le ${new Date(page.startDate).toLocaleDateString("fr-FR")}`, 74, 190, { align: "center" });
    } else if (page.type === "intro") {
      doc.setFontSize(13);
      doc.setTextColor(textR, textG, textB);
      doc.text(`L'histoire de ${page.petName}`, 74, 50, { align: "center" });
      doc.setFontSize(10.5);
      doc.setTextColor(subR, subG, subB);
      doc.text(page.text || `Depuis son arrivée sur Miloute, ${page.petName} a vécu de belles rencontres\net reçu de jolies attentions. Voici son histoire, jour après jour.`, 74, 70, { align: "center", maxWidth: 110 });
    } else if (page.type === "conclusion") {
      doc.setFontSize(16);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text(page.text || "L'histoire continue…", 74, 100, { align: "center", maxWidth: 120 });
      doc.setFontSize(10);
      doc.setTextColor(subR, subG, subB);
      doc.text("Miloute", 74, 190, { align: "center" });
    } else {
      // gift / encounter
      let y = 18;
      if (page.photo) {
        try {
          const imgData = await imageUrlToBase64(page.photo);
          doc.addImage(imgData, "JPEG", 24, y, 100, 100);
          y += 112;
        } catch {
          y += 4; // image indisponible — on continue sans bloquer tout le livre
        }
      }
      if (page.special) {
        doc.setFontSize(9);
        doc.setTextColor(148, 104, 0);
        doc.text(page.special, 74, y, { align: "center" });
        y += 7;
      }
      doc.setFontSize(13);
      doc.setTextColor(textR, textG, textB);
      doc.text(page.title, 74, y, { align: "center", maxWidth: 120 });
      y += 8;
      if (page.subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(subR, subG, subB);
        doc.text(page.subtitle, 74, y, { align: "center", maxWidth: 120 });
        y += 6;
      }
      if (page.quote) {
        doc.setFontSize(10);
        doc.setTextColor(accentDR, accentDG, accentDB);
        doc.text(`« ${page.quote} »`, 74, y, { align: "center", maxWidth: 110 });
      }
    }
  }

  doc.save(`livre-de-souvenirs-${pages[0]?.petName?.toLowerCase().replace(/\s+/g, "-") || "miloute"}.pdf`);
}

async function deleteTreatMemory(treatId) {
  const { error } = await supabase.from("treats").delete().eq("id", treatId);
  if (error) throw new Error(error.message);
}

async function markTreatsSeen(userProfile) {
  if (!userProfile?.userId) return;
  await supabase.from("treats").update({ seen: true }).eq("target_user_id", userProfile.userId).eq("seen", false);
}

async function unmatchUser(matchId) {
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw new Error(error.message);
}

// ── JOURNAL DE BORD ───────────────────────────────────────────────────────
// Fusionne 3 sources déjà existantes (matchs, cadeaux reçus, posts publiés)
// en une seule chronologie — pas de nouvelle table, juste un assemblage.
async function fetchJournalEntries(userProfile) {
  if (!userProfile?.userId) return [];

  const [{ data: matchRows }, { data: treatRows }, { data: postRows }] = await Promise.all([
    supabase.from("matches").select("id, created_at, profile_a, profile_b")
      .or(`user_a.eq.${userProfile.userId},user_b.eq.${userProfile.userId}`),
    supabase.from("treats").select("id, created_at, sender_profile_id, gift_id")
      .eq("target_user_id", userProfile.userId),
    supabase.from("community_posts").select("id, created_at, text, photo_url")
      .eq("user_id", userProfile.userId),
  ]);

  const otherProfileIds = [...new Set([
    ...(matchRows || []).map(m => (m.profile_a === userProfile.id ? m.profile_b : m.profile_a)),
    ...(treatRows || []).map(t => t.sender_profile_id),
  ])].filter(Boolean);
  const { data: otherProfiles } = otherProfileIds.length > 0
    ? await supabase.from("profiles").select("id, pet_name, species, photos").in("id", otherProfileIds)
    : { data: [] };
  const profileById = Object.fromEntries((otherProfiles || []).map(p => [p.id, p]));
  const ownPhoto = userProfile.photos?.[0]?.url || null;

  const entries = [
    ...(matchRows || []).map(m => {
      const otherId = m.profile_a === userProfile.id ? m.profile_b : m.profile_a;
      const other = profileById[otherId];
      return { id: `match-${m.id}`, date: m.created_at, icon: other?.species === "cat" ? "🐱" : "🐕", photo: other?.photos?.[0]?.url || null, text: `C'est un match avec ${other?.pet_name || "un compagnon"} !` };
    }),
    ...(treatRows || []).map(t => {
      const sender = profileById[t.sender_profile_id];
      const giftInfo = GIFT_CATALOG.find(g => g.id === t.gift_id);
      return { id: `treat-${t.id}`, date: t.created_at, icon: giftInfo?.emoji || "🎁", photo: sender?.photos?.[0]?.url || null, text: `${sender?.pet_name || "Un compagnon"} vous a envoyé ${giftInfo ? (giftInfo.gender === "f" ? "une " : "un ") + giftInfo.label : "un cadeau"}` };
    }),
    ...(postRows || []).map(p => ({ id: `post-${p.id}`, date: p.created_at, icon: "📸", photo: p.photo_url || ownPhoto, text: "Vous avez publié dans la Communauté" })),
  ];

  // Moments Spéciaux : le premier de chaque type, et quelques jalons ronds
  // sur le total cumulé — repérés en parcourant la chronologie dans l'ordre.
  const chronological = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenTypes = new Set();
  const FIRST_LABELS = { match: "🎉 Premier match !", treat: "🎉 Premier cadeau reçu !", post: "🎉 Premier post publié !" };
  chronological.forEach((e, i) => {
    const type = e.id.split("-")[0];
    if (!seenTypes.has(type)) {
      seenTypes.add(type);
      e.special = FIRST_LABELS[type];
    } else if ([10, 25, 50, 100].includes(i + 1)) {
      e.special = `🏆 ${i + 1}ᵉ moment partagé !`;
    }
  });

  return chronological.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ── STATISTIQUES AVANCÉES (Premium) ──────────────────────────────────────
// Calculées à partir de vraies données (swipes, matchs, cadeaux) — pas de
// "vues de profil" ici, cette donnée n'est pas tracée par l'app aujourd'hui,
// on ne l'invente pas.
async function fetchAdvancedStats(userProfile) {
  if (!userProfile?.userId || !userProfile?.id) return null;

  const [likesSentRes, likesReceivedRes, matchRowsRes, treatsReceivedRes, treatsSentRes, profileRes] = await Promise.all([
    supabase.from("swipes").select("id", { count: "exact", head: true }).eq("swiper_user_id", userProfile.userId).eq("direction", "like"),
    supabase.from("swipes").select("id", { count: "exact", head: true }).eq("target_profile_id", userProfile.id).eq("direction", "like"),
    supabase.from("matches").select("profile_a, profile_b").or(`user_a.eq.${userProfile.userId},user_b.eq.${userProfile.userId}`),
    supabase.from("treats").select("id", { count: "exact", head: true }).eq("target_user_id", userProfile.userId),
    supabase.from("treats").select("gift_id").eq("sender_user_id", userProfile.userId),
    supabase.from("profiles").select("created_at").eq("id", userProfile.id).maybeSingle(),
  ]);

  const likesSent = likesSentRes.count || 0;
  const likesReceived = likesReceivedRes.count || 0;
  const matchRows = matchRowsRes.data || [];
  const treatsReceivedCount = treatsReceivedRes.count || 0;
  const matchRate = likesSent > 0 ? Math.round((matchRows.length / likesSent) * 100) : null;

  let topBreed = null;
  if (matchRows.length > 0) {
    const otherIds = matchRows.map(m => m.profile_a === userProfile.id ? m.profile_b : m.profile_a);
    const { data: matchProfiles } = await supabase.from("profiles").select("id, breed").in("id", otherIds);
    const counts = {};
    (matchProfiles || []).forEach(p => { if (p.breed) counts[p.breed] = (counts[p.breed] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) topBreed = sorted[0][0];
  }

  let topGiftSent = null;
  const sentRows = treatsSentRes.data || [];
  if (sentRows.length > 0) {
    const counts = {};
    sentRows.forEach(t => { if (t.gift_id) counts[t.gift_id] = (counts[t.gift_id] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const giftInfo = GIFT_CATALOG.find(g => g.id === sorted[0][0]);
      topGiftSent = giftInfo ? `${giftInfo.emoji} ${giftInfo.label}` : null;
    }
  }

  let memberSince = null;
  if (profileRes.data?.created_at) {
    const days = Math.floor((Date.now() - new Date(profileRes.data.created_at).getTime()) / (24 * 60 * 60 * 1000));
    if (days < 1) memberSince = "Aujourd'hui";
    else if (days < 31) memberSince = `${days} jour${days > 1 ? "s" : ""}`;
    else if (days < 365) memberSince = `${Math.floor(days / 30)} mois`;
    else memberSince = `${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
  }

  const hasAnyData = matchRows.length > 0 || likesReceived > 0 || treatsReceivedCount > 0 || sentRows.length > 0;

  return { matchRate, likesReceived, matchCount: matchRows.length, topBreed, topGiftSent, memberSince, hasAnyData };
}

async function fetchMatchesForUser(userProfile) {
  if (!userProfile?.userId) return [];
  const { data: matchRows, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a.eq.${userProfile.userId},user_b.eq.${userProfile.userId}`)
    .order("created_at", { ascending: false });
  if (error || !matchRows || matchRows.length === 0) return [];

  const otherProfileIds = matchRows.map(m => (m.profile_a === userProfile.id ? m.profile_b : m.profile_a));
  const { data: otherProfiles } = await supabase.from("profiles").select("*").in("id", otherProfileIds);
  const profileById = Object.fromEntries((otherProfiles || []).map(p => [p.id, p]));

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("match_id, text, gift_emoji, sender_user_id, created_at")
    .in("match_id", matchRows.map(m => m.id))
    .order("created_at", { ascending: false });
  const lastByMatch = {};
  (lastMessages || []).forEach(msg => { if (!lastByMatch[msg.match_id]) lastByMatch[msg.match_id] = msg; });

  return matchRows.map(m => {
    const otherId = m.profile_a === userProfile.id ? m.profile_b : m.profile_a;
    const other = profileById[otherId];
    const last = lastByMatch[m.id];
    const lastIsGift = !!last?.gift_emoji;
    return {
      id: m.id,
      otherUserId: m.user_a === userProfile.userId ? m.user_b : m.user_a,
      otherProfileId: otherId,
      name: other?.pet_name || "Profil",
      species: other?.species,
      emoji: other?.species === "cat" ? "🐱" : "🐕",
      photo: other?.photos?.[0]?.url || null,
      owner: other?.owner_name || "",
      lastMsg: last ? (lastIsGift ? `🎁 ${last.sender_user_id === userProfile.userId ? "Vous avez envoyé" : "A envoyé"} un cadeau` : last.text) : "Vous avez matché ! Dites bonjour 👋",
      lastMsgIsGift: lastIsGift,
      time: last ? formatRelativeTime(last.created_at) : "",
      unread: 0,
    };
  });
}

// Mémorise, par appareil, quels messages-cadeaux ont déjà été vus avec
// l'animation complète — pour ne jouer l'effet "waouh" qu'une seule fois par
// personne, la toute première fois qu'elle découvre ce cadeau précis.
function loadSeenGiftIds() {
  try { return new Set(JSON.parse(localStorage.getItem("miloute_seen_gift_msgs") || "[]")); }
  catch { return new Set(); }
}
function saveSeenGiftIds(set) {
  try { localStorage.setItem("miloute_seen_gift_msgs", JSON.stringify([...set])); } catch {}
}

function loadPremiumStatus() {
  try { return localStorage.getItem("miloute_is_premium") === "true"; } catch { return false; }
}
function savePremiumStatus(value) {
  try { localStorage.setItem("miloute_is_premium", value ? "true" : "false"); } catch {}
}

// ── FRIANDISES ("super like" à thème) ────────────────────────────────────────
// Quota gratuit boosté au lancement pour maximiser l'engagement pendant la
// phase critique, puis réduit une fois la base d'utilisateurs stabilisée.
// 👉 À AJUSTER : mets ici la date réelle de ton lancement (la rentrée), le
// boost s'arrêtera automatiquement 14 jours plus tard.
const LAUNCH_DATE = "2026-09-01";
const LAUNCH_BOOST_DAYS = 14;
const FREE_TREATS_PER_DAY_LAUNCH = 3;
const FREE_TREATS_PER_DAY_NORMAL = 1;

function isLaunchBoostActive() {
  const launch = new Date(LAUNCH_DATE);
  const boostEnd = new Date(launch.getTime() + LAUNCH_BOOST_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  return now >= launch && now < boostEnd;
}
// Quota du jour : 3/jour pendant les 14 jours suivant le lancement, puis 1/jour.
const FREE_TREATS_PER_DAY = isLaunchBoostActive() ? FREE_TREATS_PER_DAY_LAUNCH : FREE_TREATS_PER_DAY_NORMAL;

function todayKey() { return new Date().toISOString().slice(0, 10); } // "YYYY-MM-DD"
function loadTreatsToday() {
  try {
    const raw = JSON.parse(localStorage.getItem("miloute_treats_today") || "null");
    if (raw && raw.date === todayKey()) return raw.count;
    return 0;
  } catch { return 0; }
}
function saveTreatsToday(count) {
  try { localStorage.setItem("miloute_treats_today", JSON.stringify({ date: todayKey(), count })); } catch {}
}

// ── ÉCRAN D'ACCUEIL (connexion / inscription) ───────────────────────────────────
function WelcomeScreen({ onStartEmailSignup, onLoggedIn }) {
  const [mode, setMode] = useState("choice"); // choice | login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    // En cas de succès, la page est redirigée vers Google puis revient ici —
    // la session est alors récupérée automatiquement par le listener au niveau App.
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message.includes("Invalid login") ? "Email ou mot de passe incorrect." : error.message);
      return;
    }
    onLoggedIn(data.session);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 28px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 10 }}>
        <PawLogo size={64} color="#B25F46" />
        <span style={{ fontSize: 42, fontWeight: 900, color: "#B25F46" }}>Miloute</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 14, color: "#B25F46", marginBottom: 36 }}>La vraie rencontre pour chiens et chats</div>

      {error && (
        <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>{error}</div>
      )}

      {mode === "choice" ? (
        <>
          <button onClick={handleGoogle}
            style={{ width: "100%", padding: "15px", borderRadius: 16, border: "1.5px solid #E5E7EB", background: "#fff", color: "#2D1200", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.26h2.9C16.66 14.2 17.64 11.9 17.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33C2.46 15.98 5.48 18 9 18z"/><path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.97H.98A8.996 8.996 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.46 2.02.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>
            Continuer avec Google
          </button>
          <button onClick={onStartEmailSignup}
            style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 20 }}>
            Créer un compte avec un email
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
            Déjà un compte ? <span onClick={() => setMode("login")} style={{ color: "#B25F46", fontWeight: 700, cursor: "pointer" }}>Se connecter</span>
          </div>
        </>
      ) : (
        <>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8, display: "block" }}>EMAIL</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="marie@email.com"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", fontSize: 15, outline: "none", background: "#F9FAFB", boxSizing: "border-box", marginBottom: 16 }} />
          <label style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8, display: "block" }}>MOT DE PASSE</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", fontSize: 15, outline: "none", background: "#F9FAFB", boxSizing: "border-box", marginBottom: 20 }} />
          <button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: (loading || !email || !password) ? "#E5E7EB" : "linear-gradient(135deg,#B25F46,#C97A5E)", color: (loading || !email || !password) ? "#9CA3AF" : "#fff", fontSize: 15, fontWeight: 800, cursor: (loading || !email || !password) ? "default" : "pointer", marginBottom: 16 }}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
            <span onClick={() => setMode("choice")} style={{ color: "#B25F46", fontWeight: 700, cursor: "pointer" }}>← Retour</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function Miloute() {
  const [onboarded, setOnboarded] = useState(() => loadProfile() !== null);
  const [photoUploadWarning, setPhotoUploadWarning] = useState(0); // nombre de photos qui ont échoué à l'envoi à l'inscription
  const [unseenTreats, setUnseenTreats] = useState(0);
  const [unseenLikes, setUnseenLikes] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userProfile, setUserProfile] = useState(() => loadProfile());
  const userProfileRef = useRef(userProfile);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);
  const [authSession, setAuthSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authView, setAuthView] = useState("welcome"); // welcome | email-onboarding
  const [screen, setScreen] = useState("swipe");
  const [chatId, setChatId] = useState(null);
  const [isPremium, setIsPremium] = useState(loadPremiumStatus);
  const [showPremiumTunnel, setShowPremiumTunnel] = useState(false);
  const [premiumInitialPlan, setPremiumInitialPlan] = useState("yearly");
  const [showAbout, setShowAbout] = useState(false);
  const [showPremiumSuccess, setShowPremiumSuccess] = useState(false);
  const [requestOpenProviderScreen, setRequestOpenProviderScreen] = useState(false);
  const [requestOpenShop, setRequestOpenShop] = useState(false);
  function goToShop() { setRequestOpenShop(true); setScreen("profile"); }
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [showShopSuccess, setShowShopSuccess] = useState(false);
  const [shopSuccessCategory, setShopSuccessCategory] = useState(null);
  const [shopSuccessBundleLabel, setShopSuccessBundleLabel] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [magicMomentReward, setMagicMomentReward] = useState(null);

  // Moment Magique : une fois par session/jour, tirage discret d'une petite
  // récompense surprise gratuite (voir garde-fous dans checkMagicMoment).
  useEffect(() => {
    if (!userProfile?.id) return;
    checkMagicMoment(userProfile).then(reward => {
      if (reward) {
        setMagicMomentReward(reward);
        setUserProfile(u => u ? { ...u, giftInventory: reward.giftInventory } : u);
        playGiftFeedback(loadSoundMode(), loadSoundPalette(), userProfile.species);
      }
    });
  }, [userProfile?.id]);

  // Heartbeat "statut en ligne" : signale sa propre activité toutes les 60s
  // pendant que l'app est ouverte, pour que les autres voient "En ligne".
  // Met aussi à jour le profil local (pas seulement la base) pour que le
  // Heartbeat de l'animal, affiché dans Profil, reflète l'activité en cours.
  useEffect(() => {
    if (!userProfile?.id) return;
    function beat() {
      const now = new Date().toISOString();
      touchLastActive(userProfile);
      setUserProfile(u => u ? { ...u, lastActiveAt: now } : u);
    }
    beat();
    const interval = setInterval(beat, 60000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  // Enregistrement des notifications push — une fois, à la connexion,
  // uniquement sur Android natif (no-op silencieux sur le web).
  useEffect(() => {
    if (!userProfile?.userId) return;
    registerPushNotifications(userProfile);
  }, [userProfile?.userId]);

  // Badge de notification sur l'icône Profil : friandises reçues pas encore vues.
  useEffect(() => {
    if (!userProfile?.userId) { setUnseenTreats(0); return; }
    let active = true;
    async function refresh() {
      const count = await fetchUnseenTreatsCount(userProfile);
      if (active) setUnseenTreats(count);
    }
    refresh();
    const interval = setInterval(refresh, 30000); // rafraîchi toutes les 30s
    return () => { active = false; clearInterval(interval); };
  }, [userProfile?.userId]);

  // Badge de notification sur l'icône Profil : likes reçus pas encore vus.
  useEffect(() => {
    if (!userProfile?.userId) { setUnseenLikes(0); return; }
    let active = true;
    async function refresh() {
      const count = await fetchUnseenLikesCount(userProfile);
      if (active) setUnseenLikes(count);
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [userProfile?.userId]);

  // Badge de notification sur l'icône Messages : messages non lus.
  useEffect(() => {
    if (!userProfile?.userId) { setUnreadMessages(0); return; }
    let active = true;
    async function refresh() {
      const count = await fetchUnreadMessagesCount(userProfile);
      if (active) setUnreadMessages(count);
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [userProfile?.userId]);

  // Vérifie s'il existe déjà une session Supabase (retour de Google, ou
  // navigateur déjà connecté) et reste à l'écoute des changements —
  // c'est ce listener qui capte le retour depuis Google après redirection.
  useEffect(() => {
    let active = true;

    async function handleSession(session) {
      setAuthSession(session);
      if (!session) { setCheckingSession(false); return; }

      const profile = await fetchProfileForUser(session.user.id);
      if (!active) return;
      if (profile) {
        setUserProfile(profile);
        setOnboarded(true);
        saveProfile(profile);
        // La base Supabase fait foi pour le statut Premium (pas seulement ce
        // navigateur) — on synchronise l'état local et le cache dessus.
        setIsPremium(profile.isPremium);
        savePremiumStatus(profile.isPremium);
      } else {
        // Compte authentifié (souvent via Google) mais profil animal pas encore créé.
        setOnboarded(false);
      }
      setCheckingSession(false);
    }

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  // Détecte le retour depuis Stripe Checkout, puis VÉRIFIE auprès de Stripe
  // que le paiement a réellement eu lieu — on ne fait jamais confiance à
  // l'URL seule (?premium=success peut être tapé par n'importe qui).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("premium");
    const sessionId = params.get("session_id");

    if (status === "success" && sessionId) {
      setVerifyingPayment(true);
      fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.paid && data.activated) {
            setIsPremium(true);
            savePremiumStatus(true);
            setShowPremiumSuccess(true);
            if (userProfileRef.current?.id) {
              updateUserProfile({ ...userProfileRef.current, isPremium: true });
            }
            // Revient à l'écran où l'utilisateur était avant d'être envoyé
            // vers Stripe, plutôt que de retomber sur l'écran par défaut.
            try {
              const previousScreen = localStorage.getItem("miloute_screen_before_checkout");
              if (previousScreen) { setScreen(previousScreen); localStorage.removeItem("miloute_screen_before_checkout"); }
            } catch {}
          } else if (data.paid && !data.activated) {
            setVerifyError("Paiement confirmé, mais l'activation n'a pas pu être finalisée automatiquement. Contactez le support avec votre reçu Stripe.");
          } else {
            setVerifyError("Le paiement n'a pas pu être confirmé. Si vous avez bien payé, contactez le support.");
          }
        })
        .catch(() => {
          setVerifyError("Impossible de vérifier le paiement. Réessayez ou contactez le support.");
        })
        .finally(() => setVerifyingPayment(false));
    } else if (status === "success" && !sessionId) {
      // Pas d'identifiant de session = tentative de contournement par URL → on ignore.
      setVerifyError("Lien de confirmation invalide.");
    }

    if (status === "success" || status === "cancel") {
      // Nettoie l'URL pour ne pas re-déclencher au rafraîchissement
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Même logique que ci-dessus, pour le retour d'une réservation de prestation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("booking");
    const sessionId = params.get("session_id");

    if (status === "success" && sessionId) {
      verifyBookingSession(sessionId)
        .then(data => {
          if (data.paid) {
            setShowBookingSuccess(true);
            if (userProfileRef.current && !userProfileRef.current?.questsCompleted?.first_booking) {
              claimQuest(userProfileRef.current, "first_booking").then(result => {
                if (result.claimed) updateUserProfile({ ...userProfileRef.current, giftInventory: result.giftInventory, questsCompleted: result.questsCompleted });
              }).catch(() => {});
            }
          }
          else setVerifyError("Le paiement de la réservation n'a pas pu être confirmé.");
        })
        .catch(() => setVerifyError("Impossible de vérifier le paiement de la réservation."));
    }

    if (status === "success" || status === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Même logique, pour le retour d'un achat boutique (boosts/friandises).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("shop");
    const sessionId = params.get("session_id");

    if (status === "success" && sessionId) {
      verifyShopSession(sessionId)
        .then(data => {
          if (data.paid) {
            const bundle = GIFT_BUNDLES.find(b => b.id === data.itemId);
            const purchasedItem = GIFT_CATALOG.find(g => g.id === data.itemId) || bundle;
            setShopSuccessCategory(purchasedItem?.category || null);
            setShopSuccessBundleLabel(bundle?.label || null);
            setShowShopSuccess(true);
            playGiftFeedback(loadSoundMode(), loadSoundPalette(), userProfileRef.current?.species);
            if (userProfileRef.current) {
              const updates = {};
              if (data.giftInventory !== undefined) updates.giftInventory = data.giftInventory;
              updateUserProfile({ ...userProfileRef.current, ...updates });
            }
          } else {
            setVerifyError("Le paiement n'a pas pu être confirmé.");
          }
        })
        .catch(() => setVerifyError("Impossible de vérifier le paiement."));
    }

    if (status === "success" || status === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function completeOnboarding(form) {
    let userId = authSession?.user?.id || null;

    // Pas de session active (parcours email classique) → on crée le compte maintenant.
    if (!userId) {
      const { data, error } = await supabase.auth.signUp({
        email: form.ownerEmail,
        password: form.ownerPassword,
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("Un compte existe déjà avec cet email. Essayez de vous connecter plutôt.");
        }
        throw new Error(error.message);
      }

      userId = data.user?.id;
      if (!userId) {
        throw new Error(
          "Compte créé, mais la session n'a pas pu démarrer. Si la confirmation par email est activée sur ton projet Supabase, désactive-la (Authentication → Settings → Confirm email) le temps du développement."
        );
      }
    }

    // Les photos ont été gardées en fichiers bruts pendant l'onboarding (pas de
    // compte = pas de dossier Storage). Maintenant que le compte existe, on les
    // envoie réellement et on récupère leurs vraies URLs publiques.
    const uploadedPhotos = [];
    let photoUploadFailures = 0;
    for (const p of form.photos) {
      if (p.file) {
        try {
          const url = await uploadPhotoToStorage(p.file, userId);
          uploadedPhotos.push({ url, name: p.name });
        } catch (err) {
          console.error("Échec de l'envoi d'une photo :", err); // on n'annule pas toute l'inscription pour une photo
          photoUploadFailures++;
        }
      } else if (p.url) {
        uploadedPhotos.push({ url: p.url, name: p.name });
      }
    }

    const { data: insertedRow, error: insertError } = await supabase.from("profiles").insert({
      user_id: userId,
      owner_name: form.ownerName,
      owner_email: form.ownerEmail,
      pet_name: form.petName,
      species: form.species,
      breed: form.breed,
      age: form.age,
      gender: form.gender,
      energy: form.energy,
      vaccinated: form.vaccinated,
      sterilized: form.sterilized,
      temper: form.temper,
      seeking: form.seeking,
      bio: form.bio,
      photos: uploadedPhotos,
      provider_interest: form.providerInterest,
      lat: form.location?.lat ?? null,
      lng: form.location?.lng ?? null,
      photo_captions: form.photoCaptions,
      show_main_caption: form.showMainCaption,
      // Bonus de bienvenue : un aperçu gratuit de la boutique dès l'inscription.
      gift_inventory: { [form.species === "cat" ? "fish" : "bone"]: 1, bouquet: 1 },
    }).select().single();

    if (insertError) throw new Error(insertError.message);

    // Important : on reconstruit le profil local depuis la vraie ligne insérée
    // (via profileFromRow, le mappeur canonique utilisé partout ailleurs dans
    // l'app), pas depuis le formulaire brut d'onboarding — sinon tout ce qui
    // est calculé/ajouté côté serveur à l'insertion (cadeaux de bienvenue,
    // quêtes, etc.) manque dans l'app tant qu'on n'a pas rechargé/reconnecté.
    const normalized = profileFromRow(insertedRow);
    setUserProfile(normalized);
    setOnboarded(true);
    saveProfile(normalized); // cache local — utile pour un chargement instantané au prochain lancement
    if (photoUploadFailures > 0) setPhotoUploadWarning(photoUploadFailures);
  }

  function openChat(id) { setChatId(id); setScreen("chat"); }
  function updateUserProfile(updated) {
    setUserProfile(updated);
    saveProfile(updated);
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    setUserProfile(null);
    setOnboarded(false);
    setAuthSession(null);
    setAuthView("welcome");
    setScreen("swipe");
    try { localStorage.removeItem("miloute_user_profile"); } catch {}
  }
  function closeChat() { setChatId(null); setScreen("messages"); }
  function openPremium(preferredPlan = "yearly") {
    if (!isPremium) {
      try { localStorage.setItem("miloute_screen_before_checkout", screen); } catch {}
      setPremiumInitialPlan(preferredPlan);
      setShowPremiumTunnel(true);
    }
  }
  
  const NAV = [
    { id: "swipe", label: "Découvrir", icon: null, logo: true },
    { id: "repro", label: "Reproduction", icon: "🌱" },
    { id: "providers", label: "Prestataires", icon: "🏥" },
    { id: "community", label: "Communauté", icon: "🏆" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "profile", label: "Profil", icon: userProfile?.species === "dog" ? "🐕" : "🐱" },
  ];
  const showHeader = onboarded && !["chat","profile"].includes(screen);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh", background: "#fff", fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 430, height: "100%", background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Header */}
        {showHeader && (
          <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PawLogo size={22} color="#B25F46" />
              <span style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg,#8B3D28,#B25F46)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Miloute</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAbout(true)} style={{ background: "#FAF0EB", border: "none", borderRadius: 10, color: "#8B3D28", fontSize: 12, fontWeight: 700, padding: "5px 12px", cursor: "pointer" }}>À propos & aide</button>
            </div>
          </div>
        )}

        {/* Screens */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {checkingSession
            ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={40} color="#E8B89F" /></div>
            : !onboarded
              ? (authSession
                  ? <Onboarding onComplete={completeOnboarding} initialOwner={{ name: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || "", email: authSession.user.email }} />
                  : authView === "email-onboarding"
                    ? <Onboarding onComplete={completeOnboarding} onBack={() => setAuthView("welcome")} />
                    : <WelcomeScreen onStartEmailSignup={() => setAuthView("email-onboarding")} onLoggedIn={setAuthSession} />
                )
              : <>
                {screen === "swipe" && <SwipeScreen onNav={setScreen} userProfile={userProfile} isPremium={isPremium} onPremium={openPremium} onGoToShop={goToShop} onProfileUpdated={updateUserProfile} />}
                {screen === "providers" && <ProvidersScreen userProfile={userProfile} onProfileUpdated={updateUserProfile} onNav={setScreen} onGoToProviderSetup={() => { setRequestOpenProviderScreen(true); setScreen("profile"); }} />}
                {screen === "repro" && <ReproScreen isPremium={isPremium} onPremium={openPremium} userProfile={userProfile} onProfileUpdated={updateUserProfile} />}
                
                {screen === "community" && <CommunityScreen onPremium={openPremium} isPremium={isPremium} userProfile={userProfile} onProfileUpdated={updateUserProfile} onNav={setScreen} onGoToShop={goToShop} />}
                {screen === "messages" && <MatchesScreen onOpenChat={openChat} userProfile={userProfile} />}
                {screen === "chat" && <ChatScreen matchId={chatId} onBack={closeChat} userProfile={userProfile} onMessagesRead={() => fetchUnreadMessagesCount(userProfile).then(setUnreadMessages)} onProfileUpdated={updateUserProfile} onGoToShop={goToShop} />}
                {screen === "profile" && <ProfileScreen onPremium={openPremium} isPremium={isPremium} initialData={userProfile} onProfileUpdated={updateUserProfile} onLogout={handleLogout} onTreatsSeen={() => setUnseenTreats(0)} onLikesSeen={() => setUnseenLikes(0)} onNav={setScreen} autoOpenProviderScreen={requestOpenProviderScreen} onProviderScreenOpened={() => setRequestOpenProviderScreen(false)} autoOpenShop={requestOpenShop} onShopOpened={() => setRequestOpenShop(false)} />}
              </>
          }
        </div>

        {/* Écran À propos / Aide — overlay plein écran */}
        {showAbout && (
          <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 80, display: "flex", flexDirection: "column" }}>
            <AboutScreen onBack={() => setShowAbout(false)} />
          </div>
        )}

        {/* Bottom nav — uniquement après onboarding */}
        {onboarded && screen !== "chat" && (
          <div style={{ borderTop: "1px solid #F3F4F6", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-evenly", padding: "10px 0 14px" }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setScreen(n.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", flex: 1 }}>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 24 }}>
                    {n.logo ? <PawLogo size={24} color="#B25F46" /> : <span style={{ fontSize: 20 }}>{n.icon}</span>}
                    {n.id === "profile" && (unseenTreats + unseenLikes) > 0 && (
                      <span style={{ position: "absolute", top: -6, right: -8, background: "#B25F46", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>{unseenTreats + unseenLikes}</span>
                    )}
                    {n.id === "messages" && unreadMessages > 0 && (
                      <span style={{ position: "absolute", top: -6, right: -8, background: "#B25F46", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>{unreadMessages}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: screen === n.id ? 700 : 400, color: screen === n.id ? "#B25F46" : "#9CA3AF", whiteSpace: "nowrap" }}>{n.label}</span>
                  {screen === n.id && <div style={{ width: 16, height: 3, borderRadius: 2, background: "#B25F46" }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium tunnel */}
        {showPremiumTunnel && (
          <PremiumTunnel onClose={() => setShowPremiumTunnel(false)} initialPlan={premiumInitialPlan} userProfile={userProfile} />
        )}

        {/* Vérification du paiement en cours */}
        {verifyingPayment && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", width: "100%", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, border: "4px solid #FAF0EB", borderTopColor: "#B25F46", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2D1200" }}>Vérification du paiement...</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Confirmation auprès de Stripe</div>
            </div>
          </div>
        )}

        {/* Erreur de vérification de paiement */}
        {verifyError && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setVerifyError(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Paiement non confirmé</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>{verifyError}</div>
              <button onClick={() => setVerifyError(null)}
                style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "#F3F4F6", color: "#6B7280", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Confirmation après retour de Stripe Checkout */}
        {showPremiumSuccess && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setShowPremiumSuccess(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>👑</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Bienvenue dans Premium !</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>Votre paiement a été confirmé par Stripe. Toutes les fonctionnalités Premium sont maintenant actives.</div>
              <button onClick={() => setShowPremiumSuccess(false)}
                style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Découvrir mes avantages 🐾
              </button>
            </div>
          </div>
        )}

        {showBookingSuccess && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setShowBookingSuccess(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Réservation confirmée !</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>Votre paiement est sécurisé. Une fois la prestation réalisée, confirmez-le depuis "Mes réservations" dans votre profil — les fonds seront alors reversés au prestataire.</div>
              <button onClick={() => { setShowBookingSuccess(false); setScreen("profile"); }}
                style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Voir mes réservations
              </button>
            </div>
          </div>
        )}

        {showShopSuccess && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setShowShopSuccess(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Achat confirmé !</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
                {shopSuccessBundleLabel
                  ? `Un ${shopSuccessBundleLabel} a été ajouté à votre compte. Vous pouvez le retrouver dans 🎁 Mon inventaire, dans la Boutique.`
                  : `${shopSuccessCategory === "food" ? "Une friandise" : shopSuccessCategory === "gift" ? "Un cadeau" : shopSuccessCategory === "comfort" ? "Un accessoire" : "Votre achat"} a été ajouté${shopSuccessCategory === "food" ? "e" : ""} à votre compte. Vous pouvez le/la retrouver dans 🎁 Mon inventaire, dans la Boutique.`}
              </div>
              <button onClick={() => setShowShopSuccess(false)}
                style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Super !
              </button>
            </div>
          </div>
        )}

        {/* Avertissement si une ou plusieurs photos n'ont pas pu être envoyées à l'inscription */}
        {photoUploadWarning > 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>
                {photoUploadWarning === 1 ? "Une photo n'a pas pu être envoyée" : `${photoUploadWarning} photos n'ont pas pu être envoyées`}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5, marginBottom: 20 }}>Votre compte a bien été créé, mais un problème technique a empêché l'envoi de {photoUploadWarning === 1 ? "cette photo" : "ces photos"}. Vous pouvez la/les rajouter depuis « Modifier le profil ».</div>
              <button onClick={() => setPhotoUploadWarning(0)}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                Compris
              </button>
            </div>
          </div>
        )}

        {/* Célébration d'un Moment Magique */}
        {magicMomentReward && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(45,18,0,.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "30px 24px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✨</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 6 }}>Moment Magique !</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5, marginBottom: 18 }}>Comme ça, sans raison — juste pour vous faire sourire aujourd'hui.</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#FAF0EB", borderRadius: 16, padding: "12px 20px", marginBottom: 22 }}>
                <span style={{ fontSize: 28 }}>{magicMomentReward.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#8B3D28" }}>{magicMomentReward.label} {magicMomentReward.gender === "f" ? "offerte" : "offert"} !</span>
              </div>
              <button onClick={() => setMagicMomentReward(null)}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#B25F46,#C97A5E)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                Merci ! 🐾
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

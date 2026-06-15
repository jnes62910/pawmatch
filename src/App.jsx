import { useState, useRef } from "react";


// â”€â”€ LOGO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PawLogo({ size = 48, color = "#fff" }) {
  // white = invert filter, orange = no filter (logo is black on white)
  const isWhite = color === "#fff" || color === "white" || color.includes("255,255,255");
  const isGray = color === "#9CA3AF";
  const filter = isWhite
    ? "brightness(0) invert(1)"
    : isGray
    ? "brightness(0) invert(1) opacity(0.5)"
    : "brightness(0) saturate(100%) invert(42%) sepia(80%) saturate(800%) hue-rotate(3deg) brightness(95%)";
  return (
    <img
      src="/logo.jpg"
      alt="PawMatch"
      style={{ width: size, height: size, objectFit: "contain", filter }}
    />
  );
}

// â”€â”€ DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROFILES = [
  { id: 1, name: "Luna", species: "cat", breed: "Chartreux", age: "3 ans", gender: "F", energy: 3, temper: ["CÃ¢line", "Joueuse", "Curieuse"], distance: "1,2 km", vaccinated: true, sterilized: true, owner: "Sophie M.", bio: "Luna adore les sÃ©ances de jeu avec une canne Ã  plumes. Elle est sociable avec les autres chats aprÃ¨s une courte pÃ©riode d'adaptation.", seeking: ["Play date", "Compagnon de vie"], emoji: "ðŸ±", color: "#B8A9C9", photos: ["ðŸ±", "ðŸ˜¸", "ðŸ¾"], lat: 48.833, lng: 2.362, pedigree: false },
  { id: 2, name: "Rocky", species: "dog", breed: "Berger Australien", age: "2 ans", gender: "M", energy: 5, temper: ["Joueur", "Intelligent", "Ã‰nergique"], distance: "0,8 km", vaccinated: true, sterilized: false, owner: "Thomas D.", bio: "Rocky a besoin d'un compagnon pour ses balades quotidiennes au bois de Vincennes. Il est trÃ¨s sociable avec les autres chiens.", seeking: ["Balade", "Play date", "Reproduction"], emoji: "ðŸ•", color: "#A9C4B8", photos: ["ðŸ•", "ðŸ¦®", "ðŸ¾"], lat: 48.840, lng: 2.358, pedigree: true },
  { id: 3, name: "Mochi", species: "cat", breed: "Maine Coon", age: "5 ans", gender: "M", energy: 2, temper: ["PosÃ©", "Affectueux", "IndÃ©pendant"], distance: "2,1 km", vaccinated: true, sterilized: true, owner: "Clara B.", bio: "Mochi est un grand gaillard au caractÃ¨re doux. Il cherche un compagnon calme.", seeking: ["Compagnon de vie", "Play date"], emoji: "ðŸ±", color: "#C9B8A9", photos: ["ðŸ±", "ðŸ˜º", "ðŸ¾"], lat: 48.828, lng: 2.370, pedigree: true },
  { id: 4, name: "Bella", species: "dog", breed: "Golden Retriever", age: "4 ans", gender: "F", energy: 4, temper: ["Douce", "Joueuse", "Affectueuse"], distance: "3,4 km", vaccinated: true, sterilized: false, owner: "Marc L.", bio: "Bella est une amoureuse des cÃ¢lins et des balades en forÃªt.", seeking: ["Balade", "Reproduction", "Play date"], emoji: "ðŸ•", color: "#C9C4A9", photos: ["ðŸ•", "ðŸ¦´", "ðŸ¾"], lat: 48.845, lng: 2.375, pedigree: true },
  { id: 5, name: "Pixel", species: "cat", breed: "Siamois", age: "2 ans", gender: "F", energy: 4, temper: ["Bavarde", "Curieuse", "Vive"], distance: "0,5 km", vaccinated: true, sterilized: true, owner: "LÃ©a P.", bio: "Pixel cherche une amie avec qui partager ses aventures.", seeking: ["Play date", "Cat date"], emoji: "ðŸ±", color: "#A9B8C9", photos: ["ðŸ±", "ðŸ˜¼", "ðŸ¾"], lat: 48.836, lng: 2.355, pedigree: false },
];

const REPRO_PROFILES = [
  { id: 10, name: "Atlas", species: "dog", breed: "Berger Australien", age: "3 ans", gender: "M", emoji: "ðŸ•", owner: "Julie R.", distance: "2,3 km", vaccinated: true, pedigree: true, testedGenes: true, price: "500 â‚¬", bio: "Champion de France 2024, bilan gÃ©nÃ©tique complet. Recherche femelle saine pour reproduction sÃ©rieuse.", temper: ["Calme", "Ã‰quilibrÃ©"], color: "#A9C4B8" },
  { id: 11, name: "Isis", species: "cat", breed: "Maine Coon", age: "2 ans", gender: "F", emoji: "ðŸ±", owner: "Pierre T.", distance: "4,1 km", vaccinated: true, pedigree: true, testedGenes: false, price: "400 â‚¬", bio: "Isis est une beautÃ© au caractÃ¨re doux. Recherche mÃ¢le avec pedigree LOOF.", temper: ["Douce", "Affectueuse"], color: "#C9B8A9" },
  { id: 12, name: "Thor", species: "dog", breed: "Golden Retriever", age: "4 ans", gender: "M", emoji: "ðŸ•", owner: "Emma G.", distance: "1,8 km", vaccinated: true, pedigree: true, testedGenes: true, price: "600 â‚¬", bio: "Hips A/A, yeux clairs. Reproducteur confirmÃ©, 3 portÃ©es saines.", temper: ["Stable", "Joueur"], color: "#C9C4A9" },
];

const SPOTS = [
  { id: 1, name: "Parc Montsouris", type: "park", emoji: "ðŸŒ³", animals: 8, open: true, lat: 48.821, lng: 2.337, distance: "0,9 km", desc: "Grand parc avec zone chiens sans laisse" },
  { id: 2, name: "CafÃ© des Chats Marais", type: "catcafe", emoji: "â˜•", animals: 12, open: true, lat: 48.857, lng: 2.354, distance: "2,1 km", desc: "CafÃ©-chat avec 12 rÃ©sidents, accueil 10hâ€“20h" },
  { id: 3, name: "Dog Park Nation", type: "dogpark", emoji: "ðŸŸï¸", animals: 5, open: false, lat: 48.848, lng: 2.396, distance: "3,4 km", desc: "Espace clos 800mÂ², ouverture 8hâ€“21h" },
  { id: 4, name: "Jardins du Palais Royal", type: "park", emoji: "ðŸŒ¸", animals: 3, open: true, lat: 48.864, lng: 2.337, distance: "4,2 km", desc: "Jardin historique pet-friendly" },
  { id: 5, name: "Wouf Dog Park", type: "dogpark", emoji: "ðŸŽ¾", animals: 11, open: true, lat: 48.870, lng: 2.360, distance: "5,1 km", desc: "Dog park premium avec agility" },
];

const COMMUNITY_POSTS = [
  { id: 1, breed: "Berger Australien", emoji: "ðŸ•", author: "Thomas D.", pet: "Rocky", time: "Il y a 2h", text: "Rocky a fait son premier agility aujourd'hui ! On cherche d'autres Aussies pour s'entraÃ®ner le dimanche matin Ã  Vincennes ðŸƒ", likes: 24, comments: 8, tag: "Ã‰vÃ©nement" },
  { id: 2, breed: "Chartreux", emoji: "ðŸ±", author: "Sophie M.", pet: "Luna", time: "Il y a 5h", text: "Petite question : Luna refuse de manger depuis 2 jours. Elle a pourtant l'air en forme... Quelqu'un a eu Ã§a avec son chat ? ðŸ¤”", likes: 12, comments: 19, tag: "Conseil" },
  { id: 3, breed: "Maine Coon", emoji: "ðŸ±", author: "Clara B.", pet: "Mochi", time: "Hier", text: "Mochi vient de fÃªter ses 5 ans ! ðŸŽ‚ Le plus grand et le plus doux des chats parisiens. Il cherche toujours son Ã¢me sÅ“ur pour partager son canapÃ©.", likes: 67, comments: 14, tag: "Anniversaire" },
  { id: 4, breed: "Golden Retriever", emoji: "ðŸ•", author: "Marc L.", pet: "Bella", time: "Hier", text: "Bella disponible pour reproduction printemps 2026. Pedigree SCC, bilan hanche A/A. Cherche mÃ¢le sain et Ã©quilibrÃ© uniquement.", likes: 9, comments: 5, tag: "Reproduction" },
];

const AGENDA = [
  { id: 1, date: "Sam. 14 Juin", time: "10h00", with: "Luna", ownerEmoji: "ðŸ±", owner: "Sophie M.", place: "Parc Montsouris", type: "Play date", status: "confirmed", rating: null },
  { id: 2, date: "Dim. 15 Juin", time: "15h30", with: "Rocky", ownerEmoji: "ðŸ•", owner: "Thomas D.", place: "Bois de Vincennes", type: "Balade", status: "pending", rating: null },
  { id: 3, date: "Mar. 10 Juin", time: "11h00", with: "Pixel", ownerEmoji: "ðŸ±", owner: "LÃ©a P.", place: "CafÃ© des Chats Marais", type: "Cat date", status: "done", rating: 5 },
];

const MATCHES = [
  { id: 1, name: "Luna", emoji: "ðŸ±", owner: "Sophie M.", lastMsg: "Super ! Ã€ samedi alors ðŸ˜¸", time: "12:34", unread: 2 },
  { id: 2, name: "Rocky", emoji: "ðŸ•", owner: "Thomas D.", lastMsg: "Il adore le bois de Vincennes !", time: "Hier", unread: 0 },
  { id: 5, name: "Pixel", emoji: "ðŸ±", owner: "LÃ©a P.", lastMsg: "Nouveau match âœ¨", time: "Lun.", unread: 1 },
];

const MESSAGES = {
  1: [
    { from: "them", text: "Bonjour ! Luna serait ravie de rencontrer votre chat ðŸ˜¸", time: "12:20" },
    { from: "me", text: "Quelle bonne idÃ©e ! Ils ont l'air super compatibles ðŸ¾", time: "12:25" },
    { from: "them", text: "On pourrait se retrouver au parc Montsouris ?", time: "12:30" },
    { from: "me", text: "Parfait ! Samedi matin ?", time: "12:32" },
    { from: "them", text: "Super ! Ã€ samedi alors ðŸ˜¸", time: "12:34" },
  ],
  2: [
    { from: "them", text: "Rocky est trÃ¨s sociable, pas d'inquiÃ©tude ! ðŸ•", time: "Hier 18:10" },
    { from: "me", text: "Super nouvelle ! Il adore jouer avec d'autres chiens ?", time: "Hier 18:15" },
    { from: "them", text: "Il adore le bois de Vincennes !", time: "Hier 18:20" },
  ],
  5: [{ from: "them", text: "Nouveau match âœ¨", time: "Lun. 09:00" }],
};

// â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EnergyDots({ level }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= level ? "#F26419" : "#E5E7EB" }} />
      ))}
    </div>
  );
}

function Badge({ children, color = "#FFF4EC", text = "#B84A0F" }) {
  return (
    <span style={{ background: color, color: text, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, display: "inline-block" }}>
      {children}
    </span>
  );
}

// â”€â”€ SWIPE SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SwipeScreen({ onNav }) {
  const [idx, setIdx] = useState(0);
  const [matchedWith, setMatchedWith] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [tab, setTab] = useState("all");
  const [photo, setPhoto] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const cardRef = useRef(null);

  const filtered = PROFILES.filter(p => tab === "all" || p.species === (tab === "cats" ? "cat" : "dog"));
  const profile = filtered[idx];

  const THRESHOLD = 80;
  const dragRatio = Math.min(Math.abs(dragX) / THRESHOLD, 1);
  const isLiking = dragX > 20;
  const isNoping = dragX < -20;

  function swipe(dir) {
    const targetX = dir === "like" ? 440 : -440;
    setDragX(targetX);
    setTimeout(() => {
      setDragX(0); setDragging(false); setPhoto(0);
      if (dir === "like" && Math.random() > 0.4) setMatchedWith(profile);
      else setIdx(i => Math.min(i + 1, filtered.length - 1));
    }, 380);
  }

  function closeMatch() { setMatchedWith(null); setIdx(i => Math.min(i + 1, filtered.length - 1)); }

  function onTouchStart(e) {
    if (showDetail) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setDragging(true);
  }
  function onTouchMove(e) {
    if (!dragging || touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dragX) < 10) { setDragging(false); return; }
    e.preventDefault();
    setDragX(dx);
  }
  function onTouchEnd() {
    if (!dragging) return;
    if (dragX > THRESHOLD) swipe("like");
    else if (dragX < -THRESHOLD) swipe("nope");
    else { setDragX(0); setDragging(false); }
    touchStartX.current = null;
  }
  function onMouseDown(e) {
    if (showDetail) return;
    touchStartX.current = e.clientX;
    setDragging(true);
  }
  function onMouseMove(e) {
    if (!dragging || touchStartX.current === null) return;
    setDragX(e.clientX - touchStartX.current);
  }
  function onMouseUp() {
    if (!dragging) return;
    if (dragX > THRESHOLD) swipe("like");
    else if (dragX < -THRESHOLD) swipe("nope");
    else { setDragX(0); setDragging(false); }
    touchStartX.current = null;
  }

  if (!profile) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>ðŸ¾</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#B84A0F", marginBottom: 8 }}>Plus de profils ici !</div>
      <div style={{ textAlign: "center", fontSize: 14, color: "#9CA3AF" }}>Ã‰largis ta zone de recherche ou reviens plus tard.</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

      <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", background: "#fff", flexShrink: 0 }}>
        {[["all","Tous ðŸ¾"],["cats","Chats ðŸ±"],["dogs","Chiens ðŸ•"]].map(([v,l]) => (
          <button key={v} onClick={() => { setTab(v); setIdx(0); setPhoto(0); setDragX(0); }}
            style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === v ? "#B84A0F" : "#FFF4EC", color: tab === v ? "#fff" : "#B84A0F" }}>{l}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", userSelect: "none" }}>
        <div ref={cardRef}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{ flex: 1, borderRadius: 24, overflow: "hidden", position: "relative",
            background: `linear-gradient(160deg, ${profile.color}55 0%, #fff 100%)`,
            border: "1px solid #E5E7EB",
            cursor: dragging ? "grabbing" : "grab",
            transform: `translateX(${dragX}px) rotate(${dragX * 0.08}deg)`,
            transition: dragging ? "none" : "transform .38s cubic-bezier(.25,.46,.45,.94)",
            boxShadow: "0 8px 32px rgba(242,100,25,.10)",
            touchAction: "pan-y" }}>

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
              <span style={{ fontSize: 22, fontWeight: 900, color: "#EF4444", letterSpacing: 2 }}>NOPE âŒ</span>
            </div>
          </div>

          {/* Photo dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, position: "absolute", top: 12, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}>
            {profile.photos.map((_, i) => (
              <div key={i} style={{ width: i === photo ? 24 : 16, height: 4, borderRadius: 2, background: i === photo ? "#F26419" : "rgba(255,255,255,.6)", transition: "width .2s" }} />
            ))}
          </div>

          {/* Tap zones */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "55%", zIndex: 3 }}
            onClick={() => !dragging && setPhoto(p => Math.max(0, p - 1))} />
          <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "55%", zIndex: 3 }}
            onClick={() => { if (!dragging) { if (photo < profile.photos.length - 1) setPhoto(p => p + 1); else setShowDetail(true); }}} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, fontSize: 110, pointerEvents: "none" }}>{profile.photos[photo]}</div>
          <div style={{ padding: "12px 20px 16px", pointerEvents: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: "#2D1200" }}>{profile.name}</span><span style={{ fontSize: 15, color: "#6B7280", marginLeft: 8 }}>{profile.age} {profile.gender === "F" ? "â™€" : "â™‚"}</span></div>
              <span style={{ fontSize: 20 }}>{profile.vaccinated ? "âœ…" : "âš ï¸"}</span>
            </div>
            <div style={{ fontSize: 13, color: "#B84A0F", fontWeight: 600, marginBottom: 8 }}>{profile.breed} Â· {profile.distance}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {profile.temper.map(t => <Badge key={t}>{t}</Badge>)}
              {profile.sterilized && <Badge color="#E8F5E9" text="#2E7D32">StÃ©rilisÃ©Â·e</Badge>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Ã‰NERGIE</span>
              <EnergyDots level={profile.energy} />
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {profile.seeking.map(s => <Badge key={s} color="#FFF4EC" text="#F26419">{s}</Badge>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#F7C49A", padding: "2px 0 4px" }}>
        â† Glisse Ã  gauche pour refuser Â· Ã  droite pour liker ðŸ¾ â†’
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, padding: "8px 16px 20px" }}>
        <button onClick={() => swipe("nope")} style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #FCA5A5", background: "#FFF", fontSize: 26, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>âŒ</button>
        <button onClick={() => setShowDetail(true)} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #F7C49A", background: "#FFF4EC", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>â­</button>
        <button onClick={() => swipe("like")} style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #F26419", background: "linear-gradient(135deg,#F26419,#F7931A)", cursor: "pointer", boxShadow: "0 4px 16px rgba(242,100,25,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={28} color="#fff" /></button>
      </div>

      {showDetail && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setShowDetail(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", width: "100%", maxHeight: "80%", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 56 }}>{profile.emoji}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2D1200" }}>{profile.name} <span style={{ fontSize: 15, color: "#6B7280" }}>{profile.age}</span></div>
                <div style={{ fontSize: 13, color: "#B84A0F", fontWeight: 600 }}>{profile.breed} Â· {profile.distance}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>PropriÃ©taire : {profile.owner}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {profile.temper.map(t => <Badge key={t}>{t}</Badge>)}
              {profile.sterilized && <Badge color="#E8F5E9" text="#2E7D32">StÃ©rilisÃ©Â·e</Badge>}
              {profile.vaccinated && <Badge color="#E3F2FD" text="#1565C0">VaccinÃ©Â·e âœ“</Badge>}
            </div>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>{profile.bio}</p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 20 }}>
              {profile.seeking.map(s => <Badge key={s} color="#FFF4EC" text="#F26419">{s}</Badge>)}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setShowDetail(false); swipe("nope"); }} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #FCA5A5", background: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>âŒ Passer</button>
              <button onClick={() => { setShowDetail(false); swipe("like"); }} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 700 }}>ðŸ¾ J'adore !</button>
            </div>
          </div>
        </div>
      )}

      {matchedWith && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#B84A0F,#F26419)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>ðŸŽ‰</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4, textAlign: "center" }}>C'est un match !</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,.8)", marginBottom: 32, textAlign: "center" }}>{matchedWith.name} et votre animal s'adorent ðŸ¾</div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 32 }}><PawLogo size={80} color="#fff" /><span>{matchedWith.emoji}</span></div>
          <button onClick={() => { closeMatch(); onNav("messages"); }} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#fff", color: "#B84A0F", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>ðŸ’¬ Envoyer un message</button>
          <button onClick={closeMatch} style={{ background: "transparent", border: "2px solid rgba(255,255,255,.5)", color: "#fff", padding: "14px", borderRadius: 16, width: "100%", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Continuer Ã  swiper</button>
        </div>
      )}
    </div>
  );
}


// â”€â”€ MAP SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RURAL_ANIMALS = [
  { id: 10, name: "Filou", emoji: "ðŸ•", breed: "Border Collie", owner: "Antoine R.", distance: "3,2 km", x: 30, y: 40, live: true },
  { id: 11, name: "Caline", emoji: "ðŸ±", breed: "EuropÃ©en", owner: "Nathalie B.", distance: "5,8 km", x: 65, y: 25, live: true },
  { id: 12, name: "Rex", emoji: "ðŸ•", breed: "Berger Allemand", owner: "Pierre G.", distance: "7,1 km", x: 75, y: 62, live: false },
  { id: 13, name: "Mimi", emoji: "ðŸ±", breed: "Maine Coon", owner: "Claire M.", distance: "2,4 km", x: 20, y: 68, live: true },
  { id: 14, name: "Duke", emoji: "ðŸ•", breed: "Labrador", owner: "FranÃ§ois T.", distance: "9,3 km", x: 55, y: 75, live: false },
];

const URBAN_ANIMALS = [
  { id: 1, x: 22, y: 55, emoji: "ðŸ±", name: "Luna", breed: "Chartreux", owner: "Sophie M.", distance: "1,2 km", live: true },
  { id: 2, x: 62, y: 45, emoji: "ðŸ•", name: "Rocky", breed: "Berger Australien", owner: "Thomas D.", distance: "0,8 km", live: true },
  { id: 3, x: 38, y: 72, emoji: "ðŸ±", name: "Mochi", breed: "Maine Coon", owner: "Clara B.", distance: "2,1 km", live: false },
  { id: 4, x: 80, y: 60, emoji: "ðŸ•", name: "Bella", breed: "Golden Retriever", owner: "Marc L.", distance: "3,4 km", live: false },
];

function MapScreen({ onOpenChat = () => {}, onNav = () => {} }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState("urban"); // "urban" | "rural"
  const [sharing, setSharing] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [userPos, setUserPos] = useState(null); // { lat, lng }
  const [geoError, setGeoError] = useState(null);

  const filteredSpots = SPOTS.filter(s => filter === "all" || s.type === filter);
  const animals = mode === "rural" ? RURAL_ANIMALS : URBAN_ANIMALS;
  const liveAnimals = animals.filter(a => a.live);
  const offlineAnimals = animals.filter(a => !a.live);

  function toggleSharing() {
    if (!sharing) setShowSharePrompt(true);
    else { setSharing(false); setUserPos(null); }
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      setGeoError("La gÃ©olocalisation n'est pas supportÃ©e par votre navigateur.");
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
            setGeoError("Vous avez refusÃ© l'accÃ¨s Ã  votre position. Activez-le dans les paramÃ¨tres de votre navigateur.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Position indisponible. VÃ©rifiez votre GPS.");
            break;
          default:
            setGeoError("Impossible de rÃ©cupÃ©rer votre position.");
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Mode switcher + share toggle */}
      <div style={{ background: "#fff", padding: "10px 16px 8px", flexShrink: 0 }}>
        {/* Urban / Rural toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[["urban","ðŸ™ï¸ Urbain"],["rural","ðŸŒ¿ Rural"]].map(([v,l]) => (
            <button key={v} onClick={() => { setMode(v); setSelected(null); setFilter("all"); }}
              style={{ flex: 1, padding: "8px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: mode === v ? "#B84A0F" : "#FFF4EC", color: mode === v ? "#fff" : "#B84A0F", transition: "all .2s" }}>{l}</button>
          ))}
          <button onClick={() => setShowModeInfo(true)}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#FFF4EC", color: "#9CA3AF", fontSize: 16, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>â„¹ï¸</button>
        </div>

        {/* Share position toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 14, background: sharing ? "linear-gradient(90deg,#E8F5E9,#F1F8E9)" : "#F9FAFB", border: `1.5px solid ${sharing ? "#A5D6A7" : "#E5E7EB"}`, transition: "all .3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{sharing ? "ðŸ“" : "ðŸ“"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: sharing ? "#1B5E20" : "#2D1200" }}>
                {sharing ? "Vous Ãªtes visible sur la carte" : "Partager ma position"}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                {sharing && userPos ? `ðŸ“ ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : sharing ? "Position en cours de rÃ©cupÃ©ration..." : isRural ? "Essentiel en zone rurale pour se trouver" : "Visible dans un rayon de 5 km"}
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
            <span style={{ fontSize: 14, flexShrink: 0 }}>ðŸŒ¿</span>
            <div style={{ fontSize: 11, color: "#854D0E", lineHeight: 1.5 }}>
              En zone rurale, <strong>la gÃ©olocalisation est la seule faÃ§on de se trouver</strong>. Partagez votre position pour apparaÃ®tre sur la carte des propriÃ©taires proches.
            </div>
          </div>
        )}

        {/* Urban spot filters â€” uniquement en mode urbain */}
        {!isRural && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
            {[["all","Tout ðŸ—ºï¸"],["park","Parcs ðŸŒ³"],["catcafe","CafÃ©s chat â˜•"],["dogpark","Dog parks ðŸŸï¸"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", background: filter === v ? "#B84A0F" : "#FFF4EC", color: filter === v ? "#fff" : "#B84A0F" }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden",
        background: isRural
          ? "linear-gradient(160deg,#e8f5e9 0%,#f1f8e9 40%,#e0f2f1 70%,#f9fbe7 100%)"
          : "linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 50%,#f3e5f5 100%)" }}>

        {/* Rural texture â€” champs et routes */}
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
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 2px 10px rgba(13,157,168,.4)", border: "2.5px solid #fff" }}>{a.emoji}</div>
            <div style={{ position: "absolute", top: -4, right: -4, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />
            <div style={{ position: "absolute", top: 42, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" }}>{a.name}</div>
          </div>
        ))}

        {/* Animaux hors ligne (grisÃ©s) */}
        {offlineAnimals.map(a => (
          <div key={a.id} onClick={() => setSelected(a)}
            style={{ position: "absolute", left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 7, opacity: 0.5 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "2px solid #fff" }}>{a.emoji}</div>
          </div>
        ))}

        {/* Spots â€” uniquement en mode urbain */}
        {!isRural && [
          { id: 1, x: 28, y: 68 }, { id: 2, x: 58, y: 22 }, { id: 3, x: 78, y: 38 },
          { id: 4, x: 45, y: 15 }, { id: 5, x: 72, y: 12 },
        ].filter(sp => filteredSpots.find(s => s.id === sp.id)).map(sp => {
          const spot = SPOTS.find(s => s.id === sp.id);
          return (
            <div key={sp.id} onClick={() => setSelected(spot)}
              style={{ position: "absolute", left: `${sp.x}%`, top: `${sp.y}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 9 }}>
              <div style={{ background: spot.open ? "#fff" : "#F3F4F6", border: `2px solid ${spot.open ? "#B84A0F" : "#D1D5DB"}`, borderRadius: 12, padding: "4px 8px", fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,.15)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                {spot.emoji}
                <span style={{ fontSize: 10, fontWeight: 700, color: spot.open ? "#B84A0F" : "#9CA3AF" }}>{spot.animals}</span>
              </div>
            </div>
          );
        })}

        {/* LÃ©gende */}
        <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "8px 12px", fontSize: 10, color: "#4B5563", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563EB" }} /> Moi
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} /> En live
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#9CA3AF" }} /> Hors ligne
          </div>
          {!isRural && <div style={{ display: "flex", gap: 8 }}>ðŸŒ³ Parcs â˜• CafÃ©s ðŸŸï¸ Dog parks</div>}
        </div>

        {/* Compteur live */}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "6px 12px", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2D1200" }}>{liveAnimals.length + (sharing ? 1 : 0)} en live</span>
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{isRural ? "dans votre zone" : "Ã  proximitÃ©"}</div>
        </div>
      </div>

      {/* Liste en mode rural (pas de spots, que des animaux) */}
      {isRural && (
        <div style={{ background: "#fff", maxHeight: 200, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, display: "flex", justifyContent: "space-between" }}>
            <span>PROPRIÃ‰TAIRES PROCHES</span>
            <span style={{ color: "#22C55E" }}>{liveAnimals.length} en ligne</span>
          </div>
          {animals.map(a => (
            <div key={a.id} onClick={() => setSelected(a)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: a.live ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{a.emoji}</div>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: a.live ? "#22C55E" : "#9CA3AF", border: "2px solid #fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{a.name} <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>Â· {a.breed}</span></div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{a.owner} Â· {a.distance}</div>
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
          <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}>SPOTS PROCHES</div>
          {filteredSpots.map(spot => (
            <div key={spot.id} onClick={() => setSelected(spot)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ fontSize: 26 }}>{spot.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{spot.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{spot.distance} Â· {spot.animals} animaux maintenant</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: spot.open ? "#E8F5E9" : "#FEE2E2", color: spot.open ? "#2E7D32" : "#DC2626" }}>{spot.open ? "Ouvert" : "FermÃ©"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet dÃ©tail animal ou spot */}
      {selected && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 36px", width: "100%" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            {/* Animal */}
            {selected.name && !selected.type && (
              <>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: selected.live ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{selected.emoji}</div>
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 14, height: 14, borderRadius: "50%", background: selected.live ? "#22C55E" : "#9CA3AF", border: "2px solid #fff" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: "#B84A0F", fontWeight: 600 }}>{selected.breed} Â· {selected.distance}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{selected.owner}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selected.live ? "#2E7D32" : "#9CA3AF", marginTop: 2 }}>{selected.live ? "ðŸŸ¢ En ligne maintenant" : "âšª Hors ligne"}</div>
                  </div>
                </div>
                {!selected.live && (
                  <div style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, fontSize: 12, color: "#9CA3AF", marginBottom: 12, textAlign: "center" }}>
                    {selected.name} n'est pas en ligne. Envoyez un message pour organiser une rencontre !
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setSelected(null); onOpenChat(1); onNav("chat"); }} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "2px solid #E5E7EB", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#B84A0F" }}>ðŸ’¬ Message</button>
                  <button onClick={() => { setSelected(null); onOpenChat(1); onNav("chat"); }} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }} style2={{ display:"flex", gap:6, alignItems:"center" }}>Dire bonjour !</button>
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
                    <div style={{ fontSize: 13, color: "#B84A0F" }}>{selected.distance} Â· {selected.animals} animaux maintenant</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: selected.open ? "#E8F5E9" : "#FEE2E2", color: selected.open ? "#2E7D32" : "#DC2626" }}>{selected.open ? "Ouvert" : "FermÃ©"}</div>
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
          <span style={{ fontSize: 16, flexShrink: 0 }}>âš ï¸</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 2 }}>GÃ©olocalisation impossible</div>
            <div style={{ fontSize: 12, color: "#7F1D1D" }}>{geoError}</div>
          </div>
          <button onClick={() => setGeoError(null)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>âœ•</button>
        </div>
      )}

      {/* Prompt partage de position */}
      {showSharePrompt && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowSharePrompt(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%" }}>
            <div style={{ textAlign: "center", fontSize: 48, marginBottom: 14 }}>ðŸ“</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8, textAlign: "center" }}>Partager ma position</div>
            <div style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>
              {isRural
                ? "En zone rurale, partager votre position est essentiel pour que les autres propriÃ©taires proches puissent vous trouver. Vous restez visible uniquement quand l'app est ouverte."
                : "Votre position sera visible par les propriÃ©taires dans un rayon de 5 km. Vous restez visible uniquement quand l'app est ouverte."}
            </div>
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              {["Visible uniquement pendant l'utilisation de l'app","DÃ©sactivable Ã  tout moment","Votre adresse exacte n'est jamais partagÃ©e","Rayon minimum : 500m pour protÃ©ger votre vie privÃ©e"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12, color: "#4B5563" }}>
                  <span style={{ color: "#2E7D32", fontWeight: 700 }}>âœ“</span> {item}
                </div>
              ))}
            </div>
            <button onClick={confirmSharing} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              ðŸ“ Activer la gÃ©olocalisation
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
              ["ðŸ™ï¸", "Mode Urbain", "Affiche les spots (parcs, cafÃ©s chats, dog parks) et les animaux Ã  proximitÃ©. IdÃ©al pour les grandes villes oÃ¹ les lieux de rencontre sont nombreux."],
              ["ðŸŒ¿", "Mode Rural", "Pas de spots dans votre zone ? Pas de problÃ¨me. La carte affiche directement les propriÃ©taires et animaux proches qui ont partagÃ© leur position. La gÃ©olocalisation devient votre seul point de repÃ¨re."],
            ].map(([e,t,d]) => (
              <div key={t} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{e}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200", marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowModeInfo(false)} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Compris !</button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ REPRO SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReproScreen() {
  const [selected, setSelected] = useState(null);
  const [requested, setRequested] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = REPRO_PROFILES.filter(p => filter === "all" || p.species === (filter === "cats" ? "cat" : "dog"));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px 8px", background: "#fff" }}>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 10 }}>Reproduction vÃ©rifiÃ©e et sÃ©curisÃ©e ðŸŒ±</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["all","Tous"],["cats","Chats ðŸ±"],["dogs","Chiens ðŸ•"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: filter === v ? "#B84A0F" : "#FFF4EC", color: filter === v ? "#fff" : "#B84A0F" }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Info banner */}
        <div style={{ margin: "12px 16px", padding: "12px 14px", background: "#FFF4EC", borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>ðŸ”’</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#F26419" }}>REPRODUCTION SÃ‰CURISÃ‰E</div>
            <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.5 }}>Tous les profils sont vÃ©rifiÃ©s. Documents sanitaires validÃ©s. Paiement sÃ©curisÃ© via escrow.</div>
          </div>
        </div>

        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelected(p)} style={{ margin: "0 16px 12px", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ background: `linear-gradient(90deg, ${p.color}44, #fff)`, padding: "16px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ fontSize: 52 }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#2D1200" }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{p.age} {p.gender === "F" ? "â™€" : "â™‚"}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#B84A0F", fontWeight: 600, marginBottom: 6 }}>{p.breed} Â· {p.distance}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {p.vaccinated && <Badge color="#E3F2FD" text="#1565C0">VaccinÃ© âœ“</Badge>}
                    {p.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">Pedigree âœ“</Badge>}
                    {p.testedGenes && <Badge color="#E8F5E9" text="#2E7D32">GÃ¨nes testÃ©s âœ“</Badge>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F26419" }}>{p.price}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>saillie</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#4B5563", marginTop: 10, lineHeight: 1.5 }}>{p.bio}</p>
            </div>
          </div>
        ))}
      </div>

      {selected && !requested && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", width: "100%", maxHeight: "85%", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 52 }}>{selected.emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200" }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: "#B84A0F", fontWeight: 600 }}>{selected.breed} Â· {selected.age}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>PropriÃ©taire : {selected.owner}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {selected.vaccinated && <Badge color="#E3F2FD" text="#1565C0">VaccinÃ© âœ“</Badge>}
              {selected.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">Pedigree officiel âœ“</Badge>}
              {selected.testedGenes && <Badge color="#E8F5E9" text="#2E7D32">Bilan gÃ©nÃ©tique complet âœ“</Badge>}
            </div>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>{selected.bio}</p>
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, letterSpacing: 1 }}>DÃ‰TAILS FINANCIERS</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "#4B5563" }}>Saillie</span><span style={{ fontWeight: 700, color: "#2D1200" }}>{selected.price}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "#4B5563" }}>Commission PawMatch</span><span style={{ fontWeight: 700, color: "#9CA3AF" }}>5%</span>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>ðŸ’³ Paiement sÃ©curisÃ©. LibÃ©rÃ© aprÃ¨s confirmation de la rencontre.</div>
            </div>
            <button onClick={() => setRequested(selected)} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>ðŸŒ± Envoyer une demande</button>
          </div>
        </div>
      )}

      {requested && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#B84A0F,#1B5E3B)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>ðŸŒ±</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8, textAlign: "center" }}>Demande envoyÃ©e !</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,.8)", textAlign: "center", marginBottom: 32, lineHeight: 1.6 }}>{selected.owner} recevra votre demande et pourra l'accepter. Vous serez notifiÃ© dÃ¨s qu'une rÃ©ponse sera disponible.</div>
          <button onClick={() => { setRequested(null); setSelected(null); }} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#fff", color: "#B84A0F", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Retour Ã  la liste</button>
        </div>
      )}
    </div>
  );
}

// â”€â”€ AGENDA SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, letterSpacing: 1 }}>Ã€ VENIR</div>
        {upcoming.map(ev => (
          <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            <div style={{ background: ev.status === "confirmed" ? "linear-gradient(90deg,#FFF4EC,#fff)" : "linear-gradient(90deg,#FFF9E6,#fff)", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200" }}>{ev.type} avec {ev.with}</div>
                  <div style={{ fontSize: 12, color: "#B84A0F" }}>{ev.owner}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>ðŸ“… {ev.date} Ã  {ev.time} Â· ðŸ“ {ev.place}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: ev.status === "confirmed" ? "#E8F5E9" : "#FEF9C3", color: ev.status === "confirmed" ? "#2E7D32" : "#854D0E" }}>{ev.status === "confirmed" ? "ConfirmÃ© âœ“" : "En attente"}</div>
              </div>
            </div>
            {ev.status === "confirmed" && (
              <div style={{ display: "flex", borderTop: "1px solid #F3F4F6" }}>
                <button onClick={() => setAgendaData(a => a.map(e => e.id === ev.id ? { ...e, status: "cancelled" } : e))} style={{ width: "100%", padding: "10px", background: "#fff", border: "none", fontSize: 13, color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>Annuler la rencontre</button>
              </div>
            )}
          </div>
        ))}

        <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", margin: "16px 0 10px", letterSpacing: 1 }}>PASSÃ‰ES</div>
        {past.map(ev => (
          <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", opacity: 0.85 }}>
            <div style={{ padding: "14px 16px", background: "#F9FAFB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#6B7280" }}>{ev.type} avec {ev.with}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{ev.date} Â· {ev.place}</div>
                  {ev.rating ? (
                    <div style={{ fontSize: 14, marginTop: 4 }}>{"â­".repeat(ev.rating)}</div>
                  ) : (
                    <button onClick={() => setRatingFor(ev.id)} style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#F26419", background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Laisser un avis</button>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8, textAlign: "center" }}>Comment s'est passÃ©e la rencontre ?</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", marginBottom: 20 }}>Votre avis aide les autres propriÃ©taires</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 36, background: "none", border: "none", cursor: "pointer", opacity: rating && s > rating ? 0.3 : 1, transition: "opacity .15s" }}>â­</button>
              ))}
            </div>
            <button onClick={() => rating && submitRating(ratingFor, rating)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: rating ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB", color: rating ? "#fff" : "#9CA3AF", fontWeight: 800, fontSize: 15, cursor: rating ? "pointer" : "default" }}>Envoyer mon avis</button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ COMMUNITY SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INIT_COMMENTS = {
  1: [
    { id: 1, author: "Marie L.", pet: "Caramel", emoji: "ðŸ±", text: "Super ! Rocky est trop mignon, Ã§a ferait une belle Ã©quipe ðŸ¾", time: "Il y a 1h", likes: 5 },
    { id: 2, author: "Jean P.", pet: "Max", emoji: "ðŸ•", text: "Vous trouvez des dog parks accessibles dans votre coin ?", time: "Il y a 45 min", likes: 2 },
  ],
  2: [
    { id: 1, author: "Sophie M.", pet: "Luna", emoji: "ðŸ±", text: "Ã‡a peut Ãªtre un signe de stress ou juste un caprice ! Essayez de changer de gamelle ðŸ˜Š", time: "Il y a 3h", likes: 8 },
    { id: 2, author: "Paul D.", pet: "Tiger", emoji: "ðŸ±", text: "MÃªme chose chez nous, c'est passÃ© au bout de 3 jours.", time: "Il y a 2h", likes: 3 },
    { id: 3, author: "VÃ©to Conseil", pet: "ðŸ©º", emoji: "ðŸ©º", text: "Si Ã§a dure plus de 48h, consultez un vÃ©tÃ©rinaire. Pensez Ã  vÃ©rifier que l'eau est fraÃ®che.", time: "Il y a 1h", likes: 12 },
  ],
  3: [
    { id: 1, author: "Thomas D.", pet: "Rocky", emoji: "ðŸ•", text: "Joyeux anniversaire Mochi ! ðŸŽ‚ðŸ±", time: "Hier", likes: 15 },
    { id: 2, author: "LÃ©a P.", pet: "Pixel", emoji: "ðŸ±", text: "5 ans dÃ©jÃ  ! Il est magnifique ðŸ˜", time: "Hier", likes: 9 },
  ],
  4: [
    { id: 1, author: "Clara B.", pet: "Mochi", emoji: "ðŸ±", text: "Bella a l'air adorable ! Vous Ãªtes en quelle rÃ©gion ?", time: "Hier", likes: 3 },
  ],
};

function CommunityScreen({ onPremium, isPremium }) {
  const [liked, setLiked] = useState({});
  const [breedFilter, setBreedFilter] = useState("all");
  const [showPremium, setShowPremium] = useState(false);
  const [openComments, setOpenComments] = useState(null); // post id
  const [comments, setComments] = useState(INIT_COMMENTS);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const commentsEndRef = useRef(null);

  const breeds = ["all", "Berger Australien", "Chartreux", "Maine Coon", "Golden Retriever"];
  const filtered = COMMUNITY_POSTS.filter(p => breedFilter === "all" || p.breed === breedFilter);

  const TAG_COLORS = {
    "Ã‰vÃ©nement": ["#E3F2FD","#1565C0"],
    "Conseil": ["#FFF9E6","#854D0E"],
    "Anniversaire": ["#FFF4EC","#B84A0F"],
    "Reproduction": ["#E8F5E9","#2E7D32"]
  };

  function submitComment(postId) {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    const newComment = {
      id: Date.now(),
      author: "Vous",
      pet: "Caramel",
      emoji: "ðŸ±",
      text,
      time: "Ã€ l'instant",
      likes: 0,
    };
    setComments(c => ({ ...c, [postId]: [...(c[postId] || []), newComment] }));
    setCommentInputs(i => ({ ...i, [postId]: "" }));
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function toggleCommentLike(postId, commentId) {
    const key = `${postId}-${commentId}`;
    setCommentLikes(l => ({ ...l, [key]: !l[key] }));
  }

  const activePost = COMMUNITY_POSTS.find(p => p.id === openComments);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Breed filter */}
      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "10px 16px", background: "#fff", flexShrink: 0 }}>
        {breeds.map(b => (
          <button key={b} onClick={() => setBreedFilter(b)}
            style={{ padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", background: breedFilter === b ? "#B84A0F" : "#FFF4EC", color: breedFilter === b ? "#fff" : "#B84A0F" }}>
            {b === "all" ? "Toutes les races" : b}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* New post */}
        <div style={{ margin: "12px 16px", padding: "12px 14px", background: "#F9FAFB", borderRadius: 14, display: "flex", gap: 10, alignItems: "center", border: "1px solid #E5E7EB" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>ðŸ±</div>
          <div onClick={() => isPremium ? null : setShowPremium(true)} style={{ flex: 1, fontSize: 14, color: "#9CA3AF", cursor: "pointer" }}>Partager un moment avec Caramel...</div>
          <button onClick={() => isPremium ? null : setShowPremium(true)} style={{ background: "linear-gradient(135deg,#F26419,#F7931A)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 12px", cursor: "pointer" }}>ðŸ“¸</button>
        </div>

        {/* Posts */}
        {filtered.map(post => {
          const [bgTag, textTag] = TAG_COLORS[post.tag] || ["#FFF4EC","#B84A0F"];
          const postComments = comments[post.id] || [];
          const isLiked = liked[post.id];

          return (
            <div key={post.id} style={{ margin: "0 16px 12px", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", background: "#fff" }}>
              <div style={{ padding: "14px 14px 10px" }}>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${post.emoji === "ðŸ±" ? "#F26419,#F7931A" : "#B84A0F,#8B3510"})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{post.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2D1200" }}>{post.pet} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>Â· {post.author}</span></div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{post.breed} Â· {post.time}</div>
                  </div>
                  <span style={{ background: bgTag, color: textTag, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>{post.tag}</span>
                </div>

                {/* Content */}
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: "0 0 12px" }}>{post.text}</p>

                {/* Actions â€” sans bouton Partager */}
                <div style={{ display: "flex", gap: 16, borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                  <button onClick={() => setLiked(l => ({ ...l, [post.id]: !l[post.id] }))}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: isLiked ? "#F26419" : "#9CA3AF" }}>
                    {isLiked ? "ðŸ§¡" : "ðŸ¤"} {post.likes + (isLiked ? 1 : 0)}
                  </button>
                  <button onClick={() => setOpenComments(post.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: openComments === post.id ? "#F26419" : "#9CA3AF" }}>
                    ðŸ’¬ {postComments.length}
                  </button>
                </div>

                {/* AperÃ§u du dernier commentaire */}
                {postComments.length > 0 && openComments !== post.id && (
                  <button onClick={() => setOpenComments(post.id)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, background: "#F9FAFB", borderRadius: 10, padding: "8px 10px", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{postComments[postComments.length - 1].emoji}</span>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#B84A0F" }}>{postComments[postComments.length - 1].author} </span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{postComments[postComments.length - 1].text}</span>
                    </div>
                  </button>
                )}
                {postComments.length > 1 && openComments !== post.id && (
                  <button onClick={() => setOpenComments(post.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: "4px 0 0", display: "block" }}>
                    Voir les {postComments.length} commentaires â†’
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium popup */}
      {showPremium && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={() => setShowPremium(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 20px 40px", width: "100%" }}>
            <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ textAlign: "center", fontSize: 44, marginBottom: 12 }}>ðŸ‘‘</div>
            <div style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8 }}>Fonction Premium</div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>Publiez dans la communautÃ©, accÃ©dez Ã  toutes les races et bien plus encore.</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", textAlign: "center" }}>
                <div style={{ fontWeight: 800, color: "#2D1200", fontSize: 16 }}>4,99 â‚¬</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>par mois</div>
              </div>
              <div style={{ flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #F26419", textAlign: "center", background: "#FFF4EC" }}>
                <div style={{ fontWeight: 800, color: "#F26419", fontSize: 16 }}>39,99 â‚¬</div>
                <div style={{ fontSize: 12, color: "#F26419" }}>par an Â· -33%</div>
              </div>
            </div>
            <button onClick={() => { setShowPremium(false); onPremium(); }}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              ðŸ‘‘ Passer Premium
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
                <button onClick={() => setOpenComments(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer" }}>âœ•</button>
              </div>
              {/* Post rÃ©sumÃ© */}
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#B84A0F" }}>{activePost.pet} Â· {activePost.author}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>{activePost.text}</div>
              </div>
            </div>

            {/* Comments list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {(comments[openComments] || []).length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>ðŸ’¬</div>
                  <div style={{ fontSize: 14 }}>Soyez le premier Ã  commenter !</div>
                </div>
              )}
              {(comments[openComments] || []).map(c => {
                const likeKey = `${openComments}-${c.id}`;
                const isCommentLiked = commentLikes[likeKey];
                return (
                  <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.emoji === "ðŸ©º" ? "#E3F2FD" : "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: "#F9FAFB", borderRadius: "4px 14px 14px 14px", padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#B84A0F", marginBottom: 3 }}>{c.author} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>Â· {c.pet}</span></div>
                        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, paddingLeft: 4 }}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{c.time}</span>
                        <button onClick={() => toggleCommentLike(openComments, c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: isCommentLiked ? "#F26419" : "#9CA3AF", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                          {isCommentLiked ? "ðŸ§¡" : "ðŸ¤"} {c.likes + (isCommentLiked ? 1 : 0)}
                        </button>
                        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0, fontWeight: 600 }}>RÃ©pondre</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "10px 16px 28px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>ðŸ±</div>
              <input
                value={commentInputs[openComments] || ""}
                onChange={e => setCommentInputs(i => ({ ...i, [openComments]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitComment(openComments)}
                placeholder="Ajouter un commentaire..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", fontFamily: "inherit" }}
              />
              <button onClick={() => submitComment(openComments)}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: (commentInputs[openComments] || "").trim() ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB", cursor: (commentInputs[openComments] || "").trim() ? "pointer" : "default", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s", display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={18} color={(commentInputs[openComments] || "").trim() ? "#fff" : "#9CA3AF"} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ MATCHES / CHAT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MatchesScreen({ onOpenChat }) {
  const [tab, setTab] = useState("messages");
  const [agendaData, setAgendaData] = useState(AGENDA);
  const [rating, setRating] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);

  function submitRating(id, stars) {
    setAgendaData(a => a.map(ev => ev.id === id ? { ...ev, rating: stars } : ev));
    setRatingFor(null); setRating(null);
  }

  const upcoming = agendaData.filter(e => e.status !== "done" && e.status !== "cancelled");
  const past = agendaData.filter(e => e.status === "done");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#fff", flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        {[["messages","ðŸ’¬ Messages"],["agenda","ðŸ“… Agenda"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: tab === v ? "#F26419" : "#9CA3AF", borderBottom: `3px solid ${tab === v ? "#F26419" : "transparent"}`, transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      {/* â”€â”€ MESSAGES â”€â”€ */}
      {tab === "messages" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "14px 16px 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>Vos matchs</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>3 connexions en attente</div>
          </div>
          <div style={{ overflowX: "auto", display: "flex", gap: 12, padding: "8px 16px 16px" }}>
            {MATCHES.map(m => (
              <div key={m.id} onClick={() => onOpenChat(m.id)} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, position: "relative", boxShadow: "0 4px 12px rgba(242,100,25,.25)" }}>
                  {m.emoji}
                  {m.unread > 0 && <div style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: "#F26419", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{m.unread}</div>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2D1200", marginTop: 6 }}>{m.name}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{ height: 1, background: "#F3F4F6" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginTop: 12, marginBottom: 8, letterSpacing: 1 }}>MESSAGES</div>
          </div>
          {MATCHES.map(m => (
            <div key={m.id} onClick={() => onOpenChat(m.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer", background: m.unread ? "#FFF4EC" : "#fff", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{m.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: "#2D1200", fontSize: 15 }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13, color: m.unread ? "#B84A0F" : "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: m.unread ? 600 : 400 }}>{m.lastMsg}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{m.owner}</div>
              </div>
              {m.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#F26419", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.unread}</div>}
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ AGENDA â”€â”€ */}
      {tab === "agenda" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, letterSpacing: 1 }}>Ã€ VENIR</div>
          {upcoming.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0 16px", color: "#9CA3AF" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>ðŸ“…</div>
              <div style={{ fontSize: 14 }}>Aucune rencontre planifiÃ©e</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Organisez-en une depuis vos Messages !</div>
            </div>
          )}
          {upcoming.map(ev => (
            <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ background: ev.status === "confirmed" ? "linear-gradient(90deg,#FFF4EC,#fff)" : "linear-gradient(90deg,#FFF9E6,#fff)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200" }}>{ev.type} avec {ev.with}</div>
                    <div style={{ fontSize: 12, color: "#B84A0F" }}>{ev.owner}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>ðŸ“… {ev.date} Ã  {ev.time} Â· ðŸ“ {ev.place}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, background: ev.status === "confirmed" ? "#E8F5E9" : "#FEF9C3", color: ev.status === "confirmed" ? "#2E7D32" : "#854D0E" }}>
                    {ev.status === "confirmed" ? "ConfirmÃ© âœ“" : "En attente"}
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

          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", margin: "16px 0 10px", letterSpacing: 1 }}>PASSÃ‰ES</div>
          {past.map(ev => (
            <div key={ev.id} style={{ marginBottom: 12, borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", opacity: 0.85 }}>
              <div style={{ padding: "14px 16px", background: "#F9FAFB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ev.ownerEmoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#6B7280" }}>{ev.type} avec {ev.with}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{ev.date} Â· {ev.place}</div>
                    {ev.rating
                      ? <div style={{ fontSize: 14, marginTop: 4 }}>{"â­".repeat(ev.rating)}</div>
                      : <button onClick={() => setRatingFor(ev.id)} style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#F26419", background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Laisser un avis</button>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2D1200", marginBottom: 8, textAlign: "center" }}>Comment s'est passÃ©e la rencontre ?</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", marginBottom: 20 }}>Votre avis aide les autres propriÃ©taires</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 36, background: "none", border: "none", cursor: "pointer", opacity: rating && s > rating ? 0.3 : 1, transition: "opacity .15s" }}>â­</button>
              ))}
            </div>
            <button onClick={() => rating && submitRating(ratingFor, rating)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: rating ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB", color: rating ? "#fff" : "#9CA3AF", fontWeight: 800, fontSize: 15, cursor: rating ? "pointer" : "default" }}>
              Envoyer mon avis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatScreen({ matchId, onBack }) {
  const match = MATCHES.find(m => m.id === matchId);
  const [msgs, setMsgs] = useState(MESSAGES[matchId] || []);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  function send() {
    if (!input.trim()) return;
    setMsgs(m => [...m, { from: "me", text: input.trim(), time: "Ã€ l'instant" }]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    setTimeout(() => {
      setMsgs(m => [...m, { from: "them", text: "Super idÃ©e ! ðŸ¾ On se retrouve quand ?", time: "Ã€ l'instant" }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 1200);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #F3F4F6", background: "#fff" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>â†</button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{match?.emoji}</div>
        <div><div style={{ fontWeight: 700, fontSize: 15, color: "#2D1200" }}>{match?.name}</div><div style={{ fontSize: 12, color: "#9CA3AF" }}>{match?.owner}</div></div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ background: "#FFF4EC", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>ðŸ“</button>
          <button style={{ background: "#FFF4EC", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>ðŸ—“ï¸</button>
        </div>
      </div>
      <div style={{ margin: "10px 14px 0", padding: "10px 14px", background: "#FFF4EC", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span>ðŸ“</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F26419" }}>LIEU SUGGÃ‰RÃ‰</div>
          <div style={{ fontSize: 13, color: "#4B5563" }}>Parc Montsouris Â· 0,8 km Â· Ouvert</div>
        </div>
        <button style={{ background: "#F26419", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 9px", cursor: "pointer" }}>Proposer</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: msg.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.from === "me" ? "linear-gradient(135deg,#F26419,#F7931A)" : "#F3F4F6", color: msg.from === "me" ? "#fff" : "#2D1200", fontSize: 14, lineHeight: 1.5 }}>
              {msg.text}
              <div style={{ fontSize: 10, opacity: .6, marginTop: 4, textAlign: msg.from === "me" ? "right" : "left" }}>{msg.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "#fff" }}>
        <button style={{ background: "#FFF4EC", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>ðŸ“·</button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ã‰crire un message..." style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB" }} />
        <button onClick={send} style={{ background: input.trim() ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 18, cursor: input.trim() ? "pointer" : "default", flexShrink: 0, transition: "background .2s", display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={20} color={input.trim() ? "#fff" : "#9CA3AF"} /></button>
      </div>
    </div>
  );
}

// â”€â”€ PROFILE SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_TEMPER = ["Joueur", "Affectueux", "Curieux", "CÃ¢lin", "Calme", "Ã‰nergique", "IndÃ©pendant", "Sociable", "Timide", "Gourmand"];
const ALL_SEEKING = [
  { id: "Play date",        icon: "ðŸŽ¾", label: "Play date",          desc: "Rencontre ponctuelle de jeu" },
  { id: "Compagnon de vie", icon: "ðŸ ", label: "Compagnon de vie",   desc: "Un ami pour la maison, au quotidien" },
  { id: "Balade",           icon: "ðŸ¦®", label: "Balade",             desc: "Partenaire de sortie rÃ©gulier" },
  { id: "Dog date",         icon: "ðŸ•", label: "Dog date",           desc: "Sortie sociale dÃ©tendue entre chiens" },
  { id: "Cat date",         icon: "ðŸ±", label: "Cat date",           desc: "Rencontre tranquille entre chats" },
  { id: "Reproduction",     icon: "ðŸŒ±", label: "Reproduction",       desc: "Saillie sÃ©rieuse et vÃ©rifiÃ©e" },
];

const INIT_PET = {
  name: "Caramel", breed: "EuropÃ©en", age: "4 ans", gender: "M", energy: 3,
  vaccinated: true, sterilized: false,
  temper: ["Joueur", "Affectueux", "Curieux"],
  seeking: ["Play date", "Compagnon de vie"],
  bio: "Caramel est un chat doux et curieux qui adore explorer et se faire cÃ¢liner aprÃ¨s ses aventures.",
  photos: [], video: null,
  repro: {
    active: false, price: "", priceNegotiable: false,
    availableFrom: "", availableTo: "",
    pedigree: false, geneticTest: false,
    reproDesc: "", docs: []
  }
};

function ProfileScreen({ onPremium = () => {}, isPremium = false }) {
  const [pet, setPet] = useState(INIT_PET);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet);
  const [saved, setSaved] = useState(false);
  const [editTab, setEditTab] = useState("profil"); // "profil" | "repro"
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const docRef = useRef(null);

  function openEdit() { setDraft({ ...pet, repro: { ...pet.repro } }); setEditing(true); setEditTab("profil"); }
  function save() { setPet({ ...draft }); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  function toggleTemper(t) { setDraft(d => ({ ...d, temper: d.temper.includes(t) ? d.temper.filter(x => x !== t) : d.temper.length < 4 ? [...d.temper, t] : d.temper })); }
  function toggleSeeking(s) { setDraft(d => ({ ...d, seeking: d.seeking.includes(s) ? d.seeking.filter(x => x !== s) : [...d.seeking, s] })); }
  function setRepro(k, v) { setDraft(d => ({ ...d, repro: { ...d.repro, [k]: v } })); }

  function handlePhotoAdd(e) {
    const files = Array.from(e.target.files);
    const toAdd = files.slice(0, 6 - draft.photos.length).map(f => ({ url: URL.createObjectURL(f), name: f.name }));
    setDraft(d => ({ ...d, photos: [...d.photos, ...toAdd] }));
    e.target.value = "";
  }
  function handleVideoAdd(e) {
    const f = e.target.files[0];
    if (f) setDraft(d => ({ ...d, video: { url: URL.createObjectURL(f), name: f.name } }));
    e.target.value = "";
  }
  function handleDocAdd(e) {
    const files = Array.from(e.target.files);
    const toAdd = files.map(f => ({ name: f.name, type: f.type }));
    setRepro("docs", [...draft.repro.docs, ...toAdd]);
    e.target.value = "";
  }
  function removePhoto(i) { setDraft(d => ({ ...d, photos: d.photos.filter((_, j) => j !== i) })); }
  function removeDoc(i) { setRepro("docs", draft.repro.docs.filter((_, j) => j !== i)); }

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#F9FAFB", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8, display: "block", marginTop: 4 };
  const photoSlots = [...draft.photos, ...Array(Math.max(0, 6 - draft.photos.length)).fill(null)];

  // â”€â”€ EDIT MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (editing) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F3F4F6", background: "#fff", flexShrink: 0 }}>
        <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", fontSize: 14, color: "#9CA3AF", cursor: "pointer", fontWeight: 600 }}>Annuler</button>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#2D1200" }}>Modifier le profil</span>
        <button onClick={save} style={{ background: "linear-gradient(135deg,#F26419,#F7931A)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, padding: "6px 14px", cursor: "pointer" }}>Sauver</button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#F9FAFB", padding: "8px 16px", gap: 8, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        {[["profil","ðŸ¾ Profil"],["repro","ðŸŒ± Reproduction"]].map(([v,l]) => (
          <button key={v} onClick={() => setEditTab(v)} style={{ flex: 1, padding: "9px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: editTab === v ? "#fff" : "transparent", color: editTab === v ? "#B84A0F" : "#9CA3AF", boxShadow: editTab === v ? "0 1px 6px rgba(0,0,0,.08)" : "none", transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>

        {/* â•â• TAB PROFIL â•â• */}
        {editTab === "profil" && <>
          {/* Photos */}
          <label style={labelStyle}>PHOTOS ({draft.photos.length}/6)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {photoSlots.map((p, i) => (
              <div key={i} onClick={() => !p && photoRef.current?.click()}
                style={{ aspectRatio: "1", borderRadius: 14, overflow: "hidden", position: "relative", background: p ? "#000" : "#F3F4F6", border: p ? "none" : "2px dashed #D1D5DB", cursor: p ? "default" : "pointer" }}>
                {p ? (
                  <>
                    <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {i === 0 && <div style={{ position: "absolute", bottom: 5, left: 5, background: "#F26419", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6 }}>PRINCIPALE</div>}
                    <button onClick={e => { e.stopPropagation(); removePhoto(i); }} style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>âœ•</button>
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                    <span style={{ fontSize: 24, color: "#F7C49A" }}>+</span>
                    {i === 0 && <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, textAlign: "center" }}>Photo principale</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoAdd} />
          {draft.photos.length < 6 && (
            <button onClick={() => photoRef.current?.click()} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "2px dashed #F7C49A", background: "#FFF4EC", color: "#B84A0F", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 18 }}>ðŸ“· Ajouter des photos</button>
          )}

          {/* VidÃ©o */}
          <label style={labelStyle}>VIDÃ‰O DE PRÃ‰SENTATION (optionnelle)</label>
          {draft.video ? (
            <div style={{ borderRadius: 14, overflow: "hidden", position: "relative", background: "#000", marginBottom: 8 }}>
              <video src={draft.video.url} controls style={{ width: "100%", maxHeight: 160, display: "block", objectFit: "cover" }} />
              <button onClick={() => setDraft(d => ({ ...d, video: null }))} style={{ position: "absolute", top: 7, right: 7, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.65)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>âœ•</button>
            </div>
          ) : (
            <button onClick={() => videoRef.current?.click()} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px dashed #F7C49A", background: "#FFF4EC", color: "#B84A0F", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>ðŸŽ¬</span>
              <div style={{ textAlign: "left" }}><div>Ajouter une vidÃ©o</div><div style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>30 sec max Â· augmente les matchs de 3Ã—</div></div>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoAdd} />

          <div style={{ height: 1, background: "#F3F4F6", margin: "18px 0" }} />

          {/* Infos */}
          <label style={labelStyle}>NOM</label>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={{ ...inputStyle, marginBottom: 14 }} placeholder="PrÃ©nom de votre animal" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>RACE</label><input value={draft.breed} onChange={e => setDraft(d => ({ ...d, breed: e.target.value }))} style={inputStyle} placeholder="Ex: Siamois" /></div>
            <div><label style={labelStyle}>Ã‚GE</label><input value={draft.age} onChange={e => setDraft(d => ({ ...d, age: e.target.value }))} style={inputStyle} placeholder="Ex: 3 ans" /></div>
          </div>

          <label style={labelStyle}>SEXE</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[["M","â™‚ MÃ¢le"],["F","â™€ Femelle"]].map(([v,l]) => (
              <button key={v} onClick={() => setDraft(d => ({ ...d, gender: v }))} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `2px solid ${draft.gender === v ? "#F26419" : "#E5E7EB"}`, background: draft.gender === v ? "#FFF4EC" : "#F9FAFB", color: draft.gender === v ? "#F26419" : "#6B7280", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          <label style={labelStyle}>NIVEAU D'Ã‰NERGIE</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setDraft(d => ({ ...d, energy: i }))} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `2px solid ${draft.energy >= i ? "#F26419" : "#E5E7EB"}`, background: draft.energy >= i ? "#FFF4EC" : "#F9FAFB", fontSize: 14, cursor: "pointer", color: draft.energy >= i ? "#F26419" : "#9CA3AF", fontWeight: 700 }}>{i}</button>
            ))}
          </div>

          <label style={labelStyle}>SANTÃ‰</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[["vaccinated","VaccinÃ©Â·e âœ“"],["sterilized","StÃ©rilisÃ©Â·e"]].map(([k,l]) => (
              <button key={k} onClick={() => setDraft(d => ({ ...d, [k]: !d[k] }))} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `2px solid ${draft[k] ? "#2E7D32" : "#E5E7EB"}`, background: draft[k] ? "#E8F5E9" : "#F9FAFB", color: draft[k] ? "#2E7D32" : "#9CA3AF", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          <label style={labelStyle}>CARACTÃˆRE (max 4)</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {ALL_TEMPER.map(t => (
              <button key={t} onClick={() => toggleTemper(t)} style={{ padding: "5px 12px", borderRadius: 20, border: `2px solid ${draft.temper.includes(t) ? "#B84A0F" : "#E5E7EB"}`, background: draft.temper.includes(t) ? "#FFF4EC" : "#F9FAFB", color: draft.temper.includes(t) ? "#B84A0F" : "#9CA3AF", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t}</button>
            ))}
          </div>

          <label style={labelStyle}>CHERCHE</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {ALL_SEEKING.filter(s => draft.species !== "cat" || !["Balade","Dog date"].includes(s.id))
              .filter(s => draft.species !== "dog" || !["Cat date"].includes(s.id))
              .map(s => (
              <button key={s.id} onClick={() => toggleSeeking(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `2px solid ${draft.seeking.includes(s.id) ? "#F26419" : "#E5E7EB"}`, background: draft.seeking.includes(s.id) ? "#FFF4EC" : "#F9FAFB", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${draft.seeking.includes(s.id) ? "#F26419" : "#D1D5DB"}`, background: draft.seeking.includes(s.id) ? "#F26419" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {draft.seeking.includes(s.id) && <span style={{ color: "#fff", fontSize: 12 }}>âœ“</span>}
                </div>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: draft.seeking.includes(s.id) ? "#F26419" : "#2D1200" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <label style={labelStyle}>BIO</label>
          <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} style={{ ...inputStyle, minHeight: 90, resize: "none" }} placeholder="DÃ©crivez votre animal..." />
        </>}

        {/* â•â• TAB REPRODUCTION â•â• */}
        {editTab === "repro" && <>
          {draft.sterilized ? (
            <div style={{ margin: "20px 0", padding: "20px", background: "#F9FAFB", borderRadius: 16, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>âœ‚ï¸</div>
              <div style={{ fontWeight: 700, color: "#6B7280", fontSize: 15, marginBottom: 6 }}>Animal stÃ©rilisÃ©</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>La section reproduction n'est disponible que pour les animaux non stÃ©rilisÃ©s. Modifiez le statut dans l'onglet Profil.</div>
            </div>
          ) : <>
            {/* Activer la reproduction */}
            <div style={{ background: draft.repro.active ? "linear-gradient(135deg,#E8F5E9,#F1F8E9)" : "#F9FAFB", borderRadius: 16, padding: "16px", marginBottom: 16, border: `2px solid ${draft.repro.active ? "#2E7D32" : "#E5E7EB"}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: draft.repro.active ? "#1B5E20" : "#2D1200" }}>ðŸŒ± Disponible pour reproduction</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>Votre animal apparaÃ®tra dans la section Reproduction</div>
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
                    placeholder={draft.repro.priceNegotiable ? "Ã€ discuter" : "Ex: 500"}
                    style={{ ...inputStyle, paddingRight: 36, opacity: draft.repro.priceNegotiable ? 0.5 : 1 }}
                  />
                  {!draft.repro.priceNegotiable && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", fontWeight: 600 }}>â‚¬</span>}
                </div>
              </div>
              <button onClick={() => setRepro("priceNegotiable", !draft.repro.priceNegotiable)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "0 0 14px", fontSize: 13, color: draft.repro.priceNegotiable ? "#F26419" : "#9CA3AF", fontWeight: 600 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${draft.repro.priceNegotiable ? "#F26419" : "#D1D5DB"}`, background: draft.repro.priceNegotiable ? "#F26419" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {draft.repro.priceNegotiable && <span style={{ color: "#fff", fontSize: 11 }}>âœ“</span>}
                </div>
                Prix Ã  discuter
              </button>

              {/* DisponibilitÃ© */}
              <label style={labelStyle}>PÃ‰RIODE DE DISPONIBILITÃ‰</label>
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
                {[["pedigree","ðŸ“œ Pedigree officiel (LOOF / SCC)"],["geneticTest","ðŸ§¬ Bilan gÃ©nÃ©tique complet"]].map(([k,l]) => (
                  <button key={k} onClick={() => setRepro(k, !draft.repro[k])} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `2px solid ${draft.repro[k] ? "#B84A0F" : "#E5E7EB"}`, background: draft.repro[k] ? "#FFF4EC" : "#F9FAFB", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${draft.repro[k] ? "#B84A0F" : "#D1D5DB"}`, background: draft.repro[k] ? "#B84A0F" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {draft.repro[k] && <span style={{ color: "#fff", fontSize: 11 }}>âœ“</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: draft.repro[k] ? "#B84A0F" : "#6B7280" }}>{l}</span>
                  </button>
                ))}
              </div>

              {/* Documents */}
              <label style={labelStyle}>DOCUMENTS SANITAIRES</label>
              <div style={{ marginBottom: 10 }}>
                {draft.repro.docs.map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FFF4EC", borderRadius: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{doc.type?.includes("pdf") ? "ðŸ“„" : "ðŸ–¼ï¸"}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#B84A0F", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                    <button onClick={() => removeDoc(i)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>âœ•</button>
                  </div>
                ))}
                <button onClick={() => docRef.current?.click()} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "2px dashed #F7C49A", background: "#FFF4EC", color: "#B84A0F", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ðŸ“Ž Ajouter un document (PDF, image)
                </button>
                <input ref={docRef} type="file" accept=".pdf,image/*" multiple style={{ display: "none" }} onChange={handleDocAdd} />
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Carnet de santÃ©, rÃ©sultats gÃ©nÃ©tiques, certificat de pedigree...</div>
              </div>

              {/* Description reproduction */}
              <label style={labelStyle}>DESCRIPTION POUR LA REPRODUCTION</label>
              <textarea
                value={draft.repro.reproDesc}
                onChange={e => setRepro("reproDesc", e.target.value)}
                style={{ ...inputStyle, minHeight: 90, resize: "none" }}
                placeholder="DÃ©crivez les conditions de la saillie, votre expÃ©rience d'Ã©leveur, ce que vous recherchez chez le partenaire..."
              />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Cette description est distincte de la bio gÃ©nÃ©rale et visible uniquement dans la section Reproduction.</div>
            </>}
          </>}
        </>}
      </div>
    </div>
  );

  // â”€â”€ VUE PROFIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const mainPhoto = pet.photos[0];
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {saved && (
        <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#1B5E3B", color: "#fff", padding: "10px 20px", borderRadius: 20, fontWeight: 700, fontSize: 14, zIndex: 99, boxShadow: "0 4px 16px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>âœ… Profil mis Ã  jour !</div>
      )}

      {/* Cover */}
      <div style={{ height: 180, background: mainPhoto ? "#000" : "linear-gradient(135deg,#B84A0F,#F26419)", position: "relative", overflow: "hidden" }}>
        {mainPhoto && <img src={mainPhoto.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .85 }} />}
        {!mainPhoto && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><PawLogo size={80} color="rgba(255,255,255,.6)" /></div>}
        <button onClick={openEdit} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.35)", border: "none", borderRadius: 10, color: "#fff", padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>âœï¸ Modifier</button>
        {pet.video && <div style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>ðŸŽ¬ VidÃ©o disponible</div>}
        {pet.repro.active && <div style={{ position: "absolute", bottom: 10, right: 12, background: "#2E7D32", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>ðŸŒ± Disponible reproduction</div>}
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
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>â–¶ï¸</div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "14px 20px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#2D1200" }}>{pet.name} <span style={{ fontSize: 16, color: "#6B7280", fontWeight: 400 }}>{pet.age} {pet.gender === "M" ? "â™‚" : "â™€"}</span></div>
        <div style={{ fontSize: 14, color: "#B84A0F", fontWeight: 600, marginBottom: 8 }}>{pet.breed}</div>
        {pet.bio && <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, marginBottom: 12 }}>{pet.bio}</p>}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {pet.temper.map(t => <Badge key={t}>{t}</Badge>)}
          {pet.sterilized && <Badge color="#E8F5E9" text="#2E7D32">StÃ©rilisÃ©Â·e âœ“</Badge>}
          {pet.vaccinated && <Badge color="#E3F2FD" text="#1565C0">VaccinÃ©Â·e âœ“</Badge>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 5, letterSpacing: 1 }}>Ã‰NERGIE</div>
          <EnergyDots level={pet.energy} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 5, letterSpacing: 1 }}>CHERCHE</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{pet.seeking.map(s => { const opt = ALL_SEEKING.find(o => o.id === s); return <Badge key={s} color="#FFF4EC" text="#F26419">{opt ? opt.icon + " " + opt.label : s}</Badge>; })}</div>
        </div>

        {/* Bloc reproduction visible si actif */}
        {pet.repro.active && (
          <div style={{ background: "linear-gradient(135deg,#E8F5E9,#F1F8E9)", borderRadius: 16, padding: "14px 16px", marginBottom: 14, border: "1.5px solid #A5D6A7" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32", marginBottom: 8, letterSpacing: 1 }}>ðŸŒ± DISPONIBLE POUR REPRODUCTION</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#4B5563" }}>Prix :</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#1B5E20" }}>{pet.repro.priceNegotiable ? "Ã€ discuter" : pet.repro.price ? `${pet.repro.price} â‚¬` : "Non dÃ©fini"}</span>
            </div>
            {(pet.repro.availableFrom || pet.repro.availableTo) && (
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>ðŸ“… {pet.repro.availableFrom || "?"} â†’ {pet.repro.availableTo || "?"}</div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pet.repro.pedigree && <Badge color="#F3E5F5" text="#7B1FA2">ðŸ“œ Pedigree âœ“</Badge>}
              {pet.repro.geneticTest && <Badge color="#E8F5E9" text="#2E7D32">ðŸ§¬ Bilan gÃ©nÃ©tique âœ“</Badge>}
              {pet.repro.docs.length > 0 && <Badge color="#E3F2FD" text="#1565C0">ðŸ“Ž {pet.repro.docs.length} document{pet.repro.docs.length > 1 ? "s" : ""}</Badge>}
            </div>
            {pet.repro.reproDesc ? <p style={{ fontSize: 12, color: "#4B5563", marginTop: 8, lineHeight: 1.6, marginBottom: 0 }}>{pet.repro.reproDesc}</p> : null}
          </div>
        )}

        {/* Completeness */}
        <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "12px 14px", marginBottom: 14, border: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2D1200" }}>ComplÃ©tude du profil</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#F26419" }}>
              {(pet.photos.length > 0 ? 25 : 0) + (pet.video ? 20 : 0) + (pet.bio ? 20 : 0) + (pet.temper.length > 0 ? 15 : 0) + (pet.vaccinated ? 10 : 0) + (pet.repro.active && pet.repro.price ? 10 : 0)}%
            </span>
          </div>
          <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#F26419,#F7931A)", width: `${(pet.photos.length > 0 ? 25 : 0) + (pet.video ? 20 : 0) + (pet.bio ? 20 : 0) + (pet.temper.length > 0 ? 15 : 0) + (pet.vaccinated ? 10 : 0) + (pet.repro.active && pet.repro.price ? 10 : 0)}%`, transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
            {pet.photos.length === 0 ? "ðŸ“· Ajoute des photos pour +25%" : !pet.video ? "ðŸŽ¬ Ajoute une vidÃ©o pour +20%" : !pet.repro.active ? "ðŸŒ± Active la reproduction pour +10%" : "ðŸ¾ Super profil !"}
          </div>
        </div>

        <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "14px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, letterSpacing: 1 }}>STATISTIQUES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[["12","Likes reÃ§us"],["3","Matchs"],["5","Rencontres"]].map(([n,l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#B84A0F" }}>{n}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={openEdit} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#F9FAFB", color: "#B84A0F", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>âœï¸ Modifier le profil de {pet.name}</button>
        {isPremium ? (
          <div style={{ background: "linear-gradient(135deg,#2E7D32,#43A047)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>ðŸ‘‘</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Membre Premium</div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>Toutes les fonctionnalitÃ©s sont actives âœ“</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 11, padding: "6px 10px" }}>Actif âœ“</div>
          </div>
        ) : (
          <button onClick={onPremium} style={{ width: "100%", background: "linear-gradient(135deg,#B84A0F,#F26419)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 26 }}>ðŸ‘‘</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>PawMatch Premium</div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>Swipes illimitÃ©s Â· Qui t'a likÃ© Â· Boost</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, color: "#B84A0F", fontWeight: 800, fontSize: 12, padding: "7px 12px", whiteSpace: "nowrap" }}>4,99 â‚¬/mois</div>
          </button>
        )}
      </div>
    </div>
  );
}



// â”€â”€ PREMIUM PAYMENT TUNNEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PLANS = [
  { id: "monthly", label: "Mensuel", price: "4,99", period: "mois", badge: null, savings: null },
  { id: "yearly",  label: "Annuel",  price: "39,99", period: "an", badge: "POPULAIRE", savings: "Ã‰conomisez 20 â‚¬" },
];

const FEATURES = [
  ["ðŸ¾", "Swipes illimitÃ©s"],
  ["ðŸ‘ï¸", "Voir qui a likÃ© votre animal"],
  ["âš¡", "Boost de visibilitÃ© x3"],
  ["ðŸŒ±", "AccÃ¨s reproduction complÃ¨te"],
  ["ðŸ†", "Publier dans la communautÃ©"],
  ["ðŸ“Š", "Statistiques avancÃ©es"],
];

function PremiumTunnel({ onClose, onSuccess }) {
  const [step, setStep] = useState("plans"); // plans | payment | success
  const [plan, setPlan] = useState("yearly");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedPlan = PLANS.find(p => p.id === plan);

  function formatCardNumber(v) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0,2) + "/" + d.slice(2) : d;
  }

  function validate() {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "NumÃ©ro invalide";
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
          <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto" }} />
        </div>

        {/* â”€â”€ STEP 1 : Plans â”€â”€ */}
        {step === "plans" && (
          <div style={{ overflowY: "auto", padding: "8px 20px 36px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>ðŸ‘‘</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#2D1200", marginBottom: 6 }}>PawMatch Premium</div>
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6 }}>Donnez Ã  votre animal les meilleures chances de trouver son partenaire idÃ©al.</div>
            </div>

            {/* Features */}
            <div style={{ background: "#FFF4EC", borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
              {FEATURES.map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 14, color: "#2E7D32" }}>âœ“</span>
                </div>
              ))}
            </div>

            {/* Plan selector */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {PLANS.map(p => (
                <div key={p.id} onClick={() => setPlan(p.id)}
                  style={{ flex: 1, padding: "14px 10px", borderRadius: 16, border: `2px solid ${plan === p.id ? "#F26419" : "#E5E7EB"}`, background: plan === p.id ? "#FFF4EC" : "#F9FAFB", cursor: "pointer", textAlign: "center", position: "relative", transition: "all .2s" }}>
                  {p.badge && (
                    <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 10, whiteSpace: "nowrap" }}>{p.badge}</div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan === p.id ? "#F26419" : "#6B7280", marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#2D1200" }}>{p.price} â‚¬</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>par {p.period}</div>
                  {p.savings && <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D32", marginTop: 4 }}>{p.savings}</div>}
                </div>
              ))}
            </div>

            {plan === "yearly" && (
              <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>
                Soit <strong style={{ color: "#F26419" }}>3,33 â‚¬ / mois</strong> â€” 2 mois offerts ðŸŽ
              </div>
            )}

            <button onClick={() => setStep("payment")}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 6px 20px rgba(242,100,25,.35)" }}>
              Continuer â†’ {selectedPlan.price} â‚¬ / {selectedPlan.period}
            </button>

            <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 12, lineHeight: 1.6 }}>
              RÃ©siliation Ã  tout moment Â· Paiement sÃ©curisÃ© ðŸ”’<br/>En continuant vous acceptez nos CGU et politique de confidentialitÃ©.
            </div>
          </div>
        )}

        {/* â”€â”€ STEP 2 : Paiement â”€â”€ */}
        {step === "payment" && (
          <div style={{ overflowY: "auto", padding: "8px 20px 36px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 20px" }}>
              <button onClick={() => setStep("plans")} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>â†</button>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#2D1200" }}>Informations de paiement</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Plan {selectedPlan.label} Â· {selectedPlan.price} â‚¬ / {selectedPlan.period}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 20 }}>ðŸ”’</div>
            </div>

            {/* Card brand icons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["ðŸ’³ Visa","ðŸ’³ Mastercard","ðŸ’³ Amex"].map(b => (
                <div key={b} style={{ flex: 1, padding: "6px 0", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", textAlign: "center", fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{b}</div>
              ))}
            </div>

            {/* Card number */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>NUMÃ‰RO DE CARTE</div>
              <div style={{ position: "relative" }}>
                <input
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  style={{ ...inputBase, border: `1.5px solid ${errors.number ? "#EF4444" : card.number ? "#B84A0F" : "#E5E7EB"}`, paddingRight: 44 }}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>ðŸ’³</span>
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
                  style={{ ...inputBase, border: `1.5px solid ${errors.expiry ? "#EF4444" : card.expiry ? "#B84A0F" : "#E5E7EB"}` }}
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
                  style={{ ...inputBase, border: `1.5px solid ${errors.cvc ? "#EF4444" : card.cvc ? "#B84A0F" : "#E5E7EB"}` }}
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
                style={{ ...inputBase, border: `1.5px solid ${errors.name ? "#EF4444" : card.name ? "#B84A0F" : "#E5E7EB"}` }}
              />
              {errors.name && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{errors.name}</div>}
            </div>

            {/* Order summary */}
            <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: "#4B5563" }}>PawMatch Premium {selectedPlan.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2D1200" }}>{selectedPlan.price} â‚¬</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>TVA (20%)</span>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>incluse</span>
              </div>
              <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#2D1200" }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#F26419" }}>{selectedPlan.price} â‚¬</span>
              </div>
            </div>

            <button onClick={pay} disabled={loading}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: loading ? "#D1D5DB" : "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 6px 20px rgba(242,100,25,.35)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? (
                <>
                  <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Traitement en cours...
                </>
              ) : `ðŸ”’ Payer ${selectedPlan.price} â‚¬`}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 12 }}>
              Paiement sÃ©curisÃ© par Stripe Â· DonnÃ©es chiffrÃ©es SSL
            </div>
          </div>
        )}

        {/* â”€â”€ STEP 3 : SuccÃ¨s â”€â”€ */}
        {step === "success" && (
          <div style={{ padding: "24px 24px 48px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#F26419,#F7931A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20, boxShadow: "0 8px 24px rgba(242,100,25,.35)" }}>ðŸ‘‘</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 8 }}>Bienvenue Premium !</div>
            <div style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
              Votre abonnement {selectedPlan.label} est activÃ©.<br/>
              <strong style={{ color: "#F26419" }}>Toutes les fonctionnalitÃ©s Premium</strong> sont maintenant disponibles pour votre animal ðŸ¾
            </div>

            <div style={{ width: "100%", background: "#FFF4EC", borderRadius: 16, padding: "16px", marginBottom: 24 }}>
              {FEATURES.map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{label}</span>
                  <span style={{ marginLeft: "auto", color: "#2E7D32", fontWeight: 700 }}>âœ“</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 24 }}>
              Prochain renouvellement : {plan === "yearly" ? "dans 1 an" : "dans 1 mois"}<br/>
              RÃ©siliation possible Ã  tout moment dans les paramÃ¨tres.
            </div>

            <button onClick={onSuccess}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              C'est parti ! ðŸ¾
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ ONBOARDING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const OB_TEMPER = ["Joueur","Affectueux","Curieux","CÃ¢lin","Calme","Ã‰nergique","IndÃ©pendant","Sociable","Timide","Gourmand"];
const OB_SEEKING = [
  { id: "Play date",        icon: "ðŸŽ¾", label: "Play date",          desc: "Rencontre ponctuelle de jeu" },
  { id: "Compagnon de vie", icon: "ðŸ ", label: "Compagnon de vie",   desc: "Un ami pour la maison, au quotidien" },
  { id: "Balade",           icon: "ðŸ¦®", label: "Balade",             desc: "Partenaire de sortie rÃ©gulier" },
  { id: "Dog date",         icon: "ðŸ•", label: "Dog date",           desc: "Sortie sociale dÃ©tendue entre chiens" },
  { id: "Cat date",         icon: "ðŸ±", label: "Cat date",           desc: "Rencontre tranquille entre chats" },
  { id: "Reproduction",     icon: "ðŸŒ±", label: "Reproduction",       desc: "Saillie sÃ©rieuse et vÃ©rifiÃ©e" },
];

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward -1=back
  const photoRef = useRef(null);

  const [form, setForm] = useState({
    ownerName: "", ownerEmail: "",
    petName: "", species: "", breed: "", age: "", gender: "",
    energy: 3, vaccinated: false, sterilized: false,
    temper: [], seeking: [],
    bio: "", photos: [],
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggleArr(k, v) { setForm(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v] })); }
  function toggleTemper(t) { setForm(f => ({ ...f, temper: f.temper.includes(t) ? f.temper.filter(x => x !== t) : f.temper.length < 4 ? [...f.temper, t] : f.temper })); }

  function handlePhotoAdd(e) {
    const files = Array.from(e.target.files);
    const toAdd = files.slice(0, 6 - form.photos.length).map(f => ({ url: URL.createObjectURL(f), name: f.name }));
    setForm(f => ({ ...f, photos: [...f.photos, ...toAdd] }));
    e.target.value = "";
  }

  function next() { setDirection(1); setStep(s => s + 1); }
  function back() { setDirection(-1); setStep(s => s - 1); }

  const STEPS = [
    "splash", "owner", "species", "identity", "health",
    "character", "seeking", "photos", "bio", "recap"
  ];
  const current = STEPS[step];
  const progress = step / (STEPS.length - 1);

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", fontSize: 15, outline: "none", background: "#F9FAFB", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8, display: "block" };

  // â”€â”€ SPLASH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (current === "splash") return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", background: "linear-gradient(160deg,#B84A0F 0%,#F26419 100%)" }}>
      <div style={{ marginBottom: 20 }}><PawLogo size={100} color="#fff" /></div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 10, textAlign: "center", lineHeight: 1.2 }}>Bienvenue sur PawMatch</div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,.8)", textAlign: "center", lineHeight: 1.7, marginBottom: 48 }}>
        La premiÃ¨re app de rencontres pour chats & chiens.<br/>CrÃ©ons ensemble le profil de votre animal en 2 minutes.
      </div>
      <button onClick={next} style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", background: "#fff", color: "#B84A0F", fontSize: 17, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
        C'est parti ! ðŸ¾
      </button>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 20, textAlign: "center" }}>Gratuit Â· Sans engagement Â· 2 minutes</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Progress bar */}
      <div style={{ padding: "14px 20px 0", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {step > 1 && (
            <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF", padding: 0, flexShrink: 0 }}>â†</button>
          )}
          <div style={{ flex: 1, height: 5, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#F26419,#F7931A)", width: `${progress * 100}%`, transition: "width .4s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, flexShrink: 0 }}>{step}/{STEPS.length - 1}</span>
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 16px" }}>

        {/* â”€â”€ OWNER â”€â”€ */}
        {current === "owner" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Parlez-nous de vous ðŸ‘¤</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 16, lineHeight: 1.6 }}>Ces informations restent privÃ©es et ne sont pas visibles sur le profil de votre animal.</div>
            <label style={labelStyle}>VOTRE PRÃ‰NOM</label>
            <input value={form.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="Ex: Marie" style={{ ...inputStyle, marginBottom: 16 }} />
            <label style={labelStyle}>VOTRE EMAIL</label>
            <input value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} placeholder="marie@email.com" type="email" style={{ ...inputStyle, marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 24 }}>Pour recevoir vos matchs et notifications.</div>
            <button onClick={next} disabled={!form.ownerName}
              style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: form.ownerName ? "pointer" : "default",
                background: form.ownerName ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB",
                color: form.ownerName ? "#fff" : "#9CA3AF" }}>
              Continuer â†’
            </button>
          </div>
        )}

        {/* â”€â”€ SPECIES â”€â”€ */}
        {current === "species" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Quel est votre animal ? ðŸ¾</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 28 }}>Le profil sera adaptÃ© Ã  son espÃ¨ce.</div>
            <div style={{ display: "flex", gap: 14, marginBottom: 40 }}>
              {[["cat","ðŸ±","Chat"],["dog","ðŸ•","Chien"]].map(([v,e,l]) => (
                <div key={v} onClick={() => set("species", v)}
                  style={{ flex: 1, padding: "28px 16px", borderRadius: 20, border: `3px solid ${form.species === v ? "#F26419" : "#E5E7EB"}`, background: form.species === v ? "#FFF4EC" : "#F9FAFB", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                  <div style={{ fontSize: 56, marginBottom: 10 }}>{e}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: form.species === v ? "#F26419" : "#2D1200" }}>{l}</div>
                </div>
              ))}
            </div>
          <div style={{ marginTop: 24 }}>
              <button onClick={next} disabled={!form.species}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: form.species ? "pointer" : "default",
                  background: form.species ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB",
                  color: form.species ? "#fff" : "#9CA3AF" }}>
                Continuer â†’
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ IDENTITY â”€â”€ */}
        {current === "identity" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Son identitÃ© {form.species === "cat" ? "ðŸ±" : "ðŸ•"}</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Ces infos apparaÃ®tront sur son profil public.</div>

            <label style={labelStyle}>PRÃ‰NOM</label>
            <input value={form.petName} onChange={e => set("petName", e.target.value)} placeholder={form.species === "cat" ? "Ex: Luna, Mochi..." : "Ex: Rocky, Bella..."} style={{ ...inputStyle, marginBottom: 16 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>RACE</label>
                <input value={form.breed} onChange={e => set("breed", e.target.value)} placeholder={form.species === "cat" ? "Ex: Siamois" : "Ex: Labrador"} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ã‚GE</label>
                <input value={form.age} onChange={e => set("age", e.target.value)} placeholder="Ex: 3 ans" style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>SEXE</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {[["M","â™‚ MÃ¢le"],["F","â™€ Femelle"]].map(([v,l]) => (
                <button key={v} onClick={() => set("gender", v)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${form.gender === v ? "#F26419" : "#E5E7EB"}`, background: form.gender === v ? "#FFF4EC" : "#F9FAFB", color: form.gender === v ? "#F26419" : "#6B7280", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
            <button onClick={next} disabled={!form.petName || !form.gender}
              style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: (form.petName && form.gender) ? "pointer" : "default",
                background: (form.petName && form.gender) ? "linear-gradient(135deg,#F26419,#F7931A)" : "#E5E7EB",
                color: (form.petName && form.gender) ? "#fff" : "#9CA3AF" }}>
              Continuer â†’
            </button>
          </div>
        )}

        {/* â”€â”€ HEALTH â”€â”€ */}
        {current === "health" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Sa santÃ© ðŸ¥</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 28 }}>Ces informations rassurent les autres propriÃ©taires.</div>

            <label style={labelStyle}>NIVEAU D'Ã‰NERGIE</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => set("energy", i)}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `2px solid ${form.energy >= i ? "#F26419" : "#E5E7EB"}`, background: form.energy >= i ? "#FFF4EC" : "#F9FAFB", fontSize: 16, cursor: "pointer", color: form.energy >= i ? "#F26419" : "#9CA3AF", fontWeight: 800 }}>{i}</button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: 28 }}>
              <span>TrÃ¨s calme ðŸ˜´</span><span>Ultra Ã©nergique âš¡</span>
            </div>

            <label style={labelStyle}>STATUT SANITAIRE</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["vaccinated","ðŸ’‰ VaccinÃ©Â·e"],["sterilized","âœ‚ï¸ StÃ©rilisÃ©Â·e"]].map(([k,l]) => (
                <button key={k} onClick={() => set(k, !form[k])}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `2px solid ${form[k] ? "#2E7D32" : "#E5E7EB"}`, background: form[k] ? "#E8F5E9" : "#F9FAFB", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${form[k] ? "#2E7D32" : "#D1D5DB"}`, background: form[k] ? "#2E7D32" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form[k] && <span style={{ color: "#fff", fontSize: 14 }}>âœ“</span>}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: form[k] ? "#1B5E20" : "#6B7280" }}>{l}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff" }}>
                Continuer â†’
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette Ã©tape</button>
            </div>
          </div>
        )}

        {/* â”€â”€ CHARACTER â”€â”€ */}
        {current === "character" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Son caractÃ¨re âœ¨</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Choisissez jusqu'Ã  4 traits qui le dÃ©crivent le mieux.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {OB_TEMPER.map(t => (
                <button key={t} onClick={() => toggleTemper(t)}
                  style={{ padding: "10px 16px", borderRadius: 20, border: `2px solid ${form.temper.includes(t) ? "#B84A0F" : "#E5E7EB"}`, background: form.temper.includes(t) ? "#FFF4EC" : "#F9FAFB", color: form.temper.includes(t) ? "#B84A0F" : "#6B7280", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{t}</button>
              ))}
            </div>
            {form.temper.length === 4 && (
              <div style={{ fontSize: 12, color: "#F26419", marginTop: 14, fontWeight: 600 }}>Maximum atteint â€” dÃ©sÃ©lectionnez un trait pour en choisir un autre.</div>
            )}
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff" }}>
                Continuer â†’
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette Ã©tape</button>
            </div>
          </div>
        )}

        {/* â”€â”€ SEEKING â”€â”€ */}
        {current === "seeking" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Que cherche-t-il ? ðŸŽ¯</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Plusieurs choix possibles. Cela guidera les matchs proposÃ©s.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OB_SEEKING.filter(s => form.species !== "cat" || !["Balade","Dog date"].includes(s.id))
                .filter(s => form.species !== "dog" || !["Cat date"].includes(s.id))
                .map(s => (
                <button key={s.id} onClick={() => toggleArr("seeking", s.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `2px solid ${form.seeking.includes(s.id) ? "#F26419" : "#E5E7EB"}`, background: form.seeking.includes(s.id) ? "#FFF4EC" : "#F9FAFB", cursor: "pointer" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${form.seeking.includes(s.id) ? "#F26419" : "#D1D5DB"}`, background: form.seeking.includes(s.id) ? "#F26419" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.seeking.includes(s.id) && <span style={{ color: "#fff", fontSize: 14 }}>âœ“</span>}
                  </div>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: form.seeking.includes(s.id) ? "#F26419" : "#2D1200" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff" }}>
                Continuer â†’
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette Ã©tape</button>
            </div>
          </div>
        )}

        {/* â”€â”€ PHOTOS â”€â”€ */}
        {current === "photos" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Ses plus belles photos ðŸ“¸</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Ajoutez jusqu'Ã  6 photos. Les profils avec photos ont 5Ã— plus de matchs !</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[...form.photos, ...Array(Math.max(0, 6 - form.photos.length)).fill(null)].map((p, i) => (
                <div key={i} onClick={() => !p && photoRef.current?.click()}
                  style={{ aspectRatio: "1", borderRadius: 14, overflow: "hidden", position: "relative", background: p ? "#000" : "#F3F4F6", border: p ? "none" : "2px dashed #D1D5DB", cursor: p ? "default" : "pointer" }}>
                  {p ? (
                    <>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && <div style={{ position: "absolute", bottom: 4, left: 4, background: "#F26419", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6 }}>PRINCIPALE</div>}
                      <button onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) })); }}
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>âœ•</button>
                    </>
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 24, color: "#F7C49A" }}>+</span>
                      {i === 0 && <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>Principale</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoAdd} />
            {form.photos.length < 6 && (
              <button onClick={() => photoRef.current?.click()}
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: "2px dashed #F7C49A", background: "#FFF4EC", color: "#B84A0F", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
                ðŸ“· Ajouter des photos ({form.photos.length}/6)
              </button>
            )}
            <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 6 }}>Vous pouvez continuer sans photo et en ajouter plus tard.</div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff" }}>
                Continuer â†’
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette Ã©tape</button>
            </div>
          </div>
        )}

        {/* â”€â”€ BIO â”€â”€ */}
        {current === "bio" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 6, marginTop: 8 }}>Sa petite bio âœï¸</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>En quelques mots, qui est-il vraiment ? (optionnel)</div>
            <textarea
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
              placeholder={form.species === "cat"
                ? `Ex: ${form.petName || "Luna"} est une exploratrice curieuse qui adore se blottir sur le canapÃ© aprÃ¨s ses aventures. Elle cherche un ami doux avec qui partager ses siestes...`
                : `Ex: ${form.petName || "Rocky"} est un joueur infatigable qui adore courir dans les parcs. Il cherche un compagnon de balade pour partager ses aventures quotidiennes...`}
              style={{ ...inputStyle, minHeight: 140, resize: "none", lineHeight: 1.7 }}
            />
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>{form.bio.length}/300 caractÃ¨res</div>
            <div style={{ marginTop: 24 }}>
              <button onClick={next}
                style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff" }}>
                Continuer â†’
              </button>
              <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>Passer cette Ã©tape</button>
            </div>
          </div>
        )}

        {/* â”€â”€ RECAP â”€â”€ */}
        {current === "recap" && (
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D1200", marginBottom: 4, marginTop: 8 }}>VoilÃ  {form.petName || "votre animal"} ! ðŸŽ‰</div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>VÃ©rifiez et confirmez votre profil.</div>

            {/* Mini profile card */}
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #E5E7EB", marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)" }}>
              <div style={{ height: 120, background: "linear-gradient(135deg,#B84A0F,#F26419)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {form.photos[0]
                  ? <img src={form.photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 60 }}>{form.species === "cat" ? "ðŸ±" : form.species === "dog" ? "ðŸ•" : "ðŸ¾"}</span>}
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2D1200", marginBottom: 4 }}>
                  {form.petName || "â€”"} <span style={{ fontSize: 15, color: "#6B7280", fontWeight: 400 }}>{form.age} {form.gender === "M" ? "â™‚" : form.gender === "F" ? "â™€" : ""}</span>
                </div>
                <div style={{ fontSize: 13, color: "#B84A0F", fontWeight: 600, marginBottom: 10 }}>{form.breed || "Race non prÃ©cisÃ©e"}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {form.temper.map(t => (
                    <span key={t} style={{ background: "#FFF4EC", color: "#B84A0F", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>{t}</span>
                  ))}
                  {form.vaccinated && <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>VaccinÃ©Â·e âœ“</span>}
                  {form.sterilized && <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>StÃ©rilisÃ©Â·e</span>}
                </div>
                {form.bio ? <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>{form.bio.slice(0, 100)}{form.bio.length > 100 ? "..." : ""}</p> : null}
              </div>
            </div>

            {/* Summary checklist */}
            <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px 16px", marginBottom: 24 }}>
              {[
                [!!form.ownerName, `PropriÃ©taire : ${form.ownerName || "â€”"}`],
                [!!form.species, `EspÃ¨ce : ${form.species === "cat" ? "Chat ðŸ±" : form.species === "dog" ? "Chien ðŸ•" : "â€”"}`],
                [!!form.petName, `PrÃ©nom : ${form.petName || "â€”"}`],
                [form.photos.length > 0, `Photos : ${form.photos.length}/6`],
                [form.seeking.length > 0, `Cherche : ${form.seeking.map(id => { const o = OB_SEEKING.find(x => x.id === id); return o ? o.icon + " " + o.label : id; }).join(", ") || "â€”"}`],
              ].map(([ok, label], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? "1px solid #F3F4F6" : "none" }}>
                  <span style={{ fontSize: 16 }}>{ok ? "âœ…" : "âšª"}</span>
                  <span style={{ fontSize: 13, color: ok ? "#2D1200" : "#9CA3AF", fontWeight: ok ? 500 : 400 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 24px 32px", background: "#fff", flexShrink: 0, display: ["owner","health","character","seeking","photos","bio","identity","species"].includes(current) ? "none" : "block" }}>
        {current === "recap" ? (
          <button onClick={() => onComplete(form)}
            style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", background: "linear-gradient(135deg,#F26419,#F7931A)", color: "#fff", fontSize: 17, fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 20px rgba(242,100,25,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <PawLogo size={24} color="#fff" /> DÃ©couvrir les profils !
          </button>
        ) : current === "owner" ? null : (
          <button onClick={next}
            disabled={
              (current === "species" && !form.species) ||
              (current === "identity" && (!form.petName || !form.gender))
            }
            style={{ width: "100%", padding: "18px", borderRadius: 18, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "all .2s",
              background: (current === "species" && !form.species) || (current === "identity" && (!form.petName || !form.gender))
                ? "#E5E7EB" : "linear-gradient(135deg,#F26419,#F7931A)",
              color: (current === "species" && !form.species) || (current === "identity" && (!form.petName || !form.gender))
                ? "#9CA3AF" : "#fff",
              boxShadow: "0 6px 20px rgba(242,100,25,.2)" }}>
            Continuer â†’
          </button>
        )}
        {["health","character","seeking","photos","bio"].includes(current) && (
          <button onClick={next} style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "none", fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>
            Passer cette Ã©tape
          </button>
        )}
      </div>
    </div>
  );
}

// â”€â”€ MAIN APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PawMatch() {
  const [onboarded, setOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [screen, setScreen] = useState("swipe");
  const [chatId, setChatId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumTunnel, setShowPremiumTunnel] = useState(false);

  function completeOnboarding(form) {
    setUserProfile(form);
    setOnboarded(true);
  }

  function openChat(id) { setChatId(id); setScreen("chat"); }
  function closeChat() { setChatId(null); setScreen("messages"); }
  function openPremium() { if (!isPremium) setShowPremiumTunnel(true); }
  function onPremiumSuccess() { setIsPremium(true); setShowPremiumTunnel(false); }

  
  const NAV = [
    { id: "swipe", label: "DÃ©couvrir", icon: null, logo: true },
    { id: "map", label: "Carte", icon: "ðŸ—ºï¸" },
    { id: "repro", label: "Reproduction", icon: "ðŸŒ±" },
    { id: "community", label: "CommunautÃ©", icon: "ðŸ†" },
    { id: "messages", label: "Messages", icon: "ðŸ’¬" },
    { id: "profile", label: "Profil", icon: "ðŸ±" },
  ];
  const showHeader = onboarded && !["chat","profile"].includes(screen);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#D1D5DB", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: "#fff", borderRadius: 40, boxShadow: "0 24px 80px rgba(0,0,0,.3)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Badge Premium uniquement si actif */}
        {isPremium && (
          <div style={{ position: "absolute", top: 8, right: 12, zIndex: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F26419", background: "#FFF4EC", padding: "2px 8px", borderRadius: 10 }}>ðŸ‘‘ PREMIUM</span>
          </div>
        )}

        {/* Header */}
        {showHeader && (
          <div style={{ padding: "4px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PawLogo size={22} color="#F26419" />
              <span style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg,#B84A0F,#F26419)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PawMatch</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {!isPremium && (
                <button onClick={openPremium} style={{ background: "linear-gradient(135deg,#F26419,#F7931A)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 12px", cursor: "pointer" }}>ðŸ‘‘ Premium</button>
              )}
              <button style={{ background: "#FFF4EC", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 15, cursor: "pointer" }}>ðŸ””</button>
            </div>
          </div>
        )}

        {/* Screens */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {!onboarded
            ? <Onboarding onComplete={completeOnboarding} />
            : <>
                {screen === "swipe" && <SwipeScreen onNav={setScreen} />}
                {screen === "map" && <MapScreen onOpenChat={openChat} onNav={setScreen} />}
                {screen === "repro" && <ReproScreen />}
                
                {screen === "community" && <CommunityScreen onPremium={openPremium} isPremium={isPremium} />}
                {screen === "messages" && <MatchesScreen onOpenChat={openChat} />}
                {screen === "chat" && <ChatScreen matchId={chatId} onBack={closeChat} />}
                {screen === "profile" && <ProfileScreen onPremium={openPremium} isPremium={isPremium} initialData={userProfile} />}
              </>
          }
        </div>

        {/* Bottom nav â€” uniquement aprÃ¨s onboarding */}
        {onboarded && screen !== "chat" && (
          <div style={{ borderTop: "1px solid #F3F4F6", background: "#fff", flexShrink: 0, overflowX: "auto" }}>
            <div style={{ display: "flex", padding: "6px 0 14px", minWidth: "max-content" }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setScreen(n.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 10px", minWidth: 52 }}>
                  {n.logo ? <PawLogo size={20} color={screen === n.id ? "#F26419" : "#9CA3AF"} /> : <span style={{ fontSize: 20 }}>{n.icon}</span>}
                  <span style={{ fontSize: 9, fontWeight: screen === n.id ? 700 : 400, color: screen === n.id ? "#F26419" : "#9CA3AF", whiteSpace: "nowrap" }}>{n.label}</span>
                  {screen === n.id && <div style={{ width: 16, height: 3, borderRadius: 2, background: "#F26419" }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium tunnel */}
        {showPremiumTunnel && (
          <PremiumTunnel onClose={() => setShowPremiumTunnel(false)} onSuccess={onPremiumSuccess} />
        )}
      </div>
    </div>
  );
}

/* ---------- DATA ---------- */
const SONGS = [
  {
    id: "s1",
    title: "SoundHelix 1",
    artist: "T. Schürger",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    album: "Helix",
    tags: ["lofi","chill"]
  },
  {
    id: "s2",
    title: "SoundHelix 2",
    artist: "T. Schürger",
    cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    album: "Helix",
    tags: ["beats","focus"]
  },
  {
    id: "s3",
    title: "SoundHelix 3",
    artist: "T. Schürger",
    cover: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    album: "Helix",
    tags: ["indie","mellow"]
  },
  {
    id: "s4",
    title: "SoundHelix 4",
    artist: "T. Schürger",
    cover: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&q=80",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    album: "Helix",
    tags: ["energy","workout"]
  }
];

/* ---------- STATE ---------- */
const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

let liked = new Set(LS.get("liked", []));
let playlists = LS.get("playlists", {}); // { name: ["s1","s2"] }
let queue = []; // array of song ids
let queueIndex = -1;
let shuffleOn = false;
let repeatMode = 0; // 0=off,1=all,2=one

/* ---------- EL ---------- */
const views = {
  home: document.getElementById("view-home"),
  search: document.getElementById("view-search"),
  library: document.getElementById("view-library"),
  liked: document.getElementById("view-liked"),
  playlist: document.getElementById("view-playlist"),
};
const navLinks = document.querySelectorAll(".nav-primary .nav-link");

const gridTrending = document.getElementById("gridTrending");
const gridForYou  = document.getElementById("gridForYou");
const libraryGrid = document.getElementById("libraryGrid");
const likedGrid   = document.getElementById("likedGrid");
const playlistList = document.getElementById("playlistList");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const audio = document.getElementById("audio");
const playerCover  = document.getElementById("playerCover");
const playerTitle  = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const likeToggle   = document.getElementById("likeToggle");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn      = document.getElementById("prevBtn");
const nextBtn      = document.getElementById("nextBtn");
const shuffleBtn   = document.getElementById("shuffleBtn");
const repeatBtn    = document.getElementById("repeatBtn");
const seek         = document.getElementById("seek");
const curTime      = document.getElementById("curTime");
const durTime      = document.getElementById("durTime");
const volume       = document.getElementById("volume");
const queueBtn     = document.getElementById("queueBtn");
const queuePanel   = document.getElementById("queuePanel");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const newPlaylistName = document.getElementById("newPlaylistName");
const renamePlaylistBtn = document.getElementById("renamePlaylistBtn");
const deletePlaylistBtn = document.getElementById("deletePlaylistBtn");
const playlistTitle = document.getElementById("playlistTitle");
const playlistMeta  = document.getElementById("playlistMeta");
const playlistTracks = document.getElementById("playlistTracks");
const playerLeft = document.querySelector(".player-left");

/* ---------- HELPERS ---------- */
const fmt = s => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s/60); const r = Math.floor(s%60);
  return `${m}:${r<10?"0":""}${r}`;
};
const songById = id => SONGS.find(s => s.id === id);

/* ---------- RENDER ---------- */
function card(song){
  const likedCls = liked.has(song.id) ? "active" : "";
  return `
  <a class="card-media" data-id="${song.id}">
    <img class="cover" src="${song.cover}" alt="${song.title}">
    <div class="body">
      <p class="title">${song.title}</p>
      <p class="sub">${song.artist}</p>
    </div>
    <button class="row-btn like ${likedCls}" title="Like"><i class="fa-solid fa-heart"></i></button>
  </a>`;
}

function renderHome(){
  gridTrending.innerHTML = SONGS.slice(0,4).map(card).join("");
  gridForYou.innerHTML   = SONGS.slice().reverse().map(card).join("");
}

function renderLibrary(){
  // Show all playlists as cards
  const items = Object.keys(playlists).map(name => {
    const count = playlists[name].length;
    return `
      <a class="card-media playlist-card" data-pl="${encodeURIComponent(name)}">
        <img class="cover" src="https://images.unsplash.com/photo-1518655048521-f130df041f66?w=600&q=80" alt="${name}">
        <div class="body">
          <p class="title">${name}</p>
          <p class="sub">${count} track${count!==1?"s":""}</p>
        </div>
      </a>
    `;
  }).join("");
  libraryGrid.innerHTML = items || `<div class="card-glass p-4">Create your first playlist to see it here.</div>`;
}

function renderLiked(){
  const likedSongs = SONGS.filter(s => liked.has(s.id));
  likedGrid.innerHTML = likedSongs.map(card).join("") || `<div class="card-glass p-4">No liked songs yet.</div>`;
}

function renderSidebarPlaylists(){
  playlistList.innerHTML = Object.keys(playlists).map(name => `
    <div class="playlist-item" data-pl="${encodeURIComponent(name)}">
      <span class="badge me-2">PL</span> <span>${name}</span>
    </div>
  `).join("") || `<div class="text-muted small mt-1">No playlists</div>`;
}

function openPlaylist(name){
  const ids = playlists[name] || [];
  playlistTitle.textContent = name;
  playlistMeta.textContent = `${ids.length} track${ids.length!==1?"s":""}`;
  playlistTracks.innerHTML = ids.map(id => {
    const s = songById(id);
    return `
      <div class="track-row" data-id="${s.id}">
        <div class="t-meta">
          <img src="${s.cover}" alt="${s.title}">
          <div>
            <div class="t-title">${s.title}</div>
            <div class="t-artist">${s.artist}</div>
          </div>
        </div>
        <button class="row-btn play" title="Play"><i class="fa-solid fa-circle-play"></i></button>
        <button class="row-btn add" title="Add to Queue"><i class="fa-solid fa-plus"></i></button>
        <button class="row-btn remove" title="Remove from Playlist"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
  }).join("") || `<div class="p-3 text-muted">Empty playlist.</div>`;

  // Save current open playlist name for rename/delete
  playlistTracks.dataset.playlistName = name;

  showView("playlist");
}

function renderQueue(){
  queuePanel.innerHTML = queue.map((id, idx) => {
    const s = songById(id);
    const active = idx === queueIndex ? 'style="background:#23232b"' : "";
    return `
      <div class="q-item" data-qi="${idx}" ${active}>
        <img src="${s.cover}" alt="${s.title}">
        <div>
          <div>${s.title}</div>
          <div class="text-muted small">${s.artist}</div>
        </div>
      </div>
    `;
  }).join("") || `<div class="p-3 text-muted">Queue is empty.</div>`;
}

/* ---------- NAV / VIEWS ---------- */
function showView(id){
  Object.values(views).forEach(v => v.classList.remove("active"));
  views[id].classList.add("active");
  navLinks.forEach(a => a.classList.toggle("active", a.dataset.view===id));
}
navLinks.forEach(a => a.addEventListener("click", () => showView(a.dataset.view)));

/* ---------- INTERACTION: CARDS ---------- */
function delegate(container, selector, handler){
  container.addEventListener("click", e => {
    const el = e.target.closest(selector);
    if (el && container.contains(el)) handler(e, el);
  });
}

function attachCardHandlers(){
  // play from home, liked, search (cards)
  [gridTrending, gridForYou, likedGrid, searchResults, libraryGrid].forEach(grid => {
    if(!grid) return;

    delegate(grid, ".card-media", (_, el) => {
      const id = el.dataset.id;
      if(!id) return; // playlist cards in library have no id
      playFromId(id, true);
    });

    delegate(grid, ".card-media .like", (e, el) => {
      e.stopPropagation();
      const id = el.closest(".card-media").dataset.id;
      toggleLike(id);
      el.classList.toggle("active", liked.has(id));
    });

    // open playlist card from library
    delegate(grid, ".playlist-card", (_, el) => {
      const name = decodeURIComponent(el.dataset.pl);
      openPlaylist(name);
    });
  });

  // sidebar playlist open
  delegate(playlistList, ".playlist-item", (_, el) => {
    const name = decodeURIComponent(el.dataset.pl);
    openPlaylist(name);
  });
}

/* ---------- LIKE ---------- */
function toggleLike(id){
  if(liked.has(id)) liked.delete(id);
  else liked.add(id);
  LS.set("liked", [...liked]);
  likeToggle.classList.toggle("active", liked.has(currentId()));
  renderLiked();
}

/* ---------- AUDIO / PLAYER ---------- */
function currentId(){ return queue[queueIndex]; }
function updatePlayerUI(){
  const s = songById(currentId());
  if(!s) return;
  playerCover.src = s.cover;
  playerTitle.textContent = s.title;
  playerArtist.textContent = s.artist;
  likeToggle.classList.toggle("active", liked.has(s.id));
}

function playFromId(id, replaceQueue=false){
  const idx = queue.indexOf(id);
  if(replaceQueue || idx === -1){
    queue = [id, ...SONGS.filter(s=>s.id!==id).map(s=>s.id)]; // simple queue starting with chosen
    queueIndex = 0;
  } else {
    queueIndex = idx;
  }
  audio.src = songById(currentId()).src;
  audio.play();
}

function playPause(){
  if(!audio.src){ // start first song if none
    playFromId(SONGS[0].id, true);
    return;
  }
  if(audio.paused){ audio.play(); }
  else { audio.pause(); }
}

function next(){
  if(repeatMode===2){ // repeat-one
    audio.currentTime = 0; audio.play(); return;
  }
  if(shuffleOn){
    queueIndex = Math.floor(Math.random()*queue.length);
  } else {
    queueIndex = (queueIndex+1) % queue.length;
  }
  audio.src = songById(currentId()).src;
  audio.play();
  renderQueue();
}

function prev(){
  if(audio.currentTime > 3){ audio.currentTime = 0; return; }
  queueIndex = (queueIndex-1+queue.length) % queue.length;
  audio.src = songById(currentId()).src;
  audio.play();
  renderQueue();
}

/* ---------- EVENTS ---------- */
audio.addEventListener("play", ()=>{
  playPauseBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
  playerLeft.classList.add("playing");
  updatePlayerUI();
  renderQueue();
});
audio.addEventListener("pause", ()=>{
  playPauseBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
  playerLeft.classList.remove("playing");
});
audio.addEventListener("timeupdate", ()=>{
  seek.value = (audio.currentTime / (audio.duration||1)) * 100;
  curTime.textContent = fmt(audio.currentTime);
  durTime.textContent = fmt(audio.duration);
});
audio.addEventListener("ended", ()=>{
  if(repeatMode===2){ audio.currentTime=0; audio.play(); return; }
  if(repeatMode===1){ next(); return; }
  if(queueIndex < queue.length-1){ next(); }
});

seek.addEventListener("input", ()=> {
  if(!isFinite(audio.duration)) return;
  audio.currentTime = (seek.value/100) * audio.duration;
});
volume.addEventListener("input", ()=> audio.volume = volume.value);

playPauseBtn.addEventListener("click", playPause);
prevBtn.addEventListener("click", prev);
nextBtn.addEventListener("click", next);

shuffleBtn.addEventListener("click", ()=>{
  shuffleOn = !shuffleOn;
  shuffleBtn.classList.toggle("active", shuffleOn);
});
repeatBtn.addEventListener("click", ()=>{
  repeatMode = (repeatMode+1)%3; // 0 off, 1 all, 2 one
  repeatBtn.classList.remove("one","all");
  if(repeatMode===1) repeatBtn.classList.add("all");
  if(repeatMode===2) repeatBtn.classList.add("one");
});
likeToggle.addEventListener("click", ()=>{
  const id = currentId();
  if(id) toggleLike(id);
});

/* Queue */
queueBtn.addEventListener("click", ()=>{
  queuePanel.classList.toggle("open");
});
queuePanel.addEventListener("click", e=>{
  const item = e.target.closest(".q-item");
  if(!item) return;
  const idx = +item.dataset.qi;
  queueIndex = idx;
  audio.src = songById(currentId()).src;
  audio.play();
});

/* ---------- SEARCH ---------- */
searchInput?.addEventListener("input", ()=>{
  const q = searchInput.value.trim().toLowerCase();
  const results = SONGS.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.album.toLowerCase().includes(q) ||
    s.tags.some(t=>t.includes(q))
  );
  searchResults.innerHTML = results.map(card).join("") || `<div class="card-glass p-4">No results.</div>`;
});

/* ---------- PLAYLISTS ---------- */
createPlaylistBtn?.addEventListener("click", ()=>{
  const name = (newPlaylistName.value || "").trim();
  if(!name) return;
  if(playlists[name]){ alert("A playlist with that name already exists."); return; }
  playlists[name] = [];
  LS.set("playlists", playlists);
  newPlaylistName.value = "";
  document.querySelector("#createPlaylistModal .btn-close").click();
  renderSidebarPlaylists();
  renderLibrary();
});

// Playlist view interactions
playlistTracks.addEventListener("click", e=>{
  const row = e.target.closest(".track-row");
  if(!row) return;
  const id = row.dataset.id;
  if(e.target.closest(".play")){
    playFromId(id, true);
  } else if(e.target.closest(".add")){
    // add to end of queue
    queue.push(id);
    renderQueue();
  } else if(e.target.closest(".remove")){
    const name = playlistTracks.dataset.playlistName;
    playlists[name] = playlists[name].filter(x=>x!==id);
    LS.set("playlists", playlists);
    openPlaylist(name);
    renderLibrary();
  }
});

renamePlaylistBtn.addEventListener("click", ()=>{
  const oldName = playlistTracks.dataset.playlistName;
  const newName = prompt("New name:", oldName)?.trim();
  if(!newName || newName===oldName) return;
  if(playlists[newName]){ alert("That name is already used."); return; }
  playlists[newName] = playlists[oldName];
  delete playlists[oldName];
  LS.set("playlists", playlists);
  renderSidebarPlaylists();
  renderLibrary();
  openPlaylist(newName);
});

deletePlaylistBtn.addEventListener("click", ()=>{
  const name = playlistTracks.dataset.playlistName;
  if(!confirm(`Delete playlist "${name}"?`)) return;
  delete playlists[name];
  LS.set("playlists", playlists);
  renderSidebarPlaylists();
  renderLibrary();
  showView("library");
});

/* Add to playlist / like from cards by long press or icon */
document.addEventListener("click", e=>{
  const card = e.target.closest(".card-media");
  if(!card) return;
  const id = card.dataset.id;
  if(!id) return;

  // Right side click: show quick menu (simple prompt)
  if(e.shiftKey){ // little shortcut UX: Shift+Click to add to playlist
    const names = Object.keys(playlists);
    if(names.length===0){ alert("Create a playlist first."); return; }
    const pick = prompt(`Add to which playlist?\n${names.join(", ")}`);
    if(pick && playlists[pick]){
      if(!playlists[pick].includes(id)){
        playlists[pick].push(id);
        LS.set("playlists", playlists);
        renderLibrary();
      }
    }
  }
});

/* ---------- INIT ---------- */
function init(){
  renderHome();
  renderLibrary();
  renderLiked();
  renderSidebarPlaylists();
  attachCardHandlers();

  // default queue
  queue = SONGS.map(s=>s.id);
  queueIndex = 0;
  updatePlayerUI();
  playerCover.src = SONGS[0].cover;

  // click playlist item in sidebar on load? stay at home.
}
init();

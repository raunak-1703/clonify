const toggleBtn = document.getElementById("hamburger-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const closeBtn = document.getElementById("close-btn");
const searchBox = document.getElementById('search-box');
const mediaQuery = window.matchMedia("(max-width: 375px)");

const play = document.getElementById('play');
const pause = document.getElementById('pause');
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const track = document.getElementById('track');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const progress = document.getElementById('progress');
const circle = document.getElementById('circle');
const progressbar = document.getElementById('progressbar');

const allFetchedQueries = {};
let songs = [], title = [], currentAudio = null, index = -1;
let isDragging = false, count = 0;

const updatePlaceholder = (e) => {
  searchBox.placeholder = e.matches ? "Search..." : "What do you want to play?";
};
updatePlaceholder(mediaQuery);
mediaQuery.addEventListener('change', updatePlaceholder);

toggleBtn.addEventListener("click", () => mobileMenu.classList.add("open"));
closeBtn.addEventListener("click", () => mobileMenu.classList.remove("open"));

function formatTime(time) {
  let minutes = Math.floor(time / 60);
  let seconds = Math.floor(time % 60);
  return seconds < 10 ? `${minutes}:0${seconds}` : `${minutes}:${seconds}`;
}

function highlightCards(index) {
  document.querySelectorAll('.card').forEach(card => {
    const i = Number(card.dataset.index);

    if (i === index) {
      card.classList.add('playing');
      card.querySelector('.libplay').style.display = 'none';
      card.querySelector('.libpause').style.display = 'inline';
      card.querySelector('.control>p').innerHTML='Playing'
    } else {
      card.classList.remove('playing');
      card.querySelector('.libplay').style.display = 'inline';
      card.querySelector('.libpause').style.display = 'none';
      card.querySelector('.control>p').innerHTML='Play Now'
    }
  });
}


function displayTrack(index) {
  const name = title[index]?.replace(".mp3", "") || "Unknown";
  track.innerHTML = name;
}

function displayTime(audio) {
  audio.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    if (isDragging) return;
    totalTime.textContent = count % 2 === 1 ? '-' + formatTime(audio.duration - audio.currentTime) : formatTime(audio.duration);
    currentTime.textContent = formatTime(audio.currentTime);
    const percent = (audio.currentTime / audio.duration) * 100;
    circle.style.left = `${percent}%`;
    progress.style.width = `${percent}%`;
  });
  totalTime.addEventListener('click', () => count++);
  audio.addEventListener('pause', () => {
    play.style.display = 'inline';
    pause.style.display = 'none';
  });
  audio.addEventListener('play', () => {
    play.style.display = 'none';
    pause.style.display = 'inline';
  });
  audio.addEventListener('ended', () => {
    index = (index + 1) % songs.length;
    playSong(index);
  });
}
const volumebar = document.getElementById('volumebar');
const volume = document.getElementById('volume');
const circle2 = document.getElementById('circle2');
const muteBtn = volumebar.querySelector('img');
let isDraggingVolume = false;
let lastVolume = 1; // default volume

// Initialize volume for new audio
function setInitialVolume(audio) {
  audio.volume = lastVolume;
  updateVolumeUI(lastVolume * 100);
  muteBtn.src = lastVolume === 0 ? "assets/mute.svg" : "assets/unmute.svg";
}

// Update volume UI
function updateVolumeUI(percent) {
  volume.style.width = `${percent}%`;
  circle2.style.left = `${percent}%`;
  muteBtn.src = percent === 0 ? "assets/mute.svg" : "assets/unmute.svg";
}

// Set volume based on position
function setVolumeFromClientX(clientX) {
  const rect = volumebar.getBoundingClientRect();
  let offsetX = clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));
  const percent = offsetX / rect.width;
  if (currentAudio) {
    currentAudio.volume = percent;
    lastVolume = percent;
  }
  updateVolumeUI(percent * 100);
}

// Click to set volume
volumebar.addEventListener('click', (e) => {
  setVolumeFromClientX(e.clientX);
});

// Dragging logic for volume circle
circle2.addEventListener('mousedown', () => isDraggingVolume = true);
document.addEventListener('mouseup', e => { 
  if (isDraggingVolume) setVolumeFromClientX(e.clientX); 
  isDraggingVolume = false; 
});
document.addEventListener('mousemove', e => {
  if (isDraggingVolume) updateVolumeUIFromDrag(e.clientX);
});

// Touch support
circle2.addEventListener('touchstart', () => isDraggingVolume = true);
document.addEventListener('touchend', e => {
  if (isDraggingVolume) setVolumeFromClientX(e.changedTouches[0].clientX);
  isDraggingVolume = false;
});
document.addEventListener('touchmove', e => {
  if (isDraggingVolume) updateVolumeUIFromDrag(e.touches[0].clientX);
});

// While dragging, only update UI (no sound change until mouseup)
function updateVolumeUIFromDrag(clientX) {
  const rect = volumebar.getBoundingClientRect();
  let offsetX = clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));
  const percent = (offsetX / rect.width) * 100;
  volume.style.width = `${percent}%`;
  circle2.style.left = `${percent}%`;
}

// Mute/unmute toggle
muteBtn.addEventListener('click', () => {
  if (!currentAudio) return;
  if (currentAudio.volume > 0) {
    lastVolume = currentAudio.volume;
    currentAudio.volume = 0;
    updateVolumeUI(0);
  } else {
    currentAudio.volume = lastVolume;
    updateVolumeUI(lastVolume * 100);
  }
});


function playSong(i) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  index = i;
  currentAudio = new Audio(songs[index]);
  currentAudio.play();
  displayTrack(index);
  displayTime(currentAudio);
  const imgTag = document.getElementById('current-song-img');
const allCards = document.querySelectorAll(`[data-index="${i}"]`);
let found = false;

allCards.forEach(card => {
  const img = card.querySelector("img");
  if (img && img.src && !img.src.includes("music.svg") && !found) {
    imgTag.src = img.src;
    found = true;
  }
});
  setInitialVolume(currentAudio);
  ensureInLibrary(index); // add to library if not present
   setTimeout(() => {
    highlightCards(index); // now highlight (after card is inserted)
  }, 0);
}

function updateSeekUI(clientX) {
  const rect = progressbar.getBoundingClientRect();
  let offsetX = clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));
  const percent = offsetX / rect.width;
  circle.style.left = `${percent * 100}%`;
  progress.style.width = `${percent * 100}%`;
}

function updateTime(clientX) {
  if (!currentAudio || !currentAudio.duration) return;
  const rect = progressbar.getBoundingClientRect();
  let offsetX = clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));
  const percent = offsetX / rect.width;
  currentAudio.currentTime = percent * currentAudio.duration;
}

function fetchSearchSongs(query) {
  fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const results = data.data.results;
      const songArray = results.map(song => ({
        name: song.name,
        artist: song.artists?.primary?.map(a => a.name).join(", ") || "Unknown Artist",
        image: song.image?.[2]?.url || "",
        audio: song.downloadUrl?.find(d => d.quality === "160kbps")?.url || ""
      }));

      // Clear both mobile and desktop library wrappers
      const wrappers = document.querySelectorAll(".wrapper");
      wrappers.forEach(w => w.innerHTML = "");

      // Push to global song list and render
      songArray.forEach((song) => {
        const index = songs.length;
        songs.push(song.audio);
        title.push(song.name + ".mp3");

        const html = `
          <div class="card  flex pointer" data-index="${index}">
            <div class="details flex">
              <img src="${song.image}" alt="">
              <p class="genre">${song.name}</p>
            </div>
            <div class="control flex">
              <p>Play Now</p>
              <img class="libplay" src="assets/play.svg" alt="">
              <img class="libpause" src="assets/pause.svg" alt="" style="display: none;">
            </div>
          </div>`;
        wrappers.forEach(w => w.insertAdjacentHTML('beforeend', html));
      });

      // Add click listeners to play searched songs
      document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const i = parseInt(card.dataset.index);
          if (!isNaN(i)) playSong(i);
        });
      });
      // Auto-play the first searched song
if (songs.length > 0) {
  const startIndex = songs.length - songArray.length; // Get the index of first searched song
  playSong(startIndex); // Play it
}

    })
    .catch(err => console.error("Search error:", err));
}

searchBox.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = searchBox.value.trim();
    if (query) {
      fetchSearchSongs(query);
    }
    searchBox.value="";
  }
});

function main() {
  document.addEventListener('click', function (e) {
    const card = e.target.closest('.samec');
    if (!card) return;
    const i = parseInt(card.dataset.index);
    if (!isNaN(i)) playSong(i);
  });

  play.addEventListener('click', () => {
    if (!currentAudio) playSong(0);
    else currentAudio.play();
  });

  pause.addEventListener('click', () => {
    if (currentAudio) currentAudio.pause();
  });

  next.addEventListener('click', () => {
    playSong((index + 1) % songs.length);
  });

  previous.addEventListener('click', () => {
    playSong((index - 1 + songs.length) % songs.length);
  });

  progressbar.addEventListener('click', (e) => {
    if (!currentAudio || !currentAudio.duration) return;
    const rect = progressbar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = offsetX / rect.width;
    currentAudio.currentTime = percent * currentAudio.duration;
  });

  circle.addEventListener('mousedown', () => isDragging = true);
  document.addEventListener('mouseup', e => { if (isDragging) updateTime(e.clientX); isDragging = false; });
  document.addEventListener('mousemove', e => { if (isDragging) updateSeekUI(e.clientX); });

  circle.addEventListener('touchstart', () => isDragging = true);
  document.addEventListener('touchend', e => { if (isDragging) updateTime(e.changedTouches[0].clientX); isDragging = false; });
  document.addEventListener('touchmove', e => { if (isDragging) updateSeekUI(e.touches[0].clientX); });
}

function renderSongs(queryName, songArray, containerSelector, className) {
  allFetchedQueries[queryName] = songArray;
  const container = document.getElementById(containerSelector);
  songArray.forEach((song, i) => {
    const html = `
      <div class="${className} samec pointer" data-index="${songs.length}">
        <img src="${song.image}" alt="${song.name}">
        <svg data-encore-id="icon" role="img" aria-hidden="true" class="e-9960-icon e-9960-baseline" viewBox="0 0 24 24">
          <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606"></path>
        </svg>
        <h4 class="pointer">${song.name}</h4>
        <p class="pointer">${song.artist}</p>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
    songs.push(song.audio);
    title.push(song.name + ".mp3");
  });
}

function fetchSongs(query, containerSelector, className) {
  fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const results = data.data.results;
      const songArray = results.map(song => ({
        name: song.name,
        artist: song.artists?.primary?.map(a => a.name).join(", ") || "Unknown Artist",
        image: song.image?.[2]?.url || "",
        audio: song.downloadUrl?.find(d => d.quality === "160kbps")?.url || ""
      }));
      renderSongs(query, songArray, containerSelector, className);
    })
    .catch(err => console.error(`Failed to fetch '${query}':`, err));
}

function ensureInLibrary(i) {
  const wrappers = document.querySelectorAll(".wrapper");
  const existing = document.querySelector(`.card[data-index="${i}"]`);
  if (existing) highlightCards(i);
  else {
    const songName = title[i]?.replace(".mp3", "") || "Unknown";
    const html = `
      <div class="card flex pointer playing" data-index="${i}">
        <div class="details flex">
          <img src="assets/music.svg" alt="">
          <p class="genre">${songName}</p>
        </div>
        <div class="control flex">
          <p>Play Now</p>
          <img class="libplay" src="assets/play.svg" alt="">
          <img class="libpause" src="assets/pause.svg" alt="" style="display: none;">
        </div>
      </div>`;
    wrappers.forEach(w => w.insertAdjacentHTML('beforeend', html));
    document.querySelectorAll(`.card[data-index="${i}"]`).forEach(card => {
      card.addEventListener('click', () => {
        playSong(i);
      });
    });
  }
}

fetchSongs("top hindi songs", "th-songs", "chs");
fetchSongs("romantic hits", "rh-songs", "crs");
fetchSongs("Brahmastra", "b-songs", "cbs");
fetchSongs("party hits", "p-songs", "cps");
fetchSongs("Yeh Jawaani Hai Deewani", "hit-songs", "chits");
fetchSongs("billboard hits", "e-songs", "ces");

document.querySelectorAll("h2.pointer").forEach((heading) => {
  heading.addEventListener("click", () => {
    const section = heading.nextElementSibling;
    const songCards = section.querySelectorAll(".samec");
    const wrappers = document.querySelectorAll(".wrapper");
    wrappers.forEach(w => w.innerHTML = "");

    songCards.forEach((card) => {
      const songName = card.querySelector("h4")?.textContent || "Unknown";
      const i = parseInt(card.dataset.index);
      const html = `
        <div class="card flex pointer" data-index="${i}">
          <div class="details flex">
            <img src="assets/music.svg" alt="">
            <p class="genre">${songName}</p>
          </div>
          <div class="control flex">
            <p>Play Now</p>
            <img class="libplay" src="assets/play.svg" alt="">
              <img class="libpause" src="assets/pause.svg" alt="" style="display: none;">
          </div>
        </div>`;
      wrappers.forEach(w => w.insertAdjacentHTML('beforeend', html));
    });

    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const i = parseInt(card.dataset.index);
        if (!isNaN(i)) playSong(i);
      });
    });
     const firstIndex = parseInt(songCards[0]?.dataset.index);
    if (!isNaN(firstIndex)) {
      playSong(firstIndex);
    }
  });
});


main();

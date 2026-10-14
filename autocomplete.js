function initAutocomplete(onSelectCallback) {
    const input = document.getElementById("guess-input");
    const suggestionsBox = document.getElementById("suggestions");

    if (!input || !suggestionsBox) return;

    input.addEventListener("input", () => {
        const query = input.value.toLowerCase().trim();
        suggestionsBox.innerHTML = "";
        
        if (!query) return;

        const guessedSet = window.guessedSongTitles || new Set();

        const filtered = songsDatabase.filter(song => {
            const isGuessed = guessedSet.has(song.title.toLowerCase());
            const matchesTitle = song.title.toLowerCase().includes(query);
            const matchesAlbum = song.album.toLowerCase().includes(query);
            return (matchesTitle || matchesAlbum) && !isGuessed;
        });

        filtered.forEach(song => {
            const div = document.createElement("div");
            div.classList.add("suggestion-item");
            
            const formattedDuration = typeof formatDuration === "function" ? formatDuration(song.duration) : song.duration;
            const formattedPlays = typeof formatPlays === "function" ? formatPlays(song.liczba_przesluchan) : song.liczba_przesluchan;

            div.innerHTML = `
                <img src="${song.zdj_alb}" class="suggestion-img" alt="">
                <div class="suggestion-text">
                    <span class="suggestion-title">${song.title}</span>
                    <span class="suggestion-info">${song.album} | ${song.year} | ${formattedDuration} | ${song.produkcja} | ${formattedPlays}</span>
                </div>
            `;

            div.addEventListener("click", () => {
                input.value = song.title;
                suggestionsBox.innerHTML = "";
                if (typeof onSelectCallback === "function") {
                    onSelectCallback(song);
                }
            });

            suggestionsBox.appendChild(div);
        });
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && typeof onSelectCallback === "function") {
            onSelectCallback();
        }
    });
}
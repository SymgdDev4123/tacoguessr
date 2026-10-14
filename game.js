document.addEventListener("DOMContentLoaded", () => {
    if (typeof songsDatabase === 'undefined' || songsDatabase.length === 0) return;

    const isDaily = typeof window.isDailyMode !== 'undefined' && window.isDailyMode === true;
    
    let targetSong;
    let todayDate = "";
    
    if (isDaily) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        todayDate = `${year}-${month}-${day}`;
        
        let hash = 0;
        for (let i = 0; i < todayDate.length; i++) {
            hash = ((hash << 5) - hash) + todayDate.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % songsDatabase.length;
        targetSong = songsDatabase[index];
    } else {
        targetSong = songsDatabase[Math.floor(Math.random() * songsDatabase.length)];
    }

    const dailyKey = isDaily ? `tacoquesser_daily_won_${todayDate}` : null;

    const input = document.getElementById("guess-input");
    const suggestionsBox = document.getElementById("suggestions");
    const guessBtn = document.getElementById("guess-btn");
    const guessesGrid = document.getElementById("guesses-grid");
    const messageBox = document.getElementById("message-box");
    const inputSectionContainer = document.getElementById("input-section-container");

    const modal = document.getElementById("endgame-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalImgContainer = document.getElementById("modal-img-container");
    const restartBtn = document.getElementById("restart-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");

    let gameOver = false;
    let guessCount = 0;
    window.guessedSongTitles = new Set();

    if (isDaily && localStorage.getItem(dailyKey)) {
        gameOver = true;
        if (inputSectionContainer) inputSectionContainer.style.display = "none";
        messageBox.textContent = "Dzisiejsze wyzwanie zostało już ukończone! Wróć jutro po kolejną piosenkę.";
        modal.classList.remove("hidden");
        modalTitle.textContent = "Ukończono Daily!";
        modalImgContainer.innerHTML = `<img src="${targetSong.zdj_alb}" class="modal-img" alt="">`;
        modalText.innerHTML = `Dzisiejsza piosenka to:<br><strong>"${targetSong.title}"</strong>.<br>Wróć jutro po nowe wyzwanie!`;
        if (closeModalBtn) {
            closeModalBtn.style.display = "inline-block";
        }
    } else {
        messageBox.textContent = isDaily ? "Wyzwanie dnia aktywne. Wpisz tytuł lub album, aby zacząć!" : "Wpisz tytuł lub album, aby rozpocząć grę. Liczba prób: 0";
    }

    if (typeof HintsManager !== 'undefined' && HintsManager.initStandardHints) {
        HintsManager.initStandardHints(targetSong);
    }

    initAutocomplete((selectedSong) => {
        executeGuess(selectedSong);
    });

    if (guessBtn) {
        guessBtn.addEventListener("click", () => {
            const userTitle = input.value.trim();
            const found = songsDatabase.find(s => s.title.toLowerCase() === userTitle.toLowerCase());
            executeGuess(found);
        });
    }

    function executeGuess(guessedSong) {
        if (gameOver) return;
        
        if (!guessedSong) {
            alert("Nie ma takiego utworu w bazie lub podano złą nazwę!");
            return;
        }

        if (window.guessedSongTitles.has(guessedSong.title.toLowerCase())) {
            alert("Ten utwór został już przez Ciebie wpisany!");
            return;
        }

        window.guessedSongTitles.add(guessedSong.title.toLowerCase());
        input.value = "";
        if (suggestionsBox) suggestionsBox.innerHTML = "";
        guessCount++;

        if (typeof HintsManager !== 'undefined' && HintsManager.updateState) {
            HintsManager.updateState(guessCount);
        }

        renderStandardRow(guessedSong);
    }

    function renderStandardRow(guessedSong) {
        const row = document.createElement("div");
        row.classList.add("guess-row");

        const imgTile = document.createElement("div");
        imgTile.classList.add("guess-tile-img");
        const imgEl = document.createElement("img");
        imgEl.src = guessedSong.zdj_alb; 
        imgEl.alt = guessedSong.album;
        imgTile.appendChild(imgEl);
        row.appendChild(imgTile);

        const targetSec = timeToSeconds(targetSong.duration);
        const guessedSec = timeToSeconds(guessedSong.duration);
        const prodCheck = checkProduction(guessedSong.produkcja, targetSong.produkcja);
        const guessedPlaysNum = parsePlaysToNumber(guessedSong.liczba_przesluchan);
        const targetPlaysNum = parsePlaysToNumber(targetSong.liczba_przesluchan);

        const checks = [
            { val: guessedSong.title, target: targetSong.title, type: 'exact' },
            { val: guessedSong.album, target: targetSong.album, type: 'exact' },
            { val: guessedSong.year, target: targetSong.year, type: 'number' },
            { val: formatDuration(guessedSong.duration), target: formatDuration(targetSong.duration), type: 'duration', valSec: guessedSec, targetSec: targetSec },
            { val: guessedSong.produkcja, target: targetSong.produkcja, type: 'production', status: prodCheck.status },
            { val: formatPlays(guessedSong.liczba_przesluchan), rawVal: guessedPlaysNum, rawTarget: targetPlaysNum, type: 'plays' }
        ];

        let allCorrect = true;

        checks.forEach((check) => {
            const tile = document.createElement("div");
            tile.classList.add("guess-tile");
            tile.textContent = check.val;

            if (check.type === 'exact') {
                if (check.val.toLowerCase() === check.target.toLowerCase()) {
                    tile.classList.add("correct");
                } else {
                    tile.classList.add("wrong");
                    allCorrect = false;
                }
            } else if (check.type === 'number') {
                if (Number(check.val) === Number(check.target)) {
                    tile.classList.add("correct");
                } else {
                    tile.classList.add("wrong");
                    tile.textContent += Number(check.val) < Number(check.target) ? " ⬆️" : " ⬇️";
                    allCorrect = false;
                }
            } else if (check.type === 'duration') {
                if (check.valSec === check.targetSec) {
                    tile.classList.add("correct");
                } else {
                    tile.classList.add("wrong");
                    tile.textContent += check.valSec < check.targetSec ? " ⬆️" : " ⬇️";
                    allCorrect = false;
                }
            } else if (check.type === 'production') {
                if (check.status === 'correct') {
                    tile.classList.add("correct");
                } else if (check.status === 'partial') {
                    tile.classList.add("partial");
                    allCorrect = false;
                } else {
                    tile.classList.add("wrong");
                    allCorrect = false;
                }
            } else if (check.type === 'plays') {
                if (check.rawVal === check.rawTarget) {
                    tile.classList.add("correct");
                } else {
                    tile.classList.add("wrong");
                    tile.textContent += check.rawVal < check.rawTarget ? " ⬆️" : " ⬇️";
                    allCorrect = false;
                }
            }

            row.appendChild(tile);
        });

        guessesGrid.prepend(row);
        messageBox.textContent = `Liczba prób: ${guessCount}. Skorzystaj z odblokowanych podpowiedzi poniżej w razie potrzeby.`;

        if (allCorrect) {
            if (isDaily) {
                localStorage.setItem(dailyKey, "true");
                if (inputSectionContainer) inputSectionContainer.style.display = "none";
            }
            triggerWin(guessCount);
        }
    }

    function triggerWin(count) {
        gameOver = true;
        modal.classList.remove("hidden");
        modalTitle.textContent = isDaily ? "Gratulacje! Zadanie ukończone" : "Brawo!";
        modalImgContainer.innerHTML = `<img src="${targetSong.zdj_alb}" class="modal-img" alt="">`;
        
        if (isDaily) {
            modalText.innerHTML = `Udało Ci się odgadnąć dzisiejszą piosenkę:<br><strong>"${targetSong.title}"</strong><br>po ${count} próbach! Wróć jutro po nowe wyzwanie.`;
            if (closeModalBtn) closeModalBtn.style.display = "inline-block";
            if (restartBtn) restartBtn.style.display = "none";
        } else {
            modalText.innerHTML = `Udało Ci się odgadnąć utwór:<br><strong>"${targetSong.title}"</strong><br>po ${count} próbach!`;
            if (closeModalBtn) closeModalBtn.style.display = "none";
            if (restartBtn) restartBtn.style.display = "inline-block";
        }
    }

    if (restartBtn) {
        restartBtn.addEventListener("click", () => location.reload());
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }
});
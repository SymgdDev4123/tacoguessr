const HintsManager = {
    initStandardHints(targetSong) {
        const hintYearBtn = document.getElementById("hint-year-btn");
        const hintAlbumBtn = document.getElementById("hint-album-btn");
        const hintDurationBtn = document.getElementById("hint-duration-btn");
        const messageBox = document.getElementById("message-box");

        if (hintYearBtn) {
            hintYearBtn.onclick = () => {
                messageBox.textContent = `💡 Podpowiedź (Rok): Utwór został wydany w roku ${targetSong.year}.`;
            };
        }
        if (hintAlbumBtn) {
            hintAlbumBtn.onclick = () => {
                messageBox.textContent = `💡 Podpowiedź (Album): Szukany utwór pochodzi z albumu "${targetSong.album}".`;
            };
        }
        if (hintDurationBtn) {
            hintDurationBtn.onclick = () => {
                const formattedDuration = formatDuration(targetSong.duration);
                messageBox.textContent = `💡 Podpowiedź (Czas): Szukany utwór trwa dokładnie ${formattedDuration}.`;
            };
        }
    },
    
    updateState(guessCount) {
        const hintYearBtn = document.getElementById("hint-year-btn");
        const hintAlbumBtn = document.getElementById("hint-album-btn");
        const hintDurationBtn = document.getElementById("hint-duration-btn");

        if (guessCount >= 5 && hintYearBtn) { hintYearBtn.classList.remove("locked"); hintYearBtn.removeAttribute("disabled"); }
        if (guessCount >= 8 && hintAlbumBtn) { hintAlbumBtn.classList.remove("locked"); hintAlbumBtn.removeAttribute("disabled"); }
        if (guessCount >= 13 && hintDurationBtn) { hintDurationBtn.classList.remove("locked"); hintDurationBtn.removeAttribute("disabled"); }
    }
};

function formatDuration(durationVal) {
    if (!durationVal) return "0:00";
    const str = String(durationVal).trim();
    if (str.includes(':')) return str;
    if (!isNaN(str)) {
        const numStr = str.padStart(4, '0');
        const minutes = numStr.substring(0, numStr.length - 3);
        const seconds = numStr.substring(numStr.length - 3);
        const minNum = parseInt(minutes, 10);
        const secNum = parseInt(seconds, 10);
        return `${minNum}:${secNum < 10 ? '0' + secNum : secNum}`;
    }
    return str;
}

function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const formatted = formatDuration(timeStr);
    const parts = formatted.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return parseInt(timeStr, 10) || 0;
}

function parsePlaysToNumber(playsStr) {
    if (!playsStr) return 0;
    const str = String(playsStr).toLowerCase().trim().replace(',', '.');
    let multiplier = 1;
    if (str.includes('mln')) multiplier = 1000000;
    else if (str.includes('tys')) multiplier = 1000;
    const cleanNum = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(cleanNum) ? 0 : Math.round(cleanNum * multiplier);
}

function formatPlays(num) {
    const n = Number(num);
    if (isNaN(n)) return num;
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace('.', ',') + 'mln';
    if (n >= 1000) return Math.round(n / 1000) + 'tys';
    return n.toString();
}

function checkProduction(guessedProd, targetProd) {
    if (!guessedProd || !targetProd) return { status: 'wrong' };
    const clean = s => s.toLowerCase().split(',').map(item => item.trim()).filter(Boolean);
    const gList = clean(guessedProd);
    const tList = clean(targetProd);

    if (guessedProd.toLowerCase().trim() === targetProd.toLowerCase().trim()) return { status: 'correct' };
    const intersection = gList.filter(p => tList.includes(p));
    if (intersection.length > 0) return { status: 'partial' };
    return { status: 'wrong' };
}
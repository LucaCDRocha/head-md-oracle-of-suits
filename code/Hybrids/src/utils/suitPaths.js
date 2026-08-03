/**
 * suitPaths.js
 * Single Source of Truth for all vector suit symbols.
 * Synchronous, high-DPI vector paths for 13 card suits.
 */

export function getCanonicalSuitKey(suitKey) {
    const key = (suitKey || "").toLowerCase().trim();
    if (key === '♠' || key === 'pique' || key === 'piques' || key === 'spades' || key === 'spade') return 'spades';
    if (key === '♥' || key === 'coeur' || key === 'cœur' || key === 'coeurs' || key === 'cœurs' || key === 'hearts' || key === 'heart') return 'hearts';
    if (key === '♦' || key === 'carreau' || key === 'carreaux' || key === 'diamonds' || key === 'diamond') return 'diamonds';
    if (key === '♣' || key === 'trefle' || key === 'trèfle' || key === 'trefles' || key === 'trèfles' || key === 'club' || key === 'clubs') return 'clubs';
    if (key === 'épée' || key === 'épées' || key === 'epee' || key === 'epees' || key === 'sword' || key === 'swords') return 'swords';
    if (key === 'coupe' || key === 'coupes' || key === 'cup' || key === 'cups') return 'cups';
    if (key === 'denier' || key === 'deniers' || key === 'pentacle' || key === 'pentacles' || key === 'coin' || key === 'coins') return 'coins';
    if (key === 'baton' || key === 'batons' || key === 'bâton' || key === 'bâtons' || key === 'wand' || key === 'wands' || key === 'staves' || key === 'rods') return 'wands';
    if (key === 'bouclier' || key === 'boucliers' || key === 'shield' || key === 'shields') return 'shields';
    if (key === 'gland' || key === 'glands' || key === 'eichel' || key === 'acorn' || key === 'acorns') return 'acorns';
    if (key === 'grelot' || key === 'grelots' || key === 'schellen' || key === 'bell' || key === 'bells') return 'bells';
    if (key === 'rose' || key === 'rosen' || key === 'roses') return 'roses';
    if (key === 'feuille' || key === 'feuilles' || key === 'laub' || key === 'leaf' || key === 'leaves') return 'leaves';
    return key;
}

export function getSuitPath2D() {
    return null;
}

export const SUIT_VECTOR_PATHS = {
    // ♠ Spades
    spades: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.45);
        ctx.bezierCurveTo(s * 0.15, -s * 0.20, s * 0.48, 0, s * 0.48, s * 0.22);
        ctx.bezierCurveTo(s * 0.48, s * 0.38, s * 0.30, s * 0.45, s * 0.12, s * 0.36);
        ctx.bezierCurveTo(s * 0.06, s * 0.33, s * 0.02, s * 0.28, 0, s * 0.26);
        ctx.bezierCurveTo(-s * 0.02, s * 0.28, -s * 0.06, s * 0.33, -s * 0.12, s * 0.36);
        ctx.bezierCurveTo(-s * 0.30, s * 0.45, -s * 0.48, s * 0.38, -s * 0.48, s * 0.22);
        ctx.bezierCurveTo(-s * 0.48, 0, -s * 0.15, -s * 0.20, 0, -s * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.04, s * 0.20);
        ctx.bezierCurveTo(-s * 0.04, s * 0.35, -s * 0.20, s * 0.46, -s * 0.24, s * 0.48);
        ctx.lineTo(s * 0.24, s * 0.48);
        ctx.bezierCurveTo(s * 0.20, s * 0.46, s * 0.04, s * 0.35, s * 0.04, s * 0.20);
        ctx.closePath();
        ctx.fill();
    },

    // ♥ Hearts
    hearts: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(0, s * 0.45);
        ctx.bezierCurveTo(-s * 0.02, s * 0.42, -s * 0.48, s * 0.12, -s * 0.48, -s * 0.18);
        ctx.bezierCurveTo(-s * 0.48, -s * 0.38, -s * 0.28, -s * 0.48, -s * 0.08, -s * 0.42);
        ctx.bezierCurveTo(-s * 0.02, -s * 0.40, 0, -s * 0.32, 0, -s * 0.32);
        ctx.bezierCurveTo(0, -s * 0.32, s * 0.02, -s * 0.40, s * 0.08, -s * 0.42);
        ctx.bezierCurveTo(s * 0.28, -s * 0.48, s * 0.48, -s * 0.38, s * 0.48, -s * 0.18);
        ctx.bezierCurveTo(s * 0.48, s * 0.12, s * 0.02, s * 0.42, 0, s * 0.45);
        ctx.closePath();
        ctx.fill();
    },

    // ♦ Diamonds
    diamonds: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.48);
        ctx.lineTo(s * 0.38, 0);
        ctx.lineTo(0, s * 0.48);
        ctx.lineTo(-s * 0.38, 0);
        ctx.closePath();
        ctx.fill();
    },

    // ♣ Clubs
    clubs: (ctx, s) => {
        ctx.beginPath(); ctx.arc(0, -s * 0.22, s * 0.20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-s * 0.22, s * 0.10, s * 0.20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.22, s * 0.10, s * 0.20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2); ctx.fill(); // Solid center fill
        ctx.beginPath();
        ctx.moveTo(-s * 0.04, s * 0.10);
        ctx.bezierCurveTo(-s * 0.04, s * 0.32, -s * 0.22, s * 0.45, -s * 0.24, s * 0.48);
        ctx.lineTo(s * 0.24, s * 0.48);
        ctx.bezierCurveTo(s * 0.22, s * 0.45, s * 0.04, s * 0.32, s * 0.04, s * 0.10);
        ctx.closePath();
        ctx.fill();
    },

    // ⚔ Swords
    swords: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.48);
        ctx.lineTo(s * 0.10, -s * 0.25);
        ctx.lineTo(s * 0.09, s * 0.20);
        ctx.lineTo(s * 0.30, s * 0.20);
        ctx.lineTo(s * 0.30, s * 0.27);
        ctx.lineTo(s * 0.07, s * 0.27);
        ctx.lineTo(s * 0.06, s * 0.42);
        ctx.arc(0, s * 0.46, s * 0.07, 0, Math.PI * 2);
        ctx.lineTo(-s * 0.06, s * 0.42);
        ctx.lineTo(-s * 0.07, s * 0.27);
        ctx.lineTo(-s * 0.30, s * 0.27);
        ctx.lineTo(-s * 0.30, s * 0.20);
        ctx.lineTo(-s * 0.09, s * 0.20);
        ctx.lineTo(-s * 0.10, -s * 0.25);
        ctx.closePath();
        ctx.fill();
    },

    // 🏆 Cups
    cups: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(-s * 0.36, -s * 0.42);
        ctx.lineTo(s * 0.36, -s * 0.42);
        ctx.bezierCurveTo(s * 0.34, -s * 0.10, s * 0.20, s * 0.10, s * 0.08, s * 0.15);
        ctx.lineTo(s * 0.08, s * 0.28);
        ctx.lineTo(s * 0.28, s * 0.42);
        ctx.lineTo(s * 0.28, s * 0.48);
        ctx.lineTo(-s * 0.28, s * 0.48);
        ctx.lineTo(-s * 0.28, s * 0.42);
        ctx.lineTo(-s * 0.08, s * 0.28);
        ctx.lineTo(-s * 0.08, s * 0.15);
        ctx.bezierCurveTo(-s * 0.20, s * 0.10, -s * 0.34, -s * 0.10, -s * 0.36, -s * 0.42);
        ctx.closePath();
        ctx.fill();
    },

    // 🪙 Coins
    coins: (ctx, s) => {
        ctx.beginPath(); ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.fillStyle = '#F4F0E8';
        ctx.beginPath(); ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ctx.strokeStyle || '#2B2B2B';
        const rOuter = s * 0.26;
        const rInner = s * 0.11;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = (i % 2 === 0) ? rOuter : rInner;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    // 🦯 Wands
    wands: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(-s * 0.09, -s * 0.46);
        ctx.bezierCurveTo(s * 0.08, -s * 0.20, -s * 0.06, s * 0.10, s * 0.08, s * 0.46);
        ctx.lineTo(s * 0.18, s * 0.46);
        ctx.bezierCurveTo(s * 0.04, s * 0.10, s * 0.18, -s * 0.20, s * 0.01, -s * 0.46);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.04, -s * 0.35);
        ctx.bezierCurveTo(s * 0.28, -s * 0.42, s * 0.38, -s * 0.25, s * 0.22, -s * 0.20);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.03, -s * 0.15);
        ctx.bezierCurveTo(-s * 0.28, -s * 0.22, -s * 0.38, -s * 0.05, -s * 0.22, 0);
        ctx.closePath();
        ctx.fill();
    },

    // 🛡 Shields
    shields: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(-s * 0.38, -s * 0.44);
        ctx.lineTo(s * 0.38, -s * 0.44);
        ctx.bezierCurveTo(s * 0.40, -s * 0.10, s * 0.36, s * 0.20, 0, s * 0.48);
        ctx.bezierCurveTo(-s * 0.36, s * 0.20, -s * 0.40, -s * 0.10, -s * 0.38, -s * 0.44);
        ctx.closePath();
        ctx.fill();
    },

    // 🌰 Acorns
    acorns: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(-s * 0.32, -s * 0.24);
        ctx.lineTo(s * 0.32, -s * 0.24);
        ctx.bezierCurveTo(s * 0.34, -s * 0.10, s * 0.28, 0, 0, 0);
        ctx.bezierCurveTo(-s * 0.28, 0, -s * 0.34, -s * 0.10, -s * 0.32, -s * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.rect(-s * 0.04, -s * 0.48, s * 0.08, s * 0.24);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.28, 0);
        ctx.bezierCurveTo(-s * 0.32, s * 0.20, -s * 0.20, s * 0.42, 0, s * 0.48);
        ctx.bezierCurveTo(s * 0.20, s * 0.42, s * 0.32, s * 0.20, s * 0.28, 0);
        ctx.closePath();
        ctx.fill();
    },

    // 🔔 Bells
    bells: (ctx, s) => {
        ctx.beginPath(); ctx.arc(0, -s * 0.34, s * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, s * 0.08, s * 0.38, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.fillStyle = '#F4F0E8';
        ctx.beginPath(); ctx.rect(-s * 0.28, s * 0.08, s * 0.56, s * 0.08); ctx.fill();
        ctx.restore();
    },

    // 🌹 Roses
    roses: (ctx, s) => {
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const px = s * 0.22 * Math.cos(angle);
            const py = s * 0.22 * Math.sin(angle);
            ctx.beginPath();
            ctx.arc(px, py, s * 0.18, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.save();
        ctx.fillStyle = '#F4F0E8';
        ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    },

    // 🍃 Leaves
    leaves: (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.48);
        ctx.bezierCurveTo(s * 0.30, -s * 0.30, s * 0.42, -s * 0.05, s * 0.24, s * 0.25);
        ctx.bezierCurveTo(s * 0.15, s * 0.38, s * 0.04, s * 0.44, 0, s * 0.48);
        ctx.bezierCurveTo(-s * 0.04, s * 0.44, -s * 0.15, s * 0.38, -s * 0.24, s * 0.25);
        ctx.bezierCurveTo(-s * 0.42, -s * 0.05, -s * 0.30, -s * 0.30, 0, -s * 0.48);
        ctx.closePath();
        ctx.fill();
    }
};

export function drawSuitSymbol(ctx, suitKey, x, y, size = 44, color = '#2B2B2B') {
    const canonicalKey = getCanonicalSuitKey(suitKey);
    const drawFn = SUIT_VECTOR_PATHS[canonicalKey];

    if (drawFn) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        drawFn(ctx, size);
        ctx.restore();
    } else {
        ctx.save();
        ctx.font = `${size * 0.8}px "Segoe UI Symbol", "Apple Color Emoji", "Nippo", "Times New Roman", serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(suitKey, x, y);
        ctx.restore();
    }
}

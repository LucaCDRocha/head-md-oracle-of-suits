
/**
 * cardCanvas.js
 * Programmatic Canvas compositing for playing cards and tarot cards.
 * - Playing Cards: Smooth rounded 8-point notched inner frame with Top-Left and 180° rotated Bottom-Right index cutouts.
 * - Tarot Cards: Standard rounded rectangle frame with NO corner notches.
 * - Image Rendering: 1.08x subtle zoom-in to eliminate raw image edges.
 */

import { drawSuitSymbol, getCanonicalSuitKey, getSuitPath2D, CARD_COLORS } from "./suitPaths.js";

function drawVintageCard(ctx, artworkImage, rank, suit, suitColor = CARD_COLORS.BLACK, tarotName = '', cardType = 'playing_card', tarotNumber = '') {
    const cardW = 1200;
    const cardH = 1600;

    // 1. Draw Cream/Vintage Card Background with Rounded Card Outer Edges
    const cardRadius = 32;
    ctx.save();
    ctx.fillStyle = CARD_COLORS.CREAM; // Vintage card stock color
    ctx.beginPath();
    ctx.roundRect(0, 0, cardW, cardH, cardRadius);
    ctx.fill();
    ctx.restore();
    const isPlayingCard = cardType === 'playing_card' && (rank || suit);
    const rankUpper = (rank || '').toUpperCase().trim();
    const isJoker = rankUpper.includes('JOKER');

    // Frame Dimensions & Notch Sizes
    const margin = 72;
    const frameX = margin;
    const frameY = margin;
    const frameW = cardW - (margin * 2);
    const frameH = cardH - (margin * 2);
    const nw = 125; // Notch width
    const nh = isJoker ? 530 : 215; // Expanded notch height ONLY for JOKER; standard 215px notch for all other cards
    const r = 20;  // Corner rounding radius

    // 2. Create Inner Frame Path
    let framePath = new Path2D();

    if (isPlayingCard) {
        // Smooth Rounded 8-Point Notched Path for Playing Cards
        framePath.moveTo(frameX + nw + r, frameY);
        framePath.arcTo(frameX + frameW, frameY, frameX + frameW, frameY + r, r);
        framePath.arcTo(frameX + frameW, frameY + frameH - nh, frameX + frameW - r, frameY + frameH - nh, r);
        framePath.arcTo(frameX + frameW - nw, frameY + frameH - nh, frameX + frameW - nw, frameY + frameH - nh + r, r);
        framePath.arcTo(frameX + frameW - nw, frameY + frameH, frameX + frameW - nw - r, frameY + frameH, r);
        framePath.arcTo(frameX, frameY + frameH, frameX, frameY + frameH - r, r);
        framePath.arcTo(frameX, frameY + nh, frameX + r, frameY + nh, r);
        framePath.arcTo(frameX + nw, frameY + nh, frameX + nw, frameY + nh - r, r);
        framePath.arcTo(frameX + nw, frameY, frameX + nw + r, frameY, r);
        framePath.closePath();
    } else {
        // Standard Rounded Rectangle Frame for Tarot Cards (No Corner Cutouts)
        framePath.roundRect(frameX, frameY, frameW, frameH, r);
    }

    // 3. Clip and Draw AI Artwork with 1.08x Zoom-In (eliminates raw image edge artifacts)
    ctx.save();
    ctx.clip(framePath);

    const zoomFactor = 1.08;
    const drawW = frameW * zoomFactor;
    const drawH = frameH * zoomFactor;
    const drawX = frameX - (drawW - frameW) / 2;
    const drawY = frameY - (drawH - frameH) / 2;

    ctx.drawImage(artworkImage, drawX, drawY, drawW, drawH);
    ctx.restore();

    // 4. Draw Inner Frame Border Line
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = CARD_COLORS.BLACK; // Dark ink line
    ctx.stroke(framePath);
    ctx.restore();

    // 5. Render Dynamic Typography using Nippo font & custom vector suit symbols
    if (isPlayingCard) {
        ctx.fillStyle = suitColor;

        if (isJoker) {
            // Joker Layout: Aligned directly to top and left outer notch border lines
            const jokerLetters = ['J', 'O', 'K', 'E', 'R'];
            const jokerFontSize = 95;
            const letterSpacing = 95;

            ctx.font = `bold ${jokerFontSize}px "Nippo", "Times New Roman", serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Top-Left Index 
            const jx = frameX; 
            const startY = frameY; 

            for (let i = 0; i < jokerLetters.length; i++) {
                ctx.fillText(jokerLetters[i], jx, startY + (i * letterSpacing));
            }

            // Bottom-Right Rotated Index (180° rotated point-reflection)
            ctx.save();
            ctx.translate(frameX + frameW, frameY + frameH);
            ctx.rotate(Math.PI);

            const rotJx = 0; 
            const rotStartY = 0; 

            for (let i = 0; i < jokerLetters.length; i++) {
                ctx.fillText(jokerLetters[i], rotJx, rotStartY + (i * letterSpacing));
            }
            ctx.restore();
        } else {
            const fontRankSize = 95;
            const fontSuitSize = 65;
            const lineSpacing = 6;
            const edgeOffset = 50; // Distance from suit symbol to inner artwork border lines

            if (suit) {
                // Top-Left Index: Center rank horizontally with suit symbol center
                const suitX = frameX + nw - edgeOffset - (fontSuitSize / 2);
                const suitY = rank ? (frameY + nh - edgeOffset - (fontSuitSize / 2)) : (frameY + (nh / 2));

                if (rank) {
                    const rankX = suitX; // Centered with suit symbol
                    const rankY = suitY - (fontSuitSize / 2) - lineSpacing - fontRankSize;

                    ctx.font = `bold ${fontRankSize}px "Nippo", "Times New Roman", serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(rank, rankX, rankY);
                }

                drawSuitSymbol(ctx, suit, suitX, suitY, fontSuitSize, suitColor);

                // Bottom-Right Rotated Index (180° rotated relative to frameX + frameW, frameY + frameH)
                ctx.save();
                ctx.translate(frameX + frameW, frameY + frameH);
                ctx.rotate(Math.PI);

                const rotSuitX = nw - edgeOffset - (fontSuitSize / 2);
                const rotSuitY = rank ? (nh - edgeOffset - (fontSuitSize / 2)) : (nh / 2);

                if (rank) {
                    const rotRankX = rotSuitX; // Centered with rotated suit symbol
                    const rotRankY = rotSuitY - (fontSuitSize / 2) - lineSpacing - fontRankSize;

                    ctx.font = `bold ${fontRankSize}px "Nippo", "Times New Roman", serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(rank, rotRankX, rotRankY);
                }

                drawSuitSymbol(ctx, suit, rotSuitX, rotSuitY, fontSuitSize, suitColor);
                ctx.restore();
            } else {
                // No Suit Symbol: Center Rank horizontally inside cutout box
                const rankX = frameX + (nw / 2) - 10;
                const rankY = frameY + (nh / 2) - (fontRankSize / 2);

                ctx.font = `bold ${fontRankSize + 12}px "Nippo", "Times New Roman", serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(rank, rankX, rankY);

                // Draw Bottom-Right Rotated Index
                ctx.save();
                ctx.translate(frameX + frameW, frameY + frameH);
                ctx.rotate(Math.PI);

                const rotRankX = (nw / 2) - 10;
                const rotRankY = (nh / 2) - (fontRankSize / 2);

                ctx.font = `bold ${fontRankSize + 12}px "Nippo", "Times New Roman", serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(rank, rotRankX, rotRankY);
                ctx.restore();
            }
        }
    } else if (cardType === 'tarot' || tarotName || tarotNumber) {
        // Draw Tarot Number Banner on Top Margin (centered)
        if (tarotNumber) {
            ctx.save();
            ctx.font = 'bold 38px "Nippo", "Cinzel", "Times New Roman", serif';
            const numText = tarotNumber.toUpperCase();
            const textMetrics = ctx.measureText(numText);
            const numBannerW = Math.max(130, textMetrics.width + 52);
            const numBannerH = 64;
            const numBannerX = (cardW - numBannerW) / 2;
            const numBannerY = frameY - (numBannerH / 2);

            ctx.fillStyle = CARD_COLORS.CREAM;
            ctx.beginPath();
            ctx.roundRect(numBannerX, numBannerY, numBannerW, numBannerH, 14);
            ctx.fill();
            ctx.strokeStyle = CARD_COLORS.BLACK;
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.fillStyle = CARD_COLORS.BLACK;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(numText, cardW / 2, numBannerY + (numBannerH / 2));
            ctx.restore();
        }

        // Draw Tarot Title Banner on Bottom Margin (centered, name ONLY without number)
        if (tarotName) {
            ctx.save();
            ctx.fillStyle = CARD_COLORS.CREAM;
            const bannerW = Math.min(840, frameW - 40);
            const bannerH = 76;
            const bannerX = (cardW - bannerW) / 2;
            const bannerY = frameY + frameH - (bannerH / 2);

            ctx.beginPath();
            ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
            ctx.fill();
            ctx.strokeStyle = CARD_COLORS.BLACK;
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.fillStyle = CARD_COLORS.BLACK;
            ctx.font = 'bold 40px "Nippo", "Cinzel", "Times New Roman", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tarotName.toUpperCase(), cardW / 2, bannerY + (bannerH / 2));
            ctx.restore();
        }
    }
}

export async function compositeCardCanvas(rawBase64, typographyInfo = {}) {
	if (!rawBase64) return rawBase64;

	const { cardType = 'playing_card', rank = '', suit = '', tarotName = '', tarotNumber = '' } = typographyInfo;
	const canonicalKey = getCanonicalSuitKey(suit);

	// Preload suit SVG Path2D from assets/suits/*.svg
	await getSuitPath2D(canonicalKey);

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = 1200;
				canvas.height = 1600;
				const ctx = canvas.getContext("2d");

				const suitClean = (suit || "").trim();
				const isRed = suitClean === "♥" || suitClean === "♦" || suitClean.toLowerCase().includes("heart") || suitClean.toLowerCase().includes("diamond") || suitClean.toLowerCase().includes("cœur") || suitClean.toLowerCase().includes("carreau") || canonicalKey === "hearts" || canonicalKey === "diamonds" || canonicalKey === "roses";
				const suitColor = isRed ? CARD_COLORS.RED : CARD_COLORS.BLACK;

				drawVintageCard(ctx, img, rank, suitClean, suitColor, tarotName, cardType, tarotNumber);

				const dataUrl = canvas.toDataURL("image/png");
				const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
				resolve(base64);
			} catch (err) {
				console.warn("Canvas compositing error, falling back to raw base64:", err);
				const cleanBase64 = rawBase64.includes(",") ? rawBase64.split(",")[1] : rawBase64;
				resolve(cleanBase64);
			}
		};

		img.onerror = (err) => {
			console.warn("Image load error for canvas compositing, falling back to raw base64:", err);
			const cleanBase64 = rawBase64.includes(",") ? rawBase64.split(",")[1] : rawBase64;
			resolve(cleanBase64);
		};

		img.src = rawBase64.startsWith("data:") ? rawBase64 : "data:image/png;base64," + rawBase64;
	});
}

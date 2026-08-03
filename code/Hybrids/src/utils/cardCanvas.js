
/**
 * cardCanvas.js
 * Programmatic Canvas compositing for playing cards and tarot cards.
 * - Playing Cards: Smooth rounded 8-point notched inner frame with Top-Left and 180° rotated Bottom-Right index cutouts.
 * - Tarot Cards: Standard rounded rectangle frame with NO corner notches.
 * - Image Rendering: 1.08x subtle zoom-in to eliminate raw image edges.
 */

import { drawSuitSymbol, getCanonicalSuitKey, getSuitPath2D } from "./suitPaths.js";

function drawVintageCard(ctx, artworkImage, rank, suit, suitColor = '#2B2B2B', tarotName = '', cardType = 'playing_card', tarotNumber = '') {
    const cardW = 1200;
    const cardH = 1600;

    // 1. Draw Cream/Vintage Card Background with Rounded Card Outer Edges
    const cardRadius = 32;
    ctx.save();
    ctx.fillStyle = '#F4F0E8'; // Vintage card stock color
    ctx.beginPath();
    ctx.roundRect(0, 0, cardW, cardH, cardRadius);
    ctx.fill();
    ctx.restore();

    // Frame Dimensions & Notch Sizes
    const margin = 72;
    const frameX = margin;
    const frameY = margin;
    const frameW = cardW - (margin * 2);
    const frameH = cardH - (margin * 2);
    const nw = 125; // Notch width
    const nh = 215; // Notch height
    const r = 20;  // Corner rounding radius

    const isPlayingCard = cardType === 'playing_card' && (rank || suit);

    // 2. Create Inner Frame Path
    let framePath = new Path2D();

    if (isPlayingCard) {
        // Smooth Rounded 8-Point Notched Path for Playing Cards
        framePath.moveTo(frameX + nw + r, frameY);

        // Top Edge -> Top-Right Outer Corner
        framePath.arcTo(frameX + frameW, frameY, frameX + frameW, frameY + r, r);

        // Right Edge -> Bottom-Right Notch Outer Step-In Corner
        framePath.arcTo(frameX + frameW, frameY + frameH - nh, frameX + frameW - r, frameY + frameH - nh, r);

        // Bottom-Right Notch -> Inner Corner -> Step-Down
        framePath.arcTo(frameX + frameW - nw, frameY + frameH - nh, frameX + frameW - nw, frameY + frameH - nh + r, r);

        // Bottom-Right Notch -> Bottom Edge Outer Corner
        framePath.arcTo(frameX + frameW - nw, frameY + frameH, frameX + frameW - nw - r, frameY + frameH, r);

        // Bottom Edge -> Bottom-Left Outer Corner
        framePath.arcTo(frameX, frameY + frameH, frameX, frameY + frameH - r, r);

        // Left Edge -> Top-Left Notch Outer Step-In Corner
        framePath.arcTo(frameX, frameY + nh, frameX + r, frameY + nh, r);

        // Top-Left Notch -> Inner Corner -> Step-Up
        framePath.arcTo(frameX + nw, frameY + nh, frameX + nw, frameY + nh - r, r);

        // Top-Left Notch -> Top Edge Outer Corner
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
    ctx.strokeStyle = '#2B2B2B'; // Dark ink line
    ctx.stroke(framePath);
    ctx.restore();

    // 5. Render Dynamic Typography using Nippo font & custom vector suit symbols
    if (isPlayingCard) {
        ctx.fillStyle = suitColor;

        const fontRankSize = 95;
        const fontSuitSize = 65;
        const lineSpacing = 6;
        const edgeOffset = 50; // Distance from suit symbol to inner artwork border lines

        if (suit) {
            // Top-Left Index (relative to frameX, frameY)
            const suitX = frameX + nw - edgeOffset - (fontSuitSize / 2);
            const suitY = frameY + nh - edgeOffset - (fontSuitSize / 2);

            const rankX = frameX + nw - edgeOffset;
            const rankY = suitY - (fontSuitSize / 2) - lineSpacing - fontRankSize;

            ctx.font = `bold ${fontRankSize}px "Nippo", "Times New Roman", serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, rankX, rankY);

            drawSuitSymbol(ctx, suit, suitX, suitY, fontSuitSize, suitColor);

            // Bottom-Right Rotated Index (180° rotated relative to frameX + frameW, frameY + frameH)
            ctx.save();
            ctx.translate(frameX + frameW, frameY + frameH);
            ctx.rotate(Math.PI);

            const rotSuitX = nw - edgeOffset - (fontSuitSize / 2);
            const rotSuitY = nh - edgeOffset - (fontSuitSize / 2);

            const rotRankX = nw - edgeOffset;
            const rotRankY = rotSuitY - (fontSuitSize / 2) - lineSpacing - fontRankSize;

            ctx.font = `bold ${fontRankSize}px "Nippo", "Times New Roman", serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, rotRankX, rotRankY);

            drawSuitSymbol(ctx, suit, rotSuitX, rotSuitY, fontSuitSize, suitColor);
            ctx.restore();
            ctx.restore();
        } else {
            // No Suit Symbol: Center Rank inside cutout box using Nippo font
            ctx.font = `bold ${fontRankSize + 12}px "Nippo", "Times New Roman", serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, frameX + paddingX, frameY + paddingY);

            // Draw Bottom-Right Rotated Index
            ctx.save();
            ctx.translate(frameX + frameW, frameY + frameH);
            ctx.rotate(Math.PI);
            ctx.font = `bold ${fontRankSize + 12}px "Nippo", "Times New Roman", serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, paddingX, paddingY);
            ctx.restore();
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

            ctx.fillStyle = '#F4F0E8';
            ctx.beginPath();
            ctx.roundRect(numBannerX, numBannerY, numBannerW, numBannerH, 14);
            ctx.fill();
            ctx.strokeStyle = '#2B2B2B';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#2B2B2B';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(numText, cardW / 2, numBannerY + (numBannerH / 2));
            ctx.restore();
        }

        // Draw Tarot Title Banner on Bottom Margin (centered, name ONLY without number)
        if (tarotName) {
            ctx.save();
            ctx.fillStyle = '#F4F0E8';
            const bannerW = Math.min(840, frameW - 40);
            const bannerH = 76;
            const bannerX = (cardW - bannerW) / 2;
            const bannerY = frameY + frameH - (bannerH / 2);

            ctx.beginPath();
            ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
            ctx.fill();
            ctx.strokeStyle = '#2B2B2B';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#2B2B2B';
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
				const suitColor = isRed ? "#C81E1E" : "#2B2B2B";

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

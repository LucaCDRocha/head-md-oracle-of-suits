/**
 * cardCanvas.js
 * Programmatic Canvas compositing for playing cards and tarot cards.
 * - Playing Cards: Smooth rounded 8-point notched inner frame with Top-Left and 180° rotated Bottom-Right index cutouts.
 * - Tarot Cards: Standard rounded rectangle frame with NO corner notches.
 * - Typography: Centered vertically in cutout box if suit symbol is absent.
 * - Image Rendering: 1.08x subtle zoom-in to eliminate raw image edges.
 */

function drawVintageCard(ctx, artworkImage, rank, suit, suitColor = '#2B2B2B', tarotName = '', cardType = 'playing_card') {
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

    // Frame Dimensions & Notch Sizes (Adjusted to accommodate larger Nippo typography)
    const margin = 80;
    const frameX = margin;
    const frameY = margin;
    const frameW = cardW - (margin * 2);
    const frameH = cardH - (margin * 2);
    const nw = 140; // Enlarged Notch width
    const nh = 180; // Enlarged Notch height
    const r = 24;  // Corner rounding radius

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

    // 5. Render Dynamic Typography using enlarged Nippo font
    if (isPlayingCard) {
        ctx.fillStyle = suitColor;
        ctx.textAlign = 'center';

        const fontRankSize = 92;
        const fontSuitSize = 72;
        const lineSpacing = 8;
        const totalHeight = fontRankSize + lineSpacing + fontSuitSize;

        if (suit) {
            // Calculate Top-Left Notch centered block Y start
            const blockCenterY = frameY + (nh / 2);
            const rankY = blockCenterY - (totalHeight / 2);
            const suitY = rankY + fontRankSize + lineSpacing;

            // Draw Top-Left Index (Rank + Suit centered together in Nippo)
            ctx.font = `bold ${fontRankSize}px "Nippo", "Times New Roman", serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(rank, frameX + (nw / 2), rankY);

            ctx.font = `${fontSuitSize}px "Segoe UI Symbol", "Apple Color Emoji", "Nippo", "Times New Roman", serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(suit, frameX + (nw / 2), suitY);

            // Draw Bottom-Right Rotated Index (Rank + Suit centered together in Nippo)
            ctx.save();
            ctx.translate(frameX + frameW - (nw / 2), frameY + frameH - (nh / 2));
            ctx.rotate(Math.PI);
            
            ctx.font = `bold ${fontRankSize}px "Nippo", "Times New Roman", serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(rank, 0, -(totalHeight / 2));

            ctx.font = `${fontSuitSize}px "Segoe UI Symbol", "Apple Color Emoji", "Nippo", "Times New Roman", serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(suit, 0, -(totalHeight / 2) + fontRankSize + lineSpacing);
            ctx.restore();
        } else {
            // No Suit Symbol: Center Rank vertically inside the enlarged cutout box using Nippo font
            ctx.font = `bold ${fontRankSize + 12}px "Nippo", "Times New Roman", serif`;
            ctx.textBaseline = 'middle';
            ctx.fillText(rank, frameX + (nw / 2), frameY + (nh / 2));

            // Draw Bottom-Right Rotated Index (centered vertically in Nippo)
            ctx.save();
            ctx.translate(frameX + frameW - (nw / 2), frameY + frameH - (nh / 2));
            ctx.rotate(Math.PI);
            ctx.font = `bold ${fontRankSize + 12}px "Nippo", "Times New Roman", serif`;
            ctx.textBaseline = 'middle';
            ctx.fillText(rank, 0, 0);
            ctx.restore();
        }
    } else if (tarotName) {
        // Draw Tarot Title Banner on Bottom Margin using Nippo font
        ctx.save();
        ctx.fillStyle = '#F4F0E8';
        const bannerW = Math.min(800, frameW - 40);
        const bannerH = 76;
        const bannerX = (cardW - bannerW) / 2;
        const bannerY = frameY + frameH - bannerH / 2;

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
        ctx.fillText(tarotName.toUpperCase(), cardW / 2, bannerY + bannerH / 2);
        ctx.restore();
    }
}

export async function compositeCardCanvas(rawBase64, typographyInfo = {}) {
	if (!rawBase64) return rawBase64;

	const { cardType = 'playing_card', rank = '', suit = '', tarotName = '' } = typographyInfo;

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
				const isRed = suitClean === "♥" || suitClean === "♦" || suitClean.toLowerCase().includes("heart") || suitClean.toLowerCase().includes("diamond") || suitClean.toLowerCase().includes("cœur") || suitClean.toLowerCase().includes("carreau");
				const suitColor = isRed ? "#C81E1E" : "#2B2B2B";

				drawVintageCard(ctx, img, rank, suitClean, suitColor, tarotName, cardType);

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

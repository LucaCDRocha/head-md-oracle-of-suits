/**
 * canvasComposition.js - Canvas blending collage for slot selector preview
 */

/**
 * Draw collage preview of selected cards
 * @param {Object} p5Instance - p5.js instance
 * @param {Array} selectedCards - Array of selected cards (must have loaded image properties)
 */
export function drawPreview(p5Instance, selectedCards) {
	p5Instance.background(200);

	if (selectedCards.length === 3) {
		const imgs = selectedCards.map((c) => c.img).filter((img) => img && img.width > 0);

		if (imgs.length === 3) {
			p5Instance.push();
			p5Instance.blendMode(p5Instance.BLEND);
			p5Instance.image(imgs[0], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.tint(255, 200);
			p5Instance.image(imgs[1], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.tint(255, 160);
			p5Instance.image(imgs[2], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.noTint();

			p5Instance.fill(255);
			p5Instance.stroke(0);
			p5Instance.strokeWeight(2);
			p5Instance.textSize(24);
			p5Instance.textAlign(p5Instance.CENTER, p5Instance.BOTTOM);
			p5Instance.text("HYBRID", p5Instance.width / 2, p5Instance.height - 10);
			p5Instance.pop();
		}
	}
}

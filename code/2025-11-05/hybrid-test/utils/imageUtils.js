// Image compression and manipulation utilities

/**
 * Compress image to be under max size
 * @param {string} base64Data - Base64 encoded image data
 * @param {number} maxSizeKB - Maximum size in kilobytes (default 10MB)
 * @returns {Promise<string>} Compressed base64 image data
 */
export async function compressImage(base64Data, maxSizeKB = 10000) {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			let width = img.width;
			let height = img.height;

			// Calculate initial file size
			const initialSize = Math.round((base64Data.length * 3) / 4 / 1024);
			console.log(`Initial image size: ${initialSize} KB`);

			// If already under limit, return as is
			if (initialSize <= maxSizeKB) {
				resolve(base64Data);
				return;
			}

			// Scale down image to reduce size (more conservative scaling)
			const scaleFactor = Math.sqrt(maxSizeKB / initialSize) * 0.95;
			width = Math.floor(width * scaleFactor);
			height = Math.floor(height * scaleFactor);

			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, width, height);

			// Start with higher quality to preserve image quality
			let quality = 0.95;
			let compressed = canvas.toDataURL("image/jpeg", quality).split(",")[1];
			let compressedSize = Math.round((compressed.length * 3) / 4 / 1024);

			while (compressedSize > maxSizeKB && quality > 0.5) {
				quality -= 0.05;
				compressed = canvas.toDataURL("image/jpeg", quality).split(",")[1];
				compressedSize = Math.round((compressed.length * 3) / 4 / 1024);
			}

			console.log(
				`Compressed image size: ${compressedSize} KB (quality: ${quality.toFixed(
					2
				)}, dimensions: ${width}x${height})`
			);
			resolve(compressed);
		};
		img.src = "data:image/png;base64," + base64Data;
	});
}

/**
 * Ensure all images in the selected array are loaded
 * @param {Array} selected - Array of selected card objects
 * @returns {Promise<void>}
 */
export function ensureImagesLoaded(selected) {
	return new Promise((resolve) => {
		const checks = selected.map(
			(s) =>
				new Promise((res) => {
					const check = () => {
						if (s.img && s.img.width > 0) return res();
						setTimeout(check, 100);
					};
					check();
				})
		);
		Promise.all(checks).then(resolve);
	});
}

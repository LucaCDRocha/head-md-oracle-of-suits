/**
 * Sound Effects Manager
 * Plays audio files for card creation events
 */

class SoundEffects {
	constructor() {
		this.launchSound = null;
		this.successSound = null;
		this.initialized = false;
	}

	/**
	 * Initialize the audio files (preload)
	 */
	init() {
		if (this.initialized) return;

		try {
			// Preload launch sound
			this.launchSound = new Audio("assets/sounds/Hybrids-Launch.mp3");
			this.launchSound.volume = 0.7;
			this.launchSound.preload = "auto";

			// Preload success sound
			this.successSound = new Audio("assets/sounds/Hybrids-Success.mp3");
			this.successSound.volume = 0.7;
			this.successSound.preload = "auto";

			this.initialized = true;
			console.log("Sound effects initialized");
		} catch (error) {
			console.error("Failed to initialize audio files:", error);
		}
	}

	/**
	 * Play the "Launch" sound when button is clicked
	 */
	playStartSound() {
		if (!this.initialized) this.init();
		if (!this.launchSound) return;

		try {
			// Reset to beginning if already playing
			this.launchSound.currentTime = 0;
			this.launchSound.play().catch((error) => {
				console.error("Failed to play launch sound:", error);
			});
		} catch (error) {
			console.error("Error playing launch sound:", error);
		}
	}

	/**
	 * Play the "Success" sound when hybrid is created
	 */
	playCompleteSound() {
		if (!this.initialized) this.init();
		if (!this.successSound) return;

		try {
			// Reset to beginning if already playing
			this.successSound.currentTime = 0;
			this.successSound.play().catch((error) => {
				console.error("Failed to play success sound:", error);
			});
		} catch (error) {
			console.error("Error playing success sound:", error);
		}
	}

	/**
	 * Play ambient processing sounds (no-op for now, can add loop sound if needed)
	 */
	playProcessingLoop(duration = 2) {
		// Optional: Add a looping background sound during processing
		// For now, this is a no-op
		return null;
	}

	/**
	 * Play a mechanical click sound (no-op, can be added if needed)
	 */
	playMechanicalClick(time = null) {
		// Optional: Add a click sound if needed
	}
}

// Create singleton instance
const soundEffects = new SoundEffects();

export default soundEffects;

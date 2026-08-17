/**
 * knobMapper.js - Hysteresis and analog knob mapping math
 */

// Store previous knob states
export let previousKnobIndices = Array(12).fill(-1);
export let previousKnobRawValues = Array(12).fill(-1);
export let previousKnobNumOptions = Array(12).fill(-1);
export let knobSlidingWindows = Array(12).fill({ min: 0, max: 1023 });

const HYSTERESIS_THRESHOLD = 10;

/**
 * Standard mapping helper (value from range 1 to range 2)
 */
function mapValue(n, start1, stop1, start2, stop2) {
	return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

/**
 * Map a knob value (0-1023) to an index (0 to numOptions-1) with hysteresis
 * to prevent flickering when analog values fluctuate by ±2-3
 *
 * @param {number} knobValue - Raw analog value from Arduino (0-1023)
 * @param {number} numOptions - Number of available options to map to
 * @param {number} knobId - Unique ID for this knob (0-11) to track previous state
 * @returns {number} The selected index with hysteresis applied
 */
export function mapKnobToIndexWithHysteresis(knobValue, numOptions, knobId) {
	if (numOptions <= 1) return 0;

	let { min, max } = knobSlidingWindows[knobId];
	let slidingWindowSize = Math.min(numOptions * 146, 1023);
	min = Math.min(min, 1023 - slidingWindowSize);
	max = min + slidingWindowSize;

	// Adjust window position to keep the knobValue within the window
	if (knobValue < min) {
		min = knobValue;
		max = min + slidingWindowSize;
	} else if (knobValue > max) {
		max = knobValue;
		min = max - slidingWindowSize;
	}

	// Save updated sliding window
	knobSlidingWindows[knobId] = { min, max };

	const previousIndex = previousKnobIndices[knobId];
	const previousRawValue = previousKnobRawValues[knobId];
	const previousNumOptions = previousKnobNumOptions[knobId];

	const rawIndex = Math.floor(mapValue(knobValue, min, max, 0, numOptions));
	const clampedIndex = Math.max(0, Math.min(rawIndex, numOptions - 1));

	// Check if options count changed
	if (previousNumOptions !== numOptions || previousIndex >= numOptions) {
		previousKnobIndices[knobId] = clampedIndex;
		previousKnobRawValues[knobId] = knobValue;
		previousKnobNumOptions[knobId] = numOptions;
		return clampedIndex;
	}

	if (previousIndex === -1) {
		previousKnobIndices[knobId] = clampedIndex;
		previousKnobRawValues[knobId] = knobValue;
		previousKnobNumOptions[knobId] = numOptions;
		return clampedIndex;
	}

	if (clampedIndex === previousIndex) {
		previousKnobRawValues[knobId] = knobValue;
		return previousIndex;
	}

	// Recalculate using absolute positions inside the sliding window
	const stepSize = slidingWindowSize / numOptions;
	const clampedCenter = min + (clampedIndex + 0.5) * stepSize;
	const previousCenter = min + (previousIndex + 0.5) * stepSize;

	const midpointBetweenCenters = (clampedCenter + previousCenter) / 2;

	let shouldSwitch = false;
	if (clampedIndex > previousIndex) {
		shouldSwitch = knobValue > midpointBetweenCenters + HYSTERESIS_THRESHOLD;
	} else {
		shouldSwitch = knobValue < midpointBetweenCenters - HYSTERESIS_THRESHOLD;
	}

	if (shouldSwitch) {
		previousKnobIndices[knobId] = clampedIndex;
		previousKnobRawValues[knobId] = knobValue;
		previousKnobNumOptions[knobId] = numOptions;
		return clampedIndex;
	} else {
		previousKnobRawValues[knobId] = knobValue;
		return previousIndex;
	}
}

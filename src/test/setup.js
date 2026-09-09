import '@testing-library/jest-dom/vitest'

// jsdom implements neither of these, and the proof preview depends on both.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock-preview'
  URL.revokeObjectURL = () => {}
}

// Silence jsdom's "not implemented" noise from the <video> preview element.
window.HTMLMediaElement.prototype.load = () => {}
window.HTMLMediaElement.prototype.play = () => Promise.resolve()
window.HTMLMediaElement.prototype.pause = () => {}

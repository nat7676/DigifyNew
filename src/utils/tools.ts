/**
 * Create partially redacted text for memorization feature
 * Randomly hides words based on the factor parameter
 */
export function createPartiallyRedactedText(text: string, factor: number): string {
  if (!text || factor <= 0) return text
  
  // Split text into words while preserving whitespace
  const words = text.split(/(\s+)/)
  
  // Calculate how many words to hide
  const wordCount = words.filter(w => w.trim()).length
  const wordsToHide = Math.floor(wordCount * (factor / 100))
  
  if (wordsToHide === 0) return text
  
  // Get indices of actual words (not whitespace)
  const wordIndices: number[] = []
  words.forEach((word, index) => {
    if (word.trim()) {
      wordIndices.push(index)
    }
  })
  
  // Randomly select words to hide
  const indicesToHide = new Set<number>()
  while (indicesToHide.size < wordsToHide && indicesToHide.size < wordIndices.length) {
    const randomIndex = Math.floor(Math.random() * wordIndices.length)
    indicesToHide.add(wordIndices[randomIndex])
  }
  
  // Replace selected words with underscores
  const result = words.map((word, index) => {
    if (indicesToHide.has(index)) {
      return '_'.repeat(word.length)
    }
    return word
  })
  
  return result.join('')
}

/**
 * Generate a unique ID for dashboard elements
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
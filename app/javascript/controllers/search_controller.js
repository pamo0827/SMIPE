import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["results"]

  connect() {
    this.searchTimeout = null
  }

  onInput(event) {
    const query = event.target.value.trim()

    // Debounce search
    clearTimeout(this.searchTimeout)

    if (query.length < 2) {
      return
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch(query)
    }, 300)
  }

  onKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const query = event.target.value.trim()
      if (query.length >= 2) {
        // Navigate to player page with search query
        window.location.href = `/player?q=${encodeURIComponent(query)}`
      }
    }
  }

  async performSearch(query) {
    try {
      const response = await fetch(`/youtube/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Search results:', data)
        // For now, navigate to player with search results
        // Could show dropdown results in future
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }
}

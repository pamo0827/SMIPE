import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results"]

  connect() {
    this.searchTimeout = null
    this.selectedIndex = -1
    this.results = []
    this.failedVideoIds = new Set() // 再生失敗した動画IDを記録
    this.lastPlayedIndex = -1 // 最後に再生を試みたインデックス

    // クリック外で閉じる
    this.handleClickOutside = this.handleClickOutside.bind(this)
    document.addEventListener('click', this.handleClickOutside)

    // 再生失敗イベントをリッスン
    this.handlePlaybackFailed = this.handlePlaybackFailed.bind(this)
    document.addEventListener('video-playback-failed', this.handlePlaybackFailed)
  }

  disconnect() {
    document.removeEventListener('click', this.handleClickOutside)
    document.removeEventListener('video-playback-failed', this.handlePlaybackFailed)
  }

  handlePlaybackFailed(event) {
    const { failedVideoId } = event.detail
    console.log('Playback failed for:', failedVideoId)

    // 失敗した動画IDを記録
    this.failedVideoIds.add(failedVideoId)

    // 次の再生可能な候補を探す
    this.tryNextCandidate()
  }

  tryNextCandidate() {
    // 現在の検索結果から次の候補を探す
    for (let i = this.lastPlayedIndex + 1; i < this.results.length; i++) {
      const video = this.results[i]
      if (!this.failedVideoIds.has(video.video_id)) {
        console.log('Trying next candidate:', video.title)
        this.lastPlayedIndex = i
        this.playNextCandidate(video)
        return
      }
    }

    // 全ての候補が失敗した場合
    this.showToast('再生可能な曲が見つかりませんでした', 'error')
  }

  playNextCandidate(video) {
    if (!video) return

    // 別の曲に切り替わったことを通知
    this.showToast(`埋め込み不可のため別の曲を再生: ${this.truncate(video.title, 25)}`)

    // プレイヤーに再生イベントを送信
    const playEvent = new CustomEvent('play-video', {
      detail: { videoId: video.video_id },
      bubbles: true
    })
    document.dispatchEvent(playEvent)
  }

  handleClickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.hideResults()
    }
  }

  onInput(event) {
    const query = event.target.value.trim()

    // Debounce search
    clearTimeout(this.searchTimeout)

    if (query.length < 2) {
      this.hideResults()
      return
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch(query)
    }, 300)
  }

  onKeydown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.selectNext()
        break
      case 'ArrowUp':
        event.preventDefault()
        this.selectPrevious()
        break
      case 'Enter':
        event.preventDefault()
        if (this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
          this.playVideo(this.results[this.selectedIndex])
        } else {
          const query = event.target.value.trim()
          if (query.length >= 2) {
            this.performSearch(query)
          }
        }
        break
      case 'Escape':
        this.hideResults()
        event.target.blur()
        break
    }
  }

  onFocus() {
    if (this.results.length > 0) {
      this.showResults()
    }
  }

  selectNext() {
    if (this.results.length === 0) return
    this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1)
    this.updateSelection()
  }

  selectPrevious() {
    if (this.results.length === 0) return
    this.selectedIndex = Math.max(this.selectedIndex - 1, -1)
    this.updateSelection()
  }

  updateSelection() {
    if (!this.hasResultsTarget) return

    const items = this.resultsTarget.querySelectorAll('.search-result-item')
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected')
        item.scrollIntoView({ block: 'nearest' })
      } else {
        item.classList.remove('selected')
      }
    })
  }

  async performSearch(query) {
    try {
      const response = await fetch(`/youtube/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        this.results = data.results || []
        this.selectedIndex = -1
        this.renderResults()
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  renderResults() {
    if (!this.hasResultsTarget) return

    if (this.results.length === 0) {
      this.resultsTarget.innerHTML = `
        <div class="search-no-results">
          検索結果がありません
        </div>
      `
      this.showResults()
      return
    }

    this.resultsTarget.innerHTML = this.results.slice(0, 8).map((video, index) => `
      <div class="search-result-item" data-index="${index}" data-video-id="${video.video_id}">
        <img src="${video.thumbnail}" alt="${video.title}" class="search-result-thumbnail">
        <div class="search-result-info">
          <div class="search-result-title">${this.escapeHtml(this.truncate(video.title, 50))}</div>
          <div class="search-result-artist">${this.escapeHtml(video.channel_name)}</div>
        </div>
        <div class="search-result-duration">${this.formatDuration(video.duration)}</div>
      </div>
    `).join('')

    // クリックイベントを追加
    this.resultsTarget.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index)
        this.playVideo(this.results[index])
      })
    })

    this.showResults()
  }

  showResults() {
    if (this.hasResultsTarget) {
      this.resultsTarget.classList.add('visible')
    }
  }

  hideResults() {
    if (this.hasResultsTarget) {
      this.resultsTarget.classList.remove('visible')
    }
    this.selectedIndex = -1
  }

  playVideo(video) {
    if (!video) return

    // 検索結果を閉じる
    this.hideResults()

    // 入力をクリア
    const input = this.element.querySelector('input')
    if (input) {
      input.value = ''
      input.blur()
    }

    // 再生を試みたインデックスを記録
    const index = this.results.findIndex(v => v.video_id === video.video_id)
    this.lastPlayedIndex = index
    this.failedVideoIds.clear() // 新しい選択なのでリセット

    // プレイヤーに再生イベントを送信
    const playEvent = new CustomEvent('play-video', {
      detail: { videoId: video.video_id },
      bubbles: true
    })
    document.dispatchEvent(playEvent)
  }

  showToast(message) {
    const existing = document.querySelector('.search-toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.className = 'search-toast'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3000)
  }

  truncate(str, length) {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
  }

  escapeHtml(str) {
    if (!str) return ''
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  formatDuration(seconds) {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}

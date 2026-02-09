import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["historyTab", "historyItems"]

  connect() {
    this.currentHistoryType = "likes"
    this.historyData = { likes: [], dislikes: [] }
    this.loadHistory()

    this.handleHistoryUpdated = () => this.loadHistory()
    document.addEventListener('history-updated', this.handleHistoryUpdated)
  }

  disconnect() {
    document.removeEventListener('history-updated', this.handleHistoryUpdated)
  }

  switchHistoryTab(event) {
    const tab = event.currentTarget
    const historyType = tab.dataset.historyType

    this.currentHistoryType = historyType

    // 履歴タブのアクティブ状態を更新
    this.historyTabTargets.forEach(t => t.classList.remove("active"))
    tab.classList.add("active")

    // 履歴を表示
    this.renderHistory()
  }

  async loadHistory() {
    if (!this.hasHistoryItemsTarget) return

    this.historyItemsTarget.innerHTML = '<div class="loading-playlists">読み込み中...</div>'

    try {
      const response = await fetch('/player/interactions')
      if (response.ok) {
        this.historyData = await response.json()
        this.renderHistory()
      } else {
        this.showError()
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      this.showError()
    }
  }

  renderHistory() {
    if (!this.hasHistoryItemsTarget) return

    const items = this.historyData[this.currentHistoryType] || []

    if (items.length === 0) {
      const emptyMessage = this.currentHistoryType === "likes"
        ? "いいねした曲がありません"
        : "NOT FOR MEした曲がありません"
      this.historyItemsTarget.innerHTML = `
        <div class="sidebar-empty-message">
          <p>${emptyMessage}</p>
        </div>
      `
      return
    }

    this.historyItemsTarget.innerHTML = items.map(item => `
      <div class="sidebar-playlist-item history-item" data-video-id="${item.video_id}" data-title="${this.escapeAttr(item.title)}" data-channel="${this.escapeAttr(item.channel_name)}" data-thumbnail="${this.escapeAttr(item.thumbnail)}">
        <div class="library-item-main" data-action="click->sidebar-history#playVideo">
          <img src="${item.thumbnail || '/assets/default_playlist.png'}"
               alt="${item.title}"
               class="sidebar-playlist-cover">
          <div class="sidebar-playlist-info">
            <div class="sidebar-playlist-name">${this.truncate(item.title, 22)}</div>
            <div class="sidebar-playlist-type">${item.channel_name}</div>
          </div>
        </div>
        <button class="library-item-add" data-action="click->sidebar-history#addToLibrary" title="ライブラリに追加">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    `).join('')
  }

  playVideo(event) {
    const item = event.currentTarget.closest('.history-item')
    const videoId = item?.dataset.videoId
    if (videoId) {
      document.dispatchEvent(new CustomEvent('play-video', {
        detail: { videoId },
        bubbles: true
      }))
    }
  }

  async addToLibrary(event) {
    event.stopPropagation()
    const btn = event.currentTarget
    const item = btn.closest('.history-item')
    if (!item) return

    const data = {
      video_id: item.dataset.videoId,
      title: item.dataset.title,
      channel_name: item.dataset.channel,
      thumbnail_url: item.dataset.thumbnail
    }

    try {
      const response = await fetch('/player/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getMetaValue('csrf-token')
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
        document.dispatchEvent(new CustomEvent('library-updated'))
      }
    } catch (error) {
      console.error('Failed to add to library:', error)
    }
  }

  truncate(str, length) {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
  }

  escapeAttr(str) {
    if (!str) return ''
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
  }

  getMetaValue(name) {
    const element = document.querySelector(`meta[name="${name}"]`)
    return element?.getAttribute('content') || ''
  }

  showError() {
    if (this.hasHistoryItemsTarget) {
      this.historyItemsTarget.innerHTML = `
        <div class="sidebar-empty-message">
          <p>読み込みに失敗しました</p>
        </div>
      `
    }
  }
}

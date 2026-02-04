import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["historyTab", "historyItems"]

  connect() {
    this.currentHistoryType = "likes"
    this.historyData = { likes: [], dislikes: [] }
    this.loadHistory()
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
      <div class="sidebar-playlist-item history-item" data-video-id="${item.video_id}" data-action="click->sidebar-history#playVideo">
        <img src="${item.thumbnail || '/assets/default_playlist.png'}"
             alt="${item.title}"
             class="sidebar-playlist-cover">
        <div class="sidebar-playlist-info">
          <div class="sidebar-playlist-name">${this.truncate(item.title, 25)}</div>
          <div class="sidebar-playlist-type">${item.channel_name}</div>
        </div>
      </div>
    `).join('')
  }

  playVideo(event) {
    const videoId = event.currentTarget.dataset.videoId
    if (videoId) {
      // youtube-playerコントローラーにイベントを送信
      const playerEvent = new CustomEvent('play-video', {
        detail: { videoId },
        bubbles: true
      })
      document.dispatchEvent(playerEvent)
    }
  }

  truncate(str, length) {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
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

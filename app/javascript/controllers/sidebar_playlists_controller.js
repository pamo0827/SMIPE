import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["items", "playAllButton"]

  connect() {
    this.libraryItems = []
    this.loadLibrary()

    this.handleLibraryUpdated = () => this.loadLibrary()
    document.addEventListener('library-updated', this.handleLibraryUpdated)
  }

  disconnect() {
    document.removeEventListener('library-updated', this.handleLibraryUpdated)
  }

  async loadLibrary() {
    try {
      const response = await fetch('/player/library')
      if (response.ok) {
        const data = await response.json()
        this.libraryItems = data.items || []
        this.renderLibrary(this.libraryItems)
        this.updatePlayAllButton()
      } else {
        this.libraryItems = []
        this.showEmpty()
        this.updatePlayAllButton()
      }
    } catch (error) {
      console.error('Failed to load library:', error)
      this.libraryItems = []
      this.showEmpty()
      this.updatePlayAllButton()
    }
  }

  updatePlayAllButton() {
    if (this.hasPlayAllButtonTarget) {
      this.playAllButtonTarget.style.display = this.libraryItems.length > 0 ? 'flex' : 'none'
    }
  }

  renderLibrary(items) {
    if (!items || items.length === 0) {
      this.showEmpty()
      return
    }

    this.itemsTarget.innerHTML = items.map(item => `
      <div class="sidebar-playlist-item library-item" data-video-id="${item.video_id}" data-item-id="${item.id}">
        <div class="library-item-main" data-action="click->sidebar-playlists#playVideo">
          <img src="${item.thumbnail_url || '/assets/default_playlist.png'}"
               alt="${item.title}"
               class="sidebar-playlist-cover">
          <div class="sidebar-playlist-info">
            <div class="sidebar-playlist-name">${this.truncate(item.title, 22)}</div>
            <div class="sidebar-playlist-type">${item.channel_name || ''}</div>
          </div>
        </div>
        <button class="library-item-remove" data-action="click->sidebar-playlists#removeItem" title="削除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    `).join('')
  }

  playAll() {
    if (this.libraryItems.length === 0) return

    // 全ライブラリの曲を再生リストとして送信
    const videoIds = this.libraryItems.map(item => item.video_id)
    document.dispatchEvent(new CustomEvent('play-playlist', {
      detail: { videoIds },
      bubbles: true
    }))
  }

  playVideo(event) {
    const item = event.currentTarget.closest('.library-item')
    const videoId = item?.dataset.videoId
    if (videoId) {
      document.dispatchEvent(new CustomEvent('play-video', {
        detail: { videoId },
        bubbles: true
      }))
    }
  }

  async removeItem(event) {
    event.stopPropagation()
    const item = event.currentTarget.closest('.library-item')
    const itemId = item?.dataset.itemId
    if (!itemId) return

    try {
      const response = await fetch(`/player/library/${itemId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': this.getMetaValue('csrf-token')
        }
      })

      if (response.ok) {
        item.remove()
        // 全部削除されたら空メッセージ表示
        if (!this.element.querySelector('.library-item')) {
          this.showEmpty()
        }
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  showEmpty() {
    if (this.hasItemsTarget) {
      this.itemsTarget.innerHTML = `
        <div class="sidebar-empty-message">
          <p>ライブラリに曲がありません</p>
          <p class="sidebar-empty-hint">GOOD履歴の＋ボタンで追加</p>
        </div>
      `
    }
  }

  truncate(str, length) {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
  }

  getMetaValue(name) {
    const element = document.querySelector(`meta[name="${name}"]`)
    return element?.getAttribute('content') || ''
  }
}

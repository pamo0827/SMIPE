import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.loadPlaylists()
  }

  async loadPlaylists() {
    try {
      const response = await fetch('/playlists.json')
      if (response.ok) {
        const playlists = await response.json()
        this.renderPlaylists(playlists)
      } else {
        this.showError()
      }
    } catch (error) {
      console.error('Failed to load playlists:', error)
      this.showError()
    }
  }

  renderPlaylists(playlists) {
    if (!playlists || playlists.length === 0) {
      this.element.innerHTML = `
        <div class="sidebar-playlist-item">
          <div class="sidebar-playlist-info">
            <div class="sidebar-playlist-name">プレイリストがありません</div>
            <div class="sidebar-playlist-type">お気に入りを追加しよう</div>
          </div>
        </div>
      `
      return
    }

    this.element.innerHTML = playlists.map(playlist => `
      <a href="/playlists/${playlist.id}" class="sidebar-playlist-item">
        <img src="${playlist.image || '/assets/default_playlist.png'}"
             alt="${playlist.name}"
             class="sidebar-playlist-cover">
        <div class="sidebar-playlist-info">
          <div class="sidebar-playlist-name">${playlist.name}</div>
          <div class="sidebar-playlist-type">Playlist</div>
        </div>
      </a>
    `).join('')
  }

  showError() {
    this.element.innerHTML = `
      <div class="sidebar-playlist-item">
        <div class="sidebar-playlist-info">
          <div class="sidebar-playlist-name">読み込みに失敗しました</div>
        </div>
      </div>
    `
  }
}

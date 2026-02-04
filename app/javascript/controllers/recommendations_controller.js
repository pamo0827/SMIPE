import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["grid", "refreshButton"]
  static values = {
    sectionType: String,
    sectionValue: String
  }

  connect() {
    this.setupCardClickEvents()
  }

  setupCardClickEvents() {
    // カード全体のクリックイベントを設定
    this.element.querySelectorAll('.recommendation-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // 再生ボタン以外をクリックした場合もカード全体で再生
        if (!e.target.closest('.recommendation-play-btn')) {
          const videoId = card.dataset.videoId
          const index = card.dataset.index
          this.playVideoById(videoId, parseInt(index))
        }
      })
    })
  }

  async refresh(event) {
    event.preventDefault()
    const button = event.currentTarget

    // ローディング状態に
    button.classList.add('loading')
    button.disabled = true

    try {
      const sectionType = this.sectionTypeValue
      const sectionValue = this.sectionValueValue

      const params = new URLSearchParams({
        section_type: sectionType,
        section_value: sectionValue || ''
      })

      const response = await fetch(`/player/refresh_section?${params}`)
      if (response.ok) {
        const data = await response.json()
        this.updateGrid(data.videos)
      }
    } catch (error) {
      console.error('Failed to refresh section:', error)
    } finally {
      button.classList.remove('loading')
      button.disabled = false
    }
  }

  updateGrid(videos) {
    if (!this.hasGridTarget || !videos || videos.length === 0) return

    this.gridTarget.innerHTML = videos.map((video, index) => `
      <div class="recommendation-card" data-video-id="${video.video_id}" data-index="${index}">
        <div class="recommendation-card-image">
          <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" loading="lazy">
          <button class="recommendation-play-btn" data-action="click->recommendations#playVideo" data-video-id="${video.video_id}" data-index="${index}">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606"/>
            </svg>
          </button>
        </div>
        <div class="recommendation-card-info">
          <p class="recommendation-title">${this.escapeHtml(this.truncate(video.title, 35))}</p>
          <p class="recommendation-artist">${this.escapeHtml(video.channel_name)}</p>
        </div>
      </div>
    `).join('')

    // 新しいカードにクリックイベントを再設定
    this.setupCardClickEvents()
  }

  escapeHtml(str) {
    if (!str) return ''
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  truncate(str, length) {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
  }

  playVideo(event) {
    event.preventDefault()
    event.stopPropagation()

    const videoId = event.currentTarget.dataset.videoId
    const index = parseInt(event.currentTarget.dataset.index)

    this.playVideoById(videoId, index)
  }

  playVideoById(videoId, index) {
    // YouTube Playerコントローラーを取得して再生
    const playerElement = document.querySelector('[data-controller="youtube-player"]')
    if (playerElement) {
      const playerController = this.application.getControllerForElementAndIdentifier(
        playerElement,
        'youtube-player'
      )

      if (playerController) {
        // インデックスを設定して再生
        playerController.currentIndexValue = index
        playerController.loadAndPlayVideo(videoId)

        // プレイヤーセクションにスクロール
        const albumArt = document.getElementById('album-art-section')
        if (albumArt) {
          albumArt.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }
}

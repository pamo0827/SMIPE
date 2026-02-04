import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
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

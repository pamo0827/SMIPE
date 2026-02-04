import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["albumArt", "albumImage", "videoPlayer", "songTitle", "artistName",
                    "progressBar", "currentTime", "duration", "playPauseButton",
                    "playIcon", "pauseIcon", "likeButton", "dislikeButton"]

  static values = {
    videoIds: Array,
    currentIndex: Number,
    playing: Boolean
  }

  connect() {
    console.log("YouTube Player Controller connected")

    // Initialize values
    this.currentIndexValue = 0
    this.playingValue = false
    this.player = null

    // Load video IDs from data attribute
    const videoIdsData = this.element.dataset.youtubePlayerVideoIds
    if (videoIdsData) {
      this.videoIdsValue = JSON.parse(videoIdsData)
    }

    // Load YouTube iframe API
    this.loadYouTubeAPI()
  }

  disconnect() {
    if (this.player) {
      this.player.destroy()
    }
  }

  loadYouTubeAPI() {
    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      this.initializePlayer()
      return
    }

    // Load YouTube iframe API script
    if (!window.youtubeAPILoading) {
      window.youtubeAPILoading = true
      const tag = document.createElement('script')
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    // Set callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      this.initializePlayer()
    }
  }

  initializePlayer() {
    if (!this.hasVideoPlayerTarget || this.videoIdsValue.length === 0) {
      console.error('Video player target or video IDs not found')
      return
    }

    const videoId = this.videoIdsValue[this.currentIndexValue]

    this.player = new YT.Player(this.videoPlayerTarget, {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        'playsinline': 1,
        'controls': 0,
        'modestbranding': 1,
        'rel': 0
      },
      events: {
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this)
      }
    })
  }

  onPlayerReady(event) {
    console.log('YouTube Player Ready')
    this.updatePlayerUI()
    // Auto-play the first video
    event.target.playVideo()
  }

  onPlayerStateChange(event) {
    // YT.PlayerState.PLAYING = 1
    // YT.PlayerState.PAUSED = 2
    // YT.PlayerState.ENDED = 0

    if (event.data === YT.PlayerState.PLAYING) {
      this.playingValue = true
      this.startProgressTracking()
    } else if (event.data === YT.PlayerState.PAUSED) {
      this.playingValue = false
      this.stopProgressTracking()
    } else if (event.data === YT.PlayerState.ENDED) {
      this.handleNext()
    }

    this.updatePlayPauseButton()
  }

  startProgressTracking() {
    this.progressInterval = setInterval(() => {
      if (this.player && this.player.getCurrentTime) {
        const currentTime = this.player.getCurrentTime()
        const duration = this.player.getDuration()
        this.updateProgressBar(currentTime, duration)
      }
    }, 1000)
  }

  stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  updateProgressBar(currentTime, duration) {
    if (!this.hasProgressBarTarget) return

    const percentage = (currentTime / duration) * 100
    this.progressBarTarget.value = percentage

    if (this.hasCurrentTimeTarget) {
      this.currentTimeTarget.textContent = this.formatTime(currentTime)
    }
    if (this.hasDurationTarget) {
      this.durationTarget.textContent = this.formatTime(duration)
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  updatePlayPauseButton() {
    if (!this.hasPlayIconTarget || !this.hasPauseIconTarget) return

    if (this.playingValue) {
      this.playIconTarget.style.display = 'none'
      this.pauseIconTarget.style.display = 'block'
    } else {
      this.playIconTarget.style.display = 'block'
      this.pauseIconTarget.style.display = 'none'
    }
  }

  async updatePlayerUI() {
    if (this.videoIdsValue.length === 0) return

    const videoId = this.videoIdsValue[this.currentIndexValue]

    // Fetch video details from backend
    try {
      const response = await fetch(`/youtube/video/${videoId}`)
      const data = await response.json()

      if (data.video) {
        const video = data.video

        // Update UI
        if (this.hasSongTitleTarget) {
          this.songTitleTarget.textContent = video.title
        }
        if (this.hasArtistNameTarget) {
          this.artistNameTarget.textContent = video.channel_name
        }
        if (this.hasAlbumImageTarget) {
          this.albumImageTarget.src = video.thumbnail
        }
      }
    } catch (error) {
      console.error('Failed to fetch video details:', error)
    }
  }

  // Playback controls
  togglePlay() {
    if (!this.player) return

    if (this.playingValue) {
      this.player.pauseVideo()
    } else {
      this.player.playVideo()
    }
  }

  handleNext() {
    if (this.currentIndexValue < this.videoIdsValue.length - 1) {
      this.currentIndexValue++
    } else {
      this.currentIndexValue = 0 // Loop back to first video
    }
    this.loadVideo(this.videoIdsValue[this.currentIndexValue])
  }

  handlePrevious() {
    if (this.currentIndexValue > 0) {
      this.currentIndexValue--
    } else {
      this.currentIndexValue = this.videoIdsValue.length - 1 // Loop to last video
    }
    this.loadVideo(this.videoIdsValue[this.currentIndexValue])
  }

  loadVideo(videoId) {
    if (!this.player) return

    this.player.loadVideoById(videoId)
    this.updatePlayerUI()
  }

  // おすすめカードから呼び出される
  loadAndPlayVideo(videoId) {
    if (!this.player) return

    this.player.loadVideoById(videoId)
    this.player.playVideo()
    this.updatePlayerUI()
  }

  handleSeek(event) {
    if (!this.player) return

    const percentage = event.target.value
    const duration = this.player.getDuration()
    const seekTime = (percentage / 100) * duration
    this.player.seekTo(seekTime, true)
  }

  async likeVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Like video:', videoId)

    // Visual feedback
    if (this.hasLikeButtonTarget) {
      this.likeButtonTarget.classList.add('active')
      setTimeout(() => {
        this.likeButtonTarget.classList.remove('active')
      }, 1000)
    }

    this.showToast('GOODに追加しました', 'success')
    // TODO: Implement like API call when user is logged in
  }

  // NOT FOR ME - skip and record
  async skipVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Skip video (not for me):', videoId)

    // Move to next video
    this.handleNext()

    // TODO: Implement skip/dislike API call when user is logged in
  }

  async dislikeVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Dislike video:', videoId)
    // TODO: Implement dislike API call when user is logged in
  }

  // トースト通知を表示
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 20px;
      background-color: ${type === 'success' ? '#1DB954' : '#E74C3C'};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      animation: fadeInOut 3s ease-in-out;
    `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  // CSRF トークン取得
  getMetaValue(name) {
    const element = document.querySelector(`meta[name="${name}"]`)
    return element ? element.getAttribute('content') : ''
  }
}

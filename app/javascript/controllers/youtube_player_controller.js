import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["albumArt", "albumImage", "videoPlayer", "songTitle", "artistName",
                    "progressBar", "progressBarFill", "currentTime", "duration", "playPauseButton",
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
    this.touchStartX = 0
    this.touchStartY = 0
    this.isDragging = false
    this.dragDirection = null

    // Load video IDs from data attribute
    const videoIdsData = this.element.dataset.youtubePlayerVideoIds
    if (videoIdsData) {
      this.videoIdsValue = JSON.parse(videoIdsData)
    }

    // Setup touch events for swipe gestures
    this.setupTouchEvents()

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
    
    if (this.hasProgressBarFillTarget) {
      this.progressBarFillTarget.style.width = `${percentage}%`
    }

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

  handleSeek(event) {
    if (!this.player) return

    const percentage = event.target.value
    const duration = this.player.getDuration()
    const seekTime = (percentage / 100) * duration
    this.player.seekTo(seekTime, true)
    
    if (this.hasProgressBarFillTarget) {
      this.progressBarFillTarget.style.width = `${percentage}%`
    }
  }

  // Swipe gesture handling (keep existing logic from player_controller.js)
  setupTouchEvents() {
    const albumArt = this.albumArtTarget
    const albumImage = this.albumImageTarget

    if (!albumArt || !albumImage) {
      console.error('Album art or image target not found')
      return
    }

    // Touch events
    albumArt.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    albumArt.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    albumArt.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })

    // Mouse events (for desktop)
    albumArt.addEventListener('mousedown', this.handleMouseDown.bind(this))
    albumArt.addEventListener('mousemove', this.handleMouseMove.bind(this))
    albumArt.addEventListener('mouseup', this.handleMouseUp.bind(this))
    albumArt.addEventListener('mouseleave', this.handleMouseUp.bind(this))

    // Hover effects
    albumArt.addEventListener('mouseenter', this.handleMouseEnter.bind(this))
    albumArt.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
  }

  handleMouseEnter() {
    this.albumImageTarget.style.transform = 'scale(1.02)'
    this.albumImageTarget.style.transition = 'transform 0.3s ease'
  }

  handleMouseLeave() {
    this.albumImageTarget.style.transform = 'scale(1)'
    this.albumImageTarget.style.transition = 'transform 0.3s ease'
  }

  handleTouchStart(e) {
    e.preventDefault()
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
    this.isDragging = true
    this.dragDirection = null
    this.albumImageTarget.style.transition = 'none'
    this.albumImageTarget.style.cursor = 'grabbing'
  }

  handleMouseDown(e) {
    this.touchStartX = e.clientX
    this.touchStartY = e.clientY
    this.isDragging = true
    this.dragDirection = null
    this.albumImageTarget.style.transition = 'none'
    this.albumImageTarget.style.cursor = 'grabbing'
  }

  handleTouchMove(e) {
    if (!this.isDragging) return
    e.preventDefault()

    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    this.updateDragPosition(touchX, touchY)
  }

  handleMouseMove(e) {
    if (!this.isDragging) return
    this.updateDragPosition(e.clientX, e.clientY)
  }

  updateDragPosition(x, y) {
    const diffX = x - this.touchStartX
    const diffY = y - this.touchStartY

    // Determine drag direction
    if (!this.dragDirection && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      this.dragDirection = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical'
    }

    // Restrict movement based on drag direction
    let translateX = 0
    let translateY = 0
    let rotation = 0

    if (this.dragDirection === 'horizontal') {
      translateX = diffX
      rotation = diffX * 0.1
    } else if (this.dragDirection === 'vertical') {
      translateY = diffY
    }

    // Visual feedback during drag
    const scale = 1 - Math.min(Math.abs(diffX), Math.abs(diffY)) / 1000
    this.albumImageTarget.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`
    this.albumImageTarget.style.opacity = 1 - Math.min(Math.abs(diffX), Math.abs(diffY)) / 300
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return
    this.handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  }

  handleMouseUp(e) {
    if (!this.isDragging) return
    this.handleDragEnd(e.clientX, e.clientY)
  }

  handleDragEnd(x, y) {
    const diffX = x - this.touchStartX
    const diffY = y - this.touchStartY
    const minSwipeDistance = 100

    // Reset if no significant swipe
    if (Math.abs(diffX) <= minSwipeDistance && Math.abs(diffY) <= minSwipeDistance) {
      this.albumImageTarget.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      this.albumImageTarget.style.transform = ''
      this.albumImageTarget.style.opacity = ''
      this.albumImageTarget.style.cursor = 'grab'
    } else {
      const dominantDirection = this.getDominantDirection(diffX, diffY)
      this.applyDragEndAnimation(dominantDirection)

      switch (dominantDirection) {
        case 'right':
          this.handleSwipeRight()
          break
        case 'left':
          this.handleSwipeLeft()
          break
        case 'down':
          this.handleSwipeDown()
          break
        case 'up':
          this.handleSwipeUp()
          break
      }
    }

    this.isDragging = false
    this.dragDirection = null
  }

  getDominantDirection(diffX, diffY) {
    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)

    if (absX > absY) {
      return diffX > 0 ? 'right' : 'left'
    } else {
      return diffY > 0 ? 'down' : 'up'
    }
  }

  applyDragEndAnimation(direction) {
    const albumImage = this.albumImageTarget
    albumImage.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
    albumImage.style.opacity = 0

    let transformValue = ''
    switch (direction) {
      case 'left':
        transformValue = 'translateX(-100%) rotate(-10deg) scale(0.8)'
        break
      case 'right':
        transformValue = 'translateX(100%) rotate(10deg) scale(0.8)'
        break
      case 'up':
        transformValue = 'translateY(-100%) scale(0.8)'
        break
      case 'down':
        transformValue = 'translateY(100%) scale(0.8)'
        break
    }
    albumImage.style.transform = transformValue

    // Reset after animation
    setTimeout(() => {
      albumImage.style.transition = 'none'
      albumImage.style.transform = ''
      albumImage.style.opacity = ''
      albumImage.style.cursor = 'grab'
    }, 300)
  }

  // Swipe action handlers
  handleSwipeRight() {
    // Like the current video
    this.likeVideo()
  }

  handleSwipeLeft() {
    // Dislike the current video
    this.dislikeVideo()
  }

  handleSwipeUp() {
    // 曲をキューに投稿
    this.postToQueue()
  }

  handleSwipeDown() {
    // Previous track
    this.handlePrevious()
  }

  async likeVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Like video:', videoId)
    // TODO: Implement like API call when user is logged in
  }

  async dislikeVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Dislike video:', videoId)
    // TODO: Implement dislike API call when user is logged in
  }

  // 曲をキューに投稿
  async postToQueue() {
    const videoId = this.videoIdsValue[this.currentIndexValue]

    if (!videoId) {
      console.error('No video ID to post')
      return
    }

    try {
      const response = await fetch('/queue/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getMetaValue('csrf-token')
        },
        body: JSON.stringify({ video_id: videoId })
      })

      const data = await response.json()

      if (data.success) {
        this.showToast(`キューに追加しました！（順番: ${data.queue_position}）`, 'success')
        this.handleNext() // 次の曲へ
      } else {
        this.showToast(data.error || 'キューへの追加に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Queue add error:', error)
      this.showToast('通信エラーが発生しました', 'error')
    }
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

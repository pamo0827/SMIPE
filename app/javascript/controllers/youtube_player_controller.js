import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["albumArt", "albumImage", "videoPlayer", "songTitle", "artistName",
                    "progressBar", "currentTime", "duration", "playPauseButton",
                    "playIcon", "pauseIcon", "likeButton", "dislikeButton",
                    "lyricsSection", "youtubeLink"]

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

    // Listen for custom play-video events from history/sidebar
    this.handlePlayVideoEvent = this.handlePlayVideoEvent.bind(this)
    document.addEventListener('play-video', this.handlePlayVideoEvent)

    // Load YouTube iframe API
    this.loadYouTubeAPI()
  }

  disconnect() {
    document.removeEventListener('play-video', this.handlePlayVideoEvent)
    if (this.player) {
      this.player.destroy()
    }
  }

  handlePlayVideoEvent(event) {
    const { videoId } = event.detail
    console.log('Received play-video event:', videoId)
    if (videoId) {
      this.playVideoById(videoId)
    }
  }

  playVideoById(videoId) {
    console.log('playVideoById called:', videoId, 'player exists:', !!this.player)

    // Add video to the beginning of the list if not already present
    const index = this.videoIdsValue.indexOf(videoId)
    if (index === -1) {
      // 新しい配列を作成して代入（Stimulusの変更検出のため）
      this.videoIdsValue = [videoId, ...this.videoIdsValue]
      this.currentIndexValue = 0
    } else {
      this.currentIndexValue = index
    }

    // プレイヤーが初期化されていれば再生
    if (this.player && this.player.loadVideoById) {
      console.log('Loading and playing video:', videoId)
      console.log('Player state before load:', this.player.getPlayerState?.())

      // loadVideoByIdを使用（オブジェクト形式で渡す）
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: 0
      })

      console.log('loadVideoById called with object')
    } else {
      console.log('Player not ready, storing videoId for later')
      this.pendingVideoId = videoId
    }

    // UIを直接更新（videoIdを使って）
    this.updatePlayerUIWithVideoId(videoId)
  }

  // 特定のvideoIdでUIを更新
  async updatePlayerUIWithVideoId(videoId) {
    if (!videoId) return

    // YouTubeリンクを更新
    this.updateYouTubeLink(videoId)

    try {
      const response = await fetch(`/youtube/video/${videoId}`)
      const data = await response.json()

      if (data.video) {
        const video = data.video
        console.log('Updating UI with video:', video.title)

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

  // YouTubeリンクを更新
  updateYouTubeLink(videoId) {
    if (this.hasYoutubeLinkTarget && videoId) {
      this.youtubeLinkTarget.href = `https://www.youtube.com/watch?v=${videoId}`
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
        'rel': 0,
        'autoplay': 1,
        'enablejsapi': 1
      },
      events: {
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this),
        'onError': this.onPlayerError.bind(this)
      }
    })
  }

  onPlayerReady(event) {
    console.log('YouTube Player Ready')

    // ペンディング中の動画があれば再生
    if (this.pendingVideoId) {
      console.log('Playing pending video:', this.pendingVideoId)
      this.player.loadVideoById(this.pendingVideoId)
      this.player.playVideo()
      this.pendingVideoId = null
    } else {
      // Auto-play the first video
      event.target.playVideo()
    }

    this.updatePlayerUI()
  }

  onPlayerError(event) {
    // Error codes: 2=invalid video id, 5=HTML5 error, 100=not found, 101/150=embedding disabled
    console.error('YouTube Player Error:', event.data)
    const errorMessages = {
      2: '無効な動画IDです',
      5: 'HTML5プレイヤーエラー',
      100: '動画が見つかりません',
      101: 'この動画は埋め込み再生が無効です',
      150: 'この動画は埋め込み再生が無効です'
    }
    const message = errorMessages[event.data] || '再生エラーが発生しました'
    console.error('Error message:', message)

    // 埋め込み不可エラーの場合、次の候補を試すイベントを発火
    if (event.data === 101 || event.data === 150) {
      const currentVideoId = this.videoIdsValue[this.currentIndexValue]
      console.log('Requesting next candidate for failed video:', currentVideoId)

      // 検索コントローラーに次の候補を要求
      const retryEvent = new CustomEvent('video-playback-failed', {
        detail: { failedVideoId: currentVideoId },
        bubbles: true
      })
      document.dispatchEvent(retryEvent)
    } else {
      this.showToast(message, 'error')
    }
  }

  onPlayerStateChange(event) {
    // YT.PlayerState: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
    console.log('Player state changed:', event.data)

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

    // API call to save like
    try {
      const response = await fetch('/player/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getMetaValue('csrf-token')
        },
        body: JSON.stringify({ video_id: videoId })
      })

      if (response.ok) {
        this.showToast('GOODに追加しました', 'success')
      } else if (response.status === 401) {
        this.showToast('ログインが必要です', 'error')
      } else {
        this.showToast('保存に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Failed to save like:', error)
      this.showToast('GOODに追加しました', 'success') // Show success even if offline
    }
  }

  // NOT FOR ME - skip and record
  async skipVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Skip video (not for me):', videoId)

    // API call to save dislike
    try {
      const response = await fetch('/player/dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getMetaValue('csrf-token')
        },
        body: JSON.stringify({ video_id: videoId })
      })

      if (response.ok) {
        this.showToast('NOT FOR MEに追加しました', 'info')
      } else if (response.status === 401) {
        // Continue without saving if not logged in
      }
    } catch (error) {
      console.error('Failed to save dislike:', error)
    }

    // Move to next video
    this.handleNext()
  }

  async dislikeVideo() {
    const videoId = this.videoIdsValue[this.currentIndexValue]
    console.log('Dislike video:', videoId)

    try {
      await fetch('/player/dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getMetaValue('csrf-token')
        },
        body: JSON.stringify({ video_id: videoId })
      })
    } catch (error) {
      console.error('Failed to save dislike:', error)
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

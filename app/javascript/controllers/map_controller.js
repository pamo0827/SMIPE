import { Controller } from "@hotwired/stimulus"
import L from "leaflet"

export default class extends Controller {
  static targets = ["updateButton", "locationDisplay", "statusMessage", "searchInput",
                    "searchResults", "resultsContainer", "selectedVideo", "selectedVideoInfo", "postButton"]
  static values = {
    userLocation: Object,
    loggedIn: Boolean
  }

  connect() {
    console.log("Map Controller connected")
    this.initMap()
    this.requestLocation()
    this.loadMusicPins()
    this.selectedVideoData = null
  }

  initMap() {
    const mapElement = this.element.querySelector('#map')
    this.map = L.map(mapElement).setView([35.681236, 139.767125], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map)

    this.musicPinMarkers = []
    this.currentLocationMarker = null
  }

  requestLocation() {
    if (!navigator.geolocation) {
      this.showStatus("位置情報がサポートされていません", "error")
      return
    }

    this.showStatus("位置情報を取得中...", "info")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        this.sendLocationToServer(latitude, longitude)
        this.map.setView([latitude, longitude], 15)

        if (this.currentLocationMarker) {
          this.map.removeLayer(this.currentLocationMarker)
        }

        // 現在地ピンを表示
        const currentLocationIcon = L.divIcon({
          className: 'current-location-icon',
          html: '<i class="fas fa-person"></i>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        })

        this.currentLocationMarker = L.marker([latitude, longitude], { icon: currentLocationIcon })
          .addTo(this.map)
          .bindPopup(`
            <div>
              <strong>現在位置</strong><br>
              <span class="address-loading">住所を取得中...</span>
            </div>
          `).openPopup()

        // 住所を取得してポップアップを更新
        fetch(`/locations/reverse_geocode?latitude=${latitude}&longitude=${longitude}`)
          .then(response => response.json())
          .then(data => {
            if (data.address) {
              this.currentLocationMarker.getPopup().setContent(`
                <div>
                  <strong>現在位置</strong><br>
                  ${data.address}
                </div>
              `)
            }
          })

        this.userLocationValue = {
          latitude: latitude,
          longitude: longitude,
          location_name: `緯度: ${latitude.toFixed(4)}, 経度: ${longitude.toFixed(4)}`
        }
      },
      (error) => {
        console.error("位置情報取得失敗:", error)
        let message = "位置情報を取得できませんでした"

        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = "位置情報のアクセスが拒否されました"
            break
          case error.POSITION_UNAVAILABLE:
            message = "位置情報が利用できません"
            break
          case error.TIMEOUT:
            message = "位置情報の取得がタイムアウトしました"
            break
        }

        this.showStatus(message, "error")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  updateLocation() {
    if (this.hasUpdateButtonTarget) {
      this.updateButtonTarget.disabled = true
      this.updateButtonTarget.textContent = "更新中..."
    }

    this.requestLocation()

    setTimeout(() => {
      if (this.hasUpdateButtonTarget) {
        this.updateButtonTarget.disabled = false
        this.updateButtonTarget.textContent = "位置を更新"
      }
    }, 2000)
  }

  sendLocationToServer(lat, lng) {
    const locationData = {
      location: {
        latitude: lat,
        longitude: lng,
        location_name: `緯度: ${lat.toFixed(4)}, 経度: ${lng.toFixed(4)}`
      }
    }

    fetch("/locations/1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": this.getMetaValue("csrf-token"),
        "Accept": "application/json"
      },
      body: JSON.stringify(locationData)
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    })
    .then(data => {
      if (data.status === "success") {
        this.showStatus("位置情報を更新しました", "success")
      } else {
        this.showStatus("更新に失敗しました: " + (data.errors?.join(", ") || "不明なエラー"), "error")
      }
    })
    .catch(error => {
      console.error("通信エラー", error)
      this.showStatus("通信に失敗しました", "error")
    })
  }

  // YouTube音楽検索
  async searchMusic() {
    const query = this.searchInputTarget.value.trim()

    if (!query) {
      this.showStatus("検索キーワードを入力してください", "error")
      return
    }

    this.showStatus("検索中...", "info")

    try {
      const response = await fetch(`/youtube/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.videos && data.videos.length > 0) {
        this.displaySearchResults(data.videos)
        this.showStatus(`${data.videos.length}件の動画が見つかりました`, "success")
      } else {
        this.showStatus("検索結果が見つかりませんでした", "error")
        this.hideSearchResults()
      }
    } catch (error) {
      console.error("YouTube search failed:", error)
      this.showStatus("検索に失敗しました", "error")
    }
  }

  // 検索結果を表示
  displaySearchResults(videos) {
    this.resultsContainerTarget.innerHTML = videos.map(video => `
      <div class="video-result" style="display: flex; padding: 10px; border-bottom: 1px solid #ddd; cursor: pointer; transition: background-color 0.2s;"
           data-video-id="${video.video_id}"
           data-video-title="${this.escapeHtml(video.title)}"
           data-video-channel="${this.escapeHtml(video.channel_name)}"
           data-video-thumbnail="${video.thumbnail}"
           data-video-duration="${video.duration}"
           onclick="document.querySelector('[data-controller=map]').controller.selectVideo('${video.video_id}', '${this.escapeHtml(video.title)}', '${this.escapeHtml(video.channel_name)}', '${video.thumbnail}', ${video.duration})">
        <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 5px; margin-right: 10px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 5px;">${video.title}</div>
          <div style="color: #666; font-size: 0.9em;">${video.channel_name}</div>
          <div style="color: #999; font-size: 0.8em; margin-top: 5px;">${this.formatDuration(video.duration)}</div>
        </div>
      </div>
    `).join('')

    this.searchResultsTarget.style.display = 'block'
  }

  hideSearchResults() {
    this.searchResultsTarget.style.display = 'none'
  }

  // 動画を選択
  selectVideo(videoId, title, channelName, thumbnail, duration) {
    this.selectedVideoData = {
      videoId: videoId,
      title: title,
      channelName: channelName,
      thumbnail: thumbnail,
      duration: duration
    }

    this.selectedVideoInfoTarget.innerHTML = `
      <div style="display: flex;">
        <img src="${thumbnail}" alt="${title}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 5px; margin-right: 10px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
          <div style="color: #666; font-size: 0.9em;">${channelName}</div>
          <div style="color: #999; font-size: 0.8em; margin-top: 5px;">${this.formatDuration(duration)}</div>
        </div>
      </div>
    `

    this.selectedVideoTarget.style.display = 'block'
    this.showStatus("曲を選択しました", "success")
  }

  // 地図に投稿
  async postToMap() {
    if (!this.selectedVideoData) {
      this.showStatus("曲を選択してください", "error")
      return
    }

    if (!this.userLocationValue || !this.userLocationValue.latitude) {
      this.showStatus("位置情報を取得してください", "error")
      return
    }

    this.postButtonTarget.disabled = true
    this.postButtonTarget.textContent = "投稿中..."

    try {
      const response = await fetch('/map/create_pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getMetaValue('csrf-token'),
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          video_id: this.selectedVideoData.videoId,
          latitude: this.userLocationValue.latitude,
          longitude: this.userLocationValue.longitude,
          location_name: this.userLocationValue.location_name
        })
      })

      const data = await response.json()

      if (data.success) {
        this.showStatus("地図に投稿しました！", "success")
        this.loadMusicPins() // 地図をリロード
        this.selectedVideoData = null
        this.selectedVideoTarget.style.display = 'none'
        this.hideSearchResults()
        this.searchInputTarget.value = ''
      } else {
        this.showStatus(data.error || "投稿に失敗しました", "error")
      }
    } catch (error) {
      console.error("Post to map failed:", error)
      this.showStatus("投稿に失敗しました", "error")
    } finally {
      this.postButtonTarget.disabled = false
      this.postButtonTarget.textContent = "この曲を地図に投稿"
    }
  }

  // 地図上の音楽ピンを読み込む
  async loadMusicPins() {
    try {
      const response = await fetch('/map/pins')
      const data = await response.json()

      this.clearMusicPinMarkers()

      if (data.pins && data.pins.length > 0) {
        data.pins.forEach(pin => this.addMusicPinMarker(pin))
      }
    } catch (error) {
      console.error('音楽ピンの取得に失敗しました:', error)
    }
  }

  // 音楽ピンマーカーを追加
  addMusicPinMarker(pin) {
    const markerOptions = {
      icon: L.icon({
        iconUrl: pin.thumbnail_url,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
        className: 'music-pin-leaflet-icon'
      })
    }

    const marker = L.marker([pin.latitude, pin.longitude], markerOptions)
      .bindPopup(`
        <div class="music-pin-popup">
          <div style="font-weight:bold; color:#1DB954; font-size:16px; margin-bottom:4px;">
            ${pin.name}
          </div>
          <p style="margin: 5px 0;">チャンネル: ${pin.channel_name}</p>
          <p style="margin: 5px 0;">場所: ${pin.location_name}</p>
          <p style="margin: 5px 0;">投稿日時: ${new Date(pin.created_at).toLocaleString('ja-JP')}</p>
          <div class="user-info" style="margin-top: 10px;">
            ${pin.user.image ? `<img src="${pin.user.image}" alt="${pin.user.name}" style="width:32px;height:32px;border-radius:50%;margin-right:8px;vertical-align:middle;">` : ''}
            <span>投稿者: ${pin.user.name}</span>
          </div>
          <div style="margin-top: 15px;">
            <a href="/player?video_id=${pin.video_id}" style="
              background: #1DB954;
              color: white;
              text-decoration: none;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-weight: bold;
            ">
              <i class="fab fa-youtube" style="margin-right: 5px;"></i>再生
            </a>
          </div>
        </div>
      `)

    marker.addTo(this.map)
    this.musicPinMarkers.push(marker)
  }

  clearMusicPinMarkers() {
    this.musicPinMarkers.forEach(marker => {
      this.map.removeLayer(marker)
    })
    this.musicPinMarkers = []
  }

  // ヘルパーメソッド
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  showStatus(message, type) {
    if (this.hasStatusMessageTarget) {
      this.statusMessageTarget.textContent = message
      this.statusMessageTarget.className = `status-message status-${type}`

      if (type === 'success') {
        setTimeout(() => {
          this.statusMessageTarget.textContent = ''
          this.statusMessageTarget.className = ''
        }, 3000)
      }
    }
  }

  getMetaValue(name) {
    const element = document.querySelector(`meta[name="${name}"]`)
    return element && element.getAttribute("content")
  }
}

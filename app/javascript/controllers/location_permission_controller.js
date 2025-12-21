import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["permissionButton", "statusMessage"]

  connect() {
    console.log("Location Permission Controller connected")
    this.checkLocationPermission()
  }

  // 位置情報許可状態をチェック
  async checkLocationPermission() {
    if (!navigator.geolocation) {
      this.showMessage("お使いのブラウザは位置情報に対応していません", "error")
      return
    }

    try {
      // 位置情報許可状態を確認
      const permission = await navigator.permissions.query({ name: 'geolocation' })

      if (permission.state === 'granted') {
        this.hidePermissionButton()
        this.showMessage("位置情報が有効です - 近くの音楽を探しています", "success")
        this.loadNearbyMusic()
      } else if (permission.state === 'denied') {
        this.showPermissionButton()
        this.showMessage("位置情報がブロックされています - ブラウザ設定から許可してください", "warning")
      } else {
        this.showPermissionButton()
        this.showMessage("すれちがい通信をONにすると、近くの音楽を探せます", "info")
      }

      // 許可状態の変更を監視
      permission.addEventListener('change', () => {
        this.checkLocationPermission()
      })
    } catch (error) {
      console.error('Permission query failed:', error)
      this.showPermissionButton()
    }
  }

  // 位置情報許可をリクエスト
  async requestLocationPermission(event) {
    event.preventDefault()

    if (!navigator.geolocation) {
      this.showMessage("お使いのブラウザは位置情報に対応していません", "error")
      return
    }

    this.showMessage("位置情報の許可を確認中...", "info")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 位置情報取得成功
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        console.log('Location obtained:', latitude, longitude)
        this.hidePermissionButton()
        this.showMessage("位置情報が有効になりました！近くの音楽を探しています...", "success")

        // 近くの音楽を読み込む
        this.loadNearbyMusic(latitude, longitude)
      },
      (error) => {
        // 位置情報取得失敗
        console.error('Geolocation error:', error)

        switch(error.code) {
          case error.PERMISSION_DENIED:
            this.showMessage("位置情報が拒否されました。ブラウザ設定から許可してください", "error")
            break
          case error.POSITION_UNAVAILABLE:
            this.showMessage("位置情報を取得できませんでした", "error")
            break
          case error.TIMEOUT:
            this.showMessage("位置情報の取得がタイムアウトしました", "error")
            break
          default:
            this.showMessage("位置情報の取得に失敗しました", "error")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // 近くの音楽を読み込む
  async loadNearbyMusic(latitude, longitude) {
    try {
      // PlayerControllerに位置情報を渡して近くの音楽を取得
      const response = await fetch(`/player?latitude=${latitude}&longitude=${longitude}`)

      if (response.ok) {
        // ページをリロードして近くの音楽を表示
        window.location.href = `/player?latitude=${latitude}&longitude=${longitude}`
      } else {
        console.error('Failed to load nearby music')
        this.showMessage("近くの音楽の取得に失敗しました", "error")
      }
    } catch (error) {
      console.error('Error loading nearby music:', error)
      this.showMessage("近くの音楽の取得に失敗しました", "error")
    }
  }

  // 許可ボタンを表示
  showPermissionButton() {
    if (this.hasPermissionButtonTarget) {
      this.permissionButtonTarget.style.display = 'block'
    }
  }

  // 許可ボタンを非表示
  hidePermissionButton() {
    if (this.hasPermissionButtonTarget) {
      this.permissionButtonTarget.style.display = 'none'
    }
  }

  // ステータスメッセージを表示
  showMessage(message, type = 'info') {
    if (!this.hasStatusMessageTarget) return

    this.statusMessageTarget.textContent = message
    this.statusMessageTarget.className = `status-message ${type}`
    this.statusMessageTarget.style.display = 'block'

    // 色を設定
    const colors = {
      success: '#1DB954',
      error: '#FF6B6B',
      warning: '#FFA500',
      info: '#B3B3B3'
    }
    this.statusMessageTarget.style.color = colors[type] || colors.info
  }

  // メッセージを非表示
  hideMessage() {
    if (this.hasStatusMessageTarget) {
      this.statusMessageTarget.style.display = 'none'
    }
  }
}

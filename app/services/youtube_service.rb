require 'google/apis/youtube_v3'

class YoutubeService
  API_KEY = ENV['YOUTUBE_API_KEY']
  MUSIC_CATEGORY_ID = '10' # YouTube Music category

  def initialize
    @youtube = Google::Apis::YoutubeV3::YouTubeService.new
    @youtube.key = API_KEY
  end

  # 音楽検索
  # query: "{曲名} {アーティスト} Official Audio"
  # returns: Array of {video_id, title, channel_name, thumbnail, duration}
  def search_music(query, max_results: 20)
    return [] if query.blank?

    begin
      search_query = "#{query} Official Audio"

      response = @youtube.list_searches(
        'snippet',
        q: search_query,
        type: 'video',
        video_category_id: MUSIC_CATEGORY_ID,
        max_results: max_results,
        order: 'relevance'
      )

      video_ids = response.items.map { |item| item.id.video_id }.compact
      return [] if video_ids.empty?

      # 動画の詳細情報を取得（再生時間を含む）
      videos_response = @youtube.list_videos(
        'snippet,contentDetails',
        id: video_ids.join(',')
      )

      videos_response.items.map do |video|
        {
          video_id: video.id,
          title: video.snippet.title,
          channel_name: video.snippet.channel_title,
          thumbnail: video.snippet.thumbnails.medium.url,
          duration: parse_duration(video.content_details.duration),
          published_at: video.snippet.published_at
        }
      end
    rescue Google::Apis::Error => e
      Rails.logger.error "YouTube API error in search_music: #{e.message}"
      []
    end
  end

  # 日本のトレンド音楽取得
  # returns: Array of {video_id, title, channel_name, thumbnail, duration}
  def trending_music_japan(max_results: 20)
    begin
      response = @youtube.list_videos(
        'snippet,contentDetails',
        chart: 'mostPopular',
        region_code: 'JP',
        video_category_id: MUSIC_CATEGORY_ID,
        max_results: max_results
      )

      response.items.map do |video|
        {
          video_id: video.id,
          title: video.snippet.title,
          channel_name: video.snippet.channel_title,
          thumbnail: video.snippet.thumbnails.medium.url,
          duration: parse_duration(video.content_details.duration),
          published_at: video.snippet.published_at
        }
      end
    rescue Google::Apis::Error => e
      Rails.logger.error "YouTube API error in trending_music_japan: #{e.message}"
      []
    end
  end

  # 動画詳細取得
  # video_id: YouTube video ID
  # returns: Hash {video_id, title, channel_name, thumbnail, duration, description}
  def video_details(video_id)
    return nil if video_id.blank?

    begin
      response = @youtube.list_videos(
        'snippet,contentDetails',
        id: video_id
      )

      return nil if response.items.empty?

      video = response.items.first
      {
        video_id: video.id,
        title: video.snippet.title,
        channel_name: video.snippet.channel_title,
        thumbnail: video.snippet.thumbnails.high.url,
        duration: parse_duration(video.content_details.duration),
        description: video.snippet.description,
        published_at: video.snippet.published_at
      }
    rescue Google::Apis::Error => e
      Rails.logger.error "YouTube API error in video_details: #{e.message}"
      nil
    end
  end

  private

  # YouTube ISO 8601 duration (e.g., "PT4M33S") を秒数に変換
  def parse_duration(iso_duration)
    return 0 if iso_duration.blank?

    match = iso_duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    return 0 unless match

    hours = (match[1] || 0).to_i
    minutes = (match[2] || 0).to_i
    seconds = (match[3] || 0).to_i

    hours * 3600 + minutes * 60 + seconds
  end
end

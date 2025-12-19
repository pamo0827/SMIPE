class MusicPin < ApplicationRecord
  belongs_to :user

  # Pin types
  PIN_TYPES = %w[song album legacy_spotify].freeze

  # Validations
  validates :name, :latitude, :longitude, :location_name, presence: true
  validates :pin_type, inclusion: { in: PIN_TYPES }

  validates :latitude, numericality: {
    greater_than_or_equal_to: -90,
    less_than_or_equal_to: 90
  }
  validates :longitude, numericality: {
    greater_than_or_equal_to: -180,
    less_than_or_equal_to: 180
  }

  # YouTube pins require video_id
  validates :video_id, presence: true, if: -> { youtube_pin? }

  # Scopes
  scope :youtube_pins, -> { where(pin_type: ['song', 'album']) }
  scope :legacy_pins, -> { where(pin_type: 'legacy_spotify') }
  scope :songs, -> { where(pin_type: 'song') }
  scope :albums, -> { where(pin_type: 'album') }

  scope :near_location, ->(lat, lng, radius_km = 10) {
    where(
      "6371 * acos(cos(radians(?)) * cos(radians(latitude)) *
       cos(radians(longitude) - radians(?)) +
       sin(radians(?)) * sin(radians(latitude))) < ?",
      lat, lng, lat, radius_km
    )
  }

  scope :recent, -> { order(created_at: :desc) }
  scope :popular, -> { order(created_at: :desc) } # TODO: Add view count or like count

  # Helper methods
  def coordinates
    [latitude, longitude]
  end

  def youtube_pin?
    pin_type.in?(['song', 'album'])
  end

  def legacy_pin?
    pin_type == 'legacy_spotify'
  end

  def playable?
    youtube_pin? && video_id.present?
  end

  # Get YouTube embed URL
  def youtube_embed_url
    return nil unless video_id.present?
    "https://www.youtube.com/embed/#{video_id}"
  end

  # Get YouTube watch URL
  def youtube_watch_url
    return nil unless video_id.present?
    "https://www.youtube.com/watch?v=#{video_id}"
  end

  # Format duration (seconds) to mm:ss
  def formatted_duration
    return nil unless duration.present?

    minutes = duration / 60
    seconds = duration % 60
    format('%d:%02d', minutes, seconds)
  end
end

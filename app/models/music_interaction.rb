class MusicInteraction < ApplicationRecord
  belongs_to :user

  # Interaction types
  INTERACTION_TYPES = %w[like dislike play].freeze

  # Validations
  validates :video_id, presence: true
  validates :interaction_type, presence: true, inclusion: { in: INTERACTION_TYPES }
  validates :video_id, uniqueness: { scope: [:user_id, :interaction_type] }

  # Scopes
  scope :likes, -> { where(interaction_type: 'like') }
  scope :dislikes, -> { where(interaction_type: 'dislike') }
  scope :plays, -> { where(interaction_type: 'play') }
  scope :for_video, ->(video_id) { where(video_id: video_id) }
  scope :recent, -> { order(created_at: :desc) }

  # Helper methods
  def like?
    interaction_type == 'like'
  end

  def dislike?
    interaction_type == 'dislike'
  end

  def play?
    interaction_type == 'play'
  end
end

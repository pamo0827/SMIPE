class LibraryItem < ApplicationRecord
  belongs_to :user

  validates :video_id, presence: true, uniqueness: { scope: :user_id }
  validates :title, presence: true

  scope :recent, -> { order(created_at: :desc) }
end

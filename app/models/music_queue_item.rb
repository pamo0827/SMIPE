class MusicQueueItem < ApplicationRecord
  belongs_to :music_pin
  belongs_to :posted_by, class_name: 'User', foreign_key: 'posted_by_id'
  belongs_to :received_by, class_name: 'User', foreign_key: 'received_by_id', optional: true

  # Validations
  validates :status, inclusion: { in: %w[pending delivered] }
  validates :queue_position, presence: true, numericality: { only_integer: true, greater_than: 0 }

  # Scopes
  scope :pending, -> { where(status: 'pending') }
  scope :delivered, -> { where(status: 'delivered') }
  scope :ordered_queue, -> { order(queue_position: :asc) }

  # キューから次のアイテムを取得（FIFO）
  def self.next_in_queue
    pending.ordered_queue.first
  end

  # キューに追加（末尾）
  def self.add_to_queue(music_pin, user)
    max_position = maximum(:queue_position) || 0
    create!(
      music_pin: music_pin,
      posted_by: user,
      queue_position: max_position + 1,
      status: 'pending'
    )
  end

  # 配信済みとしてマーク
  def mark_as_delivered(receiver_user)
    update!(
      status: 'delivered',
      received_by: receiver_user,
      delivered_at: Time.current
    )
  end
end

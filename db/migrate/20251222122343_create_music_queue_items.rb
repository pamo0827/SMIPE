class CreateMusicQueueItems < ActiveRecord::Migration[8.0]
  def change
    create_table :music_queue_items do |t|
      t.references :music_pin, null: false, foreign_key: true
      t.references :posted_by, null: false, foreign_key: { to_table: :users }
      t.references :received_by, null: true, foreign_key: { to_table: :users }
      t.string :status, default: 'pending', null: false
      t.integer :queue_position, null: false
      t.datetime :delivered_at, null: true

      t.timestamps
    end

    add_index :music_queue_items, :status
    add_index :music_queue_items, :queue_position
    add_index :music_queue_items, [:status, :queue_position]
  end
end

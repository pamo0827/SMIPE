class CreateMusicInteractions < ActiveRecord::Migration[8.0]
  def change
    create_table :music_interactions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :video_id, null: false
      t.string :interaction_type, null: false # 'like', 'dislike', 'play'

      t.timestamps
    end

    # Ensure a user can only have one interaction type per video
    add_index :music_interactions, [:user_id, :video_id, :interaction_type],
              unique: true,
              name: 'index_music_interactions_on_user_video_type'
  end
end

class UpdatePlaylistLocationsForYoutube < ActiveRecord::Migration[8.0]
  def change
    # Rename table for clarity
    rename_table :playlist_locations, :music_pins

    # Add YouTube-specific columns
    add_column :music_pins, :video_id, :string
    add_column :music_pins, :channel_name, :string
    add_column :music_pins, :thumbnail_url, :string
    add_column :music_pins, :duration, :integer # Duration in seconds
    add_column :music_pins, :pin_type, :string, default: 'song' # 'song', 'album', or 'legacy_spotify'

    # Mark existing Spotify pins as legacy
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE music_pins
          SET pin_type = 'legacy_spotify'
          WHERE uri LIKE 'spotify:%'
        SQL
      end
    end
  end
end

class RemoveLocationFromMusicPins < ActiveRecord::Migration[8.0]
  def change
    remove_column :music_pins, :latitude, :float
    remove_column :music_pins, :longitude, :float
    remove_column :music_pins, :location_name, :string
  end
end

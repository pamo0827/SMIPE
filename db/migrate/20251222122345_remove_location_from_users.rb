class RemoveLocationFromUsers < ActiveRecord::Migration[8.0]
  def change
    remove_column :users, :latitude, :decimal
    remove_column :users, :longitude, :decimal
    remove_column :users, :location_name, :string
    remove_column :users, :last_location_update, :datetime
  end
end

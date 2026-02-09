class CreateLibraryItems < ActiveRecord::Migration[8.0]
  def change
    create_table :library_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :video_id
      t.string :title
      t.string :channel_name
      t.string :thumbnail_url

      t.timestamps
    end
    add_index :library_items, [:user_id, :video_id], unique: true
  end
end

class MigrateUsersToGoogle < ActiveRecord::Migration[8.0]
  def change
    # Remove Spotify-specific columns
    remove_column :users, :access_token, :string if column_exists?(:users, :access_token)
    remove_column :users, :refresh_token, :string if column_exists?(:users, :refresh_token)
    remove_column :users, :expires_at, :datetime if column_exists?(:users, :expires_at)

    # Add Google OAuth columns
    add_column :users, :email, :string unless column_exists?(:users, :email)
    add_column :users, :provider, :string, default: 'google' unless column_exists?(:users, :provider)
  end
end

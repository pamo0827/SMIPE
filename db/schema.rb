# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_02_05_073003) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "artists", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "library_items", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "video_id"
    t.string "title"
    t.string "channel_name"
    t.string "thumbnail_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "video_id"], name: "index_library_items_on_user_id_and_video_id", unique: true
    t.index ["user_id"], name: "index_library_items_on_user_id"
  end

  create_table "music_interactions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "video_id", null: false
    t.string "interaction_type", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "video_id", "interaction_type"], name: "index_music_interactions_on_user_video_type", unique: true
    t.index ["user_id"], name: "index_music_interactions_on_user_id"
  end

  create_table "music_pins", force: :cascade do |t|
    t.string "name"
    t.string "uri"
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "comment"
    t.string "first_track_uri"
    t.string "video_id"
    t.string "channel_name"
    t.string "thumbnail_url"
    t.integer "duration"
    t.string "pin_type", default: "song"
    t.index ["user_id"], name: "index_music_pins_on_user_id"
  end

  create_table "music_queue_items", force: :cascade do |t|
    t.integer "music_pin_id", null: false
    t.integer "posted_by_id", null: false
    t.integer "received_by_id"
    t.string "status", default: "pending", null: false
    t.integer "queue_position", null: false
    t.datetime "delivered_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["music_pin_id"], name: "index_music_queue_items_on_music_pin_id"
    t.index ["posted_by_id"], name: "index_music_queue_items_on_posted_by_id"
    t.index ["queue_position"], name: "index_music_queue_items_on_queue_position"
    t.index ["received_by_id"], name: "index_music_queue_items_on_received_by_id"
    t.index ["status", "queue_position"], name: "index_music_queue_items_on_status_and_queue_position"
    t.index ["status"], name: "index_music_queue_items_on_status"
  end

  create_table "playlists", force: :cascade do |t|
    t.string "name"
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "spotify_id"
    t.float "latitude"
    t.float "longitude"
    t.index ["user_id"], name: "index_playlists_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.string "session_id", null: false
    t.text "data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_sessions_on_session_id", unique: true
    t.index ["updated_at"], name: "index_sessions_on_updated_at"
  end

  create_table "users", force: :cascade do |t|
    t.string "uid"
    t.string "nickname"
    t.string "name"
    t.string "image"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email"
    t.string "provider", default: "google"
    t.string "password_digest"
    t.decimal "latitude"
    t.decimal "longitude"
    t.string "location_name"
    t.datetime "last_location_update"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "library_items", "users"
  add_foreign_key "music_interactions", "users"
  add_foreign_key "music_pins", "users"
  add_foreign_key "music_queue_items", "music_pins"
  add_foreign_key "music_queue_items", "users", column: "posted_by_id"
  add_foreign_key "music_queue_items", "users", column: "received_by_id"
  add_foreign_key "playlists", "users"
end

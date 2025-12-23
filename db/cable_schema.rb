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

ActiveRecord::Schema[8.0].define(version: 2025_12_22_122345) do
  create_table "artists", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
  end

  add_foreign_key "music_interactions", "users"
  add_foreign_key "music_pins", "users"
  add_foreign_key "music_queue_items", "music_pins"
  add_foreign_key "music_queue_items", "users", column: "posted_by_id"
  add_foreign_key "music_queue_items", "users", column: "received_by_id"
  add_foreign_key "playlists", "users"
end

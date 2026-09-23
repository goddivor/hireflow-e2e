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

ActiveRecord::Schema[8.1].define(version: 2026_09_23_000001) do
  create_table "answers", force: :cascade do |t|
    t.integer "byte_size", null: false
    t.datetime "created_at", null: false
    t.integer "duration_ms", null: false
    t.integer "invitation_id", null: false
    t.integer "question_index", null: false
    t.datetime "updated_at", null: false
    t.index ["invitation_id", "question_index"], name: "index_answers_on_invitation_id_and_question_index", unique: true
    t.index ["invitation_id"], name: "index_answers_on_invitation_id"
  end

  create_table "interview_templates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "organization_id", null: false
    t.json "questions", default: [], null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_interview_templates_on_organization_id"
  end

  create_table "invitations", force: :cascade do |t|
    t.integer "candidate_id", null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.integer "interview_template_id", null: false
    t.integer "invited_by_id", null: false
    t.integer "organization_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["candidate_id"], name: "index_invitations_on_candidate_id"
    t.index ["interview_template_id"], name: "index_invitations_on_interview_template_id"
    t.index ["invited_by_id"], name: "index_invitations_on_invited_by_id"
    t.index ["organization_id"], name: "index_invitations_on_organization_id"
  end

  create_table "magic_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.integer "invitation_id"
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.datetime "used_at"
    t.integer "user_id", null: false
    t.index ["invitation_id"], name: "index_magic_links_on_invitation_id"
    t.index ["token"], name: "index_magic_links_on_token", unique: true
    t.index ["user_id"], name: "index_magic_links_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
  end

  create_table "sms_codes", force: :cascade do |t|
    t.integer "attempts", default: 0, null: false
    t.string "code_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "used_at"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sms_codes_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.integer "organization_id", null: false
    t.string "password_digest", null: false
    t.string "phone"
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "email"], name: "index_users_on_organization_id_and_email", unique: true
    t.index ["organization_id"], name: "index_users_on_organization_id"
  end

  add_foreign_key "answers", "invitations"
  add_foreign_key "interview_templates", "organizations"
  add_foreign_key "invitations", "interview_templates"
  add_foreign_key "invitations", "organizations"
  add_foreign_key "invitations", "users", column: "candidate_id"
  add_foreign_key "invitations", "users", column: "invited_by_id"
  add_foreign_key "magic_links", "invitations"
  add_foreign_key "magic_links", "users"
  add_foreign_key "sms_codes", "users"
  add_foreign_key "users", "organizations"
end

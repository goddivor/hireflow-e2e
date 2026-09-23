# Every tenant-owned table carries organization_id; controllers always query through the current organization.
class CreateHiringSchema < ActiveRecord::Migration[8.1]
  def change
    create_table :organizations do |t|
      t.string :name, null: false
      t.string :slug, null: false, index: { unique: true }
      t.timestamps
    end

    create_table :users do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.string :role, null: false
      t.string :password_digest, null: false
      t.timestamps
      t.index %i[organization_id email], unique: true
    end

    create_table :interview_templates do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :title, null: false
      t.json :questions, null: false, default: []
      t.timestamps
    end

    create_table :invitations do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :interview_template, null: false, foreign_key: true
      t.references :candidate, null: false, foreign_key: { to_table: :users }
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "pending"
      t.datetime :completed_at
      t.timestamps
    end

    create_table :magic_links do |t|
      t.references :user, null: false, foreign_key: true
      t.references :invitation, foreign_key: true
      t.string :token, null: false, index: { unique: true }
      t.datetime :expires_at, null: false
      t.datetime :used_at
      t.timestamps
    end

    create_table :sms_codes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :code_digest, null: false
      t.integer :attempts, null: false, default: 0
      t.datetime :expires_at, null: false
      t.datetime :used_at
      t.timestamps
    end

    create_table :answers do |t|
      t.references :invitation, null: false, foreign_key: true
      t.integer :question_index, null: false
      t.integer :duration_ms, null: false
      t.integer :byte_size, null: false
      t.timestamps
      t.index %i[invitation_id question_index], unique: true
    end
  end
end

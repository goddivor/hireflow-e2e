class Organization < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :interview_templates, dependent: :destroy
  has_many :invitations, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }

  def to_param = slug
end

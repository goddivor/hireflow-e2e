class Invitation < ApplicationRecord
  STATUSES = %w[pending opened completed].freeze

  belongs_to :organization
  belongs_to :interview_template
  belongs_to :candidate, class_name: "User"
  belongs_to :invited_by, class_name: "User"
  has_many :answers, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }

  delegate :questions, to: :interview_template

  def all_answered? = answers.count == questions.size

  def complete!
    update!(status: "completed", completed_at: Time.current)
  end
end

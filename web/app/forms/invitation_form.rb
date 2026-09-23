class InvitationForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  attribute :phone, :string
  attribute :interview_template_id, :integer

  validates :name, :email, :phone, :interview_template_id, presence: true

  # Returns the invitation, or nil with errors copied onto the form.
  def save(organization:, invited_by:)
    return unless valid?

    template = organization.interview_templates.find_by(id: interview_template_id)
    return errors.add(:interview_template_id, "is not one of your templates") && nil unless template

    ActiveRecord::Base.transaction do
      candidate = organization.users.find_or_initialize_by(email: email.strip.downcase)
      if candidate.persisted? && !candidate.candidate?
        errors.add(:email, "belongs to a team member")
        raise ActiveRecord::Rollback
      end
      candidate.assign_attributes(name:, phone:, role: "candidate")
      candidate.password = SecureRandom.base58(24) if candidate.new_record?
      unless candidate.save
        candidate.errors.each { |error| errors.add(error.attribute, error.message) if respond_to?(error.attribute) }
        raise ActiveRecord::Rollback
      end

      invitation = organization.invitations.create!(interview_template: template, candidate:, invited_by:)
      UserMailer.interview_invitation(candidate.magic_links.create!(invitation:)).deliver_later
      invitation
    end
  end
end

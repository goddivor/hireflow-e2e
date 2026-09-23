require "rails_helper"

RSpec.describe InterviewTemplate do
  it "drops blank questions and trims the rest" do
    template = build(:interview_template, questions: ["  Why us?  ", "", "   "])

    expect(template.questions).to eq(["Why us?"])
  end

  it "needs at least one question" do
    template = build(:interview_template, questions: [""])

    expect(template).not_to be_valid
    expect(template.errors[:questions]).to eq(["need at least one question"])
  end

  it "cannot be deleted while invitations use it" do
    invitation = create(:invitation)

    expect(invitation.interview_template.destroy).to be(false)
    expect(invitation.interview_template.errors.full_messages).to eq(["Cannot delete record because dependent invitations exist"])
  end
end

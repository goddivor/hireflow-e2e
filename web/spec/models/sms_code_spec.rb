require "rails_helper"

RSpec.describe SmsCode do
  let(:candidate) { create(:user, :candidate) }

  it "stores a digest, never the code" do
    code = described_class.issue_for(candidate)

    expect(code).to match(/\A\d{6}\z/)
    expect(candidate.sms_codes.sole.code_digest).not_to include(code)
  end

  it "accepts the code once" do
    code = described_class.issue_for(candidate)
    sms_code = candidate.sms_codes.usable.sole

    expect(sms_code.verify(code)).to be(true)
    expect(candidate.sms_codes.usable).to be_empty
  end

  it "stops accepting guesses after five attempts" do
    code = described_class.issue_for(candidate)
    sms_code = candidate.sms_codes.usable.sole
    5.times { sms_code.verify("000000") unless code == "000000" }

    expect(candidate.sms_codes.usable).to be_empty
  end

  it "voids the previous code when a new one is issued" do
    described_class.issue_for(candidate)
    described_class.issue_for(candidate)

    expect(candidate.sms_codes.usable.count).to eq(1)
  end
end

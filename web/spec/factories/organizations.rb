FactoryBot.define do
  factory :organization do
    sequence(:name) { |n| "Acme Talent #{n}" }
    slug { "#{name.parameterize}-#{SecureRandom.hex(3)}" }
  end
end

FROM ruby:3.4-slim

RUN apt-get update -qq \
 && apt-get install --no-install-recommends -y build-essential libyaml-dev sqlite3 curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /rails
# The RSpec image builds with BUNDLE_WITHOUT="" and RAILS_ENV=test.
ARG BUNDLE_WITHOUT="development:test"
ARG RAILS_ENV="uat"
ENV BUNDLE_WITHOUT="${BUNDLE_WITHOUT}" \
    RAILS_ENV="${RAILS_ENV}"

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4

COPY . .

EXPOSE 3000
CMD ["sh", "-c", "bin/rails db:prepare && exec bin/rails server -b 0.0.0.0 -p 3000"]

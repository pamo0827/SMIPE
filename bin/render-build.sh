#!/usr/bin/env bash
# exit on error
set -o errexit

bundle install
bundle exec rails assets:precompile
bundle exec rails assets:clean

# Create data directory if it doesn't exist
mkdir -p /data

# Run database migrations
bundle exec rails db:migrate

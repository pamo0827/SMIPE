# config/initializers/omniauth.rb
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET'],
           scope: 'email,profile',
           prompt: 'select_account',
           image_aspect_ratio: 'square',
           image_size: 50,
           redirect_uri: 'http://localhost:3000/auth/google_oauth2/callback'
end

# 失敗時の処理
OmniAuth.config.on_failure = proc { |env|
  message_key = env['omniauth.error.type']
  error_description = env['omniauth.error']&.error_reason
  new_path = "/auth/failure?message=#{message_key}&error=#{error_description}"
  [302, {'Location' => new_path, 'Content-Type'=> 'text/plain'}, []]
}

# エラーハンドリング
OmniAuth.config.logger = Rails.logger 
Rails.application.routes.draw do
  # Chrome DevToolsの不要なリクエストを無視する
  get '/.well-known/appspecific/com.chrome.devtools.json', to: ->(env) { [204, {}, []] }

  root 'player#show'
  resources :locations, only: [:show, :update] do
    collection do
      get :reverse_geocode
    end
  end
  
  # Authentication routes
  get '/login', to: 'sessions#new', as: 'login'
  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy', as: 'logout'

  # Registration routes
  get '/signup', to: 'users#new', as: 'signup'
  post '/signup', to: 'users#create'

  # YouTube API routes
  get '/youtube/search', to: 'youtube#search'
  get '/youtube/trending', to: 'youtube#trending'
  get '/youtube/video/:id', to: 'youtube#video'
  get 'show', to: 'users#show'
  get "up" => "rails/health#show", as: :rails_health_check
  get '/static_pages/home', to: 'static_pages#home', as: 'static_pages_home'
  get '/terms', to: 'static_pages#terms', as: 'terms'
  get '/privacy', to: 'static_pages#privacy', as: 'privacy'
  get '/player', to: 'player#show', as: 'player_page'

  # グローバルキュー関連
  namespace :queue do
    post 'add', to: 'music_queue#add'
    get 'next', to: 'music_queue#next'
    get 'status', to: 'music_queue#status'
  end

  # 設定画面
  get '/settings', to: 'settings#show', as: 'settings'
  patch '/settings/update_username', to: 'settings#update_username'

  # modelsブランチのルート
  post 'save_playlist', to: 'player#save_playlist'
  post 'playlists/save', to: 'playlists#save'
  get 'playlist_locations', to: 'player#locations'

  # mainブランチのルート
  get 'playlists', to: 'playlists#index'
  get 'playlists/:id/tracks', to: 'playlists#tracks'
  patch 'player/update_selected_playlist', to: 'player#update_selected_playlist'
  resources :playlists, only: [:index] do
    member do
      get :tracks
    end
  end
  post '/player/add_track_to_playlist', to: 'player#add_track_to_playlist'
end
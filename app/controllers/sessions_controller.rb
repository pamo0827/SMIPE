class SessionsController < ApplicationController 
  def create
    auth = request.env["omniauth.auth"]

    unless auth[:uid]
      flash[:danger] = "連携に失敗しました"
      redirect_to root_url and return
    end

    user = User.find_by(uid: auth[:uid], provider: auth[:provider])

    if user
      # 既存ユーザーの情報を更新
      user.update(
        name: auth[:info][:name],
        email: auth[:info][:email],
        image: auth[:info][:image]
      )
      log_in(user)
      flash[:success] = "ログインしました"
      redirect_to player_page_path
    else
      # 新規ユーザーを作成
      new_user = User.new(
        uid: auth[:uid],
        provider: auth[:provider],
        name: auth[:info][:name],
        nickname: auth[:info][:name], # Google OAuthではnicknameの代わりにnameを使用
        email: auth[:info][:email],
        image: auth[:info][:image]
      )

      if new_user.save
        log_in(new_user)
        flash[:success] = "ユーザー登録成功"
        redirect_to player_page_path
      else
        flash[:danger] = "予期せぬエラーが発生しました"
        redirect_to root_url
      end
    end
  end 

  def failure
    error_message = case params[:message]
    when 'invalid_credentials'
      '認証情報が無効です。'
    when 'csrf_detected'
      'セキュリティエラーが発生しました。再度お試しください。'
    else
      '認証に失敗しました。'
    end
    
    flash[:danger] = error_message
    redirect_to root_url
  end

  def destroy
    log_out if logged_in?
    flash[:success] = "ログアウトしました"
    redirect_to root_url(logged_out: true)
  end 

  def login
    if logged_in?
      redirect_to player_page_path
    else
      render 'static_pages/home'
    end
  end
end
class SettingsController < ApplicationController
  before_action :require_login

  def show
    # 設定画面を表示
  end

  def update_username
    if current_user.update(name: params[:name])
      render json: { success: true, message: 'ユーザーネームを更新しました' }
    else
      render json: { success: false, error: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update_volume
    # 音量設定はフロントエンド（localStorage）で管理
    render json: { success: true, message: '音量を保存しました' }
  end

  def delete_account
    if current_user.destroy
      session[:user_id] = nil
      render json: { success: true, message: 'アカウントを削除しました', redirect: root_path }
    else
      render json: { success: false, error: 'アカウント削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  private

  def require_login
    unless logged_in?
      redirect_to login_path, alert: 'ログインが必要です'
    end
  end
end

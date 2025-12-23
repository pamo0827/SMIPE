class StaticPagesController < ApplicationController
  def home
    @hide_header = params[:logged_out] == 'true'
    if logged_in?
      redirect_to player_page_path
    end
  end

  def terms
    # 利用規約ページ
  end

  def privacy
    # プライバシーポリシーページ
  end
end

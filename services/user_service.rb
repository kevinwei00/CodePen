require "./models/user_twitter"

class UserService

  def handle_twitter_auth(user, auth_info)
    if user['_type'] == 'User'
      new_user = convert_anon_user(user, auth_info)
      ContentService.new.copy_ownership(old_user, new_user.uid)
    else
      update_regular_user(user, auth_info)
    end
  end

  def convert_anon_user(user, auth_info)
    new_user = Kernel.const_get(auth_info['provider'].capitalize + "User").new(auth_info)
    new_user.uid = auth_info['provider'] + auth_info['uid'].to_s
    new_user.save
    new_user
  end

  def update_regular_user(user, auth_info)
    if auth_info['nickname'] != user.nickname || auth_info['name'] != user.name
      user.nickname = auth_info['nickname']
      user.name = auth_info['name']
      user.save
      user
    end
  end

end

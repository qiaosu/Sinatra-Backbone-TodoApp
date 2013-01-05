#routes
get '/' do
  js :jquery_latest, :jquery_ui, :underscore, :backbone, :jquery_easing, :jquery_mousewheel, :jquery_customscrollbar, :date_format, :todo_app, :todo_task, :mod_drag, :timeline if logged_in?
  if current_user
    @lists = current_user.lists.all(:order => [:name])
  end
  haml :index
end

get '/signup' do
  haml :signup
end

post '/signup' do
  user = User.create(params[:user])
  user.password_salt = BCrypt::Engine.generate_salt
  user.password_hash = BCrypt::Engine.hash_secret(params[:user][:password], user.password_salt)
  if user.save
  	flash[:info] = "Thank you for registering #{user.email}"
  	session[:user] = user.token
  	redirect "/"
  else
  	session[:errors] = user.errors.full_messages
  	redirect "/signup?" + hash_to_query_string(params[:user])
  end
end

get '/login' do
  if current_user
    redirect_last
  else
    haml :login
  end
end

post '/login' do
  user = User.first(:email => params[:email])
  if user
  	if user.password_hash == BCrypt::Engine.hash_secret(params[:password], user.password_salt)
  	  session[:user] = user.token
      if params[:remember_me]
  	    response.set_cookie "user", {:value => user.token, :expires => (Time.now + 52*7*24*60*60)}
  	  end
  	  redirect_last
    else
      flash[:error] = "Email/Password combination does not match"
      redirect "/login?email=#{params[:email]}"
    end
  else
  	flash[:error] = "That email address is not recognised"
  	redirect "/login?email=#{params[:email]}"
  end
end

get '/logout' do
  current_user.generate_token
  response.delete_cookie "user"
  session[:user] = nil
  flash[:info] = "Successfully logged out"
  redirect '/'
end

post '/:id' do
  List.get(params[:id]).tasks.create params[:task]
  task = List.get(params[:id]).tasks.last
  task.to_json
end

get '/task/:id' do
  task = Task.get(params[:id])

  task.to_json
end

put '/task/:id' do
  task = Task.get(params[:id])
  task.completed_at = task.completed_at.nil? ? Time.now : nil
  task.save

  task.to_json
end

delete '/task/:id' do
  Task.get(params[:id]).destroy
  params[:id]
end

post '/new/list' do
  if logged_in?
    list = List.new(params['list'])
    list.user_id = current_user.id
    list.save
    redirect to('/')
  else 
    redirect to('/login')
  end
end

get '/list/:id' do
  tasks = List.get(params[:id]).tasks unless List.get(params[:id]).nil?

  tasks.to_json
end

delete '/list/:id' do
  List.get(params[:id]).destroy
  redirect to('/')
end

put '/list/:id' do
  list = List.get(params[:id])
  list.update(:name => params['list']['name'])
  list.save
  redirect to('/')
end

get '/annotation/:id' do
  annotations = Task.get(params[:id]).annotations unless Task.get(params[:id]).nil?
  annotations.each do |annote|
    annote.content = glorify annote.content
  end

  annotations.to_json
end

post '/new/annotation' do
  task = Task.get(params[:task])
  annote = task.annotations.create(:content => params[:content])
  task.update(:sub_annotations =>task.sub_annotations+1)

  annote = task.annotations.last
  annote.content = glorify annote.content
  annote.to_json
end
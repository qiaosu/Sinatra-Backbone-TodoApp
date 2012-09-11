helpers do
  include Rack::Utils
  alias_method :h, :escape_html
  
  # Convert a hash to a querystring for form population
  def hash_to_query_string(hash)
    hash.delete "password"
    hash.delete "password_confirmation"
    hash.collect {|k,v| "#{k}=#{v}"}.join("&")
  end

  # Redirect to last page or root
  def redirect_last
    if session[:redirect_to]
      redirect_url = session[:redirect_to]
      session[:redirect_to] = nil
      redirect redirect_url
    else
      redirect "/"
    end  
  end

  # Require login to view page
  def login_required
    if session[:user]
      return true
    else
      flash[:notice] =  "Login required to view this page"
      session[:redirect_to] = request.fullpath
      redirect "/login"
      return false
    end
  end

  # Require admin flag to view page
  def admin_required
    if current_user && is_admin?
      return true
    else
      flash[:notice] =  "Admin required to view this page"
      redirect "/"
      return false
    end
  end

  # Check user has admin flag
  def is_admin?
    !!current_user.admin?
  end

  # Check logged in user is the owner
  def is_owner? owner_id
    if current_user && current_user.id.to_i == owner_id.to_i
      return true
    else
      flash[:notice] =  "You are not authorised to view this page"
      redirect "/"
      return false
    end    
  end

  # Return current_user record if logged in
  def current_user
    return @current_user ||= User.first(:token => request.cookies["user"]) if request.cookies["user"]
    @current_user ||= User.first(:token => session[:user]) if session[:user]
  end

  # check if user is logged in?
  def logged_in?
    !!session[:user]
  end

  # Loads partial view into template. Required vriables into locals
  def partial(template, locals = {})
    erb(template, :layout => false, :locals => locals)
  end

  def path_to script
    #case script
      #when :jquery then 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'
      #when :rightjs then 'http://cdn.rightjs.org/right-2.3.0.js'
      #when :backbone then 'http://cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.0/backbone-min.js'
      #when :underscore then 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.1/underscore-min.js'
      #moo, prototype, scriptaculous, jquery ui, yui, dojo, raphael, extjs      
      #else "/javascripts/#{script}.js"
    #end
    "/javascripts/#{script}.js"
  end

  def javascripts(*args)
    js = []
    js << settings.javascripts if settings.respond_to?('javascripts')
    js << args
    js << @js if @js
    js.flatten.uniq.map do |script| 
      "<script src=\"#{path_to script}\"></script>"
    end.join
  end

  def js(*args)
    @js ||= []
    @js = args
  end

  # string2md5 
  class String
    def to_md5
      Digest::MD5.hexdigest(self)
    end
  end

  def get_gravatar
    gravatar = []
    gravatar << "https://secure.gravatar.com/avatar/"
    gravatar << current_user.email.to_md5
    gravatar << "?s=140&d=http://todo.decimage.com/img/gravatar-user-420.png"
    gravatar.join
  end

end

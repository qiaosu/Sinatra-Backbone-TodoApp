require 'rubygems'
require 'json'
require 'haml'
require 'sinatra'
require "sinatra/flash"
require "debugger"
require 'data_mapper'
require 'dm-sqlite-adapter'
require 'securerandom'
require 'bcrypt'
require 'glorify'

enable :sessions

require "./helpers"

DataMapper.setup(:default, ENV['DATABASE_URL'] || "sqlite3://#{Dir.pwd}/development.db")

class User
  include DataMapper::Resource

  attr_accessor :password, :password_confirmation

  property :id,           Serial
  property :email,        String, :required => true, :unique => true, :format => :email_address
  property :password_hash,Text
  property :password_salt,Text
  property :token,        String
  property :created_at,   DateTime
  property :admin,        Boolean, :default => false

  validates_presence_of         :password
  validates_confirmation_of     :password
  validates_length_of           :password, :min => 6

  has n, :lists 

  after :create do
    self.token = SecureRandom.hex
  end

  def generate_token
    self.update!(:token => SecureRandom.hex)
  end

  def admin?
    self.admin
  end

end

class List
  include DataMapper::Resource
  property :id,           Serial
  property :name,         String, :required => true
  has n, :tasks, :constraint => :destroy
end

class Task
  include DataMapper::Resource
  property :id,           Serial
  property :name,         String, :required => true
  property :created_at,   DateTime
  property :completed_at, DateTime
  property :sub_annotations, Integer, :default => 0
  belongs_to :list

  has n, :annotations
end

class Annotation
  include DataMapper::Resource
  property :id,           Serial
  property :content,      Text
  property :created_at,   DateTime
  belongs_to :task
end

DataMapper.finalize
DataMapper.auto_upgrade!

#routes
get '/' do
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
  list = List.new(params['list'])
  list.user_id = current_user.id
  list.save
  redirect to('/')
end

get '/list/:id' do
  tasks = List.get(params[:id]).tasks unless List.get(params[:id]).nil?

  tasks.to_json
end

delete '/list/:id' do
  List.get(params[:id]).destroy
  redirect to('/')
end

get '/annotation/:id' do
  annotations = Task.get(params[:id]).annotations unless Task.get(params[:id]).nil?
  annotations.each do |annote|
    annote.content = glorify annote.content
  end

  annotations.to_json
end
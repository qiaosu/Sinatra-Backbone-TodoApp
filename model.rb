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
  property :created_at,   DateTime
  property :closed_at,    DateTime
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

  has n, :annotations, :constraint => :destroy
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
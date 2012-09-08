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

require "./model"
require "./routes"
require "./helpers"
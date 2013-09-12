#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'json'

require 'sinatra'
require 'httparty'

set :session_secret, ENV["SESSION_KEY"] || 'too secret'

enable :sessions

get '/' do
  erb :index
end
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

get '/channels/:channel_id/current_track' do
  response.headers['Content-type'] = "application/json"

  @details = HTTParty.get("http://radiobox2.omroep.nl/track/search.json?q=channel.id:'" + params[:channel_id] + "'%20AND%20startdatetime%3CNOW%20AND%20stopdatetime%3ENOW'&order=startdatetime:desc&max-results=5")
  @details.to_json
end

get '/youtube/embed/:youtube_id' do
  response.headers['Content-type'] = "application/json"

  @details = HTTParty.get('http://www.youtube.com/oembed?url=http%3A//www.youtube.com/watch%3Fv%3D' + params[:youtube_id] + '&format=json')
  @details.to_json
end
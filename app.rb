require 'sinatra'
require 'json'
require 'omniauth'
require 'omniauth-twitter'
require_relative 'minify.rb'

Dir.glob("services/*.rb").each {|r| require_relative r }

class App < Sinatra::Base

  use Rack::Session::Cookie
  enable :sessions

  use OmniAuth::Builder do
    provider :twitter, ENV['TWITTER_KEY'], ENV['TWITTER_SECRET']
  end

  get '/hi' do
    "Hello World"
  end

  get '/' do
    @user = UserService.new().user_by_session(session[:user_id])
    @tbdb = get_tbdb()
    erb :index
  end

  get '/return/stuff/' do
    return "awesome"
  end

  post '/save/content' do
        {'success' => true}.to_json
  end

  def get_tbdb()
  # default instance of a tinker box
  # in the future, it will be loaded from db
  data = {
    "name" => "My kickass TB",
    "html" => "<div>Howdy, folks!</div>",
    "css"  => "body { background: #BADA55; }",
    "js"   => "var myString = 'Badda bing!';",
    "htmlOptions" => {
    "jade" => "",
    "haml" => ""
    },
    "cssOptions"  => {
      "less"   => "",
      "stylus"   => "",
      "scss"   => "",
      "sass"   => "",
      "prefixTree" => "/box-libs/prefixfree.min.js"
    },
    "jsOptions"   => {
    "coffeeScript" => "",
    "libraries" => [ ]
    }
  }

  return data.to_json.gsub('/', '\/')
  end

  get '/auth/:name/callback' do
  user_service = UserService.new
  user = user_service.first_or_new(request.env['omniauth.auth'])
  session[:user_id] = user._id
  redirect '/'
  end

  get '/auth/failure' do
  'Authentication Failed'
  end

  # PREPROCESSORS

  post '/process/html/' do
  preprocessor_service = PreProcessorService.new
  html = preprocessor_service.process_html(params[:type], params[:html])

  encode({'html' => html})
  end

  post '/process/css/' do
  preprocessor_service = PreProcessorService.new
  css = preprocessor_service.process_css(params[:type], params[:css])

  encode({'css' => css})
  end

  post '/process/js/' do
  preprocessor_service = PreProcessorService.new
  js = preprocessor_service.process_js(params[:type], params[:js])

  encode({'js' => js})
  end

  def encode(obj)
  obj.to_json.gsub('/', '\/')
  end

  get '/:slug/fullpage/' do
  # todo, will need to actually pull
  # the right data for the url
  @tbdb = get_tbdb()

  erb :fullpage
  end

    # PREPROCESSORS

  post '/process/' do
    pps = PreProcessorService.new
    results = { }

    if params[:html] != nil and !params[:html].empty?
      results['html'] = pps.process_html(params[:htmlPreProcessor], params[:html])
    end

    if params[:css] != nil and !params[:css].empty?
      results['css'] = pps.process_css(params[:cssPreProcessor], params[:css])
    end

    if params[:js] != nil and !params[:js].empty?
      results['js'] = pps.process_js(params[:jsPreProcessor], params[:js])
    end

    if pps.errors.length > 0
      @errors = pps.errors
      results['error_html'] = erb :errors
    end

    encode(results)
  end

  def encode(obj)	  	
    obj.to_json.gsub('/', '\/')	  	
  end

  get '/:slug/fullpage/' do
    # todo, will need to actually pull
    # the right data for the url
    @tbdb = get_tbdb()

    erb :fullpage
  end

  helpers do
    def get_templates
      {'result' => (erb :template)}.to_json.gsub('/', '\/')
    end
    def partial template
      erb template, :layout => false
    end
    def logged_in
      return session[:user_id]
    end
    def js_scripts(scripts)
      minify = Minify.new()
      minify.script_tags(scripts)
    end
    def close embedded_json
      embedded_json.gsub('</', '<\/')
    end
  end
  end

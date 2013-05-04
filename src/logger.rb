###############################################################################
## Logger :Borrowed form 
# module CollaborativeEditing
###############################################################################
## this class is an utility to print logs in console and into recovery file
##

class Logger

  # foreground color
  BLACK   = "\033[30m"
  RED     = "\033[31m"
  GREEN   = "\033[32m"
  BROWN   = "\033[33m"
  BLUE    = "\033[34m"
  MAGENTA = "\033[35m"
  CYAN    = "\033[36m"
  GRAY    = "\033[37m"

  # ANSI control chars
  RESET_COLORS   = "\033[0m"
  BOLD_ON        = "\033[1m"
  BOLD_OFF       = "\033[22m"
  BLINK_ON       = "\033[5m"
  BLINK_OFF      = "\033[25m"

  DELIMITER      = " !!! "

  attr_reader :lsn, :logfilename
  
  def initialize(levels = ['debug','info','warning','color'])
     @levels      = levels
  end

  def debug(message)
    return unless @levels.include?('debug')
    log_to_stdout message, 'd'
  end

  def info(message)
    return unless @levels.include?('info')
    log_to_stdout message
  end

  def warning(message)
    return unless @levels.include?('warning')
    log_to_stdout message, 'w'
  end

  private
    def log_to_stdout(message, level = 'i')
      colors = { i: BLUE, d: BROWN, r: MAGENTA, w: RED }
      color  = @levels.include?('color') ? colors[level.to_sym] : RESET_COLORS
      puts color + "(" + level + ") " + Time.now.to_s + " " + message.to_s + RESET_COLORS
    end

end

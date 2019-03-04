/*
 * Copyright (C) 2018 by Christian Jean.
 * All rights reserved.
 *
 * CONFIDENTIAL AND PROPRIETARY INFORMATION!
 *
 * Disclosure or use in part or in whole without prior written consent
 * constitutes an infringement of copyright laws which may be punishable
 * by law.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL
 * THE LICENSOR OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
  TODO Section - Some of the many things that remain to be done!
  ------------------------------------------------------------------
  Add a 'leniency' variable which will allow leniant execution (or 
  not). When set to leniant for example, the use of 'q.ref(...)'
  will not enforce that the parameter is already set. When not 
  leniant, a check wold ocurr and throw an exception if not found.
*/


const VERSION = '0.1.30';

const QUEUE_STATE = {
  PENDING: 0,
  STARTED: 1,
  FINISHED: 9
};

const TIMEOUT_DELAY = 1;  // milliseconds

var queues = [];
var logLevel = 0;  // 0=none, 1=info, 2=some, 3=full

//----------------------------------------------------------------------------------------

function PQueue() {
  this.deferred = [];
  this.caught = [];
  this.finals = [];

  this.stack = new PStack();
  this.state = QUEUE_STATE.PENDING;
}

PQueue.prototype.add = function() {
  var refs = 0;
  var len = arguments.length;

  if (len < 2) throw new Error("Need at least 2 arguments: PQueue.add(fn, [arguments, ...], callback);");
  if (typeof arguments[0] !== "function") throw new Error("First argument is not of type Function (deferred)!");
  if (typeof arguments[len-1] !== "function") throw new Error("Last argument is not of type Function (callback)!");
  
  var args = [];
  
  for (var i=1; i<len-1; i++) {
    if (arguments[i] instanceof PStackRef) refs++;
    args.push(arguments[i]);
  }
  
  var rt = (refs == 0 ? "" : ", " + refs + " ref" + (refs > 1 ? "s" : ""));
  var at = (len <= 2 ? "" : ", [" + (len - 2) + " arg" + (len-2 > 1 ? "s" : "") + rt + "]" );
  
  this.deferred.push({ fn: arguments[0], args: args, cb: arguments[len-1] });

  log(1, "PQueue.add(fn" + at + ", cb), deferred: " + this.deferred.length);
}

PQueue.prototype.catch = function() {
  if (typeof arguments[0] !== "function") throw new Error("First argument is not of type Function (catch)!");
  if (this.caught.length > 0) throw new Error("Only one PQueue.catch(fn) allowed (at this time)!");
  this.caught.push({ cb: arguments[0] });
}

PQueue.prototype.finally = function() {
  if (typeof arguments[0] !== "function") throw new Error("First argument is not of type Function (finally)!");
  this.finals.push({ cb: arguments[0] });
}

PQueue.prototype.toString = function() {
  return "Queue: state: " + this.state +
           ", stack: " + this.stack.getSize() +
           ", deferred: " + this.deferred.length + 
           ", caught: " + this.caught.length + 
           ", finals: " + this.finals.length + 
           ", debug: " + (logLevel > 0 ? true : false) +
           ", level: " + logLevel;
}

PQueue.prototype.exec = async function() {
  log(1, "Starting execution:");
  log(2, " > " + this.toString());
  
  this.state = QUEUE_STATE.STARTED;

  for (var i=0; i<this.deferred.length; i++) {
    var fn = this.deferred[i].fn;
    var cb = this.deferred[i].cb;
    var args = [];
    
    // construct our args array
    for (var a=0; a<this.deferred[i].args.length; a++) {
      if (this.deferred[i].args[a] instanceof PStackRef) {
        args.push(this.deferred[i].args[a].resolve());
      } else {
        args.push(this.deferred[i].args[a]);
      }
    }

    try {
      log(2, " > Invoking deferred " + i + ": w/" + args.length + " arg" + (args.length > 1 ? "s" : "")  + ", values: " + JSON.stringify(args));
      var data = await fn.apply(this, args);
      log(2, " > Received data: " + JSON.stringify(data));
      log(2, " > Invoking deferred callback");
      await cb.apply(this, [ this.stack, data ]);
    } catch (e) {
      log(2, " > ERROR: " + e);
      //setTimeout(queue.execCaught, TIMEOUT_DELAY, queue, e, 0);
    }
  }
}

PQueue.prototype.execDeferred = function(queue, i) {
  if (i < 0) throw new Error("Invalid 'deferred' reference index!");

  if (i >= queue.deferred.length) {
    log(1, " > Completed all deferred, now invoking finals!");
    setTimeout(queue.execFinals, TIMEOUT_DELAY, queue, 0);
    return;
  }

  log(3, " > ---------------------------------------------------------------");
  log(2, " > Invoking deferred #" + (i+1));

  var fn = queue.deferred[i].fn;
  var cb = queue.deferred[i].cb;
  var args = [];
    
  for (var a=0; a<queue.deferred[i].args.length; a++) {
    if (queue.deferred[i].args[a] instanceof PStackRef) {
      args.push(queue.deferred[i].args[a].resolve());
    } else {
      args.push(queue.deferred[i].args[a]);
    }
  }
    
  var fcb = function(error, data) {
    log(2, "Invoked deferred:");
    log(2, " > Error: " + JSON.stringify(error));
    log(2, " > Param: " + JSON.stringify(data));

    if (error) {
      log(1, " > Received error, deferring to caught chain!");
      setTimeout(queue.execCaught, TIMEOUT_DELAY, queue, error, 0);
    } else {
      try {
        var args = [ queue.stack ];

        log(3, " > Received " + (arguments.length) + " parameter" + (arguments.length > 1 ? "s" : ""));

        if (arguments.length === 1) {   // Support only one argument (no 'error')
          args.push(arguments[0]);
        } else
        if (arguments.length === 2) {   // Support the conventional "error-first" type of callback
          args.push(arguments[1]);
        } else 
        if (arguments.length > 2) {     // Support all additional params after the first two!
          for (var x=1; x<arguments.length; x++) {
            args.push(arguments[x]);
          }   
        }
        
        log(3, " > Now invoking callback w/ " + args.length + " arg" + (args.length > 1 ? "s" : "")  + ", values: " + JSON.stringify(args));
        cb.apply(this, args);
        log(3, " > " + queue);
        setTimeout(queue.execDeferred, TIMEOUT_DELAY, queue, ++i); // Now chain...
      } catch (error) {
        log(1, " > Received error while calling PQueue.add(..) callback, deferring to caught chain!");
        setTimeout(queue.execCaught, TIMEOUT_DELAY, queue, error, 0);
      }
    }
  }

  try {
    args.push(fcb);
    log(2, " > Invoking deffered w/ " + args.length + " arg" + (args.length > 1 ? "s" : "")  + ", values: " + JSON.stringify(args));
    fn.apply(this, args);
  } catch (e) {
    log(2, " > ERROR: " + e);
    setTimeout(queue.execCaught, TIMEOUT_DELAY, queue, e, 0);
  }
}

PQueue.prototype.execCaught = function(queue, e, i) {
  if (i < 0) throw new Error("Invalid 'caught' reference index!");

  if (i >= queue.caught.length) {
    log(1, " > Completed all caught, now invoking finals!");
    setTimeout(queue.execFinals, TIMEOUT_DELAY, queue, 0);
    return;
  }

  log(3, " > ---------------------------------------------------------------");
  log(2, " > Invoking caught #" + (i+1));

  var cb = queue.caught[i].cb;
  var args = [];
    
  try {
    args.push(queue.stack);
    args.push(e);
    log(3, " > Invoking deffered w/ " + args.length + " arg" + (args.length > 1 ? "s" : "")  + ", values: " + JSON.stringify(args));
    cb.apply(this, args);
    setTimeout(queue.execCaught, TIMEOUT_DELAY, queue, e, ++i); // Now chain...
  } catch (e) {
    log(1, " > ERROR: " + e);
  }
}
  
PQueue.prototype.execFinals = function(queue, i) {
  if (i < 0) throw new Error("Invalid 'finals' reference index!");

  if (i >= queue.finals.length) {
    log(1, " > Completed all finals, leaving!");
    return;
  }

  log(3, " > ---------------------------------------------------------------");
  log(2, " > Invoking finals #" + (i+1));

  var cb = queue.finals[i].cb;
  var args = [];
    
  try {
    args.push(queue.stack);
    log(3, " > Invoking deffered w/ " + args.length + " arg" + (args.length > 1 ? "s" : "")  + ", values: " + JSON.stringify(args));
    cb.apply(this, args);
    setTimeout(queue.execFinals, TIMEOUT_DELAY, queue, ++i); // Now chain...
  } catch (e) {
    log(2, " > ERROR: " + e);
  }
}

PQueue.prototype.getStack = function() {
  return this.stack;
} 

PQueue.prototype.ref = function(key) {
  log(3, "Adding stack reference to key: '" + key + "', stack: " + this.stack);
  return new PStackRef(this.stack, key);
}

PQueue.prototype.set = function(key, value) {
  this.stack.setValue(key, value);
} 

PQueue.prototype.get = function(key) {
  return this.stack.getValue(key);
}
 
//----------------------------------------------------------------------------------------

function PStackRef(stack, key) {
  if (!stack) throw new Error("A reference to a PQueue stack is requied!");
  if (!(stack instanceof PStack)) throw new Error("Argument 'stack' is not of type PStack!");

  if (!key) throw new Error("A valid name is required!");
  //if (!(key instanceof String)) throw new Error("Argument 'key' is not of type String!");
  
  this.stack = stack;
  this.key = key;
}

PStackRef.prototype.resolve = function() {
  return this.stack.getValue(this.key);
}

//----------------------------------------------------------------------------------------

function PStack() {
  this.size = 0;
  this.values = {};
}

PStack.prototype.getSize = function() {
  return this.size;
} 

PStack.prototype.setValue = function(key, value) {
  this.size++;
  this.values[key] = value;
  log(3, " > Setting stack key '" + key + "' as '" + value + "' (type " + (typeof value) + ")");
}

PStack.prototype.getValue = function(key) {
  var value = this.values[key];
  log(3, " > Getting stack key '" + key + "' as '" + value + "' (type " + (typeof value) + ")");
  return value;
}

PStack.prototype.toString = function() {
  return "[PStack] size: " + this.size + ", values: " + JSON.stringify(this.values);
}

//----------------------------------------------------------------------------------------

/**
 * Create a new promise queue.
 *
 * @author Christian Jean
 * @since  0.1.0
 */
function createQueue() {
  var q = new PQueue();
  queues.push(q);
  return q;
}


/**
 * Provide version information.
 *
 * @author Christian Jean
 * @since  0.1.0
 */
function version() {
  return VERSION;
}

/**
 * Boolean = true to log level 3, or false to turn off logging.
 * Number  = 0=none, 1=info, 2=some, 3=full
 */
function debug(level) {
  if (typeof level === 'boolean') logLevel = level ? 3 : 0;
  if (typeof level === 'number') logLevel = level >= 0 ? level : 0;
}

function toString() {
  var msg = "[jeach-pqueues] version: " + this.version() + ", queues: " + queues.length;
  
  if (arguments.length > 0) {
    for (var i=0; i<queues.length; i++) {
      msg += "\n  >> " + queues[i].toString();
    }
  }
  
  return msg;
}

function log() {
  if (logLevel === 0) return;

  var len = arguments.length;
  var lev = 3;
  var msg = null;

  switch (len) {
    case 1: 
      lev = 3;
      msg = arguments[0];
      break;
    case 2:
      lev = arguments[0];
      msg = arguments[1];
      break;
  }

  if (logLevel > 0 && logLevel >= lev && msg) {
    console.log("[" + new Date().toISOString() + "][" + lev + "]> " + msg);
  }
}
 

/**
 * Module export mapping!
 */
module.exports = (function() {
  return {
    version: version,
    debug: debug,
    createQueue: createQueue,
    toString: toString
  };
}());

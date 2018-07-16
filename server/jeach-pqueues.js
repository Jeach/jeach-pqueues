/*
 * Jeach Promise Queues for Node JS
 *
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


var QUEUE_STATE = {
  PENDING: 0,
  STARTED: 1,
  FINISHED: 9
};

var queues = [];

//----------------------------------------------------------------------------------------

function PQueue() {
  this.deferred = [];
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
  
  console.log("PQueue.add(fn" + at + ", cb);");
  
  this.deferred.push({ fn: arguments[0], args: args, cb: arguments[len-1] });
}

PQueue.prototype.toString = function() {
  return "Queue: state: " + this.state + ", stack: " + this.stack.getSize() + ", deferred: " + this.deferred.length;
}

PQueue.prototype.exec = function() {
  console.log("------------------------------------------------------------------");
  console.log("Starting execution:");
  console.log(" > " + this.toString());
  
  this.state = QUEUE_STATE.STARTED;
  
  for (var i=0; i<this.deferred.length; i++) {
    console.log(" > Invoking deferred " + (i + 1) + " of " + this.deferred.length);
    var fn = this.deferred[i].fn;
    var cb = this.deferred[i].cb;
    var args = [];
    
    args.push(this.stack); // first arg is our stack!
    
    for (var a=0; a<this.deferred[i].args.length; a++) {
      if (this.deferred[i].args[a] instanceof PStackRef) {
        args.push(this.deferred[i].args[a].resolve());
      } else {
        args.push(this.deferred[i].args[a]);
      }
    }
    
    console.log(" > Invoking w/ " + args.length + " arg" + (args.length > 1 ? "s" : "")  + ", values: " + JSON.stringify(args));

    cb.apply(this, args);
  }
  
  console.log("Completed");
}

PQueue.prototype.getStack = function() {
  return this.stack;
} 

PQueue.prototype.ref = function(key) {
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
  console.log(" > Setting stack key '" + key + "' as '" + value + "' (type " + (typeof value) + ")");
}

PStack.prototype.getValue = function(key) {
  var value = this.values[key];
  console.log(" > Getting stack key '" + key + "' as '" + value + "' (type " + (typeof value) + ")");
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
  return "PQueues v0.1.0";
}

function toString() {
  var msg = "length: " + queues.length;
  
  if (arguments.length > 0) {
    for (var i=0; i<queues.length; i++) {
      msg += "\n  >> " + queues[i].toString();
    }
  }
  
  return msg;
}
 

/**
 * Module export mapping!
 */
module.exports = (function() {
  return {
    version: version,
    createQueue: createQueue,
    toString: toString
  };
}());

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

var express = require('express');
var pq = require('./pqueues');

var app = express();

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

function deferred() {
  console.log("Deferred invoked:");
  console.log(" > Arguments : " + arguments.length);
}

function cb(stack) {
  console.log(" > Callback invoked");
  console.log(" > Stack     : " + stack);
  console.log(" > Arguments : " + arguments.length);
  
  for (var i=0; i<arguments.length; i++) {
    console.log(" > Arg " + i + ": " + arguments[i]);
  }
}

function cb2(stack) {
  console.log(" > Callback 2 invoked");
  console.log(" > Stack     : " + stack);
  console.log(" > Arguments : " + arguments.length);
  
  for (var i=0; i<arguments.length; i++) {
    console.log(" > Arg " + i + ": " + arguments[i]);
  }
  
  stack.setValue('Ref2', new Number(22));
  stack.setValue('Ref3', new String(33));
} 
 
console.log("Version: " + pq.version()); 
console.log("Queues: " + pq.toString());

var q1 = pq.createQueue(); 
q1.set('s1', "Stack data");
q1.add(deferred, q1.ref('s1'), '111111', cb);
q1.add(deferred, '222222', cb);       
q1.add(deferred, '333333', cb);
q1.add(deferred, cb);
q1.exec(); 

var q2 = pq.createQueue();
q2.add(deferred, '444444', cb2);
q2.add(deferred, q2.ref('Ref2'), '555555', q2.ref('Ref3'), cb2);
console.log("Queue stack: " + q2.getStack());
q2.exec();
console.log("Queue stack: " + q2.getStack());
 
console.log("Queues: " + pq.toString());
console.log("Queues: " + pq.toString(true));

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
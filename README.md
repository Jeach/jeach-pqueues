# Jeach PQueues (promise queues) [BETA]
A simple alternative to other complex Node.js Promise libraries.

## Disclaimer and Rational
I'm relatively new to the use of Promises. My initial introduction to them wern't so great. I found they were exceptionally confusing, the literature was extremely lacking, and more importantly there were no useful real-world examples.

This work was a result of some experiments and a few ideas thrown together over the span of a few hours. With the soul purpose of being able to continue to move forward with an initial project. In the end, I found it so simple and easy to use that I figured I should let others have access to it. Although, it should be considered (at this time anyway), unsafe for any production environment.

### Point in Case

As mentioned above, I found the literature of various Promise libraries to be lacking (to be nice). If you consider the following **simple** synchrnous Mongoose code:

    function getSomethingByID(arg1, callback) {
      Something.findById(id, callback);
    }

We all know that a single asynchronous call is easy to invoke. What is complicated is when we have **many** real-world asynchronous calls to make.

But the authors of these Promise libraries, will have something as such to *demonstrate* the power of their libraries:

    Q
    .try(function () {
        if (!isConnectedToCloud()) {
            throw new Error("The cloud is down!");
        }

        return syncToCloud();
    })
    .catch(function (error) {
        console.error("Couldn't sync to the cloud", error);
    });

But they will **NEVER** show you real-world, complex examples of their libraries. Why? And if you navigate over to Stackoverflow for some help, you suddenly realize there are thousands of confused developers.

In short, I was stunned by the lack of proper literature and support for all of these Promise libraries. And when I actually attempted to use them for myself (I chose to use 'Q') ... well that was total confusion and frustration. So out of immadiate need to move on with my project, I came up with my own implementation of promises which I now call **jeach-pqueues** (promise queues). I believe it has a much more elegant API (no function chaining) and is essentially much easier to understand and use.

## Tutorial and Real-World Examples

I've started to write a tutorial with real-world examples where I describe the step-by-step (work in progress). If you navigate over to [jeach-pqueues-tutorial](https://glitch.com/edit/#!/jeach-pqueues-tutorial?path=README.md:1:0) over on **Glitch.com**, you will see the sample code and also be able to run the examples. You can even Remix the project for your own purpose.

## Getting Started

First, you need to install the **jeach-pqueues** module, by doing the following:

`npm --save install jeach-pqueues`

Next, you can start to use **jeach-pqueues** in your code as follows:

`const pq = require('jeach-pqueues');`

Here is an example of how the **jeach-pqueues** library would be used. I will go into further detail later on:

    var q = pq.createQueue();
    
    q.add(doFoo, param1, param2, function(stack, data) {
       // ...
       stack.setValue('param2', new Number(data.val1 * data.val2);
    });
    
    q.add(doBar, param1, q.ref('param2'), function(stack, data) {
       // ...    
    });
    
    q.add(doBaz, function(stack, data) {
       // ...    
    });
    
    q.catch(function(stack, error) {
       // Error handling 1
    });
    
    q.finally(function(stack) {
       // Finally 1
    });
     
    q.exec();

So as can be observed with the code above, instead of chaining with a `.then(...)` function, you simply need to `add(...)` your deferred function to the call queue. You can add as many as you like. 

Notice how the code seems to breath and seems to be much more cleaner than chaining?

The code signature for the `add(...)` function is as follows:

    q.add(fn, [param1, ...], cb(stack, data));

Where:

1. `fn` parameter is any standard **async** function you would like to call.
2. `param1` (and any others) are the *optional* parameters which will be passed to the `fn` function when invoked. These are entirely dependent on the `fn` API and how you would like to use it. If no parameter is required, none are provided.
3. `cb` is the **jeach-pqueue** callback which will be called if and only if the call to `fn` is successfull. If an error occurs or an exception is thrown, it will be caught by **jeach-pqueue** and the **caught** callbacks will be invoked instead.

For the purpose of providing an example, lets say you would like to call an async function called `writeToFile` which accepts three parameters; (1) a file descriptor (`fd`), (2) a buffer (`buf`), and (3) as expected of all async functions, an **"error-first"** callback function (`cb`).

So normally (without promises), you would invoke `writeToFile` like this:

    writeToFile(fd, buf, function(err, data) {
       // This gets called async, with
       // 'err' set to a value on error, or
       // 'data' containing a value on success
       // This type of callback is pretty much standard in the async world
    });

**Note**: Callbacks are heavily dependent on convention, the most common of which is the **“error-first”** callback passed as the **final** parameter (after the `fd` and `buf` parameters in our example above). By virtue of its name, an error-first callback is a function that takes an *error* object as its first parameter (or a falsey value if no error was encountered) and then any return values as subsequent parameters.

If you would like to learn more on this, you should read [The Node.js Way - Understanding Error-First Callbacks](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/) which explains the history and convention behind this.

The way you would **add** `writeToFile` to the **jeach-pqueue** library is as follows:

    q.add(writeToFile, fd, buf, function(stack, data) {
       // This gets called async, with 
       // 'stack' of this promise queue
       // 'data' containing a value on success
       // If there are **any** errors, the **catch** handlers would be called instead
    });

There is a small advantage to the **jeach-pqueue** library. You are not limited to a *standard* callback of `error` and `data` (two parameters). If the async function you are calling only returns `data` (a single parameter), the library will automatically detect this and still provide the `stack` and `data` as shown above. Additionally, if the async function you are calling returns more parameters than the *standard* `error` and `data` (ie: `cb(err, data1, data2, data3, ...)`), your **jeach-pqueue** callback could look like the following:

    q.add(writeToFile, fd, buf, function(stack, data1, data2, data3, data4) {
       // Use all the 'data' params, they will be available to you
    });

This is because the libaray automatically detects that there are additional parameters and they are provided on the call stack as well. If you look at the [Tmp package](https://www.npmjs.com/package/tmp) on the **NPM JS** page, you will see that the following function falls under this scenario:

    tmp.file(config, function _tempFileCreated(err, path, fd) {
       // Temp file callback with 3 parameters (2 after the 'err' param)
    });

With the **jeach-pqueue** library, there is no problem handling this, with this real-world example:

    var config = { prefix: 'prefix-', postfix: '.tmp', detachDescriptor: true };
    
    q.add(tmp.file, config, function (stack, path, fd) {
       stack.setValue('path', path);
       stack.setValue('fd', fd);
    });
    
    q.catch(function(stack, error) {
       // log("Error: " + error.code);
       // res.json({ success: false, error: error.code, logs: logs }); 
    });

In the example above, we use an additional (3rd param) which is `fd`, for which we successfully use in the callback. Should an error occur during the creation of the temporary file, the **catch** handler would be called instead.

Let's move forward...

By now you will have noticed the `stack` parameter in the callback function. The `stack` is essentially an instance of a `PStack` object which is associated with each instance of a promise queue.

It essentially serves three purpose:

1. To add key/value pairs to it (optional).
2. To get key/value pairs from it (optional).
3. To reference a value by providing the 'key' in a deferred call (ie: `q.ref('param2')`). When your `doBar` function is actually called, the value for the *param2* key will be resolved and provided as a parameter to your function.

You can use the stack to set any data to it and they will be available at any time during invokation of your function and/or within your callbacks. You can also read any previously set data from the stack. But more importantly, you can **reference** a future value at any time (even if the actual value hasn't yet been added to the stack).

Here is a real-world example of how I use it in a `POST /account` API:

    q.add(createAccount, username, function(stack, account) {
       console.log("We have successfully created an account entry in the database!");
       console.log("Password: " + JSON.stringify(account));
       stack.set('id', account.id);
    });
    
    q.add(createPassword, q.ref('id'), username, password, function(stack, password) {
       console.log("We have successfully created a password entry in the database!");
       console.log("Password: " + JSON.stringify(password));
    });
    
    q.add(createProfile, q.ref('id'), fname, lname, function(stack, profile) {
       console.log("We have successfully created a profile entry in the database!");
       console.log("Profile: " + JSON.stringify(profile));
    });
    
    q.add(createAction, q.ref('id'), function(stack, action) {
       console.log("We have successfully created an action entry in the database!");
       console.log("Action: " + JSON.stringify(action));
       stack.set('actionId', action.id);  // set the randomly generated SHA-256 ID to confirm account creation
    });
    
    q.add(sendConfirmationEmail, q.ref('actionId'), fname, function(stack, email) {
       console.log("We have successfully sent an account confirmation email using the action ID");
       console.log("email: " + JSON.stringify(email));  // model to reference the email that was sent (to resend)
    });

    q.catch(function(stack, error) {
        response.status(error.code).json({ success: false, error: { ... } );
    });
    
    q.finally(function(stack) {
       response.json({ success: true, data: { ... } );
    });

    q.exec();

So the above outlines how I use the 'jeach-pqueues' library for a single `POST /account` web service which allows me to create a new user account.

I do realize that the use of the `PStack` instance may be somewhat '*different*' than many may have passed around data generated in other calls. I personally find it much more cleaner this way than to declare a bunch of variables which only get set later on. So far this works ... we'll see if it is required in subsequent version of the library.

## Queues

**Note**: The following code has not yet been written yet. They are ideas I have been tinkering with to see how the following ideas can be designed and implemented.

So you may be wondering why we must create a queue with `const q = pq.createQueue();`? The rational is actually quite simple ... I intend to provide for '*parallel*' asynchronous processing. What!? What is that all about? Well, let me explain.

There are times where various steps must be executed in a serial fasion. For example, let's assume that you have a series of database steps from 1 to 7. And as in most use cases, steps 1 and 2 and 6 and 7 **must** be executed serially since one depends on the state of the privious step.

But there are times where other steps, such as steps 3, 4 and 5 are '*independant*' to each other, BUT dependant on the result of steps 1, 2 and 6, 7.

In such cases, you could do the following way:

    var q1 = pq.createQueue();  // steps 1, 2, 6, 7
    var q2 = pq.createQueue();  // steps 3, 4 and 5
    
    q1.add(step1, function(stack, data) { ... });
    q1.add(step2, function(stack, data) { ... });
    
    q2.add(step3, function(stack, data) { ... });
    q2.add(step4, function(stack, data) { ... });
    
    q2.catch(function(stack, errror) {
       // You could simply:
       //   (a) do nothing and delegate to q1.catch(..)
       //   (b) only rollback DB steps 3, 4 and 5 here
       // The q1.catch(..) will be invoked after this one
    });
    
    q1.add(q2, function(stack, data) { 
       // Would only get called IF all of steps 3, 4 and 5 succeeded
       // You couls simply:
       //   (a) do nothing and delegate to q1.finally(..)
       //   (b) commit steps 3, 4 and 5 if they were independant DB transaction
    });
    
    q1.add(step6, function(stack, data) { ... });
    q1.add(step7, function(stack, data) { ... });
    
    q1.exec();

The general idea here is that a `PQueue` by default will invoke queued deffered function calls serially even when they are asynchronous. But when a `PQueue` gets added to another queue, it wil:

1. Be executed automatically by the parent queue (ie: no need for `q2.exec();`) to be called.
2. It looses it's asynchronous *serial* execution status and becomes asynchronous *parallel* execution. This, at first glance would seem to counter any logic, right? Why even add it manage it under a Promise framework if you are going to do asynch execution? Well simply because it allows us to do two things:

1. Serialize a group of two or more steps within the execution of other serialized steps.
2. Ensure that ALL of the steps within the child queue have succeeded; if not, it ALL fails

Trying to illustratie it, execution would look something like this:

    [step1] -> [step2] -> [step3]
                          [step4]
                          [step5] -> [step6] -> [step7]

Where the 'x' axis is time.
    
But maybe using a `PQueue` is a bad idea? Maybe, we should create another type of object to clearly distinguish the differnce in execution. We'll see I guess.

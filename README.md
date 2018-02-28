# Jeach's Promise Queues (jeach-pqueues) [BETA]
A simple alternative to other complex Node.js Promise libraries.

## Disclaimer and Rational
I'm relatively new to the use of Promises. My initial introduction to them wern't so great. I found they exceptionally confusing and more importantly, I found the literature was extremely lacking.

This work was a result of a few hours worth of effort put together so that I could continue moving forward with my project. It should be considered, at this time, unsafe for any production environment. It is essentially a few ideas that were thrown together in a few hours and may prove not to be feasible in the future.

### Point in Case

As mentioned above, I found the literature of various Promise libraries to be lacking (to be nice). If you consider the following **simple** synchrnous Mongoose code:

    function getSomethingByID(arg1, callback) {
      Something.findById(id, callback);
    }

We all know that a single asynchronous call is easy to make a process. What is complicated is when we have **many** real-world asynchronous calls to make.

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

In short, I was stunned by the lack of proper literature and support for all of these Promise libraries. And when I actually attempted to use them for myself (I chose to use 'Q') ... well that was total confusion and frustration. So out of frustration and absolutely needing to move on with my project, I came up with my jeach-pqueues (promise queues). Which I believe has a much more elegant API (no function chainging) and are much easier to use.

## Getting Started

**Note**: I realize I have yet to commit my code! But I want to write a short guide before I do so. I will be submitting my code in the next week or so.

First, you need to install the `jeach-pqueues` module, by doing the following:

`npm --save install jeach-pqueues`

Next, you can use `jeach-pqueues` in your code as follows:

`const pq = require('jeach-pqueues');`

Here is an example of how the `jeach-pqueues` library would be used. I will go into further details later on:

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
        
    q.finally(function(stack) {
       // Finally 2
    });
    
    q.exec();

So as can be observed with the code above, instead of chaining with a `.then(...)` function, you simply need to **add** your deferred function to the queue. You can add as many as you like. Notice how the code seems to breath and seems to be much more cleaner than chaining?

You may have noticed the `stack` parameter of you callback function. The `stack` is essentially an instance of a `PStack` object which is associated with each promise queue.

It serves three purposes:

1. To add key/value pairs to it at any time.
2. To get key/value pairs to it at any time.
3. To reference a value by providing the 'key' in a deferred call (ie: `q.ref('param2')`). When your `doBar` function is actually called, the value for the *param2* key will be resolved and provided as parameter to your function.

You can use the stack to set any data to it and they will be available at any time during invokation of your function and/or within your callbacks. You can also read any previously set data from the stack. But more importantly, you can **reference** a future value. Here is a real-world example of how I use it in a `POST /account` API:

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

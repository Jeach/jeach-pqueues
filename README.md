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

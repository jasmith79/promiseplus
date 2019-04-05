# PromisePlus

## NOTE: WIP

Adds a thenable with added capabilities: cancellation, timeouts, finally, lazy initialization, etc.

## Rationale

Native Promises are *slowly* starting to gain some sorely needed abilities but remain inadequate even for their flagship use case (i.e. representing the value of an AJAX request). There are some *great* Promise libraries in existence like Bluebird, but Bluebird made some (totally reasonable) design decisions that aren't quite what I'm looking for. This is small and simple enough to get the job done, and has the slightly different semantics I wanted.

## Drop the Burrito

Native Promises auto-flatten by default (you can't have a Promise of a Promise of a thing, it just becomes a `Promise<Thing>`). This is arguably a mistake, since it means Promises are not Monads and thus cannot be fed to code that expects that interface. Despite the disadvantages, I've kept the auto-flattening semantics for the sake of least surprise.
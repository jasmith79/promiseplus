/// <reference path='jasmine.d.ts'
import 'jasmine';

import { LazyPromisePlus } from '../src/promiseplus';

const identity = (x: any): any => x;

describe('LazyPromisePlus', () => {
  describe('Happy path works as expected', () => {
    it('has a then works as expected with 1 arg', (done) => {
      const p = new LazyPromisePlus((res) => setTimeout(res, 0, 'foo'));
      p
        .then((t) => {
          expect(t).toBe('foo');
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });

    it('has a then works as expected with 2 args', (done) => {
      const err = new Error('bar');
      const p = new LazyPromisePlus((_, rej) => rej(err));
      p
        .then(
          () => done.fail(new Error('Should not hit this.')),
          (error) => {
            expect(error).toBe(err);
            done();
          },
        )
        .catch((error) => {
          done.fail(error);
        });
    });

    it('has a catch works as expected', (done) => {
      const err = new Error('bar');
      const p = new LazyPromisePlus((_, rej) => rej(err));
      p.catch((error) => {
        expect(error).toBe(err);
        done();
      });
    });
  });

  describe('finally works as expected', () => {
    it('always runs on a completed promise', (done) => {
      let count = 0;
      const a = LazyPromisePlus.of(3).finally(() => count++);
      const b = LazyPromisePlus.reject(new Error('foo')).finally(() => count++).catch((x) => x);
      Promise.all([a, b])
        .then(([x, y]) => {
          expect(count).toBe(2);
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });

    it('should contain the value of the settled promise.', (done) => {
      let count = 0;
      const a = LazyPromisePlus.of(3).finally(() => count++);
      const b = LazyPromisePlus.reject(new Error('foo')).finally(() => count++).catch((x) => x);
      Promise.all([a, b])
        .then(([x, y]) => {
          expect(count).toBe(2);
          expect(x).toBe(3);
          expect((y as Error).message).toBe('foo');
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });
  });

  describe('Cancellation works as expected', () => {
    it('Cancelled Promise before thened does not call callback', (done) => {
      let counter = 0;
      const incr = () => counter++;
      const p = new LazyPromisePlus((res) => res(incr()));
      p.cancel('thanks anyway');
      p
        .then(() => done.fail(new Error('Should not hit this.')))
        .catch((err) => {
          expect(err.message).toBe('thanks anyway');
          expect(counter).toBe(0);
          done();
        });
    });

    it('Cancelled Promise after then but before resolution rejects', (done) => {
      const p = new LazyPromisePlus((res) => setTimeout(res, 500, 7));
      p
        .then(() => done.fail(new Error('Should not hit this.')))
        .catch((err) => {
          expect(err.message).toBe('Cancelled PromisePlus.');
          done();
        });
      p.cancel();
    });

    it('Cancelled Promise after then but before rejection rejects with cancel error, not rejection err', (done) => {
      const p = new LazyPromisePlus((_, rej) => setTimeout(rej, 500, new Error('foo')));
      p
        .then(() => done.fail(new Error('Should not hit this.')))
        .catch((err) => {
          expect(err.message).toBe('Cancelled PromisePlus.');
          done();
        });
      p.cancel();
    });

    it('Cancel on a completed promise is a noop', (done) => {
      const p = new LazyPromisePlus((res) => res(true));
      p.then((t) => {
        expect(t).toBe(true);
        p.cancel();
        return t;
      })
      .then((t) => {
        expect(t).toBe(true);
        expect(p.isCancelled).toBe(false);
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
    });

    it('Should not call the initial callback if the Promise is cancelled before init', (done) => {
      let count = 0;
      const p = new LazyPromisePlus((resolve) => {
        count++;
        resolve(3);
      });
      p.cancel('hiya');
      p
        .then((res) => {
          done.fail(new Error('Shouldn\'t see this.'));
        })
        .catch((err) => {
          expect((err as Error).message).toBe('hiya');
          expect(count).toBe(0);
          done();
        });
    });

    it('propagates cancellations downward but not upward', (done) => {
      const p = new LazyPromisePlus((res) => setTimeout(res, 5, 7));
      const p2 = p.then(identity);
      const p3 = p2.then(identity);
      Promise.all([p, p2.catch(identity), p3.catch(identity)])
        .then(([one, two, three]) => {
          expect(one).toBe(7);
          expect((two as Error).message).toBe('Cancelled PromisePlus.');
          expect((three as Error).message).toBe('Cancelled PromisePlus.');
          done();
        })
        .catch((err) => {
          done.fail(err);
        });

      p2.cancel();
    });
  });

  describe('Timeout works as expected', () => {
    it('Rejects at timeout time', (done) => {
      const p = new LazyPromisePlus((res) => setTimeout(res, 5), 1);
      setTimeout((promise) => {
        promise
          .then(() => done.fail(new Error('Should not hit this.')))
          .catch((err: Error) => {
            expect(err.message).toBe('Promise reached timeout of 1 milliseconds.');
            done();
          });
      }, 7, p);
    });

    it('Resolved promise does not timeout', (done) => {
      const p = new LazyPromisePlus((res) => setTimeout(res, 1, 'foo'), 5);
      p
        .then((t) => {
          expect(t).toBe('foo');
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });

    it('Cancelled promise is rejected with cancellation, not timeout', (done) => {
      const p = new LazyPromisePlus((res) => setTimeout(res, 5), 1);
      p.catch(() => {}); // need the catch to avoid unhandled promise rejection
      setTimeout(() => {
        p
          .then(() => done.fail(new Error('Should not hit this.')))
          .catch((err) => {
            expect(err.message).toBe('cancelling...');
            done();
          });
      }, 7);
      p.cancel(new Error('cancelling...'));
    });
  });

  it('has a toPromise that exposes underlying Promise', (done) => {
    const p = new LazyPromisePlus((res) => setTimeout(res, 1, 'foo'), 5);
    const promise = p.toPromise();
    expect(promise instanceof Promise).toBe(true);
    promise
      .then((t) => {
        expect(t).toBe('foo');
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
  });

  it('has a class method for converting an existing Promise to a LazyPromisePlus', (done) => {
    const a = new Promise((res) => {
      setTimeout(res, 5, 'foo');
    });

    const b = LazyPromisePlus.of(a);
    const d = LazyPromisePlus.of(a);
    const e = d.catch((x) => x);
    d.cancel();

    Promise.all([
      a,
      b,
      e,
    ])
      .then(([x, y, z]) => {
        expect(x).toBe('foo');
        expect(y).toBe('foo');
        expect(z && (z as Error).message).toBe('Cancelled PromisePlus.');
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
  });

  it('has class methods for immediately resolving/rejecting a LazyPromisePlus', (done) => {
    const a = LazyPromisePlus.resolve(3);
    const b = LazyPromisePlus.reject(new Error('foo')).catch((x) => x);
    Promise.all([a, b])
      .then(([x, y]) => {
        expect(x).toBe(3);
        expect(y && (y as Error).message).toBe('foo');
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
  });
});

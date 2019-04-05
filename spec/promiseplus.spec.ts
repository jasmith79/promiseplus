/// <reference path="jasmine.d.ts"
import "jasmine";

import { PromisePlus } from "../src/promiseplus";

const identity = (x: any): any => x;

describe("PromisePlus", () => {
  describe("Happy path works as expected", () => {
    it("has a then works as expected with 1 arg", (done) => {
      const p = new PromisePlus((res) => setTimeout(res, 0, "foo"));
      p
        .then((t) => {
          expect(t).toBe("foo");
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });

    it("has a then works as expected with 2 args", (done) => {
      const err = new Error("bar");
      const p = new PromisePlus((_, rej) => rej(err));
      p
        .then(
          () => done.fail(new Error("Should not hit this.")),
          (error) => {
            expect(error).toBe(err);
            done();
          },
        )
        .catch((error) => {
          done.fail(error);
        });
    });

    it("has a catch works as expected", (done) => {
      const err = new Error("bar");
      const p = new PromisePlus((_, rej) => rej(err));
      p.catch((error) => {
        expect(error).toBe(err);
        done();
      });
    });
  });

  describe("finally works as expected", () => {
    it("always runs on a completed promise", (done) => {
      let count = 0;
      const a = PromisePlus.of(3).finally(() => count++);
      const b = PromisePlus.reject(new Error("foo")).finally(() => count++).catch((x) => x);
      Promise.all([a, b])
        .then(([x, y]) => {
          expect(count).toBe(2);
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });

    it("should contain the value of the settled promise.", (done) => {
      let count = 0;
      const a = PromisePlus.of(3).finally(() => count++);
      const b = PromisePlus.reject(new Error("foo")).finally(() => count++).catch((x) => x);
      Promise.all([a, b])
        .then(([x, y]) => {
          expect(count).toBe(2);
          expect(x).toBe(3);
          expect((y as Error).message).toBe("foo");
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });
  });

  describe("Cancellation works as expected", () => {
    it("Cancelled Promise after creation but before resolution rejects", (done) => {
      const p = new PromisePlus((res) => setTimeout(res, 500, 7));
      p
        .then(() => done.fail(new Error("Should not hit this.")))
        .catch((err) => {
          expect(err.message).toBe("");
          done();
        });
      p.cancel();
    });

    it("Cancelled Promise after then but before rejection rejects with cancel error, not rejection err", (done) => {
      const p = new PromisePlus((_, rej) => setTimeout(rej, 500, new Error("foo")));
      p
        .then(() => done.fail(new Error("Should not hit this.")))
        .catch((err) => {
          expect(err.message).toBe("");
          done();
        });
      p.cancel();
    });

    it("Cancel on a completed promise is a noop", (done) => {
      const p = new PromisePlus((res) => res(true));
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

    it("propagates cancellations downward but not upward", (done) => {
      const p = new PromisePlus((res) => setTimeout(res, 5, 7));
      const p2 = p.then(identity);
      const p3 = p2.then(identity);
      Promise.all([p, p2.catch(identity), p3.catch(identity)])
        .then(([one, two, three]) => {
          expect(one).toBe(7);
          expect((two as Error).message).toBe("");
          expect((three as Error).message).toBe("");
          done();
        })
        .catch((err) => {
          done.fail(err);
        });

      p2.cancel();
    });
  });

  describe("Timeout works as expected", () => {
    it("Rejects at timeout time", (done) => {
      const p = new PromisePlus((res) => setTimeout(res, 5), 1);
      p.catch(() => {}); // need the no-op catch to avoid unhandled promise rejection
      setTimeout((promise) => {
        promise
          .then(() => done.fail(new Error("Should not hit this.")))
          .catch((err: Error) => {
            expect(err.message).toBe("Promise reached timeout of 1 milliseconds.");
            done();
          });
      }, 7, p);
    });

    it("Resolved promise does not timeout", (done) => {
      const p = new PromisePlus((res) => setTimeout(res, 1, "foo"), 5);
      p
        .then((t) => {
          expect(t).toBe("foo");
          done();
        })
        .catch((err) => {
          done.fail(err);
        });
    });

    it("Cancelled promise is rejected with cancellation, not timeout", (done) => {
      const p = new PromisePlus((res) => setTimeout(res, 5), 1);
      p.catch(() => {}); // need the catch to avoid unhandled promise rejection
      setTimeout(() => {
        p
          .then(() => done.fail(new Error("Should not hit this.")))
          .catch((err) => {
            expect(err.message).toBe("");
            done();
          });
      }, 7);
      p.cancel();
    });
  });

  it("has a toPromise that exposes underlying Promise", (done) => {
    const p = new PromisePlus((res) => setTimeout(res, 1, "foo"), 5);
    const promise = p.toPromise();
    expect(promise instanceof Promise).toBe(true);
    promise
      .then((t) => {
        expect(t).toBe("foo");
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
  });

  it("has a class method for converting an existing Promise to a PromisePlus", (done) => {
    const a = new Promise((res) => {
      setTimeout(res, 5, "foo");
    });

    const b = PromisePlus.of(a);
    const d = PromisePlus.of(a);
    const e = d.catch(identity);
    d.cancel();

    Promise.all([
      a,
      b,
      e,
    ])
      .then(([x, y, z]) => {
        expect(x).toBe("foo");
        expect(y).toBe("foo");
        expect((z as Error).message).toBe("");
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
  });

  it("has class methods for immediately resolving/rejecting a PromisePlus", (done) => {
    const a = PromisePlus.resolve(3);
    const b = PromisePlus.reject(new Error("foo")).catch(identity);
    Promise.all([a, b])
      .then(([x, y]) => {
        expect(x).toBe(3);
        expect((y as Error).message).toBe("foo");
        done();
      })
      .catch((err) => {
        done.fail(err);
      });
  });
});

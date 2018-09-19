const PromisePlus = require('../dist/promiseplus.js');
const LazyPromisePlus = require('../dist/promiseplus.js').LazyPromisePlus;

describe('LazyPromisePlus', () => {
  // describe('Happy path works as expected', () => {
  //   it('has a then works as expected with 1 arg', done => {
  //     const p = new LazyPromisePlus(res => setTimeout(res, 0, 'foo'));
  //     p
  //       .then(t => {
  //         expect(t).toBe('foo');
  //         done();
  //       })
  //       .catch(err => {
  //         done.fail(err);
  //       });
  //   });
  //
  //   it('has a then works as expected with 2 args', done => {
  //     const err = new Error('bar');
  //     const p = new LazyPromisePlus((_, rej) => rej(err));
  //     p
  //       .then(
  //         _ => done.fail(new Error('Should not hit this.')),
  //         error => {
  //           expect(error).toBe(err);
  //           done();
  //         }
  //       )
  //       .catch(err => {
  //         done.fail(err);
  //       });
  //   });
  //
  //   it('has a catch works as expected', done => {
  //     const err = new Error('bar');
  //     const p = new LazyPromisePlus((_, rej) => rej(err));
  //     p.catch(error => {
  //       expect(error).toBe(err);
  //       done();
  //     });
  //   });
  // });
  //
  // it('Finally always runs on a completed promise', done => {
  //   let counter = 0;
  //   const err = new Error('bar');
  //   const arr = [
  //     new LazyPromisePlus((_, rej) => rej(err)).finally(_ => counter++),
  //     new LazyPromisePlus(res => res('foo')).finally(_ => counter++),
  //   ];
  //   Promise.all(arr)
  //     .then(_ => {
  //       expect(counter).toBe(2);
  //       done();
  //     })
  //     .catch(err => {
  //       done.fail(err);
  //     });
  // });

  describe('Cancellation works as expected', () => {
    // it('Cancelled Promise  before thened does not call callback', done => {
    //   let counter = 0;
    //   const incr = _ => counter++;
    //   const p = new LazyPromisePlus(res => res(incr()));
    //   p.cancel();
    //   p
    //     .then(_ => done.fail(new Error('Should not hit this.')))
    //     .catch(err => {
    //       expect(err.message).toBe('Cancelled Promise ');
    //       expect(counter).toBe(0);
    //       done();
    //     });
    // });

    // it('Cancelled Promise  after then but before resolution rejects', done => {
    //   const p = new LazyPromisePlus(res => setTimeout(res, 500, 7))
    //     .then(_ => done.fail(new Error('Should not hit this.')))
    //     .catch(err => {
    //       expect(err.message).toBe('Cancelled Promise ');
    //       done();
    //     });
    //   p.cancel();
    // });
    //
    // it('Cancelled Promise  after then but before rejection rejects with cancel error, not rejection err', done => {
    //   const p = new LazyPromisePlus((_, rej) => setTimeout(rej, 500, new Error('foo')))
    //     .then(_ => done.fail(new Error('Should not hit this.')))
    //     .catch(err => {
    //       expect(err.message).toBe('Cancelled Promise ');
    //       done();
    //     });
    //   p.cancel();
    // });

    it('Cancel on a completed promise is a noop', done => {
      const p = new LazyPromisePlus(res => res(true)).then(t => {
        expect(t).toBe(true);
        p.cancel();
        return t;
      })
      .then(t => {
        expect(t).toBe(true);
        expect(p._cancelled).toBe(false);
      });
    });
  });

  // describe('Timeout works as expected', () => {
  //   it('Rejects at timeout time', done => {
  //     const p = new LazyPromisePlus(res => setTimeout(res, 5), 1);
  //     setTimeout(p => {
  //       p
  //         .then(_ => done.fail(new Error('Should not hit this.')))
  //         .catch(err => {
  //           expect(err.message).toBe('Promise reached timeout of 1 milliseconds.');
  //           done();
  //         });
  //     }, 7, p);
  //   });
  //
  //   it('Resolved promise does not timeout', done => {
  //     const p = new LazyPromisePlus(res => setTimeout(res, 1, 'foo'), 5);
  //     p
  //       .then(t => {
  //         expect(t).toBe('foo');
  //         done();
  //       })
  //       .catch(err => {
  //         done.fail(err);
  //       });
  //   });
  //
  //   it('Cancelled promise is rejected with cancellation, not timeout', done => {
  //     const p = new LazyPromisePlus(res => setTimeout(res, 5), 1);
  //     setTimeout(() => {
  //       p
  //         .then(_ => done.fail(new Error('Should not hit this.')))
  //         .catch(err => {
  //           expect(err.message).toBe('Cancelled Promise ');
  //           done();
  //         });
  //     }, 7);
  //     p.cancel();
  //   });
  // });
  //
  // it('has a toPromise that exposes underlying Promise', done => {
  //   const p = new LazyPromisePlus(res => setTimeout(res, 1, 'foo'), 5);
  //   const promise = p.toPromise();
  //   expect(promise instanceof Promise).toBe(true);
  //   promise
  //     .then(t => {
  //       expect(t).toBe('foo');
  //       done();
  //     })
  //     .catch(err => {
  //       done.fail(err);
  //     });
  // });
});

// describe('PromisePlus', () => {
//   describe('Happy path works as expected', () => {
//     it('Then works as expected with 1 arg', done => {
//
//     });
//
//     it('Then works as expected with 2 args', done => {
//
//     });
//
//     it('Catch works as expected', done => {
//
//     });
//   });
//
//
//   it('Finally always runs on a completed promise', done => {
//
//   });
//
//   describe('Cancellation works as expected', () => {
//     it('Cancelled Promise  after creation but before resolution rejects', done => {
//
//     });
//
//     it('Cancelled Promise  after creation but before rejection rejects with cancel error, not rejection err', done => {
//
//     });
//
//     it('Cancel on a completed promise is a noop', done => {
//
//     });
//   });
//
//
//   describe('Timeout works as expected', () => {
//     it('Rejects at timeout time', done => {
//
//     });
//
//     it('Resolved promise does not timeout', done => {
//
//     });
//
//     it('Cancelled promise is rejected with cancellation, not timeout', done => {
//
//     });
//   });
//
//   it('has a toPromise that exposes underlying Promise', done => {
//
//   });
// });
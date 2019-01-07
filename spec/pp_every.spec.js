const PromisePlus = require('../dist/promiseplus.js').PromisePlus;
const LazyPromisePlus = require('../dist/promiseplus.js').LazyPromisePlus;

describe('PromisePlus.every', () => {
  it('should return the result of every thenable in an array of thenables, regardless of rejection status', done => {
    const p1 = Promise.resolve(2);
    const p2 = new Promise((res, rej) => setTimeout(rej, 100, new Error('foo')));
    const p3 = new PromisePlus(res => setTimeout(res, 0, 'bar'));
    const all = PromisePlus.every([p1, p2, p3])
      .then(([two, errfoo, bar]) => {
        expect(two).toBe(2);
        expect(errfoo.message).toBe('foo');
        expect(bar).toBe('bar');
        done();
      })
      .catch(err => done.fail(err));
  });
});

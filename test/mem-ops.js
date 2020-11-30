const Assert = require('assert')

module.exports = function make_test(si) {
  return function (fin) {
    si.test(fin)

    var fooent = si.make$('foo')

    fooent.load$(function (err, out) {
      Assert.equal(err, null)
      Assert.equal(out, null)

      fooent.load$('', function (err, out) {
        Assert.equal(err, null)
        Assert.equal(out, null)

        fooent.remove$(function (err, out) {
          Assert.equal(err, null)
          Assert.equal(out, null)

          fooent.remove$('', function (err, out) {
            Assert.equal(err, null)
            Assert.equal(out, null)

            fooent.list$(function (err, list) {
              Assert.equal(err, null)
              Assert.equal(0, list.length)

              fooent.list$({ a: 1 }, function (err, list) {
                Assert.equal(err, null)
                Assert.equal(0, list.length)

                fooent.make$({ a: 1 }).save$(function (err, foo1) {
                  Assert.equal(err, null)
                  Assert.ok(foo1.id)
                  Assert.equal(1, foo1.a)

                  fooent.list$(function (err, list) {
                    Assert.equal(err, null)
                    Assert.equal(1, list.length)
                    Assert.equal(foo1.id, list[0].id)
                    Assert.equal(foo1.a, list[0].a)
                    Assert.equal('' + foo1, '' + list[0])

                    fooent.list$({ a: 1 }, function (err, list) {
                      Assert.equal(err, null)
                      Assert.equal(1, list.length)
                      Assert.equal(foo1.id, list[0].id)
                      Assert.equal(foo1.a, list[0].a)
                      Assert.equal('' + foo1, '' + list[0])

                      fooent.load$(foo1.id, function (err, foo11) {
                        Assert.equal(err, null)
                        Assert.equal(foo1.id, foo11.id)
                        Assert.equal(foo1.a, foo11.a)
                        Assert.equal('' + foo1, '' + foo11)

                        foo11.a = 2
                        foo11.save$(function (err, foo111) {
                          Assert.equal(err, null)
                          Assert.equal(foo11.id, foo111.id)
                          Assert.equal(2, foo111.a)

                          fooent.list$(function (err, list) {
                            Assert.equal(err, null)
                            Assert.equal(1, list.length)
                            Assert.equal(foo1.id, list[0].id)
                            Assert.equal(2, list[0].a)
                            Assert.equal('' + foo111, '' + list[0])

                            fooent.list$({ a: 2 }, function (err, list) {
                              Assert.equal(err, null)
                              Assert.equal(1, list.length)
                              Assert.equal(foo1.id, list[0].id)
                              Assert.equal(2, list[0].a)
                              Assert.equal('' + foo111, '' + list[0])

                              list[0].remove$(function (err) {
                                Assert.equal(err, null)
                                fooent.list$(function (err, list) {
                                  Assert.equal(err, null)
                                  Assert.equal(0, list.length)

                                  fooent.list$({ a: 2 }, function (err, list) {
                                    Assert.equal(err, null)
                                    Assert.equal(0, list.length)

                                    fooent.make$({ b: 1 }).save$(function () {
                                      fooent.make$({ b: 2 }).save$(function () {
                                        fooent.list$(function (err, list) {
                                          Assert.equal(err, null)
                                          Assert.equal(2, list.length)

                                          fooent.list$(
                                            { b: 1 },
                                            function (err, list) {
                                              Assert.equal(err, null)
                                              Assert.equal(1, list.length)

                                              si.close(fin)
                                            }
                                          )
                                        })
                                      })
                                    })
                                  })
                                })
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  }
}

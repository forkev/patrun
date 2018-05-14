/* Copyright (c) 2013-2018 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('lab')
var Code = require('code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var patrun = require('..')
var _ = require('lodash')
var gex = require('gex')

function rs(x) {
  return x.toString(true).replace(/\s+/g, '').replace(/\n+/g, '')
}

describe('patrun', function() {
  it('toString', function(done) {
    var r = patrun()
    r.add({}, 'R')
    expect(r.toString(true)).to.equal(' <R>')
    expect(r.toString(false)).to.equal(' -> <R>')
    done()
  })

  it('empty', function(done) {
    var r = patrun()
    expect(r.toString()).to.equal('')

    expect(r.find(NaN)).to.not.exist()
    expect(r.find(void 0)).to.not.exist()
    expect(r.find(null)).to.not.exist()
    expect(r.find({})).to.not.exist()
    expect(r.find({ a: 1 })).to.not.exist()

    r.add({ a: 1 }, 'A')

    expect(r.find(NaN)).to.not.exist()
    expect(r.find(void 0)).to.not.exist()
    expect(r.find(null)).to.not.exist()
    expect(r.find({})).to.not.exist()
    expect(r.find({ a: 1 })).to.equal('A')
    done()
  })

  it('root-data', function(done) {
    var r = patrun()
    r.add({}, 'R')
    expect('' + r).to.equal(' -> <R>')
    expect(rs(r)).to.equal('<R>')
    expect(JSON.stringify(r.list())).to.equal('[{"match":{},"data":"R"}]')

    expect(r.find({})).to.equal('R')
    expect(r.find({ x: 1 })).to.equal('R')

    r.add({ a: '1' }, 'r1')
    expect('' + r).to.equal(' -> <R>\na=1 -> <r1>')
    expect(rs(r)).to.equal('<R>a:1-><r1>')

    expect(r.find({ x: 1 })).equal('R')
    expect(r.find({ a: 1 })).equal('r1')
    expect(r.find({ a: 2 })).equal('R')

    r.add({ a: '1', b: '1' }, 'r2')
    expect(r.find({ x: 1 })).equal('R')
    expect(r.find({ a: 1 })).equal('r1')
    expect(r.find({ a: 1, b: 1 })).equal('r2')
    expect(r.find({ a: 2 })).equal('R')
    expect(r.find({ a: 1, b: 2 })).equal('r1') // a:1 is defined
    expect(r.find({ a: 1, b: 2 }, true)).equal(null) // exact must be ... exact
    expect(r.find({ a: 2, b: 2 })).equal('R')
    expect(r.find({ b: 2 })).equal('R')

    r.add({ x: '1', y: '1' }, 'r3')
    expect(r.find({ x: 1 })).equal('R')

    expect(r.find({ x: 1 }, true)).equal(null)

    expect(JSON.stringify(r.list())).equal(
      '[{"match":{},"data":"R"},{"match":{"a":"1"},"data":"r1"},{"match":{"a":"1","b":"1"},"data":"r2"},{"match":{"x":"1","y":"1"},"data":"r3"}]'
    )

    done()
  })

  it('add', function(done) {
    var r

    r = patrun()
    r.add({ a: '1' }, 'r1')
    expect('' + r).to.equal('a=1 -> <r1>')
    expect(rs(r)).to.equal('a:1-><r1>')

    expect(JSON.stringify(r.list())).to.equal(
      '[{"match":{"a":"1"},"data":"r1"}]'
    )

    r = patrun()
    r.add({ a: '1', b: '2' }, 'r1')
    expect(rs(r)).to.equal('a:1->b:2-><r1>')

    r = patrun()
    r.add({ a: '1', b: '2', c: '3' }, 'r1')
    expect(rs(r)).to.equal('a:1->b:2->c:3-><r1>')

    r = patrun()
    r.add({ a: '1', b: '2' }, 'r1')
    r.add({ a: '1', b: '3' }, 'r2')
    expect('' + r).to.equal('a=1, b=2 -> <r1>\na=1, b=3 -> <r2>')
    expect(rs(r)).to.equal('a:1->b:2-><r1>3-><r2>')

    r = patrun()
    r.add({ a: '1', b: '2' }, 'r1')
    r.add({ a: '1', c: '3' }, 'r2')
    expect(rs(r)).to.equal('a:1->b:2-><r1>|c:3-><r2>')

    r.add({ a: '1', d: '4' }, 'r3')
    expect(rs(r)).to.equal('a:1->b:2-><r1>|c:3-><r2>|d:4-><r3>')

    r = patrun()
    r.add({ a: '1', c: '2' }, 'r1')
    r.add({ a: '1', b: '3' }, 'r2')
    expect(rs(r)).to.equal('a:1->b:3-><r2>|c:2-><r1>')

    expect(JSON.stringify(r.list())).to.equal(
      '[{"match":{"a":"1","b":"3"},"data":"r2"},{"match":{"a":"1","c":"2"},"data":"r1"}]'
    )
    done()
  })

  it('basic', function(done) {
    var rt1 = patrun()

    rt1.add({ p1: 'v1' }, 'r1')
    expect('r1').to.equal(rt1.find({ p1: 'v1' }))
    expect(null).to.equal(rt1.find({ p2: 'v1' }))

    rt1.add({ p1: 'v1' }, 'r1x')
    expect('r1x').to.equal(rt1.find({ p1: 'v1' }))
    expect(null).to.equal(rt1.find({ p2: 'v1' }))

    rt1.add({ p1: 'v2' }, 'r2')
    expect('r2').to.equal(rt1.find({ p1: 'v2' }))
    expect(null).to.equal(rt1.find({ p2: 'v2' }))

    rt1.add({ p2: 'v3' }, 'r3')
    expect('r3').to.equal(rt1.find({ p2: 'v3' }))
    expect(null).to.equal(rt1.find({ p2: 'v2' }))
    expect(null).to.equal(rt1.find({ p2: 'v1' }))

    rt1.add({ p1: 'v1', p3: 'v4' }, 'r4')
    expect('r4').to.equal(rt1.find({ p1: 'v1', p3: 'v4' }))
    expect('r1x').to.equal(rt1.find({ p1: 'v1', p3: 'v5' }))
    expect(null).to.equal(rt1.find({ p2: 'v1' }))
    done()
  })

  it('culdesac', function(done) {
    var rt1 = patrun()

    rt1.add({ p1: 'v1' }, 'r1')
    rt1.add({ p1: 'v1', p2: 'v2' }, 'r2')
    rt1.add({ p1: 'v1', p3: 'v3' }, 'r3')

    expect('r1').to.equal(rt1.find({ p1: 'v1', p2: 'x' }))
    expect('r3').to.equal(rt1.find({ p1: 'v1', p2: 'x', p3: 'v3' }))
    done()
  }), it('remove', function(done) {
    var rt1 = patrun()
    rt1.remove({ p1: 'v1' })

    rt1.add({ p1: 'v1' }, 'r0')
    expect('r0').to.equal(rt1.find({ p1: 'v1' }))

    rt1.remove({ p1: 'v1' })
    expect(null).to.equal(rt1.find({ p1: 'v1' }))

    rt1.add({ p2: 'v2', p3: 'v3' }, 'r1')
    rt1.add({ p2: 'v2', p4: 'v4' }, 'r2')
    expect('r1').to.equal(rt1.find({ p2: 'v2', p3: 'v3' }))
    expect('r2').to.equal(rt1.find({ p2: 'v2', p4: 'v4' }))

    rt1.remove({ p2: 'v2', p3: 'v3' })
    expect(null).to.equal(rt1.find({ p2: 'v2', p3: 'v3' }))
    expect('r2').to.equal(rt1.find({ p2: 'v2', p4: 'v4' }))

    done()
  })

  function listtest(mode) {
    return function(done) {
      var rt1 = patrun()

      if ('subvals' === mode) {
        rt1.add({ a: '1' }, 'x')
      }

      rt1.add({ p1: 'v1' }, 'r0')

      rt1.add({ p1: 'v1', p2: 'v2a' }, 'r1')
      rt1.add({ p1: 'v1', p2: 'v2b' }, 'r2')

      var found = rt1.list({ p1: 'v1' })
      expect(found).equal([
        { match: { p1: 'v1' }, data: 'r0', find: undefined },
        { match: { p1: 'v1', p2: 'v2a' }, data: 'r1', find: undefined },
        { match: { p1: 'v1', p2: 'v2b' }, data: 'r2', find: undefined }
      ])

      found = rt1.list({ p1: 'v1', p2: '*' })
      expect(found).equal([
        { match: { p1: 'v1', p2: 'v2a' }, data: 'r1', find: undefined },
        { match: { p1: 'v1', p2: 'v2b' }, data: 'r2', find: undefined }
      ])

      rt1.add({ p1: 'v1', p2: 'v2c', p3: 'v3a' }, 'r3a')
      rt1.add({ p1: 'v1', p2: 'v2d', p3: 'v3b' }, 'r3b')
      found = rt1.list({ p1: 'v1', p2: '*', p3: 'v3a' })
      expect(found).equal([
        {
          match: { p1: 'v1', p2: 'v2c', p3: 'v3a' },
          data: 'r3a',
          find: undefined
        }
      ])

      // gex can accept a list of globs
      found = rt1.list({ p1: 'v1', p2: ['v2a', 'v2b', 'not-a-value'] })
      expect(found).equal([
        { match: { p1: 'v1', p2: 'v2a' }, data: 'r1', find: undefined },
        { match: { p1: 'v1', p2: 'v2b' }, data: 'r2', find: undefined }
      ])

      done()
    }
  }

  it('list.topvals', listtest('topvals'))
  it('list.subvals', listtest('subvals'))

  it('null-undef-nan', function(done) {
    var rt1 = patrun()

    rt1.add({ p1: null }, 'r1')
    expect('{"d":"r1"}').to.equal(rt1.toJSON())

    rt1.add({ p2: void 0 }, 'r2')
    expect('{"d":"r2"}').to.equal(rt1.toJSON())

    rt1.add({ p99: 'v99' }, 'r99')
    expect('{"d":"r2","k":"p99","sk":"0~p99","v":{"v99":{"d":"r99"}}}').equal(
      rt1.toJSON()
    )

    done()
  })

  it('multi-star', function(done) {
    var p = patrun()

    p.add({ a: 1 }, 'A')
    p.add({ a: 1, b: 2 }, 'B')
    p.add({ c: 3 }, 'C')
    p.add({ b: 1, c: 4 }, 'D')

    expect(rs(p)).to.equal('a:1-><A>b:2-><B>|b:1->c:4-><D>|c:3-><C>')
    expect('' + p).to.equal(
      'a=1 -> <A>\na=1, b=2 -> <B>\nb=1, c=4 -> <D>\nc=3 -> <C>'
    )

    expect(p.find({ c: 3 })).to.equal('C')
    expect(p.find({ c: 3, a: 0 })).to.equal('C')
    expect(p.find({ c: 3, a: 0, b: 0 })).to.equal('C')
    done()
  })

  it('star-backtrack', function(done) {
    var p = patrun()

    p.add({ a: 1, b: 2 }, 'X')
    p.add({ c: 3 }, 'Y')

    expect(p.find({ a: 1, b: 2 })).to.equal('X')
    expect(p.find({ a: 1, b: 0, c: 3 })).to.equal('Y')

    p.add({ a: 1, b: 2, d: 4 }, 'XX')
    p.add({ c: 3, d: 4 }, 'YY')

    expect(p.find({ a: 1, b: 2, d: 4 })).to.equal('XX')
    expect(p.find({ a: 1, c: 3, d: 4 })).to.equal('YY')
    expect(p.find({ a: 1, b: 2 })).to.equal('X')
    expect(p.find({ a: 1, b: 0, c: 3 })).to.equal('Y')

    expect(p.list({ a: 1, b: '*' })[0].data).to.equal('X')
    expect(p.list({ c: 3 })[0].data).to.equal('Y')
    expect(p.list({ c: 3, d: '*' })[0].data).to.equal('YY')
    expect(p.list({ a: 1, b: '*', d: '*' })[0].data).to.equal('XX')

    expect('' + p).to.equal(
      'a=1, b=2 -> <X>\na=1, b=2, d=4 -> <XX>\nc=3 -> <Y>\nc=3, d=4 -> <YY>'
    )
    done()
  })

  it('remove-intermediate', function(done) {
    var p = patrun()

    p.add({ a: 1, b: 2, d: 4 }, 'XX')
    p.add({ c: 3, d: 4 }, 'YY')
    p.add({ a: 1, b: 2 }, 'X')
    p.add({ c: 3 }, 'Y')

    p.remove({ c: 3 })

    expect(p.find({ c: 3 })).to.not.exist()
    expect(p.find({ a: 1, c: 3, d: 4 })).to.equal('YY')
    expect(p.find({ a: 1, b: 2, d: 4 })).to.equal('XX')
    expect(p.find({ a: 1, b: 2 })).to.equal('X')

    p.remove({ a: 1, b: 2 })

    expect(p.find({ c: 3 })).to.not.exist()
    expect(p.find({ a: 1, c: 3, d: 4 })).to.equal('YY')
    expect(p.find({ a: 1, b: 2, d: 4 })).to.equal('XX')
    expect(p.find({ a: 1, b: 2 })).to.not.exist()
    done()
  })

  it('exact', function(done) {
    var p = patrun()

    p.add({ a: 1 }, 'X')

    expect(p.findexact({ a: 1 })).to.equal('X')
    expect(p.findexact({ a: 1, b: 2 })).to.not.exist()
    done()
  })

  it('all', function(done) {
    var p = patrun()

    p.add({ a: 1 }, 'X')
    p.add({ b: 2 }, 'Y')

    expect(JSON.stringify(p.list())).to.equal(
      '[{"match":{"a":"1"},"data":"X"},{"match":{"b":"2"},"data":"Y"}]'
    )
    done()
  })

  it('custom-happy', function(done) {
    var p1 = patrun(function(pat) {
      pat.q = 9
    })

    p1.add({ a: 1 }, 'Q')

    expect(p1.find({ a: 1 })).to.not.exist()
    expect(p1.find({ a: 1, q: 9 })).to.equal('Q')
    done()
  })

  it('custom-many', function(done) {
    var p1 = patrun(function(pat, data) {
      var items = this.find(pat, true) || []
      items.push(data)

      return {
        find: function(args, data) {
          return 0 < items.length ? items : null
        },
        remove: function(args, data) {
          items.pop()
          return 0 == items.length
        }
      }
    })

    p1.add({ a: 1 }, 'A')
    p1.add({ a: 1 }, 'B')
    p1.add({ b: 1 }, 'C')

    expect(p1.find({ a: 1 }).toString()).to.equal(['A', 'B'].toString())
    expect(p1.find({ b: 1 }).toString()).to.equal(['C'].toString())
    expect(p1.list().length).to.equal(2)

    p1.remove({ b: 1 })
    expect(p1.list().length).to.equal(1)
    expect(p1.find({ b: 1 })).to.not.exist()
    expect(p1.find({ a: 1 }).toString()).to.equal(['A', 'B'].toString())

    p1.remove({ a: 1 })
    expect(p1.list().length).to.equal(1)
    expect(p1.find({ b: 1 })).to.not.exist()

    expect(JSON.stringify(p1.find({ a: 1 })).toString()).to.equal('["A"]')

    p1.remove({ a: 1 })
    expect(p1.list().length).to.equal(0)
    expect(p1.find({ b: 1 })).to.not.exist()
    expect(p1.find({ a: 1 })).to.not.exist()
    done()
  })

  it('custom-gex', function(done) {
    // this custom function matches glob expressions
    var p2 = patrun(function(pat, data) {
      var gexers = {}
      _.each(pat, function(v, k) {
        if (_.isString(v) && ~v.indexOf('*')) {
          delete pat[k]
          gexers[k] = gex(v)
        }
      })

      // handle previous patterns that match this pattern
      var prev = this.list(pat)
      var prevfind = prev[0] && prev[0].find
      var prevdata = prev[0] && this.findexact(prev[0].match)

      return function(args, data) {
        var out = data
        _.each(gexers, function(g, k) {
          var v = null == args[k] ? '' : args[k]
          if (null == g.on(v)) {
            out = null
          }
        })

        if (prevfind && null == out) {
          out = prevfind.call(this, args, prevdata)
        }

        return out
      }
    })

    p2.add({ a: 1, b: '*' }, 'X')

    expect(p2.find({ a: 1 })).to.equal('X')
    expect(p2.find({ a: 1, b: 'x' })).to.equal('X')

    p2.add({ a: 1, b: '*', c: 'q*z' }, 'Y')

    expect(p2.find({ a: 1 })).to.equal('X')
    expect(p2.find({ a: 1, b: 'x' })).to.equal('X')
    expect(p2.find({ a: 1, b: 'x', c: 'qaz' })).to.equal('Y')

    p2.add({ w: 1 }, 'W')
    expect(p2.find({ w: 1 })).to.equal('W')
    expect(p2.find({ w: 1, q: 'x' })).to.equal('W')

    p2.add({ w: 1, q: 'x*' }, 'Q')
    expect(p2.find({ w: 1 })).to.equal('W')
    expect(p2.find({ w: 1, q: 'x' })).to.equal('Q')
    expect(p2.find({ w: 1, q: 'y' })).to.equal('W')
    done()
  })

  it('find-exact', function(done) {
    var p1 = patrun()
    p1.add({ a: 1 }, 'A')
    p1.add({ a: 1, b: 2 }, 'B')
    p1.add({ a: 1, b: 2, c: 3 }, 'C')

    expect(p1.find({ a: 1 })).to.equal('A')
    expect(p1.find({ a: 1 }, true)).to.equal('A')
    expect(p1.find({ a: 1, b: 8 })).to.equal('A')
    expect(p1.find({ a: 1, b: 8 }, true)).to.equal(null)
    expect(p1.find({ a: 1, b: 8, c: 3 })).to.equal('A')
    expect(p1.find({ a: 1, b: 8, c: 3 }, true)).to.equal(null)

    expect(p1.find({ a: 1, b: 2 })).to.equal('B')
    expect(p1.find({ a: 1, b: 2 }, true)).to.equal('B')
    expect(p1.find({ a: 1, b: 2, c: 9 })).to.equal('B')
    expect(p1.find({ a: 1, b: 2, c: 9 }, true)).to.equal(null)

    expect(p1.find({ a: 1, b: 2, c: 3 })).to.equal('C')
    expect(p1.find({ a: 1, b: 2, c: 3 }, true)).to.equal('C')
    expect(p1.find({ a: 1, b: 2, c: 3, d: 7 })).to.equal('C')
    expect(p1.find({ a: 1, b: 2, c: 3, d: 7 }, true)).to.equal(null)

    done()
  })

  it('list-any', function(done) {
    var p1 = patrun()
    p1.add({ a: 1 }, 'A')
    p1.add({ a: 1, b: 2 }, 'B')
    p1.add({ a: 1, b: 2, c: 3 }, 'C')

    var mA = '{"match":{"a":"1"},"data":"A"}'
    var mB = '{"match":{"a":"1","b":"2"},"data":"B"}'
    var mC = '{"match":{"a":"1","b":"2","c":"3"},"data":"C"}'

    expect(JSON.stringify(p1.list())).to.equal('[' + [mA, mB, mC] + ']')

    expect(JSON.stringify(p1.list({ a: 1 }))).to.equal('[' + [mA, mB, mC] + ']')
    expect(JSON.stringify(p1.list({ b: 2 }))).to.equal('[' + [mB, mC] + ']')
    expect(JSON.stringify(p1.list({ c: 3 }))).to.equal('[' + [mC] + ']')

    expect(JSON.stringify(p1.list({ a: '*' }))).to.equal(
      '[' + [mA, mB, mC] + ']'
    )
    expect(JSON.stringify(p1.list({ b: '*' }))).to.equal('[' + [mB, mC] + ']')
    expect(JSON.stringify(p1.list({ c: '*' }))).to.equal('[' + [mC] + ']')

    expect(JSON.stringify(p1.list({ a: 1, b: 2 }))).to.equal(
      '[' + [mB, mC] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1, b: '*' }))).to.equal(
      '[' + [mB, mC] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1, b: '*', c: 3 }))).to.equal(
      '[' + [mC] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1, b: '*', c: '*' }))).to.equal(
      '[' + [mC] + ']'
    )

    expect(JSON.stringify(p1.list({ a: 1, c: '*' }))).to.equal('[' + [mC] + ']')

    // test star descent

    p1.add({ a: 1, d: 4 }, 'D')
    var mD = '{"match":{"a":"1","d":"4"},"data":"D"}'

    expect(JSON.stringify(p1.list())).to.equal('[' + [mA, mB, mC, mD] + ']')
    expect(JSON.stringify(p1.list({ a: 1 }))).to.equal(
      '[' + [mA, mB, mC, mD] + ']'
    )
    expect(JSON.stringify(p1.list({ d: 4 }))).to.equal('[' + [mD] + ']')
    expect(JSON.stringify(p1.list({ a: 1, d: 4 }))).to.equal('[' + [mD] + ']')
    expect(JSON.stringify(p1.list({ a: 1, d: '*' }))).to.equal('[' + [mD] + ']')
    expect(JSON.stringify(p1.list({ d: '*' }))).to.equal('[' + [mD] + ']')

    p1.add({ a: 1, c: 33 }, 'CC')
    var mCC = '{"match":{"a":"1","c":"33"},"data":"CC"}'

    expect(JSON.stringify(p1.list())).to.equal(
      '[' + [mA, mB, mC, mCC, mD] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1 }))).to.equal(
      '[' + [mA, mB, mC, mCC, mD] + ']'
    )

    expect(JSON.stringify(p1.list({ d: 4 }))).to.equal('[' + [mD] + ']')
    expect(JSON.stringify(p1.list({ a: 1, d: 4 }))).to.equal('[' + [mD] + ']')
    expect(JSON.stringify(p1.list({ a: 1, d: '*' }))).to.equal('[' + [mD] + ']')
    expect(JSON.stringify(p1.list({ d: '*' }))).to.equal('[' + [mD] + ']')

    expect(JSON.stringify(p1.list({ c: 33 }))).to.equal('[' + [mCC] + ']')
    expect(JSON.stringify(p1.list({ a: 1, c: 33 }))).to.equal('[' + [mCC] + ']')
    expect(JSON.stringify(p1.list({ a: 1, c: '*' }))).to.equal(
      '[' + [mC, mCC] + ']'
    )
    expect(JSON.stringify(p1.list({ c: '*' }))).to.equal('[' + [mC, mCC] + ']')

    // exact
    expect(JSON.stringify(p1.list({ a: 1 }, true))).to.equal('[' + [mA] + ']')
    expect(JSON.stringify(p1.list({ a: '*' }, true))).to.equal('[' + [mA] + ']')
    expect(JSON.stringify(p1.list({ a: 1, b: 2 }, true))).to.equal(
      '[' + [mB] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1, b: '*' }, true))).to.equal(
      '[' + [mB] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1, c: 3 }, true))).to.equal('[]')
    expect(JSON.stringify(p1.list({ a: 1, c: 33 }, true))).to.equal(
      '[' + [mCC] + ']'
    )
    expect(JSON.stringify(p1.list({ a: 1, c: '*' }, true))).to.equal(
      '[' + [mCC] + ']'
    )
    done()
  })

  it('top-custom', function(done) {
    var p1 = patrun(function(pat, data) {
      return function(args, data) {
        data += '!'
        return data
      }
    })

    p1.add({}, 'Q')
    p1.add({ a: 1 }, 'A')
    p1.add({ a: 1, b: 2 }, 'B')
    p1.add({ a: 1, b: 2, c: 3 }, 'C')

    expect(p1.find({})).to.equal('Q!')
    expect(p1.find({ a: 1 })).to.equal('A!')
    expect(p1.find({ a: 1, b: 2 })).to.equal('B!')
    expect(p1.find({ a: 1, b: 2, c: 3 })).to.equal('C!')

    done()
  })

  it('mixed-values', function(done) {
    var p1 = patrun()

    p1.add({ a: 1 }, 'A')
    p1.add({ a: true }, 'AA')
    p1.add({ a: 0 }, 'AAA')
    p1.add({ a: 'A', b: 2 }, 'B')
    p1.add({ a: 'A', b: 'B', c: 3 }, 'C')

    expect(p1.find({ a: 1 })).to.equal('A')
    expect(p1.find({ a: true })).to.equal('AA')
    expect(p1.find({ a: 0 })).to.equal('AAA')
    expect(p1.find({ a: 'A', b: 2 })).to.equal('B')
    expect(p1.find({ a: 'A', b: 'B', c: 3 })).to.equal('C')

    expect(p1.list({ a: 1 }).length).to.equal(1)
    expect(p1.list({ a: true }).length).to.equal(1)
    expect(p1.list({ a: 0 }).length).to.equal(1)

    p1.add({}, 'Q')
    expect(p1.find({})).to.equal('Q')
    done()
  })

  it('no-props', function(done) {
    var p1 = patrun()
    p1.add({}, 'Z')
    expect(p1.find({})).to.equal('Z')

    p1.add({ a: 1 }, 'X')
    expect(p1.find({})).to.equal('Z')

    p1.add({ b: 2 }, 'Y')
    expect(p1.find({})).to.equal('Z')

    p1.remove({ b: 2 })
    expect(p1.find({})).to.equal('Z')
    done()
  })

  it('zero', function(done) {
    var p1 = patrun()
    p1.add({ a: 0 }, 'X')
    expect(p1.find({ a: 0 })).to.equal('X')
    done()
  })

  it('multi-match', function(done) {
    var p1 = patrun()
    p1.add({ a: 0 }, 'P')
    p1.add({ b: 1 }, 'Q')
    p1.add({ c: 2 }, 'R')

    expect(p1.find({ a: 0 })).to.equal('P')
    expect(p1.find({ a: 0, b: 1 })).to.equal('P')
    expect(p1.find({ a: 0, c: 2 })).to.equal('P')
    expect(p1.find({ a: 0, b: 1, c: 2 })).to.equal('P')
    expect(p1.find({ a: 0, c: 2 })).to.equal('P')
    expect(p1.find({ b: 1, c: 2 })).to.equal('Q')
    expect(p1.find({ c: 2 })).to.equal('R')

    p1.add({ a: 0, b: 1 }, 'S')
    expect(p1.find({ a: 0, b: 1 })).to.equal('S')
    expect(p1.find({ a: 0, c: 2 })).to.equal('P')

    p1.add({ b: 1, c: 2 }, 'T')
    expect(p1.find({ a: 0, b: 1 })).to.equal('S')
    expect(p1.find({ a: 0, c: 2 })).to.equal('P')
    expect(p1.find({ b: 1, c: 2 })).to.equal('T')

    p1.add({ d: 3 }, 'U')
    expect(p1.find({ d: 3 })).to.equal('U')
    expect(p1.find({ a: 0, d: 3 })).to.equal('P')
    expect(p1.find({ b: 1, d: 3 })).to.equal('Q')
    expect(p1.find({ c: 2, d: 3 })).to.equal('R')

    p1.add({ c: 2, d: 3 }, 'V')
    expect(p1.find({ c: 2, d: 3 })).to.equal('V')
    expect(p1.find({ a: 0, b: 1 })).to.equal('S')
    expect(p1.find({ a: 0, b: 1, c: 2, d: 3 })).to.equal('S')
    done()
  })

  it('noConflict', function(done) {
    var r = patrun().noConflict()
    r.add({}, 'R')
    expect(r.toString(true)).to.equal(' <R>')
    expect(r.toString(false)).to.equal(' -> <R>')
    done()
  })

  it('add-gex', function(done) {
    var p1 = patrun({ gex: true })

    p1.add({ a: 'A' }, 'XA')
    expect(p1.find({ a: 'A' })).to.equal('XA')
    expect(p1.find({})).to.not.exist()

    p1.add({ b: '*' }, 'XB')
    expect(p1.find({ b: 'A' })).to.equal('XB')
    expect(p1.find({ b: 'B' })).to.equal('XB')
    expect(p1.find({ b: '0' })).to.equal('XB')
    expect(p1.find({ b: 2 })).to.equal('XB')
    expect(p1.find({ b: 1 })).to.equal('XB')
    expect(p1.find({ b: 0 })).to.equal('XB')
    expect(p1.find({ b: '' })).to.equal('XB') // this is correct
    expect(p1.find({})).to.not.exist()

    p1.add({ c: '*' }, 'XC')
    expect(p1.find({ c: 'A' })).to.equal('XC')
    expect(p1.find({ c: 'B' })).to.equal('XC')
    expect(p1.find({ c: '0' })).to.equal('XC')
    expect(p1.find({ c: 2 })).to.equal('XC')
    expect(p1.find({ c: 1 })).to.equal('XC')
    expect(p1.find({ c: 0 })).to.equal('XC')
    expect(p1.find({ c: '' })).to.equal('XC') // this is correct
    expect(p1.find({})).to.not.exist()

    expect(p1.find({ b: 'A', c: 'A' })).to.equal('XB')

    p1.add({ e: '*' }, 'XE')
    p1.add({ d: '*' }, 'XD')

    //console.log(require('util').inspect(p1.top,{depth:99}))

    // alphanumeric ordering
    expect(p1.find({ d: 'A', e: 'A' })).to.equal('XD')

    p1.add({ b: 0 }, 'XB0')
    //console.log(require('util').inspect(p1.top,{depth:99}))

    p1.add({ b: 'B' }, 'XBB')
    expect(p1.find({ b: 'A' })).to.equal('XB')
    expect(p1.find({ b: 0 })).to.equal('XB0')
    expect(p1.find({ b: 'B' })).to.equal('XBB')
    done()
  })

  it('add-mixed-gex', function(done) {
    var p1 = patrun({ gex: true })

    p1.add({ a: '*' }, 'XAS')
    p1.add({ a: 'A' }, 'XA')

    p1.add({ b: 'A' }, 'XB')
    p1.add({ b: '*' }, 'XBS')

    expect(p1.find({ a: 'A' })).to.equal('XA')
    expect(p1.find({ a: 'Q' })).to.equal('XAS')

    expect(p1.find({ b: 'A' })).to.equal('XB')
    expect(p1.find({ b: 'Q' })).to.equal('XBS')

    p1.add({ c: 'B' }, 'XCB')
    p1.add({ c: 'A' }, 'XCA')
    p1.add({ c: '*b' }, 'XCBe')
    p1.add({ c: '*a' }, 'XCAe')
    p1.add({ c: 'b*' }, 'XCsB')
    p1.add({ c: 'a*' }, 'XCsA')

    expect(p1.find({ c: 'A' })).to.equal('XCA')
    expect(p1.find({ c: 'B' })).to.equal('XCB')
    expect(p1.find({ c: 'qb' })).to.equal('XCBe')
    expect(p1.find({ c: 'qa' })).to.equal('XCAe')
    expect(p1.find({ c: 'bq' })).to.equal('XCsB')
    expect(p1.find({ c: 'aq' })).to.equal('XCsA')

    expect(p1.find({ a: 'A' })).to.equal('XA')
    expect(p1.find({ a: 'Q' })).to.equal('XAS')
    expect(p1.find({ b: 'A' })).to.equal('XB')
    expect(p1.find({ b: 'Q' })).to.equal('XBS')
    done()
  })

  it('add-order-gex', function(done) {
    var p1 = patrun({ gex: true })

    p1.add({ c: 'A' }, 'XC')
    p1.add({ c: '*' }, 'XCS')

    p1.add({ a: 'A' }, 'XA')
    p1.add({ a: '*' }, 'XAS')

    p1.add({ b: 'A' }, 'XB')
    p1.add({ b: '*' }, 'XBS')

    //console.log('\n'+require('util').inspect(p1.top,{depth:99}))
    //console.log(p1.toString(true))

    expect(p1.find({ c: 'A' })).to.equal('XC')
    expect(p1.find({ b: 'A' })).to.equal('XB')
    expect(p1.find({ a: 'A' })).to.equal('XA')

    expect(p1.find({ c: 'Q' })).to.equal('XCS')
    expect(p1.find({ b: 'Q' })).to.equal('XBS')
    expect(p1.find({ a: 'Q' })).to.equal('XAS')
    done()
  })

  it('multi-gex', function(done) {
    var p1 = patrun({ gex: true })

    p1.add({ a: 1, b: 2 }, 'Xa1b2')
    p1.add({ a: 1, b: '*' }, 'Xa1b*')
    p1.add({ a: 1, c: 3 }, 'Xa1c3')
    p1.add({ a: 1, c: '*' }, 'Xa1c*')
    p1.add({ a: 1, b: 4, c: 5 }, 'Xa1b4c5')
    p1.add({ a: 1, b: '*', c: 5 }, 'Xa1b*c5')
    p1.add({ a: 1, b: 4, c: '*' }, 'Xa1b4c*')
    p1.add({ a: 1, b: '*', c: '*' }, 'Xa1b*c*')

    //console.log(p1.toString(true))

    expect(p1.find({ a: 1, b: 2 })).to.equal('Xa1b2')
    expect(p1.find({ a: 1, b: 0 })).to.equal('Xa1b*')
    expect(p1.find({ a: 1, c: 3 })).to.equal('Xa1c3')
    expect(p1.find({ a: 1, c: 0 })).to.equal('Xa1c*')
    expect(p1.find({ a: 1, b: 4, c: 5 })).to.equal('Xa1b4c5')
    expect(p1.find({ a: 1, b: 0, c: 5 })).to.equal('Xa1b*c5')
    expect(p1.find({ a: 1, b: 4, c: 0 })).to.equal('Xa1b4c*')
    expect(p1.find({ a: 1, b: 0, c: 0 })).to.equal('Xa1b*c*')

    done()
  })

  it('remove-gex', function(done) {
    var p1 = patrun({ gex: true })

    p1.add({ a: 'A' }, 'XA')
    expect(p1.find({ a: 'A' })).to.equal('XA')
    expect(p1.find({})).to.not.exist()

    p1.add({ b: '*' }, 'XB')
    expect(p1.find({ b: 'A' })).to.equal('XB')
    expect(p1.find({ b: 'B' })).to.equal('XB')
    expect(p1.find({})).to.not.exist()
    expect(p1.find({ a: 'A' })).to.equal('XA')

    p1.remove({ b: '*' })
    expect(p1.find({ b: 'A' })).to.not.exist()
    expect(p1.find({ b: 'B' })).to.not.exist()
    expect(p1.find({})).to.not.exist()
    expect(p1.find({ a: 'A' })).to.equal('XA')
    done()
  })
})
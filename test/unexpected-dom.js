/*global describe, it, beforeEach, afterEach*/
var unexpected = require('unexpected'),
    unexpectedDom = require('../lib/index'),
    sinon = require('sinon'),
    jsdom = require('jsdom');

var expect = unexpected.clone().installPlugin(require('unexpected-sinon')).installPlugin(unexpectedDom);
expect.output.installPlugin(require('magicpen-prism'));

expect.addAssertion('to inspect as [itself]', function (expect, subject, value) {
  var originalSubject = subject;
  if (typeof subject === 'string') {
    subject = jsdom.jsdom('<!DOCTYPE html><html><head></head><body>' + subject + '</body></html>').body.firstChild;
  }
  if (this.flags.itself) {
    if (typeof originalSubject === 'string') {
      expect(expect.inspect(subject).toString(), 'to equal', originalSubject);
    } else {
      throw new Error('subject must be given as a string when expected to inspect as itself');
    }
  } else {
    expect(expect.inspect(subject).toString(), 'to equal', value);
  }
});

describe('unexpected-dom', function () {
  var document, body;
  beforeEach(function (done) {
    var self = this;
    jsdom.env(' ', function (err, window) {
      self.window = window;
      document = self.document = window.document;
      body = self.body = window.document.body;

      done();
    });
  });

  it('should inspect a document correctly', function () {
    expect(
      jsdom.jsdom('<!DOCTYPE html><html><head></head><body></body></html>'),
      'to inspect as',
      '<!DOCTYPE html><html><head></head><body></body></html>'
    );
  });

  it('should inspect a document with nodes around the documentElement correctly', function () {
    expect(
      jsdom.jsdom('<!DOCTYPE html><!--foo--><html><head></head><body></body></html><!--bar-->'),
      'to inspect as',
      '<!DOCTYPE html><!--foo--><html><head></head><body></body></html><!--bar-->'
    );
  });

  it('should inspect an attribute-less element correctly', function () {
    expect('<div></div>', 'to inspect as itself');
  });

  it('should dot out descendants at level >= 3 when inspecting', function () {
    expect('<div><div><div><div>foo</div></div></div></div>', 'to inspect as', '<div><div><div>...</div></div></div>');
  });

  it('should inspect void elements correctly', function () {
    expect('<input type="text">', 'to inspect as itself');
  });

  it('should inspect simple attributes correctly', function () {
    expect('<input disabled type="text">', 'to inspect as itself');
  });

  it('should inspect undefined attributes correctly', function () {
    expect('<input value="">', 'to inspect as itself');
  });

  it('should allow regular assertions defined for the object type to work on an HTMLElement', function () {
    expect(jsdom.jsdom('<html><head></head><body></body></html>').firstChild, 'to have properties', { nodeType: 1 });
  });

  it('should consider two DOM elements equal when they are of same type and have same attributes', function () {
    var el1 = document.createElement('h1');
    var el2 = document.createElement('h1');
    var el3 = document.createElement('h1');
    el3.id = 'el3';
    var paragraph = document.createElement('p');

    expect(el1, 'to be', el1);
    expect(el1, 'not to be', el2);
    expect(el1, 'to equal', el2);
    expect(el1, 'not to equal', el3);
    expect(el1, 'not to equal', paragraph);
  });

  it('should to things', function () {
    //expect(this.document.createElement('p'), 'to match', '<p />');
  });

  describe('to have text', function () {
    it('should succeed', function () {
      document.body.innerHTML = '<div>foo</div>';
      return expect(document.body, 'to have text', 'foo');
    });

    it('should fail with a diff', function () {
      document.body.innerHTML = '<div>foo</div>';
      expect(function () {
        expect(document.body, 'to have text', 'bar');
      }, 'to throw',
        'expected <body><div>foo</div></body> to have text \'bar\'\n' +
        '\n' +
        '-foo\n' +
        '+bar'
      );
    });

    it('should use "to satisfy" semantics', function () {
      document.body.innerHTML = '<div>foo</div>';
      return expect(document.body, 'to have text', /fo/);
    });
  });

  describe('to have attributes', function () {
    describe('argument comparison', function () {
      it('should match exact arguments', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';

        expect(this.body.firstChild, 'to only have attributes', 'id', 'class', 'data-info', 'disabled');
      });

      it('should fail on exact arguments not met', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to only have attributes', 'id');
        }, 'to throw',
            'expected <button class="bar" data-info="baz" disabled id="foo">Press me</button> to only have attributes \'id\''
        );
      });

      it('should match partial arguments', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';

        expect(this.body.firstChild, 'to have attributes', 'id', 'class');
      });

      it('should fail on partial arguments not met', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to have attributes', 'id', 'foo');
        }, 'to throw',
            'expected <button class="bar" data-info="baz" disabled id="foo">Press me</button> to have attributes \'id\', \'foo\'');
      });
    });

    describe('array comparison', function () {
      it('should match exact arguments', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';

        expect(this.body.firstChild, 'to only have attributes', ['id', 'class', 'data-info', 'disabled']);
      });

      it('should fail on exact arguments not met', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to only have attributes', ['id']);
        }, 'to throw', 'expected <button class="bar" data-info="baz" disabled id="foo">Press me</button> to only have attributes [ \'id\' ]');
      });

      it('should match partial arguments', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';

        expect(this.body.firstChild, 'to have attributes', ['id', 'class']);
      });

      it('should fail on partial arguments not met', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to have attributes', ['id', 'foo']);
        }, 'to throw', 'expected <button class="bar" data-info="baz" disabled id="foo">Press me</button> to have attributes [ \'id\', \'foo\' ]');
      });
    });

    describe('object comparison', function () {
      it('should match exact object', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';

        expect(this.body.firstChild, 'to only have attributes', {
          id: 'foo',
          'class': 'bar',
          'data-info': 'baz',
          disabled: true
        });
      });

      it('should fail on exact object not satisfied', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to only have attributes', {
            id: 'foo'
          });
        }, 'to throw', /^expected <button class="bar" data-info="baz" disabled id="foo">Press me<\/button> to only have attributes/);
      });

      it('should match partial object', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';

        expect(this.body.firstChild, 'to have attributes', {
          id: 'foo',
          'class': 'bar'
        });
      });

      it('should fail on partial object not satisfied', function () {
        this.body.innerHTML = '<button id="foo" class="bar" data-info="baz" disabled>Press me</button>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to have attributes', {
            id: 'foo',
            foo: 'bar'
          });
        }, 'to throw', /expected <button class="bar" data-info="baz" disabled id="foo">Press me<\/button>\nto have attributes/);
      });

      describe('class attribute', function () {
        it('should match full class attributes', function () {
          this.body.innerHTML = '<i class="foo bar baz"></i>';

          expect(this.body.firstChild, 'to have attributes', {
            'class': 'foo bar baz'
          });
        });

        it('should throw on unmatched class set', function () {
          this.body.innerHTML = '<i class="bar"></i>';
          var el = this.body.firstChild;

          expect(function () {
            expect(el, 'to have attributes', {
              'class': 'foo bar baz'
            });
          }, 'to throw', /\/\/ expected \[ 'bar' \] to contain 'foo', 'bar', 'baz'/);
        });

        it('should match partial class attributes', function () {
          this.body.innerHTML = '<i class="foo bar baz"></i>';

          expect(this.body.firstChild, 'to have attributes', {
            'class': 'foo bar'
          });
        });

        it('should match partial class attributes in different order', function () {
          this.body.innerHTML = '<i class="foo bar baz"></i>';

          expect(this.body.firstChild, 'to have attributes', {
            'class': 'baz foo'
          });
        });

        describe('exact matches', function () {
          it('should match an exact class set', function () {
            this.body.innerHTML = '<i class="foo bar baz"></i>';

            expect(this.body.firstChild, 'to only have attributes', {
              'class': 'foo bar baz'
            });
          });

          it('should match an exact class set in different order', function () {
            this.body.innerHTML = '<i class="foo bar baz"></i>';

            expect(this.body.firstChild, 'to only have attributes', {
              'class': 'foo baz bar'
            });
          });

          it('should throw if class set contains more classes than comparator', function () {
            this.body.innerHTML = '<i class="foo bar baz"></i>';
            var el = this.body.firstChild;

            expect(function () {
              expect(el, 'to only have attributes', {
                'class': 'foo baz'
              });
            }, 'to throw', /to only have attributes \{ class: 'foo baz' \}/);
          });

          it('should throw if class set contains less classes than comparator', function () {
            this.body.innerHTML = '<i class="foo baz"></i>';
            var el = this.body.firstChild;

            expect(function () {
              expect(el, 'to only have attributes', {
                'class': 'foo bar baz'
              });
            }, 'to throw', /to only have attributes \{ class: 'foo bar baz' \}/);
          });
        });
      });

      describe('style attribute', function () {
        it('should do string comparisons', function () {
          this.body.innerHTML = '<i style="color: red; background: blue"></i>';

          expect(this.body.firstChild, 'to have attributes', {
            style: 'color: red; background: blue'
          });
        });

        it('should do string comparisons in any order', function () {
          this.body.innerHTML = '<i style="color: red; background: blue"></i>';

          expect(this.body.firstChild, 'to have attributes', {
            style: 'background: blue; color: red'
          });
        });

        it('should do object comparisons', function () {
          this.body.innerHTML = '<i style="color: red; background: blue"></i>';

          expect(this.body.firstChild, 'to have attributes', {
            style: {
              color: 'red',
              background: 'blue'
            }
          });
        });
      });
    });
  });

  describe('to have children', function () {
    describe('with no children flag', function () {
      it('should match element with no children', function () {
        this.body.innerHTML = '<div></div>';
        var el = this.body.firstChild;

        expect(el, 'to have no children');
      });

      it('should fail on element with HTMLElement children', function () {
        this.body.innerHTML = '<div><p></p></div>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to have no children');
        }, 'to throw', /^expected <div><p><\/p><\/div> to have no children/);
      });

      it('should fail on element with HTMLComment children', function () {
        this.body.innerHTML = '<div><!-- Comment --></div>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to have no children');
        }, 'to throw', /^expected <div><!-- Comment --><\/div> to have no children/);
      });

      it('should fail on element with TextNode children', function () {
        this.body.innerHTML = '<div>I am a text</div>';
        var el = this.body.firstChild;

        expect(function () {
          expect(el, 'to have no children');
        }, 'to throw', /^expected <div>I am a text<\/div> to have no children/);
      });
    });
  });

  describe('queried for', function () {
    it('should work with HTMLDocument', function () {
      var document = jsdom.jsdom('<!DOCTYPE html><html><body><div id="foo"></div></body></html>');
      expect(document, 'queried for first', 'div', 'to have attributes', { id: 'foo' });
    });

    it('should error out if the selector matches no elements, first flag set', function () {
      var document = jsdom.jsdom('<!DOCTYPE html><html><body><div id="foo"></div></body></html>');
      expect(function () {
        expect(document.body, 'queried for first', '.blabla', 'to have attributes', { id: 'foo' });
      }, 'to throw',
          'expected <body><div id="foo"></div></body> queried for first \'.blabla\', \'to have attributes\', { id: \'foo\' }\n' +
          '  The selector .blabla yielded no results'
      );
    });

    it('should error out if the selector matches no elements, first flag not set', function () {
      var document = jsdom.jsdom('<!DOCTYPE html><html><body><div id="foo"></div></body></html>');
      expect(function () {
        expect(document.body, 'queried for', '.blabla', 'to have attributes', { id: 'foo' });
      }, 'to throw',
          'expected <body><div id="foo"></div></body> queried for \'.blabla\', \'to have attributes\', { id: \'foo\' }\n' +
          '  The selector .blabla yielded no results'
      );
    });

    it('should return an array-like NodeList', function () {
      var document = jsdom.jsdom('<!DOCTYPE html><html><body><div></div><div></div><div></div></body></html>');

      expect(document, 'queried for', 'div', 'to be a', 'DOMNodeList');
    });

    it('should be able to use array semantics', function () {
      var document = jsdom.jsdom('<!DOCTYPE html><html><body><div></div><div></div><div></div></body></html>');

      expect(document, 'queried for', 'div', 'to have length', 3);
    });

    it('should fail array checks with useful nested error message', function () {
      var document = jsdom.jsdom('<!DOCTYPE html><html><body><div></div><div></div><div></div></body></html>');

      expect(function () {
        expect(document, 'queried for', 'div', 'to have length', 1);
      }, 'to throw',
          'expected <!DOCTYPE html><html><body>.........</body></html> queried for \'div\' to have length 1\n' +
          '  expected NodeList[ <div></div>, <div></div>, <div></div> ] to have length 1\n' +
          '    expected 3 to be 1'
      );
    });
  });

  describe('diffing', function () {
    function parseHtmlElement(str) {
      return jsdom.jsdom('<!DOCTYPE html><html><body>' + str + '</body></html>').body.firstChild;
    }

    expect.addAssertion(['string', 'DOMNode'], 'diffed with', function (expect, subject, value) {
      if (typeof subject === 'string') {
        subject = parseHtmlElement(subject);
      }
      if (typeof value === 'string') {
        value = parseHtmlElement(value);
      }
      this.shift(expect, expect.diff(subject, value).diff.toString(), 1);
    });

    it('should work with HTMLElement', function () {
      expect(
        '<div><div id="foo"></div><div id="bar"></div></div>',
        'diffed with',
        '<div><div id="foo"></div><div id="quux"></div></div>',
        'to equal',
        '<div>\n' +
        '  <div id="foo"></div>\n' +
        '  -<div id="bar"></div>\n' +
        '  +<div id="quux"></div>\n' +
        '</div>');
    });

    it('should work with HTMLElement with text nodes and comments inside', function () {
      expect(
        '<div>foo<!--bar--></div>',
        'diffed with',
        '<div>quux<!--baz--></div>',
        'to equal',
        '<div>\n' +
        '  -foo\n' +
        '  +quux\n' +
        '  -<!--bar-->\n' +
        '  +<!--baz-->\n' +
        '</div>');
    });

    it('should report a missing child correctly', function () {
      expect(
        '<div>foo<!--bar--></div>',
        'diffed with',
        '<div>foo<span></span><!--bar--></div>',
        'to equal',
        '<div>\n' +
        '  foo\n' +
        '  // missing <span></span>\n' +
        '  <!--bar-->\n' +
        '</div>');
    });

    it('should report an extraneous child correctly', function () {
      expect(
        '<div>foo<span></span><!--bar--></div>',
        'diffed with',
        '<div>foo<!--bar--></div>',
        'to equal',
        '<div>\n' +
        '  foo\n' +
        '  <span></span> // should be removed\n' +
        '  <!--bar-->\n' +
        '</div>');
    });

    it('should produce a nested diff when the outer elements are identical', function () {
      expect(
        '<div>foo<span><span>foo</span></span><!--bar--></div>',
        'diffed with',
        '<div>foo<span><span>bar</span></span><!--bar--></div>',
        'to equal',
        '<div>\n' +
        '  foo\n' +
        '  <span>\n' +
        '    <span>\n' +
        '      -foo\n' +
        '      +bar\n' +
        '    </span>\n' +
        '  </span>\n' +
        '  <!--bar-->\n' +
        '</div>');
    });

    it('should produce a nested diff when when the outer element has a different set of attributes', function () {
      expect(
        '<div>foo<span id="foo" class="bar"><span>foo</span></span><!--bar--></div>',
        'diffed with',
        '<div>foo<span><span>bar</span></span><!--bar--></div>',
        'to equal',
        '<div>\n' +
        '  foo\n' +
        '  -<span class="bar" id="foo">\n' +
        '  +<span>\n' +
        '    <span>\n' +
        '      -foo\n' +
        '      +bar\n' +
        '    </span>\n' +
        '  </span>\n' +
        '  <!--bar-->\n' +
        '</div>');
    });

    it('should diff documents with stuff around the documentElement', function () {
      expect(
        jsdom.jsdom('<!DOCTYPE html><!--foo--><html><body></body></html><!--bar-->'),
        'diffed with',
        jsdom.jsdom('<!DOCTYPE html><html><body></body></html>'),
        'to equal',
            '<!DOCTYPE html>\n' +
            '<!--foo--> // should be removed\n' +
            '<html><body></body></html>\n' +
            '<!--bar--> // should be removed'
        );
    });
  });

  describe('when parsed as HTML', function () {
    var htmlSrc = '<!DOCTYPE html><html><body class="bar">foo</body></html>';
    it('should parse a string as a complete HTML document', function () {
      expect(htmlSrc, 'when parsed as HTML',
          expect.it('to be a', 'HTMLDocument')
            .and('to equal', jsdom.jsdom(htmlSrc))
            .and('queried for first', 'body', 'to have attributes', { class: 'bar' })
      );
    });

    describe('when the DOMParser global is available', function () {
      var originalDOMParser,
          DOMParserSpy,
          parseFromStringSpy;

      beforeEach(function () {
        originalDOMParser = global.DOMParser;
        global.DOMParser = DOMParserSpy = sinon.spy(function () {
          return {
            parseFromString: parseFromStringSpy = sinon.spy(function (htmlString, contentType) {
              return jsdom.jsdom(htmlString);
            })
          };
        });
      });
      afterEach(function () {
        global.DOMParser = originalDOMParser;
      });

      it('should use DOMParser to parse the document', function () {
        expect(htmlSrc, 'when parsed as HTML', 'queried for first', 'body', 'to have text', 'foo');
        expect(DOMParserSpy, 'was called once');
        expect(DOMParserSpy, 'was called with');
        expect(DOMParserSpy.calledWithNew(), 'to be true');
        expect(parseFromStringSpy, 'was called once');
        expect(parseFromStringSpy, 'was called with', htmlSrc, 'text/html');
      });
    });

    describe('when the document global is available', function () {
      var originalDocument,
          createHTMLDocumentSpy,
          mockDocument;

      beforeEach(function () {
        originalDocument = global.document;
        global.document = {
          implementation: {
            createHTMLDocument: createHTMLDocumentSpy = sinon.spy(function () {
              mockDocument = jsdom.jsdom(htmlSrc);
              mockDocument.open = sinon.spy();
              mockDocument.write = sinon.spy();
              mockDocument.close = sinon.spy();
              return mockDocument;
            })
          }
        };
      });
      afterEach(function () {
        global.document = originalDocument;
      });

      it('should use document.implementation.createHTMLDocument to parse the document', function () {
        expect(htmlSrc, 'when parsed as HTML', 'queried for first', 'body', 'to have text', 'foo');
        expect(createHTMLDocumentSpy, 'was called once');
        expect(createHTMLDocumentSpy, 'was called with');
        expect(mockDocument.open, 'was called once');
        expect(mockDocument.write, 'was called with');
        expect(mockDocument.write, 'was called once');
        expect(mockDocument.write, 'was called with', htmlSrc);
        expect(mockDocument.close, 'was called once');
        expect(mockDocument.write, 'was called with');
        expect([mockDocument.open, mockDocument.write, mockDocument.close], 'given call order');
      });
    });
  });
});

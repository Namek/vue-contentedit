import Vue from 'vue'
import ContentEdit from 'src/content-edit.directive'

const INITIAL_TEXT = "The Test"
const TYPED_TEXT = "bla bla"
const ESCAPE = 27
const ENTER = 13

function getTestTemplate(isMultiline) {
  return `
    <div>
      <div class="the-element" v-content="testText" multiline="${isMultiline}"></div>
      <div class="sibling-with-value">{{testText}}</div>
    </div>
  `
}

describe('ContentEdit directive', () => {
  let vm = null
  let testEl = null
  let siblingEl = null

  function expectActive() {
    expect(document.activeElement).to.equal(testEl)
  }

  function expectInactive() {
    expect(document.activeElement).to.equal(document.body)
  }

  function setupTest(shouldBeMultiline) {
    expect(vm).to.be.null

    vm = new Vue({
      template: getTestTemplate(shouldBeMultiline),
      directives: {
        'content': ContentEdit
      },
      data: function() {
        return {
          testText: INITIAL_TEXT
        }
      }
    }).$mount()
    document.body.appendChild(vm.$el)

    testEl = vm.$el.querySelector('.the-element')
    siblingEl = vm.$el.querySelector('.sibling-with-value')

    expect(vm.testText).to.equal(INITIAL_TEXT)
    expectInactive()
  }

  afterEach(() => {
    document.body.removeChild(vm.$el)
    vm = null
    testEl = null
  });

  [false, true].forEach(isMultiline => {
    describe(`multiline=${isMultiline}`, () => {
      beforeEach(() => {
        setupTest(isMultiline)
      })

      it('element text has initial value from model', () => {
        expect(testEl.innerText).to.equal(INITIAL_TEXT)
      })

      it('element updates text from changed model', (done) => {
        expect(testEl.innerText).to.equal(INITIAL_TEXT)
        vm.testText = TYPED_TEXT

        Vue.nextTick(() => {
          expect(testEl.innerText).to.equal(TYPED_TEXT)
          done()
        })
      })

      it('save model on unfocus', () => {
        testEl.focus()
        expectActive()

        typeIn(TYPED_TEXT)
        dispatchBlur(testEl)
        expectInactive()

        expect(vm.testText).to.equal(TYPED_TEXT + INITIAL_TEXT)
      })

      it('unfocus on ESCAPE key press when content was not modified', () => {
        testEl.focus()
        expectActive()

        dispatchKey(testEl, ESCAPE)
        expectInactive()

        // should not modify anything
        expect(testEl.innerText).to.equal(INITIAL_TEXT)
        expect(vm.testText).to.equal(INITIAL_TEXT)
      })

      it('bring back innerText on ESCAPE key press when content was modified', () => {
        // 1. focus and modify innerText
        testEl.focus()
        typeIn(TYPED_TEXT)
        expect(testEl.innerText).to.equal(TYPED_TEXT + INITIAL_TEXT)

        // 2. hit ESCAPE and see old content
        dispatchKey(testEl, ESCAPE)
        expectActive()
        expect(testEl.innerText).to.equal(INITIAL_TEXT)

        // 3. verify that model is unchanged
        expect(vm.testText).to.equal(INITIAL_TEXT)
      })

      it('have cursor position on end after ESCAPE key press after modification', () => {
        // 1. focus and modify innerText
        testEl.focus()
        typeIn(TYPED_TEXT)
        expect(testEl.innerText).to.equal(TYPED_TEXT + INITIAL_TEXT)

        // 2. hit ESCAPE and verify cursor position
        dispatchKey(testEl, ESCAPE)
        expectActive()
        expect(testEl.innerText).to.equal(INITIAL_TEXT)
        expect(getCaretPosition(testEl)).to.equal(vm.testText.length)
      })

      it('do not save model by typing letters', (done) => {
        testEl.focus()

        typeIn('a')
        setTimeout(() => {
          expect(testEl.innerText).to.equal('a' + INITIAL_TEXT)
          expect(vm.testText).to.equal(INITIAL_TEXT)

          typeIn('b')
          setTimeout(() => {
            expect(testEl.innerText).to.equal('ab' + INITIAL_TEXT)
            expect(vm.testText).to.equal(INITIAL_TEXT)

            typeIn('c')
            setTimeout(() => {
              expect(testEl.innerText).to.equal('abc' + INITIAL_TEXT)
              expect(vm.testText).to.equal(INITIAL_TEXT)

              done()
            }, 20)
          }, 20)
        }, 20)
      })

      it('confirm two-way binding', (done) => {
        expect(siblingEl.innerText).to.equal(INITIAL_TEXT)
        const expectedText = TYPED_TEXT + INITIAL_TEXT

        testEl.focus()
        typeIn(TYPED_TEXT)
        dispatchBlur(testEl)

        Vue.nextTick(() => {
          expect(siblingEl.innerText).to.equal(expectedText)
          done()
        })
      })
    })
  })

  describe('multiline=false', () => {
    beforeEach(() => {
      setupTest(false)
    })

    it('save model on ENTER key press', () => {
      testEl.focus()
      expectActive()
      typeIn(TYPED_TEXT)

      dispatchKey(testEl, ENTER)

      // for some reason blur event is not dispatched in tests,
      // so we do it manually to trigger model update
      dispatchBlur(testEl)

      expectInactive()
      expect(testEl.innerText).to.equal(TYPED_TEXT + INITIAL_TEXT)
      expect(vm.testText).to.equal(TYPED_TEXT + INITIAL_TEXT)
    })
  })

  describe('multiline=true', () => {
    beforeEach(() => {
      setupTest(true)
    })
    it('should not prevent ENTER key press', () => {
      testEl.focus()
      typeIn('abc')

      // simulate ENTER key
      dispatchKey(testEl, ENTER, {expectNotPreventDefault: true})
    })
  })
})

function typeIn(text) {
  document.execCommand('insertText', false, text)
}

function dispatchBlur(el) {
  // this function blurs element twice in a row:

  // 1. this blur() changes document.activeElement
  el.blur()

  // 2. this 'blur' is useful when test browser is not focused
  let evt = document.createEvent('Event')
  evt.initEvent('blur', true, true)
  el.dispatchEvent(evt)
}

function dispatchKey(el, keyCode, opts = {}) {
  {
    const a = opts.expectPreventDefault
    const b = opts.expectNotPreventDefault
    assert(a !== b || a === undefined || b === undefined)
  }

  let evt = document.createEvent('Event')
  evt.initEvent('keydown', true, true)
  evt.keyCode = keyCode

  if (opts.expectPreventDefault || opts.expectNotPreventDefault) {
    sinon.spy(evt, 'preventDefault')
  }

  el.dispatchEvent(evt)

  if (opts.expectPreventDefault === true) {
    assert(evt.preventDefault.calledOnce)
  }

  if (opts.expectNotPreventDefault === true) {
    assert(evt.preventDefault.notCalled)
  }
}

function getCaretPosition() {
  // as per, https://developer.mozilla.org/en-US/docs/Web/API/Selection
  // assuming that there is only text inside given element
  return window.getSelection().focusOffset
}

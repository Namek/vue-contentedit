export default {
  twoWay: true,
  params: ['multiline'],

  bind: function() {
    let params = this.params
    if (params.multiline === undefined) {
      params.multiline = false
    }

    this.el.textContent = this.oldVal = this.arg
    this.el.contentEditable = true
    this.el.style.whiteSpace = 'pre-wrap'

    this.blurHandler = (evt) => {
      this.set(this.el.textContent)
    }
    this.el.addEventListener('blur', this.blurHandler)

    this.keydownHandler = (evt) => {
      let shouldUnfocus = false
      let shouldReturnFalse = false

      if (!params.multiline && evt.keyCode == 13/* ENTER */) {
        evt.preventDefault()
        shouldUnfocus = true
        shouldReturnFalse = true
      }

      if (evt.keyCode == 27/* ESCAPE */) {
        if (this.el.textContent != this.oldVal) {
          // bring back value from model
          this.el.textContent = this.oldVal

          // move cursor to end
          setEndOfContenteditable(this.el)
        }
        else {
          shouldUnfocus = true
        }
      }

      if (shouldUnfocus) {
        // unfocus element
        this.el.blur()

        // prevent refocus on double-ENTER
        window.getSelection().removeAllRanges()
      }

      if (shouldReturnFalse) {
        return false
      }
    }
    this.el.addEventListener('keydown', this.keydownHandler)

    this.pasteHandler = (evt) => {
      if (!params.multiline) {
        evt.preventDefault()
        let content = evt.clipboardData.getData('text/plain')
        let filteredContent = content.replace(/(?:\r\n|\r|\n)/gm, '')

        if (content.length !== filteredContent.length) {
          // source: http://stackoverflow.com/a/12028136/450926
          document.execCommand('insertText', false, filteredContent)
        }
      }
    }
    this.el.addEventListener('paste', this.pasteHandler)
  },

  update: function (val, oldVal) {
    this.el.textContent = val
    this.oldVal = val
  },

  unbind: function () {
    this.el.removeEventListener('blur', this.blurHandler)
    this.el.removeEventListener('keypress', this.keydownHandler)
    this.el.removeEventListener('paste', this.pasteHandler)
  }
}

/*eslint-disable */
// source: http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
function setEndOfContenteditable(contentEditableElement) {
    var range,selection;
    if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if (document.selection)//IE 8 and lower
    {
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}
/*eslint-enable */

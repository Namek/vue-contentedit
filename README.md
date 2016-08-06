# vue-contentedit

> contenteditable directive for Vue.js

## Usage

```js
import Vue from 'vue'
import ContentEdit from 'src/content-edit.directive'

vm = new Vue({
  template: `
    <div class="the-element" v-content="testText" multiline="${isMultiline}"></div>
  `,
  directives: {
    'content': ContentEdit
  },
  data: function() {
    return {
      testText: "some value",
      isMultiline: true //false by default
    }
  }
})
```

## Development

``` bash
# install dependencies
npm install

# run unit tests
npm run unit

# run unit tests with debug mode
npm run unit-debug

# run all tests
npm test
```

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
window.addEventListener('beforeunload', function(event) {
  event.returnValue = 'Are you sure?'
})
ReactDOM.render(<App generateKeysIsDisabled={true} />, document.getElementById('root'))

// service worker disabled because we don't yet understand how exactly it affects caching policy
// and want to avoid further issues caused by old versions of files served from cache
//registerServiceWorker()

import React from 'react'

const NotFoundPage = () => <div>
  <div className="row mrgn-tp-lg">
    <div className="col-md-12">
      <h1>
        <span className="glyphicon glyphicon-warning-sign mrgn-rght-md"></span>
        Page Not Found</h1>
      <p>We're sorry you ended up here. Sometimes a page gets moved or deleted, but
        hopefully we can help you find what you're looking for.</p>
      <ul>
        <li>Return to the
          <a href="/">home page</a>
        </li>
      </ul>
    </div>
  </div>
</div>

export default NotFoundPage

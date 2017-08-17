import React from 'react'
import PropTypes from 'prop-types'
import Link from 'gatsby-link'
import Helmet from 'react-helmet'

const scriptsrc = [`/jquery.2.1.4.js`, `/wet-boew/js/wet-boew.min.js`, `/theme-gc-intranet/js/theme.min.js`];

class TemplateWrapper extends React.Component {
  constructor() {
    super();
  }

  componentDidMount() {
    scriptsrc.reduce((promise, src) => promise.then(() => new Promise((resolve, _reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.onload = resolve;
      document
        .body
        .appendChild(script);
    })), Promise.resolve());
  }
  render() {
    return (
      <div>
        <Helmet title="HYDEX Reports">
          <meta charset="utf-8"/>
          <title>HYDEX Reports
          </title>
          <meta content="width=device-width,initial-scale=1" name="viewport"/>
          <meta name="dcterms.language" title="ISO639-2" content="eng"/>
          <link
            href="/theme-gc-intranet/assets/favicon.ico"
            rel="icon"
            type="image/x-icon"/>
          <link rel="stylesheet" href="/theme-gc-intranet/css/theme.min.css"/>
          <noscript>{`<link rel="stylesheet" href="/wet-boew/css/noscript.min.css"/>`}</noscript>
          <html class="no-js" lang="en" dir="ltr"/>
        </Helmet>

        <header role="banner" id="wb-bnr">
          <div className="container">
            <div className="row">
              <div className="col-sm-6">
                <object
                  id="gcwu-sig"
                  type="image/svg+xml"
                  tabIndex="-1"
                  role="img"
                  data="/theme-gc-intranet/assets/sig-blk-en.svg"
                  aria-label="Government of Canada"></object>
              </div>
              <div className="col-sm-6">
                <object
                  id="wmms"
                  type="image/svg+xml"
                  tabIndex="-1"
                  role="img"
                  data="/theme-gc-intranet/assets/wmms-intra.svg"
                  aria-label="Symbol of the Government of Canada"></object>
              </div>
            </div>
          </div>
        </header>

        <main role="main" property="mainContentOfPage" className="container">
          {this
            .props
            .children()}
        </main>
      </div>
    );
  }
}
TemplateWrapper.propTypes = {
  children: PropTypes.func
}

export default TemplateWrapper;
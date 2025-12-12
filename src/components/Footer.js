function Footer() {
  return(
    <footer className="footer">
      <div>
        <span className='link-button' onClick={() => window.open('https://github.com/mjoonwoo/osca')}>
          <img src={require('../assets/github-mark-white.png')} alt='GitHub' width={20} height={20} />
        </span><br />
        <img src={require('../assets/logo256_white.png')} alt='Logo' width={24} height={24} />
        OSCA: Open Source Chess Analyzer<br />
        Licensed under <a href='https://opensource.org/licenses/MIT' target='_blank' rel='noreferrer'>GPLv3</a>
      </div>
      <p>© 2025 mjoonwoo</p>
    </footer>
  );
}

export default Footer;
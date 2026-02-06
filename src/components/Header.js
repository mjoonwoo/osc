import React, { useState } from 'react';

export function Header({ onTabChange }) {
	const [active, setActive] = useState('analysis');

	function select(tab) {
		setActive(tab);
		if (typeof onTabChange === 'function') onTabChange(tab);
	}

	return (
		<nav className="navbar bg-dark border-bottom border-body" data-bs-theme="dark">
			<div className="container-fluid">
				<span className="navbar-brand mb-0 h1 d-flex align-items-center">
					<img
						src={require(`../assets/logo256_white.png`)}
						alt="Logo"
						width="24"
						height="24"
						className="d-inline-block align-text-top me-2"
					/>
					OSCA
				</span>

				<ul className="nav nav-pills ms-auto header-tabs" role="tablist">
					<li className="nav-item">
						<button
							className={`nav-link ${active === 'analysis' ? 'active' : ''}`}
							onClick={() => select('analysis')}
							type="button"
							aria-current={active === 'analysis' ? 'page' : undefined}
						>
							Analysis
						</button>
					</li>
					<li className="nav-item">
						<button
							className={`nav-link ${active === 'play' ? 'active' : ''}`}
							onClick={() => select('play')}
							type="button"
							aria-current={active === 'play' ? 'page' : undefined}
						>
							Play
						</button>
					</li>
				</ul>
			</div>
		</nav>
	);
}
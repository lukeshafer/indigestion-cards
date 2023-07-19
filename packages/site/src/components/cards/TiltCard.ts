export default () => ({
	transition: 'transform 0.5s',
	shinePosition: '50%',
	shineAfterOpacity: '0',
	transform: 'rotate3d(0, 0, 0, 0deg)',
	shineOpacity: '0',
	start() {
		this.shineAfterOpacity = '1';
		setTimeout(() => {
			this.transition = 'transform 0.0s';
		}, 100);
	},
	end() {
		this.shineAfterOpacity = '0';
		this.transition = 'transform 0.5s';
		this.transform = 'rotate3d(0, 0, 0, 0deg)';
		this.shinePosition = '50%';
		this.shineOpacity = '0.2';
	},
	move(e: MouseEvent | TouchEvent, el: HTMLElement) {
		if (window.localStorage.getItem('disableAnimations') === 'true') return;
		if (e.type === 'touchmove') e.preventDefault();

		const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
		const { left, top, width, height } = el.getBoundingClientRect();

		const x = Math.min(Math.max((clientX - left) / width - 0.5, -0.5), 0.5);
		const y = Math.min(Math.max((clientY - top) / height - 0.5, -0.5), 0.5);
		const angle = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) * 70;

		this.transform = 'rotate3d(' + y + ', ' + -x + ', 0, ' + angle + 'deg)';
		this.shinePosition = String(60 - (-x + 0.5) * 60 + (40 - (-y + 0.5) * 40) + '%');
		this.shineOpacity = String(y + 0.2 + (x + 0.2));
	},
});

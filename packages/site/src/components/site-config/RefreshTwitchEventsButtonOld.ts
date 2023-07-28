export default () => ({
	btnText: 'Refresh Twitch Events',
	disabled: false,
	btnType: 'submit',
	refresh() {
		this.btnText = 'Refreshing...';
		this.disabled = true;
		console.log('refreshing');
		fetch('/api/admin/refresh-twitch-event-subscriptions?fetch=true', {
			method: 'POST',
		}).then((res) => {
			if (res.ok) {
				this.btnText = 'Refreshed!';
				this.btnType = 'success';
			} else {
				this.btnText = 'Error!';
				this.btnType = 'error';
			}

			this.disabled = false;
			setTimeout(() => {
				this.btnText = 'Refresh Twitch Events';
				this.btnType = 'submit';
			}, 2000);
		});
	},
});

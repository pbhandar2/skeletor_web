$(document).ready(function() {

	const current_location = window.location.pathname.split("/")[1]

	if (!current_location) $("#home_li").addClass("active");
	else $(`#${current_location}_li`).addClass("active");
});
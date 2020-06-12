$(document).ready(function() {
	const current_location = window.location.pathname.split("/")[1]
	if (!current_location) $("#home_li").addClass("active");
	else $(`#${current_location}_li`).addClass("active");
});

function convertDate(date_string, id) {
	//console.log(date_string);
	//console.log(id);
	const date_obj = new Date(date_string);
	const moment_obj = moment(date_obj).utcOffset(-7).format('YYYY-MM-DD HH:mm');
	//console.log(document.getElementById(`date_${id}`));
	document.getElementById(`date_${id}`).innerHTML = moment_obj;
}
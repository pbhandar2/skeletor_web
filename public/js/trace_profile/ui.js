/*
	The function creates a new progress bar for a download session.
*/
function createProgressBar(barNumber) {
	let main_row = document.createElement("div");
	main_row.className = "row";
	main_row.id = "progressBar-" + barNumber + "-wrapper";

	const bar = document.createElement("div");
	bar.className = "progressBar-" + barNumber;
	bar.style.height = '40px';
	bar.style.width = '0%';
	bar.style.backgroundColor = 'blue';
	bar.style.margin = '5px';
	bar.innerHTML = 'Uploading ..';
	main_row.append(bar);

	let progressBarContainer = document.getElementById("progressBarContainer");
	progressBarContainer.append(main_row);
}

/*
	The function creates a new progress bar for a download session.
*/
function createAnalysisProgressBar(fileName, timestamp) {

	console.log("in createAnalysisProgressBar");
	let main_row = document.createElement("div");
	main_row.className = "row";
	main_row.id = "analysisProgressBar-" + fileName + "_" + timestamp + "-wrapper";
	main_row.innerHTML = `Analyzing ${fileName}`;
	main_row.style.margin = '3px';

	const bar = document.createElement("div");
	bar.className = "analysisProgressBar-" + fileName + "_" + timestamp;
	bar.style.height = '40px';
	bar.style.width = '0%';
	bar.style.backgroundColor = "#ffcc66";
	bar.style.margin = '5px';
	
	main_row.append(bar);

	let progressBarContainer = document.getElementById("progressBarContainer");
	progressBarContainer.append(main_row);
}

function incrementAnalysisProgressBar(fileName, size, filesCompleted, timestamp) {
	const lambdaNeeded = (size*11)/50000000;
	const percentDone = Math.floor((filesCompleted/lambdaNeeded)*100);

	//console.log(`incrementing ${fileName} needed: ${lambdaNeeded} done: ${filesCompleted} percent: ${percentDone}`);
	//console.log(document.getElementsByClassName("analysisProgressBar-" + fileName));
	//console.log(document.getElementsByClassName("analysisProgressBar-" + fileName + "_" + timestamp));

	const bar = document.getElementsByClassName("analysisProgressBar-" + fileName);
	bar[0].style.width = `${percentDone}%`;
}

/*
	The function removes a progress bar once a download session is complete. 
*/
function removeProgressBar(barNumber) {
	let progressBarContainerClass = "progressBar-" + barNumber + "-wrapper";
	let progressBarContainer = document.getElementById(progressBarContainerClass);
	progressBarContainer.remove();
}

function removeAnalysisProgressBar(fileName) {
	let progressBarContainerClass = "analysisProgressBar-" + fileName + "-wrapper";
	let progressBarContainer = document.getElementById(progressBarContainerClass);
	progressBarContainer.remove();
}




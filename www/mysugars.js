var RESULTS_LOCAL_STORAGE = "results";
var BG_UNITS_LOCAL_STORAGE = "bgunits";
var jQT = '';

function setupJQTouch(){
	
	jQT = $.jQTouch({
					icon: 'icon.png',
					startupScreen: 'startup.png'
					});
	
}

function showAds(){
	var adAtBottom = true,
	showAdsNow = true;
	setTimeout(function() {
			   window.plugins.iAdPlugin.prepare(adAtBottom); // by default, ad is at Top
			   }, 1000);
	window.plugins.iAdPlugin.showAd(showAdsNow);
}

function cb(date) {
	console.log(date.toString());
	alert('date is'+date.toString());
	document.getElementById("displaydate").innerHTML = date.toString();
}

function show(mode) {
	plugins.datePicker.show({
		date: new Date(),
		mode: mode, //date or time or blank for both
		allowOldDates: true
	    }, cb);
}

function initializeStorage()
{
	if (!localStorage[RESULTS_LOCAL_STORAGE]) 
	{
		localStorage[RESULTS_LOCAL_STORAGE] = JSON.stringify([]);
	}
	if(!localStorage[BG_UNITS_LOCAL_STORAGE])
	{
		localStorage[BG_UNITS_LOCAL_STORAGE] = '';
	}
}

function getSortedResults()
{
	var results = JSON.parse(localStorage[RESULTS_LOCAL_STORAGE]);
	
	if(results.length > 1)
	{
		results.sort(function(a, b) {  
					 if (a.order < b.order) return -1;  
					 if (a.order > b.order) return 1;  
					 return 0;  
					   }  
					 );  
		
	}
	return results;
}

function setupEvents()
{
	$('#result').click(showResultForEditing);
	$('#add form').submit(saveResult);
	$('#edit form').submit(updateResult);
	$('#settings form').submit(saveSettings);
	$('#deleteresult').click(confirmDelete);
	$('#clearresults').click(confirmClear);
	$('#maillink').click(sendEmail);
}

function sendEmail()
{
	
	var formatedResults = '';
	var resultsToEmail = getSortedResults();
	var subject = '';
	var units = localStorage[BG_UNITS_LOCAL_STORAGE];
	
	for(i in resultsToEmail)
	{
		formatedResults += 'Day: '+ resultsToEmail[i].displaydate +'\n';
		formatedResults += 'Time: '+ resultsToEmail[i].displaytime +'\n';
		formatedResults += 'Result: '+ resultsToEmail[i].sugar +' '+units+'\n';
		formatedResults += 'Insulin: '+ resultsToEmail[i].insulinamount +'\n';
		formatedResults += 'Food: '+ resultsToEmail[i].food +'\n';
		formatedResults += 'Excercise: '+ resultsToEmail[i].exercise +'\n';
		formatedResults += '\n';
	}
	
	window.plugins.emailComposer.showEmailComposer(subject,formatedResults);
}

function confirmClear()
{
	navigator.notification.confirm('Do you want to clear all the results?',clearResults);
}

function clearResults()
{
	localStorage[RESULTS_LOCAL_STORAGE] = JSON.stringify([]);
	showResults();
	jQT.goBack();
	return false;
}

/*
 Confirm delete message
 */
function confirmDelete()
{
	navigator.notification.confirm('Do you want to delete the result?',deleteResult);
}

/*
 delete a single result
 */
function deleteResult()
{
		
	var results = getSortedResults();
	var editId = document.getElementById('editid').value;
	var key = findResultKeyById(editId);
	
	results.splice(key,1);
	saveResults(results);

	updateList('editform');
	
	return false;
}

/*
 show all results in the list
 */
function showResults()
{

	var perviousTitle = '',
	resultsToShow = getSortedResults(), 
	units = localStorage[BG_UNITS_LOCAL_STORAGE];
	
	resetList();
	
	for(i in resultsToShow)
	{
		var title = resultsToShow[i].groupingdate;
		
		if(perviousTitle != title)
		{
			var seperator = '<li class="sep">'+title+'</li>';
			var seperatorItem = $(seperator);
			$('#resultslist').append(seperatorItem);
			perviousTitle = title;
		}
		
		var result = '<li class="arrow"><a href="#edit" id="result">'+resultsToShow[i].sugar+' '+units+'<small>'+resultsToShow[i].displaytime +'</small></a></li>';
		var resultItem = $(result);
		resultItem.bind('click',{IdForResult:resultsToShow[i].id},showResultForEditing);
		
		$('#resultslist').append(resultItem);
		
	}
}

/*
 reset the results list to be blank
 */
function resetList()
{
	var element = document.getElementById('resultslist');
	element.innerHTML = "";
}

/*
 show the linked result for editing
 */
function showResultForEditing(e)
{	
	var id = e.data.IdForResult;
	//_debug('edit record '+id);
	var	result = getResultById(id);
	
	document.getElementById('editid').value = result.id;
	document.getElementById('editdatetime').value = result.datetime;
	document.getElementById('editdisplaydate').value = result.displaydate;
	document.getElementById('editdisplaytime').value = result.displaytime;
	document.getElementById('editsugar').value = result.sugar;
	document.getElementById('editinsulinamount').value = result.insulinamount;
	document.getElementById('editfood').value = result.food;
	document.getElementById('editexercise').value = result.exercise;
}

/*
 get the result for this result.id
 */
function getResultById(id){
	
	var results = getSortedResults();
	var result = '';
	for(i in results){
		//alert(' this id ['+results[i].id+'] looking for ['+id+']');
		if(results[i].id == id){
			result = results[i];
			break;
		}
	}
	return result;
}

/*
 find the key for this results id	
*/
function findResultKeyById(resultId){
	var results = getSortedResults();
	var key = '';
	for(i in results){
		if(results[i].id === resultId){
			key = i;
			break;
		}
	}
	
	return key;
}

/*
 update and save the results with this edited result
 */
function updateResult(){
	
	var results = getSortedResults();
	var editId = document.getElementById('editid').value;
	var key = findResultKeyById(editId);
		
	//update values
	
	if(key !== ''){
		results[key].groupingdate = formatGroupingDate(document.getElementById('editdisplaydate').value);
		results[key].displaydate = document.getElementById('editdisplaydate').value;
		results[key].displaytime = document.getElementById('editdisplaytime').value;
		results[key].order = getResultDateOrder(document.getElementById('editdisplaydate').value,document.getElementById('editdisplaytime').value);
		results[key].sugar = document.getElementById('editsugar').value;
		results[key].insulinamount = document.getElementById('editinsulinamount').value;
		results[key].food = document.getElementById('editfood').value;
		results[key].exercise = document.getElementById('editexercise').value;
		
		saveResults(results);
	}else{
		alert('no match');
	}
	
	updateList('editform');
	
	return false;
}

function updateList(form){
	showResults();
	jQT.goBack();
	resetForm(form);
}

/*
  add and save this new result to the results
 */
function saveResult(){
	
	//_debug('save result');
	
	var uniqId = 'id' + (new Date()).getTime();
	
	var result={
		id : uniqId,
		groupingdate : formatGroupingDate(document.getElementById('displaydate').value),
		displaydate : document.getElementById('displaydate').value,
		displaytime : document.getElementById('displaytime').value,
		order : getResultDateOrder(document.getElementById('displaydate').value,document.getElementById('displaytime').value),
		sugar : document.getElementById('sugar').value,
		insulinamount : document.getElementById('insulinamount').value,
		food : document.getElementById('food').value,
		exercise : document.getElementById('exercise').value
	};
	
	var results = getSortedResults();
	results.push(result);
	
	saveResults(results);
	updateList('addform');
	return false;
}

/*
 save any settings
 */
function saveSettings(){
	
	try
	{
		var units = document.getElementById('glucoseunits').value;
		//alert('units: '+units);
		localStorage[BG_UNITS_LOCAL_STORAGE] = units;	
		jQT.goBack();
		return false;
	}
	catch (error) 
	{
		if (error === QUOTA_EXCEEDED_ERR) 
		{
			navigator.notification.alert('Storage quota has been exceeded!');
		}
	}
}

/*
 Save results to local storage
 */
function saveResults(results){
	try
	{
		localStorage[RESULTS_LOCAL_STORAGE] = JSON.stringify(results);	
		
	}
	catch (error) 
	{
		if (error === QUOTA_EXCEEDED_ERR) 
		{
			navigator.notification.alert('Storage quota has been exceeded!');
		}
	}
}

/*
 reset the form
 */
function resetForm(name)
{
	document.getElementById(name).reset(); 
}

/*
 format the time for display purposes
 */
function formatDisplayTime()
{	
	var displayTime = document.getElementById('displaytime').value;
	
	if(!displayTime){
		
		var currentTime = new Date(),
		hours = currentTime.getHours(),
		minutes = currentTime.getMinutes(),
		formatedTime = '';
		
		if (minutes < 10)
		{
			minutes = "0" + minutes
		}
		formatedTime = hours + ":" + minutes;
		
		document.getElementById('displaytime').value = formatedTime;
	}
}

function getResultDateOrder(date,time)
{
	var hours = time.split(":",2)[0];
	var minutes = time.split(":",2)[1];
	
	var resolvedDateTime = new Date(date); 
	
	resolvedDateTime.setHours(hours);
	resolvedDateTime.setMinutes(minutes);	
	
	return resolvedDateTime.getTime();
}

/*
 what is the day of the week?
 */
function getDayOfWeek(theDay)
{	
	switch (theDay)
	{
		case 0:
			return "Sunday";
			break;
		case 1:
			return "Monday";
			break;
		case 2:
			return "Tuesday";
			break;
		case 3:
			return "Wednesday";
			break;
		case 4:
			return "Thursday";
			break;
		case 5:
			return "Friday";
			break;
		case 6:
			return "Saturday";
			break;			
	}
}

/*
 format the date that is used to group the results
 */
function formatGroupingDate(dateString)
{
	var theDate = new Date(dateString);
	var dayOfWeek = getDayOfWeek(theDate.getDay());
	var formatted = dayOfWeek+" "+theDate.toLocaleDateString();
	return formatted;
}

/*
 format the date for display purposes
 */
function formatDisplayDate()
{
	var displayDate = document.getElementById('displaydate').value;
	
	if(!displayDate)
	{
		var currentDate = new Date();
		document.getElementById('displaydate').value = currentDate.toLocaleDateString();
	}
}

var randomNumberSeed = Math.floor((Math.random()*10000)+1);
var JOB_INTERVAL_GROUP_1 = 20.0;
var JOB_INTERVAL_GROUP_2 = 40.0;
var JOB_INTERVAL_GROUP_3 = 12.5;

var JOB_EXECUTION_MAC = 4.5;
var JOB_EXECUTION_NEXT = 5.0;
var JOB_EXECUTION_PRINTER = 5.8;

var NUMBER_SIMULATIONS = 1;
var NUMBER_JOBS = 10000;
var NUMBER_WARMUP_JOBS = 1000;
var MAX_PRINTER_JOBS = 10;

// Completed all three stages
var successfulJobs = 0;

// Exited the system
var completedJobs = 0;

var jobArea = 0.0, prevJobArea = 0.0, prevClock = 0.0, prevJobTotal = 0;
var clock = 0.0;
var _jobId = 0;
var timer;

var trials = 1;
var jobHistory = 0.0;
var printerJobs = 0;
var macClock = 0.0;
var macHistory = 0.0;
var nextClock = 0.0;
var nextHistory = 0.0;
var printerClock = 0.0;
var printerHistory = 0.0;

var averageJobs = [], averageTime = [], averageMacUtil = [], averageNextUtil = [], averagePrinterUtil = [];

// var warmupClock = 0.0;
// var warmupMacClock = 0.0;
// var warmupNextClock = 0.0;
// var warmupPrinterClock = 0.0;

var warmupDone = false;
var printerQueueGraphTime = [];
var printerQueueGraphNumber = [];

// Miliseconds
var TIMER_TICK = 1;

var ANIMATING = function () {
	return ( TIMER_TICK > 0 );
}

var Job = Backbone.Model.extend({
	initialize: function(){
		_jobId++;
		this.set('id', _jobId);
	},
	defaults: {
		state: "INIT",
		source: "GROUP_1",
		arrivalTime: 0.0,
		systemStartTime: 0.0,
		didPrint: false,
	},
	selector: function (){
		return '#job-' + this.id;
	},

	removeUI: function(){
		if ( ANIMATING() )
		{
			$(this.selector()).hide().remove();
		}
	},
	drawUI: function (){

	},
	didPrint: function () {
		this.set('didPrint', true);
	},
	totalTime: function () {
		return this.get('arrivalTime') - this.get('systemStartTime');
	}
});

var JobList = Backbone.Collection.extend({
	model: Job,
	comparator: function(job) {
		return job.get('arrivalTime');
	}
});

var jobList = new JobList();

function randomNumberGenerator ( plSeed ) {
	var dZ, dQout, lQuot;

	dZ = ( plSeed ) * 16807;
	dQuot = dZ / 2147483647;
	lQuot = Math.floor( dQuot );
	dZ -= lQuot * 2147483647;

	randomNumberSeed = Math.floor( dZ );
	return ( dZ / 2147483647 );
}

function exponentialRVG ( dMean ) {
	return ( -dMean * Math.log(randomNumberGenerator(randomNumberSeed)));
}

function updateClock ( force )
{
	if ( ANIMATING() || force == true )
	{
		updateCompletedJobCount();
		updateUtilizations();

		$('#clock').text(clock);

		// var groupTotal = $('#group-list li').size();
		// var macTotal = $('#mac-list li').size();
		// var nextTotal = $('#next-list li').size();
		// var printerTotal = $('#printer-list li').size();
		// var countTotal = groupTotal + macTotal + nextTotal + printerTotal;

		// $('#bar-group').css('width', (groupTotal / countTotal)*100+'%');
		// $('#bar-mac').css('width', (macTotal / countTotal)*100+'%');
		// $('#bar-next').css('width', (nextTotal / countTotal)*100+'%');
		// $('#bar-printer').css('width', (printerTotal / countTotal)*100+'%');
	}
}

function updateUtilizations ()
{
	$('#mac-util').text(macHistory / clock);
	$('#next-util').text(nextHistory / clock);
	$('#printer-util').text(printerHistory / clock);
	$('#average-time').text(jobHistory / successfulJobs);
	$('#average-jobs').text(jobArea / clock);
}

function updateJobArea ()
{
	jobArea += prevJobTotal * (clock - prevClock);
	prevJobTotal = jobList.length;
	prevClock = clock;
}

function updateCompletedJobCount ()
{
	$('#job-count').text(completedJobs);
}

$(document).ready(function(){

	// First three jobs:
	jobList.add(new Job({
		arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_1),
		source: "GROUP_1"
	}));
	jobList.add(new Job({
		arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_2),
		source: "GROUP_2"
	}));
	jobList.add(new Job({
		arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_3),
		source: "GROUP_3"
	}));

	$('#animation-button').toggleClass('btn-success');
	$('#animation-button').on('click', function(){
		$(this).toggleClass('btn-success');

		return false;
	});


	$('#start-button').on('click', function(){
		if ( $('#animation-button').hasClass('btn-success') )
		{
			TIMER_TICK = parseInt($('#animation-time').val());
			if ( TIMER_TICK < 0 ) TIMER_TICK = 1;
			$('#animation-time').val(TIMER_TICK);
		}
		else
		{
			TIMER_TICK = 0;
		}

		if ( ANIMATING() )
		{
			timer = window.setInterval(function(){
				if ( completedJobs < (NUMBER_JOBS + NUMBER_WARMUP_JOBS) )
				{
					runSimulation();
				}
			}, TIMER_TICK);

		}
		else
		{
			function doSimulation ()
			{
				while ( completedJobs < (NUMBER_JOBS + NUMBER_WARMUP_JOBS) )
				{
					runSimulation();
				}
				updateClock(true);
			}

			doSimulation();
		}

		return false;
	});

	$('#reset-button').on('click', function(){
		window.clearInterval(timer);

		completedJobs = 0.0;
		jobList.reset();
		$('ol').empty();
		warmupDone = true;
		clock = 0.0;
		jobHistory = 0.0;

		successfulJobs = 0;
		printerJobs = 0;

		jobArea = 0.0;
		prevJobArea = 0.0;
		prevClock = 0.0;
		prevJobTotal = 0;

		macClock = 0.0;
		macHistory = 0.0;

		nextClock = 0.0;
		nextHistory = 0.0;

		printerClock = 0.0;
		printerHistory = 0.0;

		printerQueueGraphNumber = [];
		printerQueueGraphTime = [];

		// First three jobs:
		jobList.add(new Job({
			arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_1),
			source: "GROUP_1"
		}));
		jobList.add(new Job({
			arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_2),
			source: "GROUP_2"
		}));
		jobList.add(new Job({
			arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_3),
			source: "GROUP_3"
		}));

		updateClock();

		return false;
	});

	$('#pause-button').on('click', function(){
		window.clearInterval(timer);
		return false;
	});

	$('#total-job-count').text(NUMBER_JOBS + NUMBER_WARMUP_JOBS + " total ("+ NUMBER_WARMUP_JOBS + " warmup jobs)");
});

function runSimulation ()
{
	var j, timeDifference;

	j = jobList.shift();

	if ( typeof j == undefined || j == null ) return;

	if ( completedJobs == NUMBER_WARMUP_JOBS && !warmupDone )
	{
		jobList.reset();
		$('ol').empty();
		warmupDone = true;
		clock = 0.0;
		jobHistory = 0.0;

		successfulJobs = 0;
		printerJobs = 0;

		jobArea = 0.0;
		prevJobArea = 0.0;
		prevClock = 0.0;
		prevJobTotal = 0;

		macClock = 0.0;
		macHistory = 0.0;

		nextClock = 0.0;
		nextHistory = 0.0;

		printerClock = 0.0;
		printerHistory = 0.0;

		printerQueueGraphNumber = [];
		printerQueueGraphTime = [];

		// First three jobs:
		jobList.add(new Job({
			arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_1),
			source: "GROUP_1"
		}));
		jobList.add(new Job({
			arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_2),
			source: "GROUP_2"
		}));
		jobList.add(new Job({
			arrivalTime: exponentialRVG(JOB_INTERVAL_GROUP_3),
			source: "GROUP_3"
		}));

		return;
	}

	clock = j.get('arrivalTime');
	updateClock();
	updateJobArea();

	j.removeUI();

	var state = j.get('state');
	var arrivalTime = j.get('arrivalTime'), executionTime;
	switch ( state )
	{
		case "INIT":

			if ( ANIMATING() )
			{
				$('<li id="job-'+j.get('id')+'"><button class="btn palette-firm">Job #' + j.id + '</button></li>').show().appendTo('#group-list');
			}

			// Add jobs from same group

			switch ( j.get('source') )
			{
				case "GROUP_1":
					arrivalTime = exponentialRVG(JOB_INTERVAL_GROUP_1);
				break;

				case "GROUP_2":
					arrivalTime = exponentialRVG(JOB_INTERVAL_GROUP_2);
				break;

				case "GROUP_3":
					arrivalTime = exponentialRVG(JOB_INTERVAL_GROUP_3);
				break;
			}

			jobList.add(new Job({
				arrivalTime: clock + arrivalTime,
				systemStartTime: clock,
				source: j.get('source')
			}));

			// Add same job back into model
			j.set('state', 'MAC');
			jobList.add(j);
		break;

		case "MAC":
			if ( ANIMATING() )
			{
				$('<li id="job-'+j.get('id')+'"><button class="btn palette-info">Job #' + j.id + '</button></li>').show().appendTo('#mac-list');

			}

			// Add same job back into model
			j.set('state', 'NEXT');
			executionTime = exponentialRVG(JOB_EXECUTION_MAC);
			macHistory += executionTime;

			if ( arrivalTime + executionTime < macClock )
			{
				arrivalTime = macClock + executionTime;
			}
			else
			{
				arrivalTime += executionTime;
			}

			macClock = arrivalTime;

			j.set('arrivalTime', arrivalTime);
			jobList.add(j);
		break;

		case "NEXT":
			if ( ANIMATING() )
			{
				$('<li id="job-'+j.get('id')+'"><button class="btn palette-wisteria">Job #' + j.id + '</button></li>').show().appendTo('#next-list');
			}
			// Add same job back into model


			j.set('state', 'PRINTER');
			executionTime = exponentialRVG(JOB_EXECUTION_NEXT);
			nextHistory += executionTime;

			if ( arrivalTime + executionTime < nextClock )
			{
				arrivalTime =  nextClock + executionTime;
			}
			else
			{
				arrivalTime += executionTime;
			}

			nextClock = arrivalTime;

			j.set('arrivalTime', arrivalTime);
			jobList.add(j);
		break;


		case "PRINTER":
			if ( printerJobs < MAX_PRINTER_JOBS )
			{
				printerJobs++;
				if ( ANIMATING() )
				{
					$('<li id="job-'+j.get('id')+'"><button class="btn palette-carrot">Job #' + j.id + '</button></li>').show().appendTo('#printer-list');
				}
				executionTime = exponentialRVG(JOB_EXECUTION_PRINTER);
				printerHistory += executionTime;

				if ( arrivalTime + executionTime < printerClock )
				{
					arrivalTime = printerClock + executionTime;
				}
				else
				{
					arrivalTime += executionTime;
				}

				j.didPrint();
				printerClock = arrivalTime;
				j.set('state', 'COMPLETED');
				j.set('executionTime', executionTime);
				j.set('arrivalTime', arrivalTime);
				jobList.add(j);
			}

			completedJobs++;
		break;

		case 'COMPLETED':

			jobHistory += j.totalTime();
			// console.log(j.totalTime());
			if ( printerJobs > 0 )
			{
				printerJobs--;
			}

			successfulJobs++;
		break;
	}

}

var toggleHandler = function(toggle) {
    var toggle = toggle;
    var radio = $(toggle).find("input");

    var checkToggleState = function() {
        if (radio.eq(0).is(":checked")) {
            $(toggle).removeClass("toggle-off");
        } else {
            $(toggle).addClass("toggle-off");
        }
    };

    checkToggleState();

    radio.eq(0).click(function() {
        $(toggle).toggleClass("toggle-off");
    });

    radio.eq(1).click(function() {
        $(toggle).toggleClass("toggle-off");
    });
};

$(document).ready(function() {
    $(".toggle").each(function(index, toggle) {
        toggleHandler(toggle);
    });
});

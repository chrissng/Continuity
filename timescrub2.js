var minMaxDates = [new Date("2014-07-23T00:00:00Z"), new Date("2014-07-23T12:00:00Z")]; 
//var minMaxDates = [new Date("2014-07-23T05:35:28Z"), new Date("2014-07-23T08:59:30Z")]; 
var allData = [];

d3.csv("my_ships_h2.csv", function(data) { 

	var escapeRegex = / |\#|\.|\>|\<|\,|\:|\/|\)|\(|\'|\"|\-|\n|\r|\&|\*|\@/g;
	var counter = 0;
	var customTimeFormat = d3.time.format.utc.multi([
		[".%L", function(d) { return d.getMilliseconds(); }],
		[":%S", function(d) { return d.getSeconds(); }],
		["%I:%M", function(d) { return d.getMinutes(); }],
		["%I %p", function(d) { return d.getHours(); }],
		["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
		["%b %d", function(d) { return d.getDate() != 1; }],
		["%B", function(d) { return d.getMonth(); }],
		["%Y", function() { return true; }]
	]);
	var margin = {top: 10, right: 10, bottom: 10, left: 10},
		width = 1000 - margin.left - margin.right,
		height = 50 - margin.bottom - margin.top,
		moving,
		currentValue = 0,
		targetValue = 0,
		alpha = 0.2,
		testMapHeight = 700;
		
		
	// Load data
	allData = d3.nest()
		.key(function(d) { return d.eid; })
		.entries(data); 
	
	for (var i = 0; i < allData.length; i++) { // for each ship
		var dateList = [];
		var lngList = [];
		var latList = [];
		
		for (var j = 0; j < allData[i].values.length; j++) {
			dateList.push(new Date(allData[i].values[j].time));
			lngList.push(parseFloat(allData[i].values[j].lng));
			latList.push(parseFloat(allData[i].values[j].lat));
		}
		
		console.log("dateList #: " + dateList.length + " \t lngList #: " + lngList.length + " \t latList #: " + latList.length);
		
		allData[i].lonScale = d3.time.scale().domain(dateList).range(lngList);
		allData[i].latScale = d3.time.scale().domain(dateList).range(latList);
	}
	console.log("Tracks count: " + allData.length);
	
	
	// Map projection stuffs for testing
	var projection = d3.geo.mercator()
		.center([100.25051, 3.42496])
		.scale(25000)
		.translate([width / 2, testMapHeight / 2]);
		
		
	// Timeline, brush, labels and stuffs
	var x = d3.time.scale()
		.domain(minMaxDates)
		.range([0, width-30])
		.clamp(true);
		
	var brush = d3.svg.brush()
		.x(x)
		.extent([0, 0])
		.on("brush", brushed);

	var div = d3.select("body").append("div").attr("id", "console")
		.style("position", "absolute").style("top", "15px").style("left", "20px")
		.text("time scrubber");

	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.style("position", "absolute").style("top", "20px")
		.append("g")
			.attr("transform", "translate(" + margin.left*2 + "," + margin.top + ")");

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (height / 2) + ")")
		.style("font-size", "6 pt")
		.call(d3.svg.axis()
			.scale(x)
			.tickFormat(customTimeFormat)
			.tickPadding(12)
			.tickSize(0))
		.select(".domain")
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "halo");

	var slider = svg.append("g")
		.attr("class", "slider")
		.call(brush);

	slider.selectAll(".extent,.resize").remove();
	slider.select(".background").attr("height", height);

	var handle = slider.append("circle")
		.attr("class", "handle")
		.attr("transform", "translate(0," + height / 2 + ")")
		.style("fill", "#ddd")
		.attr("r", 10);

	//slider.call(brush.extent([targetValue, targetValue]));

	var testArea = d3.select("body").append("svg")
					.attr("id", "testArea")
					.attr("width", width + margin.left)
					.attr("height", testMapHeight)
					.style("background", "#1E1E1E")
					.style("border", "1px solid black");

	d3.json("my_malacca_straits.json", function(data) {
		testArea.selectAll("path")
			.data(data.features)
			.enter()
				.append("path")
				.attr("d", d3.geo.path().projection(projection))
				.style("fill", "#555555");

		var shipCircle = testArea.selectAll("circle")
			.data(allData)
			.enter()
			.append("circle")
				.attr("class", "track").attr("id", function(d) {
					return "track" + d.key.replace(escapeRegex, "_");
				})
				.attr("fill", function(d) {
					if (d.key == "7f878b65-87a2-477a-b519-2bc00f98f4b5") {
						d.darken = 0;
						return "#ff0000";
					} else {
						return "#ffffff";
					}
				})
				.attr("r", function(d) {
					if (d.key == "7f878b65-87a2-477a-b519-2bc00f98f4b5") {
						return 4.5;
					} else {
						return 3;
					}
				})
				.style("stroke-width", 1)
				.style("stroke", "#000");
				
		shipCircle.filter(function(d) { return d.values.length <= 1; }).remove();
		
		brushed(true);
	});
	
	
	
	/*
	function brushed() {
		var value = brush.extent()[0];
		if (d3.event && d3.event.sourceEvent) { // not a programmatic event
			value = x.invert(d3.mouse(this)[0]);
			brush.extent([value, value]);
		}
		
		handle.attr("cx", x(value));
		
		var format = d3.time.format("%d %b %Y %I:%M:%S %p");
		var valueRounded = Math.round(value);
		var text1 = "" + (++counter) + ") " + format(new Date(valueRounded)) + " - " + lonScale(valueRounded).toFixed(9) + ", " + latScale(valueRounded).toFixed(9);
		
		console.log(text1);
		
		d3.select("circle#sampleTrack").attr("transform", "translate(" + projection([lonScale(valueRounded), latScale(valueRounded)]) + ")");
		d3.select("div#console").text(text1);
		//d3.select("body").style("background-color", d3.hsl(value, .8, .8));
	}*/

	function brushed(init) {
		if (d3.event && d3.event.sourceEvent) { // not a programmatic event
			targetValue = x.invert(d3.mouse(this)[0]);
			move();

			return;
		} else if (init) {
			brush.extent([minMaxDates[0], minMaxDates[0]]);
		}

		currentValue = brush.extent()[0];
		handle.attr("cx", x(currentValue));

		var format = d3.time.format.utc("%d %b %Y %I:%M:%S %p");
		var currentValueRounded = Math.round(currentValue);
		//var text1 = "" + (++counter) + ") " + format(new Date(currentValueRounded)) + " - " + lonScale(currentValueRounded).toFixed(9) + ", " + latScale(currentValueRounded).toFixed(9);
		var text1 = "Deviation from traveling pattern @ " + format(new Date(currentValueRounded));

		//console.log(text1);
		//console.log(projection([lonScale(currentValueRounded), latScale(currentValueRounded)]));

		//d3.select("circle#sampleTrack").attr("transform", "translate(" + projection([lonScale(currentValueRounded), latScale(currentValueRounded)]) + ")");
		d3.select("div#console").text(text1);
		d3.selectAll("svg#testArea circle.track")
			/*style("fill", function(d) {
				if (d.key == "7f878b65-87a2-477a-b519-2bc00f98f4b5") {
					d.darken++;
					return (currentValueRounded >= 1406098155505 && currentValueRounded <= 1406101292785 && d.darken%5<3) ? "#860111" : "#f00";
				} else {
					return "#fff";
				}
			})*/
			.style("stroke", function(d) {
				if (currentValueRounded >= 1406098155505 && currentValueRounded <= 1406101292785 && d.key == "7f878b65-87a2-477a-b519-2bc00f98f4b5") {
					return "#ffffff";
				} else {
					return "#000000";
				}
			})
			.attr("transform", function(d) {
				var proj = projection([d.lonScale(new Date(currentValueRounded)), d.latScale(new Date(currentValueRounded))]);
				if (isNaN(proj[0]) || isNaN(proj[1])) {
					console.log(d.key);
					return;
				}
				return "translate(" + proj + ")"
			});
	}

	function move() {
		if (moving) return false;
		moving = true;
		d3.timer(function() {
			currentValue = Math.abs(currentValue - targetValue) < 1e-3
				? targetValue
				: targetValue * alpha + currentValue * (1 - alpha);
			slider
				.call(brush.extent([currentValue, currentValue]))
				.call(brush.event);

			//console.log(moving + " - " + Math.round(currentValue/1000) + " - " + Math.round(targetValue/1000));

			return !(moving = Math.round(currentValue/1000) !== Math.round(targetValue/1000));
		});
	}
});
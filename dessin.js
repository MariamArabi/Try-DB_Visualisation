var BORDER_CHARGE = 3;
var PARTICLE_CHARGE = 0.1;
var PARTICLE_CHARGE_POW = 2;

var keys = ["AvMoisture", "AvN", "AvP", "AvK"];

// Panel A : Treemap

var svgA = d3.select(".a svg");

var colors = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);
var colors2 = d3.scaleOrdinal(d3.schemePastel1);

var treemap = d3.treemap()
	.tile(d3.treemapResquarify)
	.size([+svgA.attr("width"), +svgA.attr("height")])
	.round(true)
	.paddingInner(1);

var tooltip = d3.select('body')
	.append('div')
	.attr('class', 'hidden tooltip');

// Panel B : Buttons

// Panel C : Selection

var svgC = d3.select(".c svg");
var MAX_SELECTED_PLANTS = 10;
var selectedPlants = [];

var widthC = +svgC.attr("width");
var heightC = +svgC.attr("height");

// Panel D : Voronoi

var svgD = d3.select(".d svg");
var widthD = +svgD.attr("width");
var heightD = +svgD.attr("height");
var nodePadding = 2.5;

var simulation = d3.forceSimulation()
	.force("forceX", d3.forceX().strength(0.01 * BORDER_CHARGE).x(widthD * .5))
	.force("forceY", d3.forceY().strength(.015 * BORDER_CHARGE).y(heightD * .5));

var voronoi = d3.voronoi()
	.extent([[0, 0], [widthD, heightD]])
	.x(function (d) { return d.x; })
	.y(function (d) { return d.y; });

var voronoiGroup = svgD.append("g")
	.attr("class", "voronoi");

var nodesGroup = svgD.append("g")
	.attr("class", "nodes")

var t = d3.transition()
	.duration(750);

// Panel E : Butons

var svgE = d3.select(".e svg");

// Data

d3.csv("data/nutriments.csv", function (data) {
	data.AvK = +data.AvK;
	data.AvN = +data.AvN;
	data.AvP = +data.AvP;
	data.AvMoisture = +data.AvMoisture;
	data.total = data.AvK + data.AvN + data.AvP + data.AvMoisture;

	return data;

}).then(function (data) {
	initButtons(data);
	displayTreemap(data, "AvMoisture");
	displayBarChart();
});

function updateVoronoi() {

	// transition‚
	var t = d3.transition()
		.duration(750);

	// elements
	var circle, path;

	// JOIN
	path = voronoiGroup.selectAll("path")
		.data(voronoi(selectedPlants).polygons());

	circle = nodesGroup.selectAll("circle")
		.data(selectedPlants, function (d) { return d.Name; })
		.on("mouseover", function (d) {
			console.log(d)
			onMouseOver(d);
		})
		.on("mouseout", function (d) {
			onMouseOut(d);
		});

	// EXIT
	path.exit().remove();
	circle.exit().remove();

	// UPDATE
	path
		.attr("d", function (d) { return d ? "M" + d.join("L") + "Z" : null; })
		.style("fill", "#FFF")
		.style("stroke", "#222");

	circle
		.attr("cx", function (d) { return d.x; })
		.attr("cy", function (d) { return d.y; })
		.on("mouseover", function (d) {
			console.log(d)
			onMouseOver(d);
		})
		.on("mouseout", function (d) {
			onMouseOut(d);
		});

	// ENTER
	path.enter().append("path")
		.attr("class", "voronoi")
		.attr("d", function (d) { return d ? "M" + d.join("L") + "Z" : null; })
		.style("fill", "#FFF")
		.style("stroke", "#222");

	circle.enter().append("circle")
		.attr("r", 10)
		.attr("cx", function (d) { return d.x; })
		.attr("cy", function (d) { return d.y; })
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended))
		.style("fill", function (d) {
			console.log(d);
			return colors(d.CropCategory);
		})
		.append("text")
        .text(function(d) { return d.Name; })
        .attr("y", function(d) { return 20; })
        .attr("x", function(d) { return 5; });

	simulation.alphaDecay(0.000001);

	simulation
		.nodes(selectedPlants)
		.force("charge", d3.forceManyBody().strength(function (d) {
			return -PARTICLE_CHARGE * Math.pow(d.AvMoisture, PARTICLE_CHARGE_POW);
		}))
		.force("collide", d3.forceCollide().strength(.5).radius(35))
		.on("tick", function (d) {

			circle = nodesGroup.selectAll("circle")
				.data(selectedPlants, function (d) { return d.Name; });

			circle
				.attr("cx", function (d) { return Math.max(35, Math.min(widthD - 35, d.x)); })
				.attr("cy", function (d) { return Math.max(35, Math.min(heightD - 35, d.y)); });

			voronoi
				.x(function (d) { return d.x; })
				.y(function (d) { return d.y; });

			path = voronoiGroup.selectAll("path")
				.data(voronoi(selectedPlants).polygons());
			path.attr("d", function (d) {
				return d ? "M" + d.join("L") + "Z" : null;
			});
		});

	simulation.alpha(2).restart();
}

function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(.03).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(.03);
	d.fx = null;
	d.fy = null;
	simulation.alpha(1).restart();
}

function updatePlants() {
	selectedPlants.sort(function (a, b) { return b.total - a.total; });

	var t = d3.transition()
		.duration(500)

	let x = d3.scaleBand()
		.rangeRound([0, widthC])
		.paddingInner(0.05)
		.align(0.1);

	let y = d3.scaleLinear()
		.rangeRound([heightC, 0]);

	x.domain(selectedPlants.map(function (d) { return d.Name; }));
	y.domain([0, d3.max(selectedPlants, function (d) { return d.total; })]).nice();

	//console.log(d3.stack().keys(keys)(selectedPlants))

	svgC.selectAll(".bar")
		.data(d3.stack().keys(keys)(selectedPlants))
		.selectAll("rect")
		.data(function (d) { return d; })
		.enter().append("rect")
		.attr("x", function (d) { return x(d.data.Name); })
		.attr("y", function (d) { return y(d[1]); })
		.attr("height", function (d) { return y(d[0]) - y(d[1]); })
		.attr("width", x.bandwidth());

	svgC.selectAll(".bar")
		.data(d3.stack().keys(keys)(selectedPlants))
		.selectAll("rect")
		.data(function (d) { return d; })
		.attr("x", function (d) { return x(d.data.Name); })
		.attr("y", function (d) { return y(d[1]); })
		.attr("height", function (d) { return y(d[0]) - y(d[1]); })
		.attr("width", x.bandwidth());

	svgC.selectAll(".bar")
		.data(d3.stack().keys(keys)(selectedPlants))
		.selectAll("rect")
		.data(function (d) { return d; })
		.exit().remove()
}

function selectPlant(plant) {

	if (selectedPlants.includes(plant)) {
		index = selectedPlants.indexOf(plant);
		selectedPlants.splice(index, 1);
	} else if (selectedPlants.length < MAX_SELECTED_PLANTS) {

		plant.x = widthD * .5 + Math.random() * 5;
		plant.y = heightD * .5 + Math.random() * 5;

		selectedPlants.push(plant);
	} else {
		alert("Can't select more than " + MAX_SELECTED_PLANTS + " plants")
	}

	svgA.selectAll("rect")
		.filter(function (d) {
			return selectedPlants.includes(d.data);
		})
		.style("opacity", "0.4");

	svgA.selectAll("rect")
		.filter(function (d) {
			return !selectedPlants.includes(d.data);
		})
		.style("opacity", "1");

	if (selectedPlants.length == 0) {
		showExplications();
	} else {
		hideExplications();
	}

	updatePlants();
	updateVoronoi();
}

function showExplications() {
	var parent = document.getElementById("explications");
	parent.innerText = "Try Projet"
}

function hideExplications() {
	var parent = document.getElementById("explications");
	parent.innerText = ""
}

function initButtons(data) {
	d3.select(".b")
		.append("button")
		.text("Average Moisture")
		.on("click", function () {
			updateTreemap(data, "AvMoisture");
		});

	d3.select(".b")
		.append("button")
		.text("Average P")
		.on("click", function () {
			updateTreemap(data, "AvP");
		});

	d3.select(".b")
		.append("button")
		.text("Average K")
		.on("click", function () {
			updateTreemap(data, "AvK");
		});

	d3.select(".b")
		.append("button")
		.text("Average N")
		.on("click", function () {
			updateTreemap(data, "AvN");
		});
}

function displayTreemap(data, variable) {

	var stratified = d3.stratify()
		.id(function (d) { return d.Name; })
		.parentId(function (d) { return d.CropCategory; })
		(data);

	var root = stratified
		.sum(function (d) { return d[variable]; })
		.sort(function (a, b) { return b[variable] - a[variable]; });

	treemap(root);

	console.log(root.leaves())

	var cell = svgA.selectAll("g")
		.data(root.leaves())
		.enter()
		.append("g")
		.attr("id", function (d) { return d.id })
		.attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	cell.append("rect")
		.attr("id", function (d) { return d.id; })
		.attr("width", function (d) { return d.x1 - d.x0; })
		.attr("height", function (d) { return d.y1 - d.y0; })
		.attr("fill", function (d) {
			return colors(d.data.CropCategory);
		})
		.on("mouseover", function (d) {
			onMouseOver(d);
		})
		.on("mouseout", function (d) {
			onMouseOut(d);
		})
		.on("click", function (d) {
			selectPlant(d.data);
		});

    cell.append("text")
        .text(function(d) { return d.id; })
        .attr("y", function(d) { return 20; })
        .attr("x", function(d) { return 5; });
}

function updateTreemap(data, variable) {

	var stratified = d3.stratify()
		.id(function (d) { return d.Name; })
		.parentId(function (d) { return d.CropCategory; })
		(data);

	var root = stratified
		.sum(function (d) { return d[variable]; })
		.sort(function (a, b) { return b[variable] - a[variable]; });

	treemap(root);

	svgA.selectAll("g")
		.data(root.leaves())
		.transition()
		.attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	svgA.selectAll("rect")
		.data(root.leaves())
		.transition()
		.attr("width", function (d) { return d.x1 - d.x0; })
		.attr("height", function (d) { return d.y1 - d.y0; });
}

function onMouseOver(element) {

	var mouse = d3.mouse(svgA.node()).map(function (d) {
		return parseInt(d);
	});

	tooltip.classed('hidden', false)
		.attr('style', 'left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] - 35) + 'px')
		.html(element.id);
}

function onMouseOut(element) {
	tooltip.classed('hidden', true);
}

function displayBarChart() {

	svgC.selectAll("g")
		.data(d3.stack().keys(keys)(selectedPlants))
		.enter().append("g")
		.attr("class", "bar")
		.attr("fill", function (d) { return colors2(d.key); });

	selectedPlants.sort(function (a, b) { return b.total - a.total; });

	let x = d3.scaleBand()
		.rangeRound([0, widthC])
		.paddingInner(0.05)
		.align(0.1);

	let y = d3.scaleLinear()
		.rangeRound([heightC, 0]);

	x.domain(selectedPlants.map(function (d) { return d.Name; }));
	y.domain([0, d3.max(selectedPlants, function (d) { return d.total; })]).nice();

	colors2.domain(keys);

	svgC.append("g")
		.attr("class", "axis x")
		.attr("transform", "translate(0," + heightC + ")")
		.call(d3.axisBottom(x));

	/*svgC.append("g")
		.attr("class", "axis y")
		.call(d3.axisLeft(y).ticks(null, "s"))
		.append("text")
		.attr("x", 2)
		.attr("y", y(y.ticks().pop()) + 0.5)
		.attr("dy", "0.32em")
		.attr("fill", "#000")
		.attr("font-weight", "bold")
		.attr("text-anchor", "start")
		.text("Composition");*/

	var legend = svgC.append("g")
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
		.attr("text-anchor", "end")
		.selectAll("g")
		.data(keys.slice().reverse())
		.enter().append("g")
		.attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

	legend.append("rect")
		.attr("x", widthC - 19)
		.attr("width", 19)
		.attr("height", 19)
		.attr("fill", colors2)

	legend.append("text")
		.attr("x", widthC - 24)
		.attr("y", 9.5)
		.attr("dy", "0.32em")
		.text(function (d) { return d; });

	console.log(selectedPlants);

	svgC.append("g")
		.selectAll("g")
		.data(d3.stack().keys(keys)(selectedPlants))
		.enter().append("g")
		.attr("fill", function (d) { return colors(d.key); })
		.selectAll("rect")
		.data(function (d) { return d; })
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function (d) { return x(d.data.Name); })
		.attr("y", function (d) { return y(d[1]); })
		.attr("height", function (d) { return y(d[0]) - y(d[1]); })
		.attr("width", x.bandwidth());
}

function displayAxes() {

}
